"use client";

import Image from "next/image";
import { Crown, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatFreelancerRate } from "@/lib/rate-format";

type FreelancerCard = {
  id: string;
  name: string;
  role: string;
  price: string;
  image: string | null;
  skills: string[];
  featured: boolean;
  status: string;
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function getStatusDetails(status?: string) {
  const normalized = status?.trim().toLowerCase();
  if (normalized === "active" || normalized === "online" || normalized === "available") {
    return { class: "bg-green-500", label: "Online", isOnline: true };
  }
  if (normalized === "away" || normalized === "busy") {
    return { class: "bg-amber-400", label: "Busy", isOnline: false };
  }
  return { class: "bg-muted-foreground", label: "Offline", isOnline: false };
}

export default function FeaturedFreelancers() {
  const [freelancers, setFreelancers] = useState<FreelancerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const skipNextScrollIntoViewRef = useRef(false);
  const [cardsPerPage, setCardsPerPage] = useState(1);
  const [activePage, setActivePage] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isInView, setIsInView] = useState(true);

  // Fetch active freelancers from Supabase
  useEffect(() => {
    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase
          .from("freelancers")
          .select(
            "id, full_name, title, photo_url, skills, hourly_rate, hourly_rate_min, hourly_rate_max, rate_type, featured, status",
          )
          .in("status", ["active", "available", "busy"])
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(12);

        if (data && data.length > 0) {
          setFreelancers(
            data.map((r: any) => {
              return {
                id: String(r.id),
                name: String(r.full_name ?? "Unnamed"),
                role: String(r.title ?? "Freelancer"),
                price: formatFreelancerRate(
                  r.hourly_rate_min ?? r.hourly_rate ?? null,
                  r.rate_type,
                  r.hourly_rate_max,
                ),
                image: r.photo_url ?? null,
                skills: Array.isArray(r.skills) ? r.skills.map(String) : [],
                featured: !!r.featured,
                status: String(r.status || "active"),
              };
            }),
          );
        }

        // Subscribe to real-time availability updates
        const channel = supabase
          .channel("public:freelancers")
          .on(
            "postgres_changes",
            {
              event: "UPDATE",
              schema: "public",
              table: "freelancers",
            },
            (payload) => {
              setFreelancers((prev) =>
                prev.map((freelancer) =>
                  freelancer.id === String(payload.new.id)
                    ? { ...freelancer, status: String(payload.new.status) }
                    : freelancer,
                ),
              );
            },
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };
      } catch {
        // fetch failed, freelancers stays empty
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(freelancers.length / cardsPerPage));
  }, [cardsPerPage]);

  useEffect(() => {
    const updateCardsPerPage = () => {
      const width = window.innerWidth;

      if (width >= 1024) return setCardsPerPage(4);
      if (width >= 768) return setCardsPerPage(2);
      return setCardsPerPage(1);
    };

    updateCardsPerPage();
    window.addEventListener("resize", updateCardsPerPage);
    return () => window.removeEventListener("resize", updateCardsPerPage);
  }, []);

  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!scrollerRef.current) return;

    // If the current active page is out of range after a resize,
    // clamp it and scroll to the clamped page.
    const clamped = Math.min(activePage, pageCount - 1);
    if (clamped !== activePage) {
      setActivePage(clamped);
      return;
    }

    if (skipNextScrollIntoViewRef.current) {
      skipNextScrollIntoViewRef.current = false;
      return;
    }

    const scroller = scrollerRef.current;
    const startIndex = clamped * cardsPerPage;
    const target = scroller.children.item(startIndex) as HTMLElement | null;
    if (!target) return;

    // Use scrollTo so autoplay only moves the carousel, not the whole page.
    scroller.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
  }, [activePage, cardsPerPage, pageCount]);

  useEffect(() => {
    if (pageCount <= 1) return;
    if (isPaused) return;
    if (!isInView) return;

    const prefersReducedMotion = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    )?.matches;
    if (prefersReducedMotion) return;

    const id = window.setInterval(() => {
      setActivePage((p) => (p + 1) % pageCount);
    }, 3500);

    return () => window.clearInterval(id);
  }, [isPaused, pageCount, isInView]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let raf = 0;

    const onScroll = () => {
      window.cancelAnimationFrame(raf);

      raf = window.requestAnimationFrame(() => {
        const current = scrollerRef.current;
        if (!current) return;

        // Determine which page-start card is closest to the scroller's left edge.
        let bestPage = 0;
        let bestDistance = Number.POSITIVE_INFINITY;

        for (let page = 0; page < pageCount; page++) {
          const startIndex = page * cardsPerPage;
          const el = current.children.item(startIndex) as HTMLElement | null;
          if (!el) continue;

          const distance = Math.abs(el.offsetLeft - current.scrollLeft);
          if (distance < bestDistance) {
            bestDistance = distance;
            bestPage = page;
          }
        }

        setActivePage((prev) => {
          if (prev === bestPage) return prev;
          skipNextScrollIntoViewRef.current = true;
          return bestPage;
        });
      });
    };

    scroller.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.cancelAnimationFrame(raf);
      scroller.removeEventListener("scroll", onScroll);
    };
  }, [cardsPerPage, pageCount]);

  return (
    <section className="py-24 px-6 bg-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight">
            Featured Freelancers
          </h2>

          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Discover top Nigerian professionals ready to help you build, grow,
            and scale your business.
          </p>
        </div>

        {/* Freelancer Carousel */}
        {loading && (
          <div className="flex justify-center py-16 text-muted-foreground text-sm">
            Loading freelancers…
          </div>
        )}
        {!loading && freelancers.length === 0 && (
          <div className="flex justify-center py-16 text-muted-foreground text-sm">
            No freelancers available yet.
          </div>
        )}
        {!loading && freelancers.length > 0 && (
          <div
            ref={carouselRef}
            className="relative"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onPointerDown={() => setIsPaused(true)}
            onPointerUp={() => setIsPaused(false)}
            onPointerCancel={() => setIsPaused(false)}
          >
            <div
              ref={scrollerRef}
              className="-mx-6 px-6 flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-3"
              aria-label="Featured freelancers"
            >
              {freelancers.map((freelancer, index) => (
                <div
                  key={freelancer.id}
                  className="snap-start shrink-0 w-full md:w-[calc((100%-24px)/2)] lg:w-[calc((100%-72px)/4)] py-8
                  "
                >
                  <div className="group relative border rounded-2xl p-6 hover:shadow-xl transition bg-card h-full">
                    {/* Top Rated badge for featured freelancers */}
                    {freelancer.featured && (
                      <div className="absolute top-0  my-2 left-4 z-10 inline-flex items-center gap-1 rounded-full bg-linear-to-r from-yellow-500 to-amber-400 text-white text-[10px] font-bold px-3 py-1 shadow-md shadow-yellow-400/30">
                        <Crown className="w-3 h-3" />
                        Top Rated
                      </div>
                    )}
                    {/* Profile */}
                    <div className="flex items-center gap-4 mb-4 mt-3">
                      <div className="relative shrink-0">
                        <div className="rounded-full p-0.5 ring-1 ring-border transition group-hover:ring-2 group-hover:ring-primary/30">
                          {freelancer.image ? (
                            <Image
                              src={freelancer.image}
                              alt={freelancer.name}
                              width={60}
                              height={60}
                              className="h-14 w-14 rounded-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                            />
                          ) : (
                            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                              {getInitials(freelancer.name)}
                            </div>
                          )}
                        </div>

                        {(() => {
                          const s = getStatusDetails(freelancer.status);
                          return (
                            <span
                              className="absolute -right-0.5 -bottom-0.5 inline-flex size-3.5 items-center justify-center"
                              title={`Status: ${s.label}`}
                            >
                              <span
                                className={`relative block size-3.5 rounded-full ring-2 ring-card ${s.class}`}
                              >
                                {s.isOnline && (
                                  <span className="absolute inset-0 rounded-full bg-green-500/40 animate-ping" />
                                )}
                              </span>
                            </span>
                          );
                        })()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold truncate">{freelancer.name}</h3>

                        <p className="text-sm text-muted-foreground truncate">
                          {freelancer.role}
                        </p>
                      </div>
                    </div>

                    {/* Skills */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {freelancer.skills.slice(0, 3).map((skill, i) => (
                        <span
                          key={i}
                          className="text-xs bg-muted px-3 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Price + CTA */}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary">
                        {freelancer.price}
                      </span>

                      <Link
                        href={`/freelancer/${freelancer.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pageCount > 1 && (
              <div
                className="mt-6 flex items-center justify-center gap-2"
                aria-label="Carousel pagination"
              >
                {Array.from({ length: pageCount }).map((_, page) => {
                  const isActive = page === activePage;

                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setActivePage(page)}
                      className={
                        "h-6 min-w-6 rounded-full transition-all flex items-center justify-center " +
                        (isActive ? "w-8" : "w-6")
                      }
                      aria-label={`Go to page ${page + 1}`}
                      aria-current={isActive ? "true" : "false"}
                    >
                      <span
                        className={
                          "h-2.5 rounded-full transition-all " +
                          (isActive ? "w-8 bg-primary" : "w-2.5 bg-muted")
                        }
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {/* Browse Button */}
        <div className="text-center mt-16">
          <Link
            href="/browse-talents"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition"
          >
            Browse All Freelancers
          </Link>
        </div>
      </div>
    </section>
  );
}
