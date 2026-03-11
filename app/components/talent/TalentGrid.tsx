"use client";

import TalentCard, { type TalentCardProps } from "./TalentCard";

export default function TalentGrid(props: {
  talents: TalentCardProps[];
  totalFound: number;
  sort: string;
  onSortChange: (next: string) => void;
}) {
  const { talents, totalFound, sort, onSortChange } = props;

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {new Intl.NumberFormat().format(totalFound)} freelancers found
        </p>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="rounded-lg border bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Sort by"
          >
            <option>Best Match</option>
            <option>Top Rated</option>
            <option>Most Reviews</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {talents.map((talent) => (
          <TalentCard key={`${talent.name}-${talent.role}`} {...talent} />
        ))}
      </div>
    </section>
  );
}
