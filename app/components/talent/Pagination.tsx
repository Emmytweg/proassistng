"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { cn } from "@/lib/utils";

export default function Pagination(props: {
  page?: number;
  totalPages?: number;
  onPageChange?: (nextPage: number) => void;
}) {
  const totalPages = Math.max(1, props.totalPages ?? 12);
  const [localPage, setLocalPage] = useState(1);
  const page = Math.min(totalPages, Math.max(1, props.page ?? localPage));

  const pages = useMemo(() => {
    const items: Array<number | "ellipsis"> = [];

    const add = (value: number | "ellipsis") => {
      const last = items[items.length - 1];
      if (value === "ellipsis" && last === "ellipsis") return;
      items.push(value);
    };

    const windowSize = 1;
    const start = Math.max(2, page - windowSize);
    const end = Math.min(totalPages - 1, page + windowSize);

    add(1);
    if (start > 2) add("ellipsis");
    for (let p = start; p <= end; p++) add(p);
    if (end < totalPages - 1) add("ellipsis");
    if (totalPages > 1) add(totalPages);

    return items;
  }, [page, totalPages]);

  const setPage = (next: number) => {
    const clamped = Math.min(totalPages, Math.max(1, next));
    setLocalPage(clamped);
    props.onPageChange?.(clamped);
  };

  return (
    <nav
      className="flex items-center justify-center gap-2 pt-2"
      aria-label="Pagination"
    >
      <button
        type="button"
        className="size-9 rounded-lg border bg-card text-sm inline-flex items-center justify-center disabled:opacity-50"
        onClick={() => setPage(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>

      {pages.map((p, idx) => {
        if (p === "ellipsis") {
          return (
            <span
              key={`ellipsis-${idx}`}
              className="size-9 inline-flex items-center justify-center text-sm text-muted-foreground"
            >
              …
            </span>
          );
        }

        const active = p === page;

        return (
          <button
            key={p}
            type="button"
            onClick={() => setPage(p)}
            className={cn(
              "size-9 rounded-lg border text-sm inline-flex items-center justify-center transition",
              active
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card hover:bg-muted",
            )}
            aria-current={active ? "page" : undefined}
          >
            {p}
          </button>
        );
      })}

      <button
        type="button"
        className="size-9 rounded-lg border bg-card text-sm inline-flex items-center justify-center disabled:opacity-50"
        onClick={() => setPage(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}
