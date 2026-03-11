"use client";

import Image from "next/image";
import { Crown, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type FreelancerCard = {
  id: string;
  name: string;
  role: string;
  price: string;
  image: string | null;
  skills: string[];
  featured: boolean;
};

const FALLBACK_FREELANCERS: FreelancerCard[] = [
  {
    id: "1",
    name: "David A.",
    role: "Full-Stack Developer",
    price: "₦120,000/hr",
    image: null,
    skills: ["React", "Next.js", "Node.js"],
    featured: true,
  },
  {
    id: "2",
    name: "Sarah K.",
    role: "UI/UX Designer",
    price: "₦90,000/hr",
    image: null,
    skills: ["Figma", "UX Research", "Prototyping"],
    featured: false,
  },
  {
    id: "3",
    name: "Michael O.",
    role: "Digital Marketer",
    price: "₦70,000/hr",
    image: null,
    skills: ["SEO", "Ads", "Analytics"],
    featured: false,
  },
  {
    id: "4",
    name: "Grace T.",
    role: "Content Writer",
    price: "₦60,000/hr",
    image: null,
    skills: ["Copywriting", "SEO", "Blog Writing"],
    featured: false,
  },
];

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export default function FeaturedFreelancers() {
  const [freelancers, setFreelancers] =
    useState<FreelancerCard[]>(FALLBACK_FREELANCERS);
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
            "id, full_name, title, photo_url, skills, hourly_rate, rate_type, featured",
          )
          .eq("status", "active")
          .order("featured", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(12);

        if (data && data.length > 0) {
          setFreelancers(
            data.map((r: any) => {
              const amt =
                typeof r.hourly_rate === "number"
                  ? `₦${r.hourly_rate.toLocaleString("en-NG")}`
                  : null;
              const suffix =
                r.rate_type === "milestone"
                  ? "/milestone"
                  : r.rate_type === "contract"
                    ? " (contract)"
                    : "/hr";
              return {
                id: String(r.id),
                name: String(r.full_name ?? "Unnamed"),
                role: String(r.title ?? "Freelancer"),
                price: amt ? `${amt}${suffix}` : "Contact for rate",
                image: r.photo_url ?? null,
                skills: Array.isArray(r.skills) ? r.skills.map(String) : [],
                featured: !!r.featured,
              };
            }),
          );
        }
      } catch {
        // silently fall back to hardcoded data
      }
    })();
  }, []);
  const [availabilityByIndex, setAvailabilityByIndex] = useState<boolean[]>(
    () => freelancers.map((_, index) => index % 2 === 0),
  );

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
    // Lightweight "live" availability simulation.
    // If you later add a real API, replace this with fetched data.
    if (isPaused) return;
    if (!isInView) return;

    const id = window.setInterval(() => {
      if (document.visibilityState === "hidden") return;

      setAvailabilityByIndex((prev) => {
        if (prev.length === 0) return prev;

        const next = [...prev];
        const randomIndex = Math.floor(Math.random() * next.length);
        next[randomIndex] = !next[randomIndex];
        return next;
      });
    }, 6000);

    return () => window.clearInterval(id);
  }, [isPaused, isInView]);

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
                className="snap-start shrink-0 w-full md:w-[calc((100%-24px)/2)] lg:w-[calc((100%-72px)/4)]"
              >
                <div className="group relative border rounded-2xl p-6 hover:shadow-xl transition bg-card h-full">
                  {/* Top Rated badge for featured freelancers */}
                  {freelancer.featured && (
                    <div className="absolute -top-3 left-4 z-10 inline-flex items-center gap-1 rounded-full bg-linear-to-r from-yellow-500 to-amber-400 text-white text-[10px] font-bold px-3 py-1 shadow-md shadow-yellow-400/30">
                      <Crown className="w-3 h-3" />
                      Top Rated
                    </div>
                  )}

                  {/* Live Availability */}
                  {(() => {
                    const isAvailable = availabilityByIndex[index] ?? false;

                    return (
                      <span
                        className={
                          "absolute right-4 top-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium " +
                          (isAvailable
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-muted bg-muted text-muted-foreground")
                        }
                        aria-label={
                          isAvailable ? "Available now" : "Currently busy"
                        }
                      >
                        <span
                          className={
                            "h-2 w-2 rounded-full " +
                            (isAvailable
                              ? "bg-primary"
                              : "bg-muted-foreground/60")
                          }
                        />
                        {isAvailable ? "Available now" : "Busy"}
                      </span>
                    );
                  })()}

                  {/* Profile */}
                  <div className="flex items-center gap-4 mb-4 mt-2">
                    {freelancer.image ? (
                      <Image
                        src={freelancer.image}
                        alt={freelancer.name}
                        width={60}
                        height={60}
                        className="rounded-full object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-15 h-15 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-lg">
                        {getInitials(freelancer.name)}
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold">{freelancer.name}</h3>

                      <p className="text-sm text-muted-foreground">
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
                      "h-2.5 rounded-full transition-all " +
                      (isActive ? "w-8 bg-primary" : "w-2.5 bg-muted")
                    }
                    aria-label={`Go to page ${page + 1}`}
                    aria-current={isActive ? "true" : "false"}
                  />
                );
              })}
            </div>
          )}
        </div>

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
