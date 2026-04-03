export const PRESET_RATE_TYPES = [
  "hourly",
  "monthly",
  "milestone",
  "contract",
] as const;

export function normalizeRateType(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function getRateSuffix(rateType: string | null | undefined): string {
  const normalized = normalizeRateType(rateType);
  if (!normalized) return "/hr";

  if (normalized === "hourly" || normalized === "hour" || normalized === "hr") {
    return "/hr";
  }
  if (normalized.includes("month")) return "/month";
  if (normalized.includes("mile")) return "/milestone";
  if (normalized.includes("contract")) return " (contract)";

  if (normalized.startsWith("/")) return normalized;
  if (normalized.startsWith("(")) return ` ${normalized}`;
  return `/${normalized}`;
}

export function formatFreelancerRate(
  minRate: number | null,
  rateType: string | null | undefined,
  maxRate?: number | null,
): string {
  const safeMin =
    typeof minRate === "number" && Number.isFinite(minRate) ? minRate : null;
  const safeMax =
    typeof maxRate === "number" && Number.isFinite(maxRate) ? maxRate : null;

  if (safeMin == null && safeMax == null) return "Contact for rate";

  const low =
    safeMin == null
      ? (safeMax as number)
      : safeMax == null
        ? safeMin
        : Math.min(safeMin, safeMax);
  const high =
    safeMin == null
      ? null
      : safeMax == null
        ? null
        : Math.max(safeMin, safeMax);

  if (high == null || low === high) {
    return `₦${low.toLocaleString("en-NG")}${getRateSuffix(rateType)}`;
  }

  return `₦${low.toLocaleString("en-NG")} - ₦${high.toLocaleString("en-NG")}${getRateSuffix(rateType)}`;
}
