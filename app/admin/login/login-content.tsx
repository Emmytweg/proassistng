"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

function BrandMark() {
  return (
    <div className="bg-primary/10 p-3 rounded-xl border border-primary/20">
      <svg
        className="size-8 text-primary"
        fill="none"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M24 4H6V17.3333V30.6667H24V44H42V30.6667V17.3333H24V4Z"
        />
      </svg>
    </div>
  );
}

export default function AdminLoginContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="light relative min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden bg-background text-foreground antialiased selection:bg-primary/30">
      <div className="w-full flex items-center justify-center flex-col max-w-[440px] z-10">
        {/* Brand */}
        <img
          src="/logo.png"
          alt="ProAssist Logo"
          className="rounded-full h-28 mb-6 w-auto"
        />

        {/* Card */}
        <div className="bg-card rounded-xl shadow-2xl border border-border/50 overflow-hidden">
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-xl font-semibold">Admin Login</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Please enter your credentials to continue
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
                    const supabase = getSupabaseBrowserClient();
                    const { error } = await supabase.auth.signInWithPassword({
                      email,
                      password,
                    });

                    if (error) {
                      setError(error.message);
                      return;
                    }

                    router.push("/admin");
                  } catch (err) {
                    setError(
                      err instanceof Error
                        ? err.message
                        : "Login failed. Please try again.",
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
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium">Password</label>
                  <Link
                    href="#"
                    prefetch={false}
                    className="text-xs font-medium text-primary hover:opacity-80 transition-opacity"
                  >
                    Forgot password?
                  </Link>
                </div>
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
                    autoComplete="current-password"
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

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.currentTarget.checked)}
                  className="h-4 w-4 rounded border-border text-primary focus:ring-primary/20 bg-background"
                />
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-sm text-muted-foreground"
                >
                  Keep me logged in
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={
                  "w-full flex justify-center items-center py-3.5 px-4 rounded-xl bg-primary hover:opacity-90 text-primary-foreground font-semibold text-sm transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-60 disabled:hover:opacity-60 disabled:active:scale-100"
                }
              >
                {submitting ? "Signing in..." : "Sign In to Dashboard"}
              </button>

              {error ? (
                <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-xl p-3">
                  {error}
                </div>
              ) : null}

              <div className="text-xs text-muted-foreground">
                Need an account?{" "}
                <Link
                  href="/admin/signup"
                  className="font-medium text-primary hover:opacity-80 transition-opacity"
                >
                  Sign up
                </Link>
              </div>
            </form>
          </div>

          <div className="px-8 py-4 bg-muted/30 border-t border-border flex justify-between items-center">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
              Security Level: High
            </span>
            <div className="flex gap-2 items-center">
              <div className="size-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-muted-foreground">
                Systems Operational
              </span>
            </div>
          </div>
        </div>

        {/* <div className="mt-8 flex justify-center gap-6">
          <Link
            href="#"
            prefetch={false}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="#"
            prefetch={false}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            prefetch={false}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact Support
          </Link>
        </div> */}
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
    </div>
  );
}
