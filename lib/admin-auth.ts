export const ADMIN_ALLOWED_EMAIL = "proassistng@gmail.com";

export function normalizeEmail(email: string): string {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

export function isAllowedAdminEmail(email: string | null | undefined): boolean {
  return normalizeEmail(email ?? "") === ADMIN_ALLOWED_EMAIL;
}
