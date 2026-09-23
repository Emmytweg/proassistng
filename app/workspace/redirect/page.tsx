"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, ShieldCheck } from "lucide-react";
import { API_ENDPOINTS, readApiError } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function WorkspaceRedirectPage() {
  const router = useRouter();
  const params = useSearchParams();
  const projectId = params.get("project_id") ?? "";
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setReady(true);
    if (!projectId) return;

    const supabase = getSupabaseBrowserClient();
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace(`/workspace/${projectId}`);
    });
  }, [projectId, router]);

  async function requestAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSending(true);
    setError(null);

    try {
      const response = await fetch(API_ENDPOINTS.workspaceMagicLink, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, email: email.trim() }),
      });

      if (!response.ok) {
        throw new Error(await readApiError(response, "Unable to send the access link."));
      }

      setSent(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to send the access link.");
    } finally {
      setSending(false);
    }
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Redirecting to your secure workspace…
      </div>
    );
  }

  if (projectId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="text-2xl font-black">Secure workspace access</h1>
          {sent ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Check your email for the secure access link. Open it in this browser to enter the workspace.
            </p>
          ) : (
            <>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Enter the client email used during payment and we will send a secure sign-in link.
              </p>
              <form onSubmit={requestAccess} className="mt-6 space-y-3 text-left">
                <label htmlFor="workspace-email" className="text-sm font-medium">Client email</label>
                <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <input
                    id="workspace-email"
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                  />
                </div>
                <button type="submit" disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60">
                  {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {sending ? "Sending access link" : "Email me a workspace link"}
                </button>
              </form>
              {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
        <ShieldCheck className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h1 className="text-2xl font-black">Workspace missing</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          A project workspace link is required to open this secure project.
        </p>
      </div>
    </div>
  );
}
