"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CreditCard, Building2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";

// Paystack inline JS is loaded via Script in layout or on demand here.
// No npm package needed — works with any React version.
declare global {
  interface Window {
    PaystackPop?: {
      setup(config: {
        key: string;
        email: string;
        amount: number;
        currency?: string;
        ref: string;
        metadata?: object;
        onClose?: () => void;
        callback?: (response: {
          reference: string;
          transaction: string;
          status: string;
        }) => void;
      }): { openIframe(): void };
    };
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentCheckoutProps {
  freelancerName: string;
  projectTitle: string;
  clientName: string;
  clientEmail: string;
  freelancerId: string;
  budget: string;
  category: string;
  description: string;
  startDate: string;
  duration: string;
  commitment: string;
  requirements: string;
}

// Paystack does not require a separate payment_options field per method,
// the modal shows all available channels automatically.
const PAYMENT_METHODS = [
  {
    id: "card" as const,
    label: "Debit / Credit Card",
    sub: "Visa, Mastercard, Verve",
    icon: CreditCard,
  },
  {
    id: "transfer" as const,
    label: "Bank Transfer",
    sub: "Instant bank payment",
    icon: Building2,
  },
  {
    id: "ussd" as const,
    label: "USSD",
    sub: "*737#",
    icon: Smartphone,
  },
];

type MethodId = (typeof PAYMENT_METHODS)[number]["id"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function PaymentCheckout({
  freelancerName,
  projectTitle,
  clientName,
  clientEmail,
  freelancerId,
  budget,
  category,
  description,
  startDate,
  duration,
  commitment,
  requirements,
}: PaymentCheckoutProps) {
  const router = useRouter();
  const [method, setMethod] = useState<MethodId>("card");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  // Load Paystack inline JS once on mount — no npm package needed
  useEffect(() => {
    if (window.PaystackPop) {
      setSdkReady(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setSdkReady(true);
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const amount = Math.max(1, parseFloat(budget.replace(/[^0-9.]/g, "")) || 0);
  // Paystack expects kobo (NGN × 100)
  const amountKobo = Math.round(amount * 100);

  function handlePay() {
    if (!agreed || loading || !sdkReady || !window.PaystackPop) return;
    setLoading(true);

    const handler = window.PaystackPop.setup({
      key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
      email: clientEmail,
      amount: amountKobo,
      currency: "NGN",
      ref: `HIRE-${freelancerId}-${Date.now()}`,
      metadata: {
        custom_fields: [
          {
            display_name: "Client Name",
            variable_name: "client_name",
            value: clientName,
          },
          {
            display_name: "Freelancer",
            variable_name: "freelancer_name",
            value: freelancerName,
          },
          {
            display_name: "Project",
            variable_name: "project_title",
            value: projectTitle,
          },
        ],
      },
      onClose: () => setLoading(false),
      callback: (response) => {
        if (response.status === "success") {
          fetch("/api/notify-hire", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              freelancerId,
              freelancerName,
              clientName,
              clientEmail,
              projectTitle,
              category,
              description,
              startDate,
              duration,
              commitment,
              requirements,
              amount,
              txRef: response.reference,
              transactionId: response.transaction,
            }),
          }).catch(() => {});

          router.push(
            `/hire/success?tx_ref=${encodeURIComponent(response.reference)}&transaction_id=${encodeURIComponent(response.transaction)}&amount=${amount}`,
          );
        } else {
          setLoading(false);
        }
      },
    });
    handler.openIframe();
  }

  return (
    <div className="space-y-5">
      {/* Method selector */}
      <div>
        <p className="text-sm font-semibold mb-3">Select payment method</p>
        <div className="grid gap-3">
          {PAYMENT_METHODS.map((m) => {
            const active = method === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={
                  "flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition " +
                  (active
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-muted hover:border-primary/30 hover:bg-muted/30")
                }
              >
                <m.icon
                  className={
                    "size-5 shrink-0 " +
                    (active ? "text-primary" : "text-muted-foreground")
                  }
                />
                <div className="flex-1">
                  <p className="font-medium text-sm">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.sub}</p>
                </div>
                <div
                  className={
                    "size-4 rounded-full border-2 transition " +
                    (active ? "border-primary bg-primary" : "border-muted")
                  }
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Email receipt notice */}
      {clientEmail && (
        <p className="text-xs text-muted-foreground">
          Payment receipt will be sent to{" "}
          <span className="font-semibold text-foreground">{clientEmail}</span>
        </p>
      )}

      {/* T&C agreement */}
      <label className="flex items-start gap-3 cursor-pointer select-none text-sm">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          className="mt-0.5 accent-primary size-4 shrink-0"
        />
        <span className="text-muted-foreground leading-relaxed">
          I agree to the{" "}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          . I understand funds are held in escrow until I approve the
          deliverables.
        </span>
      </label>

      {/* Pay button */}
      <Button
        size="lg"
        disabled={!agreed || loading || !sdkReady || amount <= 0}
        onClick={handlePay}
        className="w-full rounded-xl text-base font-bold py-6"
      >
        {loading ? (
          <>
            <Loader2 className="size-5 mr-2 animate-spin" />
            Opening payment…
          </>
        ) : (
          <>Pay ₦{amount.toLocaleString("en-NG")} via Paystack</>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Powered by Paystack · Secured by SSL
      </p>
    </div>
  );
}
