"use client";

import { Filter } from "lucide-react";

export type FiltersState = {
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
  ratingMin: 0 | 4.5 | 4.0;
};

const DEFAULT_FILTERS: FiltersState = {
  category: "All Categories",
  minRate: "",
  maxRate: "",
  experience: { entry: true, intermediate: true, expert: true },
  ratingMin: 0,
};

function coerceRating(value: string): 0 | 4.5 | 4.0 {
  if (value === "0") return 0;
  return value === "4.0" ? 4.0 : 4.5;
}

function countActiveFilters(value: FiltersState): number {
  let count = 0;
  if (value.category !== "All Categories") count += 1;
  if (value.minRate.trim() !== "" || value.maxRate.trim() !== "") count += 1;

  const exp = value.experience;
  if (!(exp.entry && exp.intermediate && exp.expert)) count += 1;

  if (value.ratingMin > 0) count += 1;
  return count;
}

export default function TalentFilters(props: {
  value: FiltersState;
  onChange: (next: FiltersState) => void;
}) {
  const { value, onChange } = props;
  const activeFilterCount = countActiveFilters(value);

  const updateExperience = (
    key: keyof FiltersState["experience"],
    checked: boolean,
  ) => {
    const next = { ...value.experience, [key]: checked };
    // Keep at least one experience level selected, so users never accidentally hide all results.
    if (!next.entry && !next.intermediate && !next.expert) {
      next[key] = true;
    }

    onChange({ ...value, experience: next });
  };

  const budgetHint =
    value.minRate.trim() !== "" && value.maxRate.trim() !== ""
      ? Number(value.minRate) > Number(value.maxRate)
        ? "Tip: Minimum is higher than maximum, so we will automatically swap them for you."
        : ""
      : "";

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="rounded-2xl border bg-card p-5 space-y-6">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground" />
          <h2 className="font-semibold">Filters</h2>
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {activeFilterCount} active
          </span>
        </div>

        <p className="text-xs text-muted-foreground">
          Use these options to narrow results. You can always clear everything
          and start again.
        </p>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            What kind of help do you need?
          </label>
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
          <p className="text-xs text-muted-foreground">
            Choose one service area, or keep "All Categories" to view everyone.
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Your budget per hour (NGN)
          </label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              step={500}
              placeholder="Min"
              value={value.minRate}
              onChange={(e) => onChange({ ...value, minRate: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              type="number"
              min={0}
              step={500}
              placeholder="Max"
              value={value.maxRate}
              onChange={(e) => onChange({ ...value, maxRate: e.target.value })}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Example: Min 5000 and Max 20000. Leave empty to show all prices.
          </p>
          {budgetHint && <p className="text-xs text-amber-600">{budgetHint}</p>}
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Experience level</legend>
          <p className="text-xs text-muted-foreground">
            Select one or more levels. At least one level must stay selected.
          </p>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4"
                checked={value.experience.entry}
                onChange={(e) => updateExperience("entry", e.target.checked)}
              />
              Entry Level
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4"
                checked={value.experience.intermediate}
                onChange={(e) =>
                  updateExperience("intermediate", e.target.checked)
                }
              />
              Intermediate
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                className="size-4"
                checked={value.experience.expert}
                onChange={(e) => updateExperience("expert", e.target.checked)}
              />
              Expert
            </label>
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Client rating</legend>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="rating"
                className="size-4"
                value="0"
                checked={value.ratingMin === 0}
                onChange={(e) =>
                  onChange({
                    ...value,
                    ratingMin: coerceRating(e.target.value),
                  })
                }
              />
              Any rating
            </label>
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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onChange(DEFAULT_FILTERS)}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Clear all filters
          </button>
        </div>

        <div className="rounded-xl border border-primary/10 bg-primary/5 p-4">
          <p className="text-xs font-semibold text-primary">PRO TIP</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Start broad, then add 1 filter at a time until you see the right
            match.
          </p>
        </div>
      </div>
    </aside>
  );
}
