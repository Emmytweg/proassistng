"use client";

import TalentFilters from "@/app/components/talent/TalentFilters";
import type { FiltersState } from "@/app/components/talent/TalentFilters";
import TalentSearch from "@/app/components/talent/TalentSearch";
import TalentGrid from "@/app/components/talent/TalentGrid";
import Pagination from "@/app/components/talent/Pagination";

import { useEffect, useMemo, useState } from "react";
import type { TalentCardProps } from "@/app/components/talent/TalentCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatFreelancerRate } from "@/lib/rate-format";

type TalentItem = TalentCardProps & {
  category: FiltersState["category"];
  hourlyRate: number;
  experienceLevel: "Entry Level" | "Intermediate" | "Expert";
};

const PAGE_SIZE = 4;

function includesText(haystack: string, needle: string) {
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function inferCategory(
  skills: string[],
  title: string,
): FiltersState["category"] {
  const text = [...skills, title].join(" ").toLowerCase();
  if (
    /react|node|python|typescript|javascript|vue|angular|laravel|php|django|mongo|postgres|mysql|aws|docker|backend|frontend|fullstack|developer|engineer/.test(
      text,
    )
  )
    return "Development";
  if (
    /figma|adobe|illustrator|photoshop|sketch|ux|ui\b|design|wireframe|prototype|invision/.test(
      text,
    )
  )
    return "Design";
  if (/writing|content|copywriting|seo|blog|editorial|copy/.test(text))
    return "Writing";
  if (
    /marketing|ads|google ads|meta ads|ppc|analytics|social media|growth|email/.test(
      text,
    )
  )
    return "Marketing";
  return "All Categories";
}

function inferExperience(
  exp: string | null,
): "Entry Level" | "Intermediate" | "Expert" {
  if (!exp) return "Intermediate";
  if (exp === "1-2 years") return "Entry Level";
  if (exp === "3-5 years") return "Intermediate";
  return "Expert";
}

export default function BrowseTalentsContent() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("Best Match");
  const [page, setPage] = useState(1);
  const [allTalents, setAllTalents] = useState<TalentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FiltersState>({
    category: "All Categories",
    minRate: "",
    maxRate: "",
    experience: { entry: true, intermediate: true, expert: true },
    ratingMin: 0,
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(null);

    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data, error } = await supabase
          .from("freelancers")
          .select(
            "id, full_name, title, location, experience, hourly_rate, rate_type, bio, skills, featured, photo_url, status",
          )
          .eq("status", "active")
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!active) return;

        const mapped: TalentItem[] = (data ?? []).map((r: any) => {
          const skills: string[] = Array.isArray(r.skills)
            ? r.skills.map(String)
            : [];
          const title = String(r.title ?? "Freelancer");
          const hourlyRate =
            typeof r.hourly_rate === "number" ? r.hourly_rate : 0;
          return {
            id: String(r.id),
            name: String(r.full_name ?? "Freelancer"),
            role: title,
            price: formatFreelancerRate(
              r.hourly_rate ?? null,
              r.rate_type ?? null,
            ),
            image: r.photo_url ?? undefined,
            rating: null,
            reviews: null,
            location: String(r.location ?? "Nigeria"),
            bio: String(
              r.bio ??
                "Experienced Nigerian freelancer ready to help with your project.",
            ),
            tags: skills.slice(0, 5),
            verified: true,
            featured: !!r.featured,
            category: inferCategory(skills, title),
            hourlyRate,
            experienceLevel: inferExperience(r.experience),
          };
        });

        setAllTalents(mapped);
      } catch (err) {
        if (!active) return;
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

  const filtered = useMemo(() => {
    const needle = query.trim();

    const minRate = Number(filters.minRate);
    const maxRate = Number(filters.maxRate);
    const hasMin = Number.isFinite(minRate) && filters.minRate.trim() !== "";
    const hasMax = Number.isFinite(maxRate) && filters.maxRate.trim() !== "";

    const normalizedMin = hasMin ? Math.max(0, minRate) : null;
    const normalizedMax = hasMax ? Math.max(0, maxRate) : null;

    const effectiveMin =
      normalizedMin != null && normalizedMax != null
        ? Math.min(normalizedMin, normalizedMax)
        : normalizedMin;
    const effectiveMax =
      normalizedMin != null && normalizedMax != null
        ? Math.max(normalizedMin, normalizedMax)
        : normalizedMax;

    return allTalents.filter((t) => {
      if (
        filters.category !== "All Categories" &&
        t.category !== filters.category
      ) {
        return false;
      }

      if (
        filters.ratingMin > 0 &&
        t.rating != null &&
        t.rating < filters.ratingMin
      ) {
        return false;
      }

      if (effectiveMin != null && t.hourlyRate < effectiveMin) return false;
      if (effectiveMax != null && t.hourlyRate > effectiveMax) return false;

      const expAllowed =
        (filters.experience.entry && t.experienceLevel === "Entry Level") ||
        (filters.experience.intermediate &&
          t.experienceLevel === "Intermediate") ||
        (filters.experience.expert && t.experienceLevel === "Expert");
      if (!expAllowed) return false;

      if (!needle) return true;

      const text = [t.name, t.role, t.location, t.bio, ...t.tags].join(" ");
      return includesText(text, needle);
    });
  }, [allTalents, filters, query]);

  useEffect(() => {
    setPage(1);
  }, [query, filters]);

  const sorted = useMemo(() => {
    if (sort === "Top Rated") {
      return [...filtered].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    if (sort === "Most Reviews") {
      return [...filtered].sort((a, b) => (b.reviews ?? 0) - (a.reviews ?? 0));
    }
    return filtered;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));

  useEffect(() => {
    setPage((p) => Math.min(totalPages, Math.max(1, p)));
  }, [totalPages]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [page, sorted]);

  return (
    <>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          <TalentFilters value={filters} onChange={setFilters} />

          <div className="flex-1 space-y-6">
            <TalentSearch value={query} onChange={setQuery} />

            {loadError && (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {loadError}
              </p>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-24 text-muted-foreground text-sm">
                Loading freelancers…
              </div>
            ) : (
              <TalentGrid
                talents={pageItems}
                totalFound={sorted.length}
                sort={sort}
                onSortChange={(next) => {
                  setSort(next);
                  setPage(1);
                }}
              />
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 pb-14">
        <div className="rounded-2xl border bg-card p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Frequently asked questions</h2>
            <p className="mt-2 text-muted-foreground">
              Quick answers to help you hire faster.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem
              value="item-1"
              className="rounded-xl border bg-background px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                How do I contact a freelancer?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Use the "Contact" button on a profile to start a conversation
                  and share your project details.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-2"
              className="mt-3 rounded-xl border bg-background px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                Are freelancers on ProAssistNG vetted?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Yes—profiles are reviewed for quality signals like work
                  history, skills, and client feedback.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-3"
              className="mt-3 rounded-xl border bg-background px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                Can I filter by budget and experience?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Absolutely. Use the Hourly Rate and Experience Level filters
                  to narrow down to the right fit.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-4"
              className="mt-3 rounded-xl border bg-background px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                What happens after I hire someone?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Agree on scope, timeline, and milestones, then collaborate
                  through messages and deliverables.
                </p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem
              value="item-5"
              className="mt-3 rounded-xl border bg-background px-4"
            >
              <AccordionTrigger className="py-4 hover:no-underline">
                Do you support long-term contracts?
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-muted-foreground">
                  Yes—many freelancers are available for ongoing work. Use the
                  search and filters to find the right match.
                </p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>
    </>
  );
}
