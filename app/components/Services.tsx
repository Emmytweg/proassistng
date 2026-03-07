"use client";

import {
  Code2,
  Palette,
  PenTool,
  Megaphone,
  BarChart3,
  Headphones,
} from "lucide-react";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Feature } from "@/components/ui/feature-section-with-bento-grid";

const services = [
  {
    title: "Web Development",
    description:
      "Hire experienced developers to build websites, web apps, and e-commerce platforms.",
    icon: Code2,
  },
  {
    title: "UI/UX Design",
    description:
      "Professional designers creating beautiful and user-friendly product experiences.",
    icon: Palette,
  },
  {
    title: "Content Writing",
    description:
      "High-quality blog posts, website copy, and SEO content for your business.",
    icon: PenTool,
  },
  {
    title: "Digital Marketing",
    description:
      "Grow your business with SEO, paid ads, and social media marketing.",
    icon: Megaphone,
  },
  {
    title: "Data & Analytics",
    description:
      "Turn data into insights with dashboards, reports, and analysis.",
    icon: BarChart3,
  },
  {
    title: "Virtual Assistance",
    description:
      "Reliable assistants to handle admin tasks and business operations.",
    icon: Headphones,
  },
];

export default function Services() {
  const cardsTopRef = useRef<HTMLDivElement | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState(services.length);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const updateItemsPerPage = () => {
      const width = window.innerWidth;

      if (width >= 1024) return setItemsPerPage(services.length);
      if (width >= 768) return setItemsPerPage(4);
      return setItemsPerPage(2);
    };

    updateItemsPerPage();
    window.addEventListener("resize", updateItemsPerPage);
    return () => window.removeEventListener("resize", updateItemsPerPage);
  }, []);

  const pageCount = useMemo(() => {
    return Math.max(1, Math.ceil(services.length / itemsPerPage));
  }, [itemsPerPage]);

  const currentPage = Math.min(page, pageCount - 1);

  const pagedServices = useMemo(() => {
    const start = currentPage * itemsPerPage;
    return services.slice(start, start + itemsPerPage);
  }, [currentPage, itemsPerPage]);

  useEffect(() => {
    if (page !== currentPage) setPage(currentPage);
  }, [page, currentPage]);

  useEffect(() => {
    // When paginating on smaller screens, bring the grid back into view.
    if (itemsPerPage >= services.length) return;
    cardsTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [currentPage, itemsPerPage]);

  return (
    <section className="py-24 px-6 bg-muted/40">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold tracking-tight">
            Services You Can Hire
          </h2>

          <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
            Find skilled Nigerian professionals ready to deliver high-quality
            services for your business.
          </p>
        </div>

        {/* Desktop: Bento Grid */}
        <div className="hidden lg:block">
          <Feature
            variant="embedded"
            showHeader={false}
            items={services.map((service) => ({
              title: service.title,
              description: service.description,
              icon: service.icon,
            }))}
          />
        </div>

        {/* Mobile/Tablet: Paginated Grid */}
        <div className="lg:hidden">
          <div
            ref={cardsTopRef}
            className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
          >
            {pagedServices.map((service, index) => {
              const Icon = service.icon;

              return (
                <div
                  key={`${service.title}-${index}`}
                  className="group rounded-2xl border bg-card p-8 hover:shadow-xl transition"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-primary/10 mb-6">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold mb-3">
                    {service.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    {service.description}
                  </p>

                  {/* Link */}
                  <Link
                    href="/services"
                    className="text-sm font-medium text-primary group-hover:underline"
                  >
                    Explore service →
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pageCount > 1 && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                aria-label="Previous page"
              >
                Prev
              </Button>

              <div
                className="flex items-center gap-2"
                aria-label="Service pagination"
              >
                {Array.from({ length: pageCount }).map((_, p) => {
                  const isActive = p === currentPage;

                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      className={
                        "h-2.5 rounded-full transition-all " +
                        (isActive ? "w-8 bg-primary" : "w-2.5 bg-muted")
                      }
                      aria-label={`Go to page ${p + 1}`}
                      aria-current={isActive ? "true" : "false"}
                    />
                  );
                })}
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={currentPage === pageCount - 1}
                aria-label="Next page"
              >
                Next
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
