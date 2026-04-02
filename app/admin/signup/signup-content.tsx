"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

const ADMIN_TOAST_KEY = "proassist_admin_toast";
const ADMIN_SIGNUP_ENABLED =
  process.env.NEXT_PUBLIC_ADMIN_SIGNUP_ENABLED === "true";

export default function AdminSignupContent() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!ADMIN_SIGNUP_ENABLED) {
    return (
      <div className="light min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-xl w-full rounded-xl border bg-card p-6 text-sm">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            Admin signup is disabled
          </h2>
          <p className="text-muted-foreground">
            Contact the site owner to create an admin account securely.
          </p>
          <Link
            href="/admin/login"
            className="inline-flex mt-4 rounded-lg bg-primary px-4 py-2 text-primary-foreground font-semibold"
          >
            Go to admin login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="light relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-background text-foreground antialiased selection:bg-primary/30">
      <div className="w-full max-w-110 flex flex-col items-center justify-center z-10">
        <Image
          src="/logo.png"
          alt="ProAssistNG"
          width={224}
          height={149}
          className="rounded-full h-28 mb-6 w-auto"
          priority
        />

        <div className="bg-card rounded-xl shadow-2xl border border-border/50 overflow-hidden">
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold">Admin Sign Up</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Create your admin account to access the console
              </p>
            </div>

            <form
              className="space-y-5"
              onSubmit={(e) => {
                (async () => {
                  e.preventDefault();
                  setSubmitting(true);
                  setError(null);

                  try {
                    if (password !== confirmPassword) {
                      setError("Passwords do not match.");
                      return;
                    }

                    const supabase = getSupabaseBrowserClient();
                    const { data: signUpData, error: signUpError } =
                      await supabase.auth.signUp({
                        email,
                        password,
                      });

                    if (signUpError) {
                      setError(signUpError.message);
                      return;
                    }

                    // Get the session user (either from signUp directly or after signIn)
                    const sessionUser =
                      signUpData.session?.user ??
                      (await (async () => {
                        if (!signUpData.session) {
                          const { data: signInData, error: signInError } =
                            await supabase.auth.signInWithPassword({
                              email,
                              password,
                            });

                          if (signInError || !signInData.session) {
                            setError(
                              "Email confirmation is enabled in Supabase. Disable it (Auth → Email) to allow instant sign up and dashboard access.",
                            );
                            return null;
                          }
                          return signInData.session.user;
                        }
                        return null;
                      })());

                    if (!sessionUser) return;

                    try {
                      sessionStorage.setItem(
                        ADMIN_TOAST_KEY,
                        JSON.stringify({
                          title: "Account created",
                          message:
                            "Account created successfully. Admin access must be approved by the site owner.",
                        }),
                      );
                    } catch {
                      // ignore storage failures
                    }

                    router.replace("/admin/login");
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Sign up failed. Please try again.",
                    );
                  } finally {
                    setSubmitting(false);
                  }
                })();
              }}
            >
              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.currentTarget.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-muted/30 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent transition-all text-sm"
                    placeholder="admin@proassistng.com"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    className="block w-full pl-11 pr-12 py-3 bg-muted/30 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent transition-all text-sm"
                    placeholder="••••••••"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-muted-foreground group-focus-within:text-primary transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.currentTarget.value)}
                    className="block w-full pl-11 pr-12 py-3 bg-muted/30 border border-border rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent transition-all text-sm"
                    placeholder="••••••••"
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setShowConfirm((v) => !v)}
                    aria-label={showConfirm ? "Hide password" : "Show password"}
                  >
                    {showConfirm ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-semibold text-sm transition-all shadow-lg shadow-primary/25 active:scale-[0.98] disabled:opacity-60 disabled:hover:opacity-60 disabled:active:scale-100"
              >
                {submitting ? "Creating account..." : "Create Admin Account"}
              </button>

              {error ? (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                  {error}
                </div>
              ) : null}

              <div className="text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link
                  href="/admin/login"
                  className="font-medium text-primary hover:opacity-80 transition-opacity"
                >
                  Log in
                </Link>
              </div>
            </form>
          </div>

          <div className="px-8 py-4 bg-muted/30 border-t border-border flex justify-between items-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Admin Access
            </span>
            <span className="text-[11px] text-muted-foreground">
              Requests are subject to approval
            </span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary/20 to-transparent" />
    </div>
  );
}
