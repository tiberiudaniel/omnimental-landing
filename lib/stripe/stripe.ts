import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

const API_VERSION: Stripe.StripeConfig["apiVersion"] = "2023-10-16";

export function getStripe(): Stripe {
  if (stripeInstance) {
    return stripeInstance;
  }
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  stripeInstance = new Stripe(secretKey, { apiVersion: API_VERSION });
  return stripeInstance;
}
