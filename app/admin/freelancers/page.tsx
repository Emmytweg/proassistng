"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Pencil,
  Plus,
  Star,
  Trash2,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type FreelancerRow = {
  id: string;
  name: string;
  email?: string | null;
  title: string;
  skills: string[];
  rate: string;
  rateType: string;
  featured: boolean;
  dbStatus: string;
};

function useReveal() {
  const reduceMotion = useReducedMotion();
  return useMemo(
    () =>
      ({
        fadeUp: {
          hidden: { opacity: 0, y: reduceMotion ? 0 : 10 },
          show: {
            opacity: 1,
            y: 0,
            transition: { duration: reduceMotion ? 0 : 0.45, ease: "easeOut" },
          },
        },
      }) as const,
    [reduceMotion],
  );
}

function InitialAvatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center text-xs font-semibold text-foreground">
      {initials}
    </div>
  );
}

function SkillsChips({ skills }: { skills: string[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {skills.map((skill) => (
        <span
          key={skill}
          className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full"
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

function StatusCell({ status }: { status: string }) {
  const isActive = status === "active";
  return (
    <div className="flex items-center gap-2">
      <span
        className={
          "w-2 h-2 rounded-full " +
          (isActive ? "bg-green-500" : "bg-muted-foreground/40")
        }
      />
      <span
        className={
          "text-xs font-medium capitalize " +
          (isActive ? "text-green-600" : "text-muted-foreground")
        }
      >
        {status}
      </span>
    </div>
  );
}

export default function FreelancersPage() {
  const v = useReveal();
  const router = useRouter();
  const [query, setQuery] = useState("");

  const [rows, setRows] = useState<FreelancerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("freelancers")
          .select(
            "id, full_name, title, skills, hourly_rate, rate_type, featured, status, created_at",
          )
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!active) return;

        const mapped: FreelancerRow[] = (data ?? []).map((r: any) => {
          const amt =
            typeof r.hourly_rate === "number"
              ? `₦${r.hourly_rate.toLocaleString("en-NG")}`
              : null;
          const suffix =
            r.rate_type === "milestone"
              ? "/milestone"
              : r.rate_type === "monthly"
                ? "/month"
                : r.rate_type === "contract"
                  ? " (contract)"
                  : "/hr";
          return {
            id: String(r.id),
            name: String(r.full_name ?? "Unnamed"),
            email: null,
            title: String(r.title ?? "—"),
            skills: Array.isArray(r.skills) ? r.skills.map(String) : [],
            rate: amt ? `${amt}${suffix}` : "—",
            rateType: String(r.rate_type ?? "hourly"),
            featured: !!r.featured,
            dbStatus: String(r.status ?? "active"),
          };
        });

        setRows(mapped);
      } catch (err) {
        setLoadError(
          err instanceof Error ? err.message : "Failed to load freelancers.",
        );
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const filtered = rows.filter((r) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.email ?? "").toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.skills.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page header row (matches screenshot: title + search + buttons) */}
      <motion.div
        variants={v.fadeUp}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex items-center gap-4 flex-1">
          <h1 className="text-xl font-bold text-foreground">Freelancers</h1>
          <div className="max-w-md w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-muted/60 border-none rounded-xl py-2 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring placeholder:text-muted-foreground"
                placeholder="Search freelancers by name, skill, or title..."
                type="text"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" className="rounded-xl">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button asChild className="rounded-xl font-semibold">
            <Link href="/admin/add-freelancer">
              <Plus className="h-4 w-4 mr-2" />
              Add Freelancer
            </Link>
          </Button>
          <div className="w-10 h-10 rounded-full bg-muted overflow-hidden ring-2 ring-background flex items-center justify-center">
            <span className="text-xs font-semibold text-foreground">A</span>
          </div>
        </div>
      </motion.div>

      {/* Table */}
      <motion.div
        variants={v.fadeUp}
        initial="hidden"
        animate="show"
        className="bg-card rounded-xl border shadow-sm overflow-auto"
      >
        {loadError ? (
          <div className="p-6 text-sm text-destructive bg-destructive/10 border-b border-destructive/20">
            {loadError}
          </div>
        ) : null}

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50 text-muted-foreground uppercase text-[11px] font-bold tracking-wider">
              <th className="px-6 py-4">Freelancer</th>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Skills</th>
              <th className="px-6 py-4">Rate</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td
                  className="px-6 py-8 text-sm text-muted-foreground"
                  colSpan={6}
                >
                  Loading freelancers...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  className="px-6 py-8 text-sm text-muted-foreground"
                  colSpan={6}
                >
                  No freelancers found.
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <InitialAvatar name={row.name} />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {row.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {row.email || "—"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-muted-foreground">
                      {row.title}
                    </span>
                  </td>
                  <td className="px-6 py-4 truncate">
                    <SkillsChips skills={row.skills} />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">{row.rate}</td>
                  <td className="px-6 py-4">
                    <StatusCell status={row.dbStatus} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className="p-1.5 text-muted-foreground hover:text-primary transition-colors"
                        aria-label="Edit freelancer"
                        onClick={() =>
                          router.push(`/admin/edit-freelancer?id=${row.id}`)
                        }
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={
                          "p-1.5 transition-colors " +
                          (row.featured
                            ? "text-yellow-500 hover:text-yellow-600"
                            : "text-muted-foreground hover:text-yellow-500")
                        }
                        aria-label={
                          row.featured
                            ? "Unfeature freelancer"
                            : "Feature freelancer"
                        }
                        onClick={async () => {
                          const supabase = getSupabaseBrowserClient();
                          const next = !row.featured;
                          await supabase
                            .from("freelancers")
                            .update({
                              featured: next,
                              updated_at: new Date().toISOString(),
                            })
                            .eq("id", row.id);
                          setRows((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, featured: next } : r,
                            ),
                          );
                        }}
                      >
                        <Star
                          className={
                            "h-4 w-4 " + (row.featured ? "fill-yellow-500" : "")
                          }
                        />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Delete freelancer"
                        onClick={() =>
                          router.push(
                            `/admin/delete-freelancer?id=${row.id}&name=${encodeURIComponent(row.name)}`,
                          )
                        }
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="px-6 py-4 bg-muted/50 border-t flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-semibold text-foreground">1-4</span>{" "}
            of <span className="font-semibold text-foreground">128</span>{" "}
            freelancers
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-lg border hover:bg-background transition-colors disabled:opacity-50"
              disabled
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold"
              aria-current="page"
            >
              1
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium hover:bg-muted transition-colors"
            >
              2
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium hover:bg-muted transition-colors"
            >
              3
            </button>
            <span className="px-1 text-muted-foreground">...</span>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium hover:bg-muted transition-colors"
            >
              12
            </button>
            <button
              type="button"
              className="w-8 h-8 flex items-center justify-center rounded-lg border hover:bg-background transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
