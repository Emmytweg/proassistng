import Link from "next/link";
import { ArrowLeft, ShieldCheck, Lock } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import PaymentCheckout from "./payment-checkout";
import { calculateTransactionBreakdown } from "@/lib/payment-pricing";

export default async function HirePaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const p = await searchParams;

  const freelancerName = p.freelancerName ?? "Freelancer";
  const freelancerTitle = p.freelancerTitle ?? "";
  const freelancerRate = p.freelancerRate ?? "—";
  const projectTitle = p.projectTitle ?? "—";
  const category = p.category ?? "—";
  const description = p.description ?? "";
  const startDate = p.startDate ?? "—";
  const duration = p.duration ?? "—";
  const commitment = p.commitment ?? "—";
  const clientName = p.clientName ?? "";
  const clientEmail = p.clientEmail ?? "";
  const budget = p.budget ?? "0";
  const requirements = p.requirements ?? "";
  const freelancerId = p.freelancerId ?? "";
  const { baseAmount, platformFee, totalAmount } =
    calculateTransactionBreakdown(budget);

  return (
    <main className="min-h-screen bg-muted/30">
      <Navbar />

      <div className="mx-auto max-w-2xl px-6 py-10 pt-28">
        {/* Back */}
        <Link
          href={`/freelancer/${freelancerId}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to profile
        </Link>

        <h1 className="text-3xl font-black tracking-tight mb-1">
          Confirm & Pay
        </h1>
        <p className="text-muted-foreground mb-8 text-sm">
          Review your hire details below then complete payment to lock in{" "}
          {freelancerName.split(" ")[0]}.
        </p>

        {/* Order summary */}
        <div className="rounded-2xl border bg-card shadow-sm p-6 mb-6 space-y-4">
          <h2 className="font-bold text-base">Order Summary</h2>

          {/* Freelancer row */}
          <div className="flex items-start justify-between gap-4 pb-4 border-b">
            <div>
              <p className="font-semibold">{freelancerName}</p>
              <p className="text-sm text-muted-foreground">{freelancerTitle}</p>
            </div>
            <span className="font-bold text-primary text-sm whitespace-nowrap">
              {freelancerRate}
            </span>
          </div>

          {/* Project details */}
          <div className="space-y-2 text-sm">
            <Row label="Project" value={projectTitle} />
            <Row label="Category" value={category} />
            {description && (
              <div className="pt-1">
                <span className="text-muted-foreground">Description</span>
                <p className="mt-1 text-foreground leading-relaxed">
                  {description}
                </p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="grid grid-cols-3 gap-3 pt-2 border-t text-sm">
            <MiniCard label="Start" value={startDate} />
            <MiniCard label="Duration" value={duration} />
            <MiniCard label="Hours" value={commitment} />
          </div>

          {/* Client info */}
          <div className="space-y-2 text-sm pt-2 border-t">
            <Row label="Client name" value={clientName} />
            <Row label="Email" value={clientEmail} />
            {requirements && <Row label="Requirements" value={requirements} />}
          </div>

          {/* Pricing */}
          <div className="space-y-2 pt-3 border-t text-sm">
            <Row
              label="Freelancer amount"
              value={`₦${baseAmount.toLocaleString("en-NG")}`}
            />
            <Row
              label="Platform fee (5%)"
              value={`₦${platformFee.toLocaleString("en-NG")}`}
            />
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="font-bold text-base">Total to pay</span>
            <span className="font-black text-xl text-primary">
              ₦{totalAmount.toLocaleString("en-NG")}
            </span>
          </div>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground mb-6">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-primary" />
            Secure escrow payment
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="size-4 text-primary" />
            SSL encrypted checkout
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-primary" />
            Money-back guarantee
          </span>
        </div>

        {/* Payment form (client component) */}
        <PaymentCheckout
          freelancerName={freelancerName}
          projectTitle={projectTitle}
          clientName={clientName}
          clientEmail={clientEmail}
          freelancerId={freelancerId}
          budget={budget}
          category={category}
          description={description}
          startDate={startDate}
          duration={duration}
          commitment={commitment}
          requirements={requirements}
        />
      </div>

      <Footer />
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-right font-medium text-foreground">
        {value || "—"}
      </span>
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/30 px-3 py-2 text-center">
      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
        {label}
      </p>
      <p className="font-semibold mt-0.5">{value || "—"}</p>
    </div>
  );
}
