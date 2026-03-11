"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Zap,
  UserPlus,
  Users,
  Mail,
  BookUser,
  Settings,
  type LucideIcon,
} from "lucide-react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type NavItem = {
  label: string;
  href: string;
  Icon: LucideIcon;
  badge?: string;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    href: "/admin",
    Icon: LayoutDashboard,
  },
  {
    label: "Add Freelancer",
    href: "/admin/add-freelancer",
    Icon: UserPlus,
  },
  {
    label: "Freelancers",
    href: "/admin/freelancers",
    Icon: Users,
  },
  {
    label: "Messages",
    href: "/admin/messages",
    Icon: Mail,
  },
  {
    label: "Subscribers",
    href: "/admin/subscribers",
    Icon: BookUser,
  },
];

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  if (parts.length === 0) return "A";
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("");
}

export default function AdminSidebar() {
  const pathname = usePathname();

  const [unreadCount, setUnreadCount] = useState<number | null>(null);
  const [adminName, setAdminName] = useState("Alex Johnson");
  const [adminRole, setAdminRole] = useState("Super Admin");
  const [adminInitials, setAdminInitials] = useState("AJ");

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
        setUnreadCount(0);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const items = useMemo(() => {
    return navItems.map((it) => {
      if (it.href !== "/admin/messages") return it;
      if (unreadCount === null || unreadCount <= 0) return it;
      return { ...it, badge: String(unreadCount) };
    });
  }, [unreadCount]);

  return (
    <aside className="hidden md:flex w-64 bg-foreground text-background shrink-0 flex-col">
      <div className="p-6 flex items-center gap-3">
        <div className="min-w-0">
          <img
            src="/logo.png"
            alt="ProAssist Logo"
            className="rounded-full h-28 w-auto"
          />
        </div>
      </div>

      <nav className="flex-1 px-3 mt-4 space-y-1">
        {items.map(({ label, href, Icon, badge }) => {
          const active =
            pathname === href ||
            (href !== "/admin" && pathname?.startsWith(`${href}/`));

          return (
            <Link
              key={href}
              href={href}
              className={
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors " +
                (active
                  ? "bg-primary/20 text-background border-l-4 border-primary"
                  : "text-background/70 hover:text-background hover:bg-background/10")
              }
            >
              <Icon className="w-5 h-5" />
              <div className="flex-1 flex items-center justify-between">
                <span className="font-medium">{label}</span>
                {badge ? (
                  <span className="bg-primary/25 text-background text-[10px] px-2 py-0.5 rounded-full font-semibold">
                    {badge}
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto border-t border-background/10">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-background/10 transition-colors">
          <div className="h-10 w-10 rounded-full bg-background/10 overflow-hidden flex items-center justify-center">
            <span className="text-xs font-semibold text-background">
              {adminInitials}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-background truncate">
              {adminName}
            </p>
            <p className="text-xs text-background/60 truncate">{adminRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
