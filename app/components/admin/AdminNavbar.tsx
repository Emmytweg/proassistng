"use client";

import { Bell, CalendarDays, HelpCircle, Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

function getTitle(pathname: string | null) {
  if (!pathname) return "Dashboard Overview";
  if (pathname === "/admin") return "Dashboard Overview";
  if (pathname.startsWith("/admin/add-freelancer")) return "Add New Freelancer";
  if (pathname.startsWith("/admin/edit-freelancer")) return "Edit Freelancer";
  if (pathname.startsWith("/admin/delete-freelancer"))
    return "Delete Freelancer";
  if (pathname.startsWith("/admin/freelancers")) return "Freelancers";
  if (pathname.startsWith("/admin/messages")) return "Messages";
  return "Admin";
}

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "A";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export default function AdminNavbar() {
  const pathname = usePathname();
  const title = getTitle(pathname);
  const isMessages = pathname?.startsWith("/admin/messages");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [messagesQuery, setMessagesQuery] = useState("");

  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [adminName, setAdminName] = useState("Sarah Jenkins");
  const [adminRole, setAdminRole] = useState("Super Admin");
  const [adminInitials, setAdminInitials] = useState("SJ");

  useEffect(() => {
    if (!isMessages) return;
    setMessagesQuery(searchParams.get("q") ?? "");
  }, [isMessages, searchParams]);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();

        const [{ data: userRes }, unreadRes, roleRes] = await Promise.all([
          supabase.auth.getUser(),
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("unread", true),
          supabase.from("admin_users").select("role").maybeSingle(),
        ]);

        if (!active) return;

        setUnreadCount(unreadRes.error ? 0 : (unreadRes.count ?? 0));

        const user = userRes.user;
        if (user) {
          const meta = user.user_metadata as any;
          const metaName =
            typeof meta?.full_name === "string" ? meta.full_name : null;
          const email = typeof user.email === "string" ? user.email : null;
          const emailName = email ? email.split("@")[0] : null;
          const derivedName =
            metaName ??
            (emailName
              ? emailName
                  .replace(/[._-]+/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())
              : "Admin");

          setAdminName(derivedName);
          setAdminInitials(initialsFromName(derivedName));
        }

        if (!roleRes.error && roleRes.data?.role) {
          const role = String(roleRes.data.role);
          setAdminRole(role === "admin" ? "Admin" : role);
        }
      } catch {
        if (!active) return;
        // Fall back to defaults if Supabase isn't configured or requests fail.
        setUnreadCount(0);
      }
    })();

    return () => {
      active = false;
    };
  }, [pathname]);

  return (
    <header className="h-16 bg-background border-b flex items-center justify-between px-8 sticky top-0 z-10">
      <div className="flex items-center gap-4 min-w-0">
        <h2 className="text-xl font-semibold text-foreground truncate">
          {title}
        </h2>
        {isMessages && unreadCount !== null && unreadCount > 0 ? (
          <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
            {unreadCount} New
          </span>
        ) : null}
      </div>

      {isMessages ? (
        <div className="flex items-center gap-4 flex-1 max-w-2xl px-8">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by sender, email or subject..."
              value={messagesQuery}
              onChange={(e) => {
                const next = e.currentTarget.value;
                setMessagesQuery(next);
                const params = new URLSearchParams(searchParams);
                if (next.trim()) params.set("q", next);
                else params.delete("q");
                router.replace(
                  `/admin/messages${params.toString() ? `?${params.toString()}` : ""}`,
                );
              }}
              className="w-full pl-10 pr-4 py-2 bg-muted/60 border-none rounded-xl text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button
            type="button"
            className="flex items-center gap-2 px-3 py-2 bg-muted/60 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted transition-colors whitespace-nowrap"
            aria-label="Date range"
          >
            <CalendarDays className="w-4 h-4" />
            Oct 12 - Oct 19
          </button>
        </div>
      ) : null}

      <div className="flex items-center gap-4">
        {!isMessages ? (
          <div className="relative hidden md:block">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search data..."
              className="pl-10 pr-4 py-2 bg-muted/60 border-none rounded-full text-sm w-64 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        ) : null}

        <button
          type="button"
          className="p-2 text-muted-foreground hover:bg-muted rounded-lg relative transition-colors"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount !== null && unreadCount > 0 ? (
            <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
          ) : null}
        </button>

        {isMessages ? (
          <button
            type="button"
            className="p-2 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            aria-label="Help"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
        ) : (
          <>
            <div className="h-8 w-px bg-border mx-2" />
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-foreground">
                  {adminName}
                </p>
                <p className="text-[10px] text-muted-foreground">{adminRole}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center border-2 border-transparent group-hover:border-primary transition-colors">
                <span className="text-xs font-semibold text-foreground">
                  {adminInitials}
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
