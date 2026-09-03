"use client";

import { Trash2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function DeleteFreelancerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");
  const name = searchParams.get("name") ?? "this freelancer";

  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: deleteError } = await supabase
        .from("freelancers")
        .delete()
        .eq("id", id);
      if (deleteError) throw deleteError;
      router.push("/admin/freelancers");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto mt-8 w-full max-w-lg sm:mt-20">
      <div className="flex flex-col items-center gap-6 rounded-2xl border bg-card p-4 text-center shadow-xl shadow-black/5 sm:p-8">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Trash2 className="w-7 h-7 text-destructive" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground">
            Delete Freelancer
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Are you sure you want to permanently delete{" "}
            <span className="wrap-break-word font-semibold text-foreground">
              {name}
            </span>
            ? This action cannot be undone.
          </p>
        </div>

        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-xl px-4 py-2 w-full">
            {error}
          </p>
        )}

        <div className="flex gap-3 w-full">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={() => router.push("/admin/freelancers")}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            className="flex-1 rounded-xl font-semibold"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Yes, Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
