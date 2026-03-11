"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import FreelancerForm, {
  type FreelancerInitialData,
} from "@/app/components/admin/FreelancerForm";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function EditFreelancerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [data, setData] = useState<FreelancerInitialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      router.replace("/admin/freelancers");
      return;
    }

    (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data: row, error: fetchError } = await supabase
          .from("freelancers")
          .select(
            "full_name, title, location, experience, hourly_rate, rate_type, portfolio_url, phone_number, bio, skills, service_slugs, featured, photo_url, status",
          )
          .eq("id", id)
          .single();

        if (fetchError) throw fetchError;

        setData({
          full_name: row.full_name ?? "",
          title: row.title ?? null,
          location: row.location ?? null,
          experience: (row.experience ??
            "") as FreelancerInitialData["experience"],
          hourly_rate: row.hourly_rate ?? null,
          rate_type: (row.rate_type ??
            "hourly") as FreelancerInitialData["rate_type"],
          portfolio_url: row.portfolio_url ?? null,
          phone_number: row.phone_number ?? null,
          bio: row.bio ?? null,
          skills: Array.isArray(row.skills) ? row.skills : [],
          service_slugs: Array.isArray(row.service_slugs)
            ? row.service_slugs
            : [],
          featured: row.featured ?? false,
          photo_url: row.photo_url ?? null,
          status: row.status ?? "active",
        });
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load freelancer.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-sm text-muted-foreground">
        Loading freelancer...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-sm text-destructive">
        {error ?? "Freelancer not found."}
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <FreelancerForm initialData={data} freelancerId={id!} />
    </div>
  );
}
