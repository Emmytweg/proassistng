import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import {
  calculateTransactionBreakdown,
  parseNairaAmount,
} from "@/lib/payment-pricing";

export default async function HireSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;
  const txRef = p.tx_ref ?? "";
  const transactionId = p.transaction_id ?? "";
  const amount = parseNairaAmount(p.amount ?? 0);
  const baseAmount = parseNairaAmount(p.base_amount);
  const platformFee = parseNairaAmount(p.platform_fee);
  const fallback = calculateTransactionBreakdown(amount / 1.1);
  const displayBaseAmount = baseAmount > 0 ? baseAmount : fallback.baseAmount;
  const displayPlatformFee =
    platformFee > 0 ? platformFee : fallback.platformFee;

  return (
    <main className="min-h-screen bg-muted/30">
      <Navbar />

      <div className="mx-auto max-w-lg px-6 py-10 pt-32 text-center">
        <div className="inline-flex items-center justify-center size-20 rounded-full bg-primary/10 mb-6">
          <CheckCircle2 className="size-10 text-primary" />
        </div>

        <h1 className="text-3xl font-black tracking-tight mb-2">
          Payment Successful!
        </h1>
        <p className="text-muted-foreground mb-8">
          Your payment of{" "}
          <span className="font-bold text-foreground">
            ₦{amount.toLocaleString("en-NG")}
          </span>{" "}
          has been received. The freelancer will be notified and will reach out
          shortly.
        </p>

        {/* Receipt details */}
        <div className="rounded-2xl border bg-card p-5 text-sm space-y-3 mb-8 text-left">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Freelancer amount</span>
            <span className="font-medium">
              ₦{displayBaseAmount.toLocaleString("en-NG")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Platform fee (5%)</span>
            <span className="font-medium">
              ₦{displayPlatformFee.toLocaleString("en-NG")}
            </span>
          </div>
          {txRef && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono font-medium text-xs">{txRef}</span>
            </div>
          )}
          {transactionId && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono font-medium text-xs">
                {transactionId}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between border-t pt-3">
            <span className="text-muted-foreground">Amount paid</span>
            <span className="font-bold text-primary">
              ₦{amount.toLocaleString("en-NG")}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Status</span>
            <span className="inline-flex items-center gap-1.5 text-green-700 font-semibold">
              <span className="size-2 rounded-full bg-green-500" />
              Successful
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/browse-talents"
            className="inline-flex items-center justify-center rounded-xl border px-6 py-3 text-sm font-medium hover:bg-muted/50 transition"
          >
            Browse More Talent
          </Link>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-xl bg-primary text-primary-foreground px-6 py-3 text-sm font-semibold hover:bg-primary/90 transition"
          >
            Back to Home
          </Link>
        </div>
      </div>

      <Footer />
    </main>
  );
}
