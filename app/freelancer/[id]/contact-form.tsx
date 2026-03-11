"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ContactForm({
  freelancerId,
  freelancerName,
}: {
  freelancerId: string;
  freelancerName: string;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: insertError } = await supabase.from("messages").insert({
        sender_name: name.trim(),
        sender_email: email.trim() || null,
        subject: `Message for ${freelancerName}`,
        body: message.trim(),
        user_ref: freelancerId,
        unread: true,
        status: "open",
      });
      if (insertError) throw insertError;

      // Fire-and-forget email notification to support inbox
      fetch("/api/notify-enquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          senderName: name.trim(),
          senderEmail: email.trim() || undefined,
          freelancerName,
          messageBody: message.trim(),
        }),
      }).catch(() => {});

      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send message.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
        <CheckCircle2 className="size-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold">Message sent!</h3>
        <p className="mt-2 text-muted-foreground">
          Your message has been delivered to {freelancerName}. They'll get back
          to you soon.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-card p-6 sm:p-8 shadow-sm">
      <h2 className="text-xl font-bold mb-1">Contact {freelancerName}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Send a message and they'll respond directly.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold">Your Name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Emeka Eze"
              className="rounded-xl border bg-muted/30 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold">
              Email{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-xl border bg-muted/30 px-4 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold">Message</label>
          <textarea
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder={`Hi ${freelancerName.split(" ")[0]}, I'd like to discuss a project with you...`}
            className="rounded-xl border bg-muted/30 px-4 py-3 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button
          type="submit"
          disabled={submitting}
          className="gap-2 rounded-xl"
        >
          <Send className="size-4" />
          {submitting ? "Sending…" : "Send Message"}
        </Button>
      </form>
    </div>
  );
}
