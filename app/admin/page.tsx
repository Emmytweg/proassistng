"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  Briefcase,
  MessageSquare,
  MoreHorizontal,
  Star,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatFreelancerRate } from "@/lib/rate-format";

const ADMIN_TOAST_KEY = "proassist_admin_toast";

type Trend = { value: string; direction: "up" | "down" };

type StatKey =
  | "totalFreelancers"
  | "featuredFreelancers"
  | "newMessages"
  | "activeProjects";

type DashboardStats = Record<StatKey, { value: number; trend: Trend }>;

type RecentFreelancer = {
  name: string;
  role: string;
  rate: string;
  status: "Active" | "Pending" | "Idle";
};

type ActivityItem = {
  title: string;
  detail: string;
  time: string;
  highlight: boolean;
  timestamp: number;
};

function isMissingColumnOrBadRequest(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: unknown; message?: unknown };
  const message = typeof anyErr.message === "string" ? anyErr.message : "";
  // PostgREST often uses 400s for unknown columns (select/order).
  return (
    anyErr.code === "PGRST204" ||
    message.toLowerCase().includes("column") ||
    message.toLowerCase().includes("created_at")
  );
}

function isNotFoundOrNoExposure(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const anyErr = err as { code?: unknown; message?: unknown };
  const message = typeof anyErr.message === "string" ? anyErr.message : "";
  return (
    anyErr.code === "42P01" ||
    message.toLowerCase().includes("not found") ||
    message.toLowerCase().includes("does not exist")
  );
}

function formatTrend(current: number, previous: number): Trend {
  if (previous <= 0) {
    return { value: "+0.0%", direction: "up" };
  }
  const delta = ((current - previous) / previous) * 100;
  const direction: Trend["direction"] = delta >= 0 ? "up" : "down";
  const sign = delta >= 0 ? "+" : "";
  return { value: `${sign}${delta.toFixed(1)}%`, direction };
}

function timeAgo(date: Date): string {
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return `${seconds} sec ago`;
  if (hours < 1) return `${minutes} mins ago`;
  if (days < 1) return `${hours} hours ago`;
  return `${days} days ago`;
}

function useReveal() {
  const reduceMotion = useReducedMotion();

  return useMemo(
    () =>
      ({
        card: {
          hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
          show: {
            opacity: 1,
            y: 0,
            transition: { duration: reduceMotion ? 0 : 0.45, ease: "easeOut" },
          },
        },
        stagger: {
          hidden: {},
          show: {
            transition: {
              staggerChildren: reduceMotion ? 0 : 0.06,
              delayChildren: reduceMotion ? 0 : 0.02,
            },
          },
        },
      }) as const,
    [reduceMotion],
  );
}

function StatCard({
  title,
  value,
  Icon,
  trend,
}: {
  title: string;
  value: string;
  Icon: React.ComponentType<{ className?: string }>;
  trend: Trend;
}) {
  const TrendIcon = trend.direction === "up" ? TrendingUp : TrendingDown;
  const trendColor =
    trend.direction === "up" ? "text-primary" : "text-destructive";

  return (
    <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-muted rounded-lg text-muted-foreground">
          <Icon className="w-5 h-5" />
        </div>
        <span
          className={
            "text-xs font-medium flex items-center gap-1 " + trendColor
          }
        >
          {trend.value} <TrendIcon className="w-3 h-3" />
        </span>
      </div>
      <h3 className="text-muted-foreground text-sm font-medium">{title}</h3>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

function StatusPill({ status }: { status: "Active" | "Pending" | "Idle" }) {
  const styles =
    status === "Active"
      ? "bg-primary/15 text-primary"
      : status === "Pending"
        ? "bg-amber-500/15 text-amber-700"
        : "bg-muted text-muted-foreground";

  return (
    <span
      className={
        "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium " +
        styles
      }
    >
      {status}
    </span>
  );
}

export default function AdminPage() {
  const v = useReveal();

  const [toast, setToast] = useState<null | {
    title: string;
    message?: string;
  }>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalFreelancers: { value: 0, trend: { value: "+0.0%", direction: "up" } },
    featuredFreelancers: {
      value: 0,
      trend: { value: "+0.0%", direction: "up" },
    },
    newMessages: { value: 0, trend: { value: "+0.0%", direction: "up" } },
    activeProjects: { value: 0, trend: { value: "+0.0%", direction: "up" } },
  });
  const [recentFreelancers, setRecentFreelancers] = useState<
    RecentFreelancer[]
  >([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(ADMIN_TOAST_KEY);
      if (!raw) return;
      sessionStorage.removeItem(ADMIN_TOAST_KEY);

      const parsed = JSON.parse(raw) as { title?: unknown; message?: unknown };
      const next = {
        title: typeof parsed.title === "string" ? parsed.title : "Success",
        message:
          typeof parsed.message === "string" ? parsed.message : undefined,
      };
      setToast(next);

      const t = window.setTimeout(() => setToast(null), 3200);
      return () => window.clearTimeout(t);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const supabase = getSupabaseBrowserClient();
        const now = new Date();
        const startCurrent = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const startPrev = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        const [totalFreelancers, featuredFreelancers, unreadMessages] =
          await Promise.all([
            supabase
              .from("freelancers")
              .select("id", { count: "exact", head: true }),
            supabase
              .from("freelancers")
              .select("id", { count: "exact", head: true })
              .eq("featured", true),
            supabase
              .from("messages")
              .select("id", { count: "exact", head: true })
              .eq("unread", true),
          ]);

        // Trend queries depend on timestamp columns that may not exist yet.
        const [
          totalFreelancersCurrent,
          totalFreelancersPrev,
          featuredCurrent,
          featuredPrev,
          messagesCurrent,
          messagesPrev,
        ] = await Promise.all([
          supabase
            .from("freelancers")
            .select("id", { count: "exact", head: true })
            .gte("created_at", startCurrent.toISOString()),
          supabase
            .from("freelancers")
            .select("id", { count: "exact", head: true })
            .gte("created_at", startPrev.toISOString())
            .lt("created_at", startCurrent.toISOString()),
          supabase
            .from("freelancers")
            .select("id", { count: "exact", head: true })
            .eq("featured", true)
            .gte("created_at", startCurrent.toISOString()),
          supabase
            .from("freelancers")
            .select("id", { count: "exact", head: true })
            .eq("featured", true)
            .gte("created_at", startPrev.toISOString())
            .lt("created_at", startCurrent.toISOString()),
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .gte("received_at", startCurrent.toISOString()),
          supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .gte("received_at", startPrev.toISOString())
            .lt("received_at", startCurrent.toISOString()),
        ]);

        // Optional tables for dashboard: may 404 until schema/grants are applied.
        const [activeProjects, projectsCurrent, projectsPrev, activityRows] =
          await Promise.all([
            supabase
              .from("projects")
              .select("id", { count: "exact", head: true })
              .eq("status", "active"),
            supabase
              .from("projects")
              .select("id", { count: "exact", head: true })
              .eq("status", "active")
              .gte("created_at", startCurrent.toISOString()),
            supabase
              .from("projects")
              .select("id", { count: "exact", head: true })
              .eq("status", "active")
              .gte("created_at", startPrev.toISOString())
              .lt("created_at", startCurrent.toISOString()),
            supabase
              .from("activity_events")
              .select("title, detail, highlight, created_at")
              .order("created_at", { ascending: false })
              .limit(4),
          ]);

        // Recent freelancers can fail if the table lacks created_at/status yet.
        const recentPrimary = await supabase
          .from("freelancers")
          .select(
            "full_name, title, hourly_rate, hourly_rate_min, hourly_rate_max, rate_type, status, featured",
          )
          .order("created_at", { ascending: false })
          .limit(4);

        let recentData: any[] | null = recentPrimary.data ?? null;
        let recentError: unknown = recentPrimary.error ?? null;

        if (recentError && isMissingColumnOrBadRequest(recentError)) {
          const recentFallback = await supabase
            .from("freelancers")
            .select(
              "full_name, title, hourly_rate, hourly_rate_min, hourly_rate_max, rate_type, featured",
            )
            .order("id", { ascending: false })
            .limit(4);

          recentData = recentFallback.data ?? null;
          recentError = recentFallback.error ?? null;
        }

        const firstError =
          totalFreelancers.error ||
          featuredFreelancers.error ||
          unreadMessages.error ||
          (recentError as any) ||
          null;

        if (firstError) throw firstError;

        const nextStats: DashboardStats = {
          totalFreelancers: {
            value: totalFreelancers.count ?? 0,
            trend:
              totalFreelancersCurrent.error || totalFreelancersPrev.error
                ? { value: "+0.0%", direction: "up" }
                : formatTrend(
                    totalFreelancersCurrent.count ?? 0,
                    totalFreelancersPrev.count ?? 0,
                  ),
          },
          featuredFreelancers: {
            value: featuredFreelancers.count ?? 0,
            trend:
              featuredCurrent.error || featuredPrev.error
                ? { value: "+0.0%", direction: "up" }
                : formatTrend(
                    featuredCurrent.count ?? 0,
                    featuredPrev.count ?? 0,
                  ),
          },
          newMessages: {
            value: unreadMessages.count ?? 0,
            trend:
              messagesCurrent.error || messagesPrev.error
                ? { value: "+0.0%", direction: "up" }
                : formatTrend(
                    messagesCurrent.count ?? 0,
                    messagesPrev.count ?? 0,
                  ),
          },
          activeProjects: {
            value:
              activeProjects.error &&
              isNotFoundOrNoExposure(activeProjects.error)
                ? 0
                : (activeProjects.count ?? 0),
            trend:
              projectsCurrent.error || projectsPrev.error
                ? { value: "+0.0%", direction: "up" }
                : formatTrend(
                    projectsCurrent.count ?? 0,
                    projectsPrev.count ?? 0,
                  ),
          },
        };

        const mappedRecent: RecentFreelancer[] = (recentData ?? []).map(
          (r: any) => {
            const status = String(r.status ?? "active").toLowerCase();
            const normalized: RecentFreelancer["status"] =
              status === "pending"
                ? "Pending"
                : status === "idle"
                  ? "Idle"
                  : "Active";
            return {
              name: String(r.full_name ?? "Unnamed"),
              role: String(r.title ?? "—"),
              rate:
                r.hourly_rate != null ||
                r.hourly_rate_min != null ||
                r.hourly_rate_max != null
                  ? formatFreelancerRate(
                      r.hourly_rate_min ?? r.hourly_rate,
                      r.rate_type,
                      r.hourly_rate_max,
                    )
                  : "—",
              status: normalized,
            };
          },
        );

        // Activity: prefer activity_events, otherwise derive a minimal feed from latest rows.
        let mappedActivity: ActivityItem[] = [];
        if (!activityRows.error && (activityRows.data?.length ?? 0) > 0) {
          mappedActivity = (activityRows.data ?? []).map((a: any) => {
            const ts = a.created_at ? new Date(a.created_at) : new Date();
            return {
              title: String(a.title ?? "Activity"),
              detail: String(a.detail ?? ""),
              time: timeAgo(ts),
              highlight: !!a.highlight,
              timestamp: ts.getTime(),
            };
          });
        } else {
          const [latestFreelancers, latestMessages] = await Promise.all([
            supabase
              .from("freelancers")
              .select("full_name, title, created_at")
              .order("created_at", { ascending: false })
              .limit(2),
            supabase
              .from("messages")
              .select("sender_name, subject, received_at")
              .order("received_at", { ascending: false })
              .limit(2),
          ]);

          const derived: ActivityItem[] = [];
          for (const f of latestFreelancers.data ?? []) {
            const ts = f.created_at ? new Date(f.created_at) : new Date();
            derived.push({
              title: "New freelancer registered",
              detail: `${String(f.full_name ?? "Someone")} joined as ‘${String(f.title ?? "Freelancer")}’.`,
              time: timeAgo(ts),
              highlight: true,
              timestamp: ts.getTime(),
            });
          }
          for (const m of latestMessages.data ?? []) {
            const ts = m.received_at ? new Date(m.received_at) : new Date();
            derived.push({
              title: "New message",
              detail: `${String(m.sender_name ?? "User")} sent: ‘${String(m.subject ?? "Message")}’.`,
              time: timeAgo(ts),
              highlight: false,
              timestamp: ts.getTime(),
            });
          }
          mappedActivity = derived
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, 4);
        }

        if (!active) return;
        setStats(nextStats);
        setRecentFreelancers(mappedRecent);
        setActivity(mappedActivity);
      } catch (err) {
        if (!active) return;
        setError(
          err instanceof Error ? err.message : "Failed to load dashboard data.",
        );
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-8">
      {toast ? (
        <div className="fixed top-6 right-6 z-50 max-w-90 w-[calc(100%-3rem)] sm:w-auto">
          <div className="bg-card border border-primary/25 rounded-xl p-4 shadow-sm">
            <p className="text-sm font-semibold text-foreground">
              {toast.title}
            </p>
            {toast.message ? (
              <p className="text-xs text-muted-foreground mt-1">
                {toast.message}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* STATS */}
      <motion.div
        variants={v.stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div variants={v.card}>
          <StatCard
            title="Total Freelancers"
            value={
              loading ? "…" : stats.totalFreelancers.value.toLocaleString()
            }
            Icon={Users}
            trend={stats.totalFreelancers.trend}
          />
        </motion.div>
        <motion.div variants={v.card}>
          <StatCard
            title="Featured Freelancers"
            value={
              loading ? "…" : stats.featuredFreelancers.value.toLocaleString()
            }
            Icon={Star}
            trend={stats.featuredFreelancers.trend}
          />
        </motion.div>
        <motion.div variants={v.card}>
          <StatCard
            title="New Messages"
            value={loading ? "…" : stats.newMessages.value.toLocaleString()}
            Icon={MessageSquare}
            trend={stats.newMessages.trend}
          />
        </motion.div>
        <motion.div variants={v.card}>
          <StatCard
            title="Active Projects"
            value={loading ? "…" : stats.activeProjects.value.toLocaleString()}
            Icon={Briefcase}
            trend={stats.activeProjects.trend}
          />
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RECENT FREELANCERS */}
        <div className="lg:col-span-2 bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="p-6 border-b flex items-center justify-between">
            <h3 className="font-semibold text-foreground">
              Recent Freelancers
            </h3>
            <button
              type="button"
              className="text-xs font-medium text-primary hover:underline"
            >
              View all
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                  <th className="px-6 py-4">Freelancer</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Hourly rate</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y text-sm">
                {loading ? (
                  <tr>
                    <td
                      className="px-6 py-8 text-sm text-muted-foreground"
                      colSpan={5}
                    >
                      Loading recent freelancers...
                    </td>
                  </tr>
                ) : recentFreelancers.length === 0 ? (
                  <tr>
                    <td
                      className="px-6 py-8 text-sm text-muted-foreground"
                      colSpan={5}
                    >
                      No freelancers yet.
                    </td>
                  </tr>
                ) : (
                  recentFreelancers.map((row) => (
                    <tr
                      key={row.name}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
                            {row.name
                              .split(" ")
                              .slice(0, 2)
                              .map((s) => s[0])
                              .join("")}
                          </div>
                          <span className="font-medium text-foreground/90">
                            {row.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {row.role}
                      </td>
                      <td className="px-6 py-4 font-semibold text-foreground/90">
                        {row.rate}
                      </td>
                      <td className="px-6 py-4">
                        <StatusPill status={row.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          className="p-1 hover:bg-muted rounded text-muted-foreground transition-colors"
                          aria-label="Row actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ACTIVITY FEED */}
        <aside className="bg-card rounded-xl border shadow-sm p-6">
          <h3 className="font-semibold text-foreground mb-6">Activity Feed</h3>

          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-6 relative">
              {loading ? (
                <div className="text-sm text-muted-foreground">
                  Loading activity...
                </div>
              ) : activity.length === 0 ? (
                <div className="text-sm text-muted-foreground">
                  No activity yet.
                </div>
              ) : (
                activity.map((item) => (
                  <div
                    key={item.title + item.time}
                    className="flex gap-4 items-start pl-8 relative"
                  >
                    <div
                      className={
                        "absolute left-[-1.5px] w-2 h-2 rounded-full mt-2 " +
                        (item.highlight
                          ? "bg-destructive shadow-[0_0_0_4px_rgba(0,0,0,0.06)]"
                          : "bg-muted-foreground/40")
                      }
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {item.detail}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 mt-1 uppercase font-semibold">
                        {item.time}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            type="button"
            className="w-full mt-8 py-2 text-xs font-medium text-muted-foreground border rounded-lg hover:bg-muted/40 transition-colors"
          >
            Load more activity
          </button>
        </aside>
      </div>
    </div>
  );
}
