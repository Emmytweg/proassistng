"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { Mail, Phone, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { useMemo, useState, useEffect } from "react";

import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type SubjectOption =
  | "General inquiry"
  | "Account support"
  | "Billing & payments"
  | "Partnerships";

function useReveal() {
  const reduceMotion = useReducedMotion();

  const fadeUp = useMemo(
    () =>
      ({
        hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: reduceMotion ? 0 : 0.55, ease: "easeOut" },
        },
      }) as const,
    [reduceMotion],
  );

  const fadeIn = useMemo(
    () =>
      ({
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: { duration: reduceMotion ? 0 : 0.55, ease: "easeOut" },
        },
      }) as const,
    [reduceMotion],
  );

  const stagger = useMemo(
    () =>
      ({
        hidden: {},
        show: {
          transition: {
            staggerChildren: reduceMotion ? 0 : 0.08,
            delayChildren: reduceMotion ? 0 : 0.04,
          },
        },
      }) as const,
    [reduceMotion],
  );

  return { fadeUp, fadeIn, stagger };
}

type Toast = { type: "success" | "error"; message: string };

export default function ContactContent() {
  const { fadeUp, fadeIn, stagger } = useReveal();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState<SubjectOption>("General inquiry");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <main className="pt-24 bg-background text-foreground">
      {/* HERO */}
      <section className="relative py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.35 }}
            className="max-w-3xl"
          >
            <motion.span
              variants={fadeIn}
              className="inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-primary mb-4"
            >
              Support center
            </motion.span>
            <motion.h1
              variants={fadeUp}
              className="text-5xl font-black leading-tight tracking-tight lg:text-6xl"
            >
              Get in touch
            </motion.h1>
            <motion.p
              variants={fadeUp}
              className="mt-6 text-lg leading-8 text-muted-foreground"
            >
              Our team is here to help you connect with trusted Nigerian talent.
              Whether you’re a business looking to scale or a freelancer seeking
              opportunities, reach out with any questions.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* FORM + SIDEBAR */}
      <section className="py-12 lg:py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            {/* Form */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
              className="lg:col-span-2"
            >
              <div className="rounded-2xl border bg-card p-8 shadow-xl shadow-black/5">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold">Send us a message</h2>
                  <p className="mt-2 text-muted-foreground">
                    Fill out the form below and we’ll get back to you within 24
                    hours.
                  </p>
                </div>

                <form
                  className="space-y-6"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!fullName.trim() || !message.trim()) return;
                    setLoading(true);
                    const supabase = getSupabaseBrowserClient();
                    const { error } = await supabase.from("messages").insert({
                      sender_name: fullName.trim(),
                      sender_email: email.trim() || null,
                      subject,
                      body: message.trim(),
                    });

                    // Fire and forget email notification
                    if (!error) {
                      fetch("/api/notify-contact", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          senderName: fullName.trim(),
                          senderEmail: email.trim() || undefined,
                          subject,
                          messageBody: message.trim(),
                        }),
                      }).catch(() => {});
                    }

                    setLoading(false);
                    if (error) {
                      setToast({
                        type: "error",
                        message: "Failed to send message. Please try again.",
                      });
                    } else {
                      setToast({
                        type: "success",
                        message:
                          "Message sent! We\'ll get back to you within 24 hours.",
                      });
                      setFullName("");
                      setEmail("");
                      setSubject("General inquiry");
                      setMessage("");
                    }
                  }}
                >
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold"
                        htmlFor="contact-full-name"
                      >
                        Full name
                      </label>
                      <input
                        id="contact-full-name"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Doe"
                        className="block w-full rounded-xl border bg-muted/30 px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>

                    <div className="space-y-2">
                      <label
                        className="text-sm font-semibold"
                        htmlFor="contact-email"
                      >
                        Email address
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@company.com"
                        className="block w-full rounded-xl border bg-muted/30 px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-semibold"
                      htmlFor="contact-subject"
                    >
                      Subject
                    </label>
                    <select
                      id="contact-subject"
                      value={subject}
                      onChange={(e) =>
                        setSubject(e.target.value as SubjectOption)
                      }
                      className="block w-full rounded-xl border bg-muted/30 px-4 py-3.5 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option>General inquiry</option>
                      <option>Account support</option>
                      <option>Billing & payments</option>
                      <option>Partnerships</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label
                      className="text-sm font-semibold"
                      htmlFor="contact-message"
                    >
                      Message
                    </label>
                    <textarea
                      id="contact-message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={5}
                      placeholder="How can we help you?"
                      className="block w-full resize-none rounded-xl border bg-muted/30 px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <motion.div whileHover={{ y: -1 }} whileTap={{ scale: 0.99 }}>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-12 w-full rounded-xl font-semibold disabled:opacity-60"
                    >
                      {loading ? "Sending…" : "Send message"}
                    </Button>
                  </motion.div>
                </form>
              </div>
            </motion.div>

            {/* Sidebar */}
            <div className="space-y-8">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                className="rounded-2xl border bg-card p-8 shadow-md"
              >
                <h3 className="mb-6 text-xl font-bold">Contact details</h3>

                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Email us
                      </p>
                      <p className="font-semibold">proassistng@gmail.com</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Call us
                      </p>
                      <p className="font-semibold">+234 70534 55065 </p>
                    </div>
                  </div>

                  {/* <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        Our office
                      </p>
                      <p className="font-semibold">Victoria Island, Lagos</p>
                    </div>
                  </div> */}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="h-64 overflow-hidden rounded-2xl border bg-muted grayscale hover:grayscale-0 transition-all duration-500"
              >
                <div
                  className="h-full w-full bg-cover bg-center"
                  style={{ backgroundImage: "url('/4.png')" }}
                  aria-label="Map showing Lagos office location"
                  role="img"
                />
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, amount: 0.25 }}
                className="rounded-2xl bg-primary p-8 text-primary-foreground"
              >
                <h4 className="text-lg font-bold">Need instant help?</h4>
                <p className="mt-2 text-sm opacity-90">
                  Visit our Help Center for quick answers to common questions
                  about onboarding and payments.
                </p>
                <Link
                  href="#"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-bold hover:underline"
                >
                  Browse Help Center
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* BOTTOM CTA */}
      <section className="border-y py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-10">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            className="flex flex-col items-center justify-between gap-8 md:flex-row"
          >
            <div>
              <h2 className="text-2xl font-bold">
                Looking for something else?
              </h2>
              <p className="mt-2 text-muted-foreground">
                Join businesses growing with ProAssistNG.
              </p>
            </div>

            <div className="flex gap-4">
              {/* <Button asChild variant="outline" className="rounded-lg">
                <Link href="#">Read FAQ</Link>
              </Button> */}
              <Button asChild className="rounded-lg">
                <Link href="/browse-talents">Get started</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TOAST */}
      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-4 shadow-xl text-sm font-medium max-w-sm ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 shrink-0" />
            )}
            <span>{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
              aria-label="Dismiss"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
