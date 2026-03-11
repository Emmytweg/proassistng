import Link from "next/link";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import TalentCard from "@/app/components/talent/TalentCard";

import { getServiceCategory, serviceCategories } from "@/lib/services";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { TalentCardProps } from "@/app/components/talent/TalentCard";

function formatRate(
  hourlyRate: number | null,
  rateType: string | null,
): string {
  if (hourlyRate == null) return "Contact for rate";
  const amt = `₦${hourlyRate.toLocaleString("en-NG")}`;
  if (rateType === "milestone") return `${amt}/milestone`;
  if (rateType === "contract") return `${amt} (contract)`;
  return `${amt}/hr`;
}

export function generateStaticParams() {
  return serviceCategories.map((c) => ({ category: c.slug }));
}

export const dynamic = "force-dynamic";

export default async function ServiceCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: rawCategory } = await params;
  const slug = decodeURIComponent(rawCategory ?? "")
    .trim()
    .toLowerCase();

  const category = getServiceCategory(slug);

  // Fetch active freelancers whose service_slugs array contains this slug
  let talents: TalentCardProps[] = [];
  let fetchError: string | null = null;

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("freelancers")
    .select(
      "id, full_name, title, location, hourly_rate, rate_type, bio, skills, featured, photo_url",
    )
    .eq("status", "active")
    .contains("service_slugs", [slug])
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[service page] supabase error:", error.message, error.code);
    fetchError = error.message;
  } else if (data && data.length > 0) {
    talents = (data as any[]).map((r) => {
      const skills: string[] = Array.isArray(r.skills)
        ? r.skills.map(String)
        : [];
      return {
        id: String(r.id),
        name: String(r.full_name ?? "Unnamed"),
        role: String(r.title ?? "Freelancer"),
        status: "online" as const,
        price: formatRate(r.hourly_rate, r.rate_type),
        image: r.photo_url ?? null,
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
      };
    });
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <Navbar />
      {/* 
      {process.env.NODE_ENV === "development" && (
        <div className="mx-auto max-w-7xl px-6 pt-20 pb-0">
          <div className="rounded-xl border border-yellow-300 bg-yellow-50 px-4 py-3 text-xs font-mono text-yellow-800 space-y-0.5">
            <p>
              <strong>slug:</strong> {slug}
            </p>
            <p>
              <strong>category matched:</strong>{" "}
              {category ? category.title : "none"}
            </p>
            <p>
              <strong>supabase rows:</strong> {data?.length ?? 0}
            </p>
            <p>
              <strong>using fallback:</strong> {String(!!usingFallback)}
            </p>
            {fetchError && (
              <p className="text-red-600">
                <strong>error:</strong> {fetchError}
              </p>
            )}
          </div>
        </div>
      )} */}

      <div className="mx-auto max-w-7xl px-6 py-10 pt-20">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-green-600">
            Service
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            {category?.title ?? "Service"}
          </h1>
          {category ? (
            <>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                {category.description}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {talents.length} freelancer{talents.length === 1 ? "" : "s"}{" "}
                found
              </p>
            </>
          ) : (
            <p className="mt-2 max-w-2xl text-muted-foreground">
              We couldn’t find that service category.
            </p>
          )}
        </div>

        {!category ? (
          <div className="rounded-2xl border bg-card p-8">
            <h2 className="text-lg font-semibold">Service not found</h2>
            <p className="mt-2 text-muted-foreground">
              Please choose a service from the Services page.
            </p>
            <Link
              href="/services"
              className="mt-5 inline-flex rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Back to Services
            </Link>
          </div>
        ) : talents.length === 0 ? (
          <div className="rounded-2xl border bg-card p-8">
            <h2 className="text-lg font-semibold">No freelancers yet</h2>
            <p className="mt-2 text-muted-foreground">
              We’re still onboarding specialists for this service.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {talents.map((t) => (
              <TalentCard key={`${category.slug}-${t.name}`} {...t} />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </main>
  );
}
