"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { X, ChevronRight, ChevronLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ─── Types ───────────────────────────────────────────────────────────────────

interface HireFlowProps {
  freelancerId: string;
  freelancerName: string;
  freelancerTitle: string;
  freelancerRate: string;
  /** callback if parent wants to know the dialog state */
  onClose?: () => void;
}

type Step = 1 | 2 | 3;

interface FormData {
  // Step 1
  projectTitle: string;
  category: string;
  description: string;
  // Step 2
  startDate: string;
  duration: string;
  commitment: string;
  // Step 3
  clientName: string;
  clientEmail: string;
  budget: string;
  requirements: string;
}

const EMPTY: FormData = {
  projectTitle: "",
  category: "",
  description: "",
  startDate: "",
  duration: "",
  commitment: "",
  clientName: "",
  clientEmail: "",
  budget: "",
  requirements: "",
};

// ─── Step metadata ────────────────────────────────────────────────────────────

const STEPS: { label: string; caption: string }[] = [
  { label: "Project", caption: "Tell us about the work" },
  { label: "Timeline", caption: "Scope & commitment" },
  { label: "Your info", caption: "Almost there" },
];

const CATEGORIES = [
  "Content Writing",
  "Copywriting",
  "Editing & Proofreading",
  "Web Development",
  "UI/UX Design",
  "Digital Marketing",
  "Data Analytics",
  "Virtual Assistance",
  "Other",
];

const START_OPTIONS = ["ASAP", "Within 1 week", "Within 1 month", "Flexible"];

const DURATION_OPTIONS = [
  "1–2 weeks",
  "1 month",
  "3 months",
  "6+ months",
  "Ongoing",
];

const COMMITMENT_OPTIONS = [
  { label: "As needed", sub: "Flexible hours" },
  { label: "Part-time", sub: "< 20 hrs / week" },
  { label: "Full-time", sub: "40 hrs / week" },
];

// ─── Reusable primitives ─────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-foreground mb-1.5">
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition placeholder:text-muted-foreground"
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition placeholder:text-muted-foreground resize-none"
    />
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition text-foreground"
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function ChipGroup({
  options,
  value,
  onChange,
}: {
  options: { label: string; sub?: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {options.map((o) => {
        const active = value === o.label;
        return (
          <button
            key={o.label}
            type="button"
            onClick={() => onChange(o.label)}
            className={
              "flex flex-col items-center justify-center rounded-xl border px-3 py-3 text-sm font-medium transition " +
              (active
                ? "border-primary bg-primary/10 text-primary shadow-sm"
                : "border-muted bg-muted/30 hover:border-primary/30 hover:bg-primary/5")
            }
          >
            {o.label}
            {o.sub && (
              <span className="text-[10px] font-normal text-muted-foreground mt-0.5">
                {o.sub}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Step panels ─────────────────────────────────────────────────────────────

function Step1({
  data,
  set,
}: {
  data: FormData;
  set: (k: keyof FormData, v: string) => void;
}) {
  return (
    <div className="space-y-5 text-start">
      <div>
        <Label>Project title *</Label>
        <Input
          value={data.projectTitle}
          onChange={(v) => set("projectTitle", v)}
          placeholder="e.g. Redesign our company website"
          required
        />
      </div>
      <div>
        <Label>Service category *</Label>
        <Select
          value={data.category}
          onChange={(v) => set("category", v)}
          options={CATEGORIES}
          placeholder="Select a category"
        />
      </div>
      <div>
        <Label>Project description *</Label>
        <Textarea
          value={data.description}
          onChange={(v) => set("description", v)}
          placeholder="Describe the project goals, deliverables, and any important context…"
          rows={5}
        />
      </div>
    </div>
  );
}

function Step2({
  data,
  set,
}: {
  data: FormData;
  set: (k: keyof FormData, v: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label>When do you need to start?</Label>
        <ChipGroup
          options={START_OPTIONS.map((l) => ({ label: l }))}
          value={data.startDate}
          onChange={(v) => set("startDate", v)}
        />
      </div>
      <div>
        <Label>Expected project length</Label>
        <ChipGroup
          options={DURATION_OPTIONS.map((l) => ({ label: l }))}
          value={data.duration}
          onChange={(v) => set("duration", v)}
        />
      </div>
      <div>
        <Label>Work commitment</Label>
        <ChipGroup
          options={COMMITMENT_OPTIONS}
          value={data.commitment}
          onChange={(v) => set("commitment", v)}
        />
      </div>
    </div>
  );
}

function Step3({
  data,
  set,
  freelancerName,
  freelancerTitle,
  freelancerRate,
}: {
  data: FormData;
  set: (k: keyof FormData, v: string) => void;
  freelancerName: string;
  freelancerTitle: string;
  freelancerRate: string;
}) {
  return (
    <div className="space-y-5">
      {/* Summary card */}
      <div className="rounded-xl border bg-muted/30 p-4 text-sm space-y-1.5">
        <p className="font-semibold text-foreground">
          {data.projectTitle || "—"}
        </p>
        <p className="text-muted-foreground">{data.category || "—"}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground pt-1">
          {data.startDate && (
            <span>
              Start:{" "}
              <strong className="text-foreground">{data.startDate}</strong>
            </span>
          )}
          {data.duration && (
            <span>
              Length:{" "}
              <strong className="text-foreground">{data.duration}</strong>
            </span>
          )}
          {data.commitment && (
            <span>
              Hours:{" "}
              <strong className="text-foreground">{data.commitment}</strong>
            </span>
          )}
        </div>
        <div className="pt-2 border-t mt-2 flex items-center justify-between">
          <span className="text-muted-foreground">Hiring</span>
          <span className="font-semibold text-foreground">
            {freelancerName} · {freelancerTitle}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Rate</span>
          <span className="font-bold text-primary">{freelancerRate}</span>
        </div>
      </div>

      <div>
        <Label>Your full name *</Label>
        <Input
          value={data.clientName}
          onChange={(v) => set("clientName", v)}
          placeholder="Jane Doe"
          required
        />
      </div>
      <div>
        <Label>Email address *</Label>
        <Input
          value={data.clientEmail}
          onChange={(v) => set("clientEmail", v)}
          placeholder="jane@company.com"
          type="email"
          required
        />
      </div>
      <div>
        <Label>Project budget (NGN) *</Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium select-none">
            ₦
          </span>
          <input
            type="number"
            min="1000"
            value={data.budget}
            onChange={(e) => set("budget", e.target.value)}
            placeholder="e.g. 50000"
            className="w-full rounded-xl border bg-background pl-8 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 transition placeholder:text-muted-foreground"
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Enter the freelancer amount. A 5% platform fee is added at checkout.
        </p>
      </div>
      <div>
        <Label>
          Any specific requirements?{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          value={data.requirements}
          onChange={(v) => set("requirements", v)}
          placeholder="Tools, tech stack, NDAs, time zones, etc."
          rows={3}
        />
      </div>
    </div>
  );
}

// ─── Validation ───────────────────────────────────────────────────────────────

function canAdvance(step: Step, data: FormData): boolean {
  if (step === 1)
    return (
      data.projectTitle.trim() !== "" &&
      data.category !== "" &&
      data.description.trim() !== ""
    );
  if (step === 2) return true; // optional chips
  if (step === 3)
    return (
      data.clientName.trim() !== "" &&
      data.clientEmail.trim() !== "" &&
      parseFloat(data.budget) > 0
    );
  return false;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function HireFlow({
  freelancerId,
  freelancerName,
  freelancerTitle,
  freelancerRate,
  onClose,
}: HireFlowProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<FormData>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  function set(key: keyof FormData, value: string) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function handleOpen() {
    setStep(1);
    setData(EMPTY);
    setOpen(true);
  }

  function handleClose() {
    setOpen(false);
    onClose?.();
  }

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Trap scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleSubmit() {
    if (!canAdvance(3, data)) return;
    setSubmitting(true);

    const params = new URLSearchParams({
      freelancerId,
      freelancerName,
      freelancerTitle,
      freelancerRate,
      projectTitle: data.projectTitle,
      category: data.category,
      description: data.description,
      startDate: data.startDate,
      duration: data.duration,
      commitment: data.commitment,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      budget: data.budget,
      requirements: data.requirements,
    });

    router.push(`/hire/payment?${params.toString()}`);
  }

  const progress = (step / 3) * 100;

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex w-full items-center justify-center rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
      >
        Hire {freelancerName.split(" ")[0]}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Hire freelancer"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Dialog panel */}
          <div
            ref={dialogRef}
            className="relative z-10 w-full sm:max-w-lg bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92dvh] sm:max-h-[85dvh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  Step {step} of 3
                </p>
                <h2 className="text-lg font-black tracking-tight mt-0.5">
                  {STEPS[step - 1].caption}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="rounded-full p-2 hover:bg-muted transition-colors"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Step indicators */}
            <div className="px-6 pb-4 shrink-0">
              <div className="flex items-center gap-2 mb-3">
                {STEPS.map((s, i) => {
                  const n = (i + 1) as Step;
                  const done = n < step;
                  const active = n === step;
                  return (
                    <div key={i} className="flex items-center gap-2 flex-1">
                      <div
                        className={
                          "size-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors " +
                          (done
                            ? "bg-primary text-primary-foreground"
                            : active
                              ? "border-2 border-primary text-primary"
                              : "border-2 border-muted text-muted-foreground")
                        }
                      >
                        {done ? <Check className="size-3" /> : n}
                      </div>
                      <span
                        className={
                          "hidden sm:block text-xs font-medium " +
                          (active ? "text-foreground" : "text-muted-foreground")
                        }
                      >
                        {s.label}
                      </span>
                      {i < 2 && (
                        <div
                          className={
                            "flex-1 h-px " + (done ? "bg-primary" : "bg-muted")
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              {/* Progress bar */}
              <div className="h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 pb-4">
              {step === 1 && <Step1 data={data} set={set} />}
              {step === 2 && <Step2 data={data} set={set} />}
              {step === 3 && (
                <Step3
                  data={data}
                  set={set}
                  freelancerName={freelancerName}
                  freelancerTitle={freelancerTitle}
                  freelancerRate={freelancerRate}
                />
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 pt-3 flex items-center justify-between gap-3 border-t shrink-0">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => (s - 1) as Step)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="size-4" /> Back
                </button>
              ) : (
                <span />
              )}

              {step < 3 ? (
                <Button
                  onClick={() => setStep((s) => (s + 1) as Step)}
                  disabled={!canAdvance(step, data)}
                  className="rounded-xl px-6"
                >
                  Continue <ChevronRight className="size-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!canAdvance(3, data) || submitting}
                  className="rounded-xl px-6"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="size-4 mr-2 animate-spin" />{" "}
                      Processing…
                    </>
                  ) : (
                    <>
                      Proceed to Payment{" "}
                      <ChevronRight className="size-4 ml-1" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
