"use server";

import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe/stripe";
import { getPriceIdForPlan } from "@/lib/stripe/prices";
import type { Plan } from "@/lib/stripe/prices";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { track } from "@/lib/telemetry/track";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
    if (!token) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    let uid: string | null = null;
    try {
      const adminAuth = getAdminAuth();
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid ?? null;
    } catch (error) {
      console.warn("checkout verifyIdToken failed", error);
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    if (!uid) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const plan = body?.plan as Plan | undefined;
    if (!plan || (plan !== "monthly" && plan !== "annual")) {
      return NextResponse.json({ error: "invalid_plan" }, { status: 400 });
    }

    const priceId = getPriceIdForPlan(plan);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin");
    if (!appUrl) {
      return NextResponse.json({ error: "app_url_missing" }, { status: 500 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/upgrade/cancel`,
      metadata: { uid, plan },
      subscription_data: {
        metadata: { uid, plan },
      },
    });

    track("checkout_session_created", { plan, uid });
    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error("create-checkout error", error);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
