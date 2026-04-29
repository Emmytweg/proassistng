export const PLATFORM_FEE_RATE = 0.05;

function roundCurrency(value: number): number {
  return Math.round(value * 100) / 100;
}

export function parseNairaAmount(
  value: string | number | null | undefined,
): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? Math.max(0, value) : 0;
  }

  const text = String(value ?? "");
  const parsed = Number.parseFloat(text.replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, parsed);
}

export function calculateTransactionBreakdown(
  baseAmountInput: string | number,
) {
  const baseAmount = parseNairaAmount(baseAmountInput);
  const platformFee = roundCurrency(baseAmount * PLATFORM_FEE_RATE);
  const totalAmount = roundCurrency(baseAmount + platformFee);

  return {
    baseAmount,
    platformFee,
    totalAmount,
  };
}
