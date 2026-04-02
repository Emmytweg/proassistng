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
  hourlyRate: number | null,
  rateType: string | null | undefined,
): string {
  if (hourlyRate == null) return "Contact for rate";
  return `₦${hourlyRate.toLocaleString("en-NG")}${getRateSuffix(rateType)}`;
}
