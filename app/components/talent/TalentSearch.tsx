"use client";

import { Search } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const popular = ["React", "Product Design", "Copywriting", "SEO"];

export default function TalentSearch(props: {
  value?: string;
  onChange?: (next: string) => void;
}) {
  const [localQuery, setLocalQuery] = useState("");
  const query = props.value ?? localQuery;

  const update = (next: string) => {
    setLocalQuery(next);
    props.onChange?.(next);
  };

  return (
    <section className="rounded-2xl border bg-card p-5">
      <form
        className="flex flex-col gap-3 sm:flex-row sm:items-center"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="relative flex-1">
          <span className="sr-only">Search</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => update(e.target.value)}
            placeholder="Search for skills, roles, or keywords"
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <Button type="submit" className="sm:w-28">
          Search
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground">
          POPULAR:
        </p>
        {popular.map((item) => (
          <Badge key={item} variant="outline" className="text-xs">
            {item}
          </Badge>
        ))}
      </div>
    </section>
  );
}
