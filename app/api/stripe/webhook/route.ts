"use server";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";

import { getStripe } from "@/lib/stripe/stripe";
import { track } from "@/lib/telemetry/track";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { Plan } from "@/lib/stripe/prices";
import { getPlanForPriceId } from "@/lib/stripe/prices";

type SubscriptionStatus = Stripe.Subscription.Status;

const PREMIUM_ACTIVE_STATUSES: SubscriptionStatus[] = ["active", "trialing", "past_due", "unpaid"];

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("Stripe webhook secret missing");
    return NextResponse.json({ error: "webhook_secret_missing" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const bodyBuffer = Buffer.from(await req.arrayBuffer());
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(bodyBuffer, signature, webhookSecret);
  } catch (error) {
    console.error("Stripe webhook signature verification failed", error);
    return NextResponse.json({ error: "invalid_signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSession(event.data.object as Stripe.Checkout.Session);
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription, event.type);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeletion(event.data.object as Stripe.Subscription);
        break;
      default:
        // Ignore other events for now.
        break;
    }
  } catch (error) {
    console.error("Stripe webhook handler error", error);
    return NextResponse.json({ error: "handler_error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}

async function handleCheckoutSession(session: Stripe.Checkout.Session) {
  const uid = session.metadata?.uid;
  if (!uid) {
    console.warn("checkout.session.completed missing uid", session.id);
    return;
  }

  const plan = normalizePlan(session.metadata?.plan);
  const customerId = normalizeCustomer(session.customer);
  const subscriptionId = normalizeSubscription(session.subscription);

  await updatePremiumProfile(uid, {
    isPremium: true,
    plan: plan ?? undefined,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
  });

  track("checkout_success", { uid, plan, sessionId: session.id });
  track("premium_activated", { uid, plan, source: "checkout.session.completed" });
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription, eventType: string) {
  const uid = subscription.metadata?.uid;
  if (!uid) {
    console.warn("subscription event missing uid", subscription.id, eventType);
    return;
  }
  const plan = normalizePlan(subscription.metadata?.plan) ?? inferPlanFromSubscription(subscription);
  const isPremium = PREMIUM_ACTIVE_STATUSES.includes(subscription.status);

  await updatePremiumProfile(uid, {
    isPremium,
    plan: plan ?? undefined,
    stripeCustomerId: normalizeCustomer(subscription.customer),
    stripeSubscriptionId: subscription.id,
  });

  if (isPremium) {
    track("premium_activated", { uid, plan, source: eventType, status: subscription.status });
  } else {
    track("premium_deactivated", { uid, plan, source: eventType, status: subscription.status });
  }
}

async function handleSubscriptionDeletion(subscription: Stripe.Subscription) {
  const uid = subscription.metadata?.uid;
  if (!uid) {
    console.warn("subscription.deleted missing uid", subscription.id);
    return;
  }

  await updatePremiumProfile(uid, {
    isPremium: false,
    plan: null,
    stripeCustomerId: normalizeCustomer(subscription.customer),
    stripeSubscriptionId: subscription.id,
  });

  track("premium_deactivated", { uid, plan: null, source: "customer.subscription.deleted" });
}

function normalizePlan(value?: string | null): Plan | null {
  if (value === "monthly" || value === "annual") {
    return value;
  }
  return null;
}

function inferPlanFromSubscription(subscription: Stripe.Subscription): Plan | null {
  const firstItem = subscription.items?.data?.[0];
  const priceId = firstItem?.price?.id;
  return getPlanForPriceId(priceId);
}

function normalizeCustomer(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined): string | null {
  if (!customer) return null;
  if (typeof customer === "string") return customer;
  return customer.id ?? null;
}

function normalizeSubscription(subscription: string | Stripe.Subscription | null | undefined): string | null {
  if (!subscription) return null;
  if (typeof subscription === "string") return subscription;
  return subscription.id ?? null;
}

type PremiumUpdate = {
  isPremium: boolean;
  plan?: Plan | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

async function updatePremiumProfile(uid: string, update: PremiumUpdate) {
  const db = getAdminDb();
  // Writes are idempotent: repeated events set the same values, avoiding duplicate effects.
  // TODO: add explicit processed-events tracking if Stripe retries become noisy.
  const payload: Record<string, unknown> = {
    isPremium: update.isPremium,
    premiumUpdatedAt: FieldValue.serverTimestamp(),
  };

  if ("plan" in update) {
    payload.plan = update.plan ?? null;
  }
  if ("stripeCustomerId" in update) {
    payload.stripeCustomerId = update.stripeCustomerId ?? null;
  }
  if ("stripeSubscriptionId" in update) {
    payload.stripeSubscriptionId = update.stripeSubscriptionId ?? null;
  }

  await db.collection("userProfiles").doc(uid).set(payload, { merge: true });
}
