"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const footerLinks = [
  { name: "Overview", href: "/" },
  { name: "Freelancers", href: "/freelancers" },
  { name: "Services", href: "/services" },
  { name: "How It Works", href: "/how-it-works" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  async function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus("error");
        setMessage(json.error ?? "Something went wrong.");
      } else {
        setStatus("success");
        setMessage("You're subscribed! Thanks for joining.");
        setEmail("");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <footer className="border-t bg-background">
      <div className="max-w-7xl mx-auto px-6 py-14">
        {/* Top: brand + links */}
        <div className="flex flex-col items-center gap-6">
          <Link
            href="/"
            className="inline-flex items-center gap-3 font-semibold tracking-tight"
            aria-label="Go to homepage"
          >
            <Image
              src="/logo.png"
              alt="ProAssistNG"
              width={150}
              height={150}
              className="rounded-sm"
            />
          </Link>

          <nav aria-label="Footer navigation">
            <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Divider */}
        <div className="mt-12 border-t" />

        {/* Bottom: subscribe + copyright */}
        <div className="pt-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <form
            className="flex w-full max-w-xl flex-col gap-3 sm:flex-row"
            onSubmit={handleSubscribe}
            aria-label="Email subscription"
          >
            <div className="flex w-full flex-col gap-2">
              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <label htmlFor="footer-email" className="sr-only">
                  Enter your email
                </label>
                <input
                  id="footer-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setStatus("idle");
                    setMessage("");
                  }}
                  disabled={status === "loading" || status === "success"}
                  className="h-11 w-full rounded-md border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-60"
                />
                <Button
                  type="submit"
                  className="h-11 w-full sm:w-auto"
                  disabled={status === "loading" || status === "success"}
                >
                  {status === "loading"
                    ? "Subscribing…"
                    : status === "success"
                      ? "Subscribed ✓"
                      : "Subscribe"}
                </Button>
              </div>
              {message && (
                <p
                  className={`text-xs font-medium ${
                    status === "success" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {message}
                </p>
              )}
            </div>
          </form>

          <p className="text-sm text-muted-foreground md:text-right">
            © {new Date().getFullYear()} ProAssistNG. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
