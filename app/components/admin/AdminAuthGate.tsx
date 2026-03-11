"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AdminAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    let supabase: ReturnType<typeof getSupabaseBrowserClient> | null = null;
    try {
      supabase = getSupabaseBrowserClient();
    } catch (err) {
      setConfigError(
        err instanceof Error ? err.message : "Supabase is not configured.",
      );
      setReady(true);
      return;
    }

    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      const isPublicAuthPage =
        pathname?.startsWith("/admin/login") ||
        pathname?.startsWith("/admin/signup");
      if (!data.session && !isPublicAuthPage) {
        router.replace("/admin/login");
        return;
      }

      setReady(true);
    })();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: unknown, session: unknown) => {
      const isPublicAuthPage =
        pathname?.startsWith("/admin/login") ||
        pathname?.startsWith("/admin/signup");
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
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (configError) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-6">
        <div className="max-w-xl w-full bg-card border border-border rounded-xl p-6 text-sm">
          <p className="font-semibold text-foreground mb-2">
            Supabase setup required
          </p>
          <p className="text-muted-foreground">{configError}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
