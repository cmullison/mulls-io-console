"use client";

import { useState, useMemo } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { confirmPayment } from "@/actions/credits.action";
import { useTheme } from "next-themes";
import { Card, CardContent } from "@/components/ui/card";
import { getPackageIcon } from "./credit-packages";
import { CREDITS_EXPIRATION_YEARS } from "@/constants";

interface StripePaymentFormProps {
  packageId: string;
  clientSecret: string;
  onSuccess: () => void;
  onCancel: () => void;
  credits: number;
  price: number;
}

function PaymentForm({ packageId, clientSecret, onSuccess, onCancel, credits, price }: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[StripePaymentForm] handleSubmit started", { packageId, clientSecret: !!clientSecret });

    if (!stripe || !elements) {
      console.error("[StripePaymentForm] Missing stripe or elements", { stripe: !!stripe, elements: !!elements });
      return;
    }

    setIsProcessing(true);
    console.log("[StripePaymentForm] Starting payment processing");

    try {
      console.log("[StripePaymentForm] Confirming payment with Stripe");
      const { error } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        console.error("[StripePaymentForm] Stripe confirmPayment error", {
          code: error.code,
          message: error.message,
          type: error.type,
          paymentIntent: error.payment_intent
        });
        toast.error(error.message || "Payment failed");
      } else {
        console.log("[StripePaymentForm] Payment confirmed, retrieving payment intent");
        // The payment was successful
        const paymentIntent = await stripe.retrievePaymentIntent(clientSecret);
        
        console.log("[StripePaymentForm] Payment intent retrieved", {
          exists: !!paymentIntent.paymentIntent,
          id: paymentIntent.paymentIntent?.id,
          status: paymentIntent.paymentIntent?.status,
          amount: paymentIntent.paymentIntent?.amount
        });
        
        if (paymentIntent.paymentIntent) {
          console.log("[StripePaymentForm] Calling confirmPayment action", {
            packageId,
            paymentIntentId: paymentIntent.paymentIntent.id
          });
          
          const { success } = await confirmPayment({
            packageId,
            paymentIntentId: paymentIntent.paymentIntent.id,
          });

          console.log("[StripePaymentForm] confirmPayment action result", { success });

          if (success) {
            console.log("[StripePaymentForm] Payment successful");
            toast.success("Payment successful!");
            onSuccess();
          } else {
            console.error("[StripePaymentForm] confirmPayment returned false");
            toast.error("Payment failed");
          }
        } else {
          console.error("[StripePaymentForm] No payment intent found in response");
          throw new Error("No payment intent found");
        }
      }
    } catch (error) {
      console.error("[StripePaymentForm] Payment error", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        packageId,
        clientSecret: !!clientSecret
      });
      toast.error("An unexpected error occurred");
    } finally {
      setIsProcessing(false);
      console.log("[StripePaymentForm] Payment processing completed");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getPackageIcon(credits)}
                <div>
                  <div className="text-2xl font-bold">
                    {credits.toLocaleString()} credits
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-primary">
                ${price}
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="text-xs text-muted-foreground space-y-2">
              <p>
                Your payment is secure and encrypted. We use Stripe, a trusted global payment provider, to process your payment.
              </p>
              <p>
                For your security, your payment details are handled directly by Stripe and never touch our servers.
              </p>
              <p>
                Credits will be added to your account immediately after successful payment and will be valid for {CREDITS_EXPIRATION_YEARS} years from the purchase date.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-8">
        <PaymentElement />
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isProcessing || !stripe || !elements}
            className="px-8"
          >
            {isProcessing ? "Processing..." : "Pay Now"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export function StripePaymentForm(props: StripePaymentFormProps) {
  const { resolvedTheme: theme } = useTheme();
  
  const stripePromise = useMemo(() => {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    console.log("[StripePaymentForm] Initializing Stripe", { 
      hasPublishableKey: !!publishableKey,
      clientSecret: !!props.clientSecret,
      theme
    });
    
    if (!publishableKey) {
      console.error("[StripePaymentForm] Missing NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY");
      return null;
    }
    
    return loadStripe(publishableKey);
  }, []);

  console.log("[StripePaymentForm] Rendering Elements wrapper", {
    stripePromise: !!stripePromise,
    clientSecret: !!props.clientSecret,
    packageId: props.packageId,
    credits: props.credits,
    price: props.price
  });

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: props.clientSecret,
        appearance: {
          theme: theme === "dark" ? "night" : "stripe",
        },
      }}
    >
      <PaymentForm {...props} />
    </Elements>
  );
}
