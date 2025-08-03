'use server';

import { requireVerifiedEmail } from "@/utils/auth";
import {
  getCreditTransactions,
  updateUserCredits,
  logTransaction,
  getCreditPackage,
} from "@/utils/credits";
import { CREDIT_TRANSACTION_TYPE } from "@/db/schema";
import { getStripe } from "@/lib/stripe";
import { MAX_TRANSACTIONS_PER_PAGE, CREDITS_EXPIRATION_YEARS } from "@/constants";
import ms from "ms";
import { withRateLimit, RATE_LIMITS } from "@/utils/with-rate-limit";

// Action types
type GetTransactionsInput = {
  page: number;
  limit?: number;
};

type CreatePaymentIntentInput = {
  packageId: string;
};

type PurchaseCreditsInput = {
  packageId: string;
  paymentIntentId: string;
};

export async function getTransactions({ page, limit = MAX_TRANSACTIONS_PER_PAGE }: GetTransactionsInput) {
  return withRateLimit(async () => {
    if (page < 1 || limit < 1) {
      throw new Error("Invalid page or limit");
    }

    if (limit > MAX_TRANSACTIONS_PER_PAGE) {
      throw new Error(`Limit cannot be greater than ${MAX_TRANSACTIONS_PER_PAGE}`);
    }

    if (!limit) {
      limit = MAX_TRANSACTIONS_PER_PAGE;
    }

    const session = await requireVerifiedEmail();

    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const result = await getCreditTransactions({
      userId: session.user.id,
      page,
      limit,
    });

    return {
      transactions: result.transactions,
      pagination: {
        total: result.pagination.total,
        pages: result.pagination.pages,
        current: result.pagination.current,
      }
    };
  }, RATE_LIMITS.PURCHASE);
}

export async function createPaymentIntent({ packageId }: CreatePaymentIntentInput) {
  return withRateLimit(async () => {
    console.log("[createPaymentIntent] Starting payment intent creation", { packageId });
    
    const session = await requireVerifiedEmail();
    if (!session) {
      console.error("[createPaymentIntent] No session found");
      throw new Error("Unauthorized");
    }

    console.log("[createPaymentIntent] Session found", { userId: session.user.id });

    try {
      const creditPackage = getCreditPackage(packageId);
      if (!creditPackage) {
        console.error("[createPaymentIntent] Invalid package", { packageId });
        throw new Error("Invalid package");
      }

      console.log("[createPaymentIntent] Credit package found", { 
        packageId: creditPackage.id,
        credits: creditPackage.credits,
        price: creditPackage.price 
      });

      const stripe = getStripe();
      console.log("[createPaymentIntent] Stripe instance obtained");

      const paymentIntentData = {
        amount: creditPackage.price * 100,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true,
          allow_redirects: 'never',
        },
        metadata: {
          userId: session.user.id,
          packageId: creditPackage.id,
          credits: creditPackage.credits.toString(),
        },
      };

      console.log("[createPaymentIntent] Creating payment intent with data", paymentIntentData);

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

      console.log("[createPaymentIntent] Payment intent created successfully", {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        clientSecretExists: !!paymentIntent.client_secret
      });

      return { clientSecret: paymentIntent.client_secret };
    } catch (error) {
      console.error("[createPaymentIntent] Error creating payment intent", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        packageId,
        userId: session.user.id
      });
      throw new Error("Failed to create payment intent");
    }
  }, RATE_LIMITS.PURCHASE);
}

export async function confirmPayment({ packageId, paymentIntentId }: PurchaseCreditsInput) {
  return withRateLimit(async () => {
    console.log("[confirmPayment] Starting payment confirmation", { packageId, paymentIntentId });
    
    const session = await requireVerifiedEmail();
    if (!session) {
      console.error("[confirmPayment] No session found");
      throw new Error("Unauthorized");
    }

    console.log("[confirmPayment] Session found", { userId: session.user.id });

    try {
      const creditPackage = getCreditPackage(packageId);
      if (!creditPackage) {
        console.error("[confirmPayment] Invalid package", { packageId });
        throw new Error("Invalid package");
      }

      console.log("[confirmPayment] Credit package found", { 
        packageId: creditPackage.id,
        credits: creditPackage.credits,
        price: creditPackage.price 
      });

      // Verify the payment intent
      console.log("[confirmPayment] Retrieving payment intent from Stripe", { paymentIntentId });
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      console.log("[confirmPayment] Payment intent retrieved", {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        metadata: paymentIntent.metadata
      });

      if (paymentIntent.status !== 'succeeded') {
        console.error("[confirmPayment] Payment not completed", { 
          status: paymentIntent.status,
          paymentIntentId 
        });
        throw new Error("Payment not completed");
      }

      // Verify the payment intent metadata matches
      const metadataValid = (
        paymentIntent.metadata.userId === session.user.id &&
        paymentIntent.metadata.packageId === packageId &&
        parseInt(paymentIntent.metadata.credits) === creditPackage.credits
      );

      console.log("[confirmPayment] Validating metadata", {
        expected: {
          userId: session.user.id,
          packageId: packageId,
          credits: creditPackage.credits
        },
        actual: {
          userId: paymentIntent.metadata.userId,
          packageId: paymentIntent.metadata.packageId,
          credits: parseInt(paymentIntent.metadata.credits)
        },
        valid: metadataValid
      });

      if (!metadataValid) {
        console.error("[confirmPayment] Invalid payment intent metadata");
        throw new Error("Invalid payment intent");
      }

      // Add credits and log transaction
      console.log("[confirmPayment] Updating user credits", { 
        userId: session.user.id, 
        creditsToAdd: creditPackage.credits 
      });
      
      await updateUserCredits(session.user.id, creditPackage.credits);
      
      console.log("[confirmPayment] Logging transaction");
      await logTransaction({
        userId: session.user.id,
        amount: creditPackage.credits,
        description: `Purchased ${creditPackage.credits} credits`,
        type: CREDIT_TRANSACTION_TYPE.PURCHASE,
        expirationDate: new Date(Date.now() + ms(`${CREDITS_EXPIRATION_YEARS} years`)),
        paymentIntentId: paymentIntent?.id
      });

      console.log("[confirmPayment] Payment confirmation completed successfully");
      return { success: true };
    } catch (error) {
      console.error("[confirmPayment] Error processing payment", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        packageId,
        paymentIntentId,
        userId: session.user.id
      });
      throw new Error("Failed to process payment");
    }
  }, RATE_LIMITS.PURCHASE);
}
