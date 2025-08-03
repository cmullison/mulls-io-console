import "server-only";
import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe() {
  console.log("[getStripe] Initializing Stripe instance", { hasExistingInstance: !!stripeInstance });
  
  if (stripeInstance) {
    console.log("[getStripe] Returning existing Stripe instance");
    return stripeInstance;
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  console.log("[getStripe] Checking environment variables", { hasSecretKey: !!stripeSecretKey });

  if (!stripeSecretKey) {
    console.error("[getStripe] Missing STRIPE_SECRET_KEY environment variable");
    throw new Error("Missing STRIPE_SECRET_KEY environment variable");
  }

  console.log("[getStripe] Creating new Stripe instance");
  stripeInstance = new Stripe(stripeSecretKey, {
    apiVersion: "2025-02-24.acacia",
    typescript: true,
    httpClient: Stripe.createFetchHttpClient()
  });

  console.log("[getStripe] Stripe instance created successfully");
  return stripeInstance;
}
