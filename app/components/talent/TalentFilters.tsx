"use client";

import { Filter } from "lucide-react";

type FiltersState = {
  category:
    | "All Categories"
    | "Development"
    | "Design"
    | "Writing"
    | "Marketing";
  minRate: string;
  maxRate: string;
  experience: {
    entry: boolean;
    intermediate: boolean;
    expert: boolean;
  };
  ratingMin: 4.5 | 4.0;
};

function coerceRating(value: string): 4.5 | 4.0 {
  return value === "4.0" ? 4.0 : 4.5;
}

export default function TalentFilters(props: {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
}) {
  const { value, onChange } = props;

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="rounded-2xl border bg-card p-5 space-y-6">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <h2 className="font-semibold">Filters</h2>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <select
            value={value.category}
            onChange={(e) =>
              onChange({
                ...value,
                category: e.target.value as FiltersState["category"],
              })
            }
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="All Categories">All Categories</option>
            <option value="Development">Development</option>
            <option value="Design">Design</option>
            <option value="Writing">Writing</option>
            <option value="Marketing">Marketing</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Hourly Rate</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              placeholder="Min"
              value={value.minRate}
              onChange={(e) => onChange({ ...value, minRate: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              type="number"
              placeholder="Max"
              value={value.maxRate}
              onChange={(e) => onChange({ ...value, maxRate: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Experience Level</legend>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4"
                checked={value.experience.entry}
                onChange={(e) =>
                  onChange({
                    ...value,
                    experience: {
                      ...value.experience,
                      entry: e.target.checked,
                    },
                  })
                }
              />
              Entry Level
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4"
                checked={value.experience.intermediate}
                onChange={(e) =>
                  onChange({
                    ...value,
                    experience: {
                      ...value.experience,
                      intermediate: e.target.checked,
                    },
                  })
                }
              />
              Intermediate
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4"
                checked={value.experience.expert}
                onChange={(e) =>
                  onChange({
                    ...value,
                    experience: {
                      ...value.experience,
                      expert: e.target.checked,
                    },
                  })
                }
              />
              Expert
            </label>
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Client Rating</legend>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="rating"
                className="size-4"
                value="4.5"
                checked={value.ratingMin === 4.5}
                onChange={(e) =>
                  onChange({
                    ...value,
                    ratingMin: coerceRating(e.target.value),
                  })
                }
              />
              4.5 &amp; up
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="rating"
                className="size-4"
                value="4.0"
                checked={value.ratingMin === 4.0}
                onChange={(e) =>
                  onChange({
                    ...value,
                    ratingMin: coerceRating(e.target.value),
                  })
                }
              />
              4.0 &amp; up
            </label>
          </div>
        </fieldset>

        <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
          <p className="text-xs font-semibold text-primary">PRO TIP</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Verified freelancers complete projects 30% faster on average.
          </p>
        </div>
      </div>
    </aside>
  );
}
