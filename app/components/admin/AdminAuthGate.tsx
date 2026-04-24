"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { isAllowedAdminEmail } from "@/lib/admin-auth";

const ADMIN_SIGNUP_ENABLED =
  process.env.NEXT_PUBLIC_ADMIN_SIGNUP_ENABLED === "true";

export default function AdminAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  const supabaseInit = useMemo(() => {
    try {
      return {
        supabase: getSupabaseBrowserClient(),
        error: null as string | null,
      };
    } catch (err) {
      return {
        supabase: null,
        error:
          err instanceof Error ? err.message : "Supabase is not configured.",
      };
    }
  }, []);

  useEffect(() => {
    let active = true;
    const supabase = supabaseInit.supabase;
    if (!supabase) return;

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      const sessionEmail = data.session?.user?.email;
      if (data.session && !isAllowedAdminEmail(sessionEmail)) {
        await supabase.auth.signOut();
        if (!active) return;
        router.replace("/admin/login");
        return;
      }

      const isPublicAuthPage =
        pathname?.startsWith("/admin/login") ||
        (ADMIN_SIGNUP_ENABLED && pathname?.startsWith("/admin/signup"));
      if (!data.session && !isPublicAuthPage) {
        router.replace("/admin/login");
        return;
      }

      setReady(true);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: unknown, session: unknown) => {
      const nextEmail =
        session && typeof session === "object"
          ? (session as { user?: { email?: string | null } }).user?.email
          : null;

      if (session && !isAllowedAdminEmail(nextEmail)) {
        void supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      const isPublicAuthPage =
        pathname?.startsWith("/admin/login") ||
        (ADMIN_SIGNUP_ENABLED && pathname?.startsWith("/admin/signup"));
      if (!session && !isPublicAuthPage) {
        router.replace("/admin/login");
        return;
      }
      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [pathname, router, supabaseInit.supabase]);

  if (supabaseInit.error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
        <div className="max-w-xl w-full bg-card border border-border rounded-xl p-6 text-sm">
          <p className="font-semibold text-foreground mb-2">
            Supabase setup required
          </p>
          <p className="text-muted-foreground">{supabaseInit.error}</p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
