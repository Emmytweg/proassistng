import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_STORE = new Map<string, RateLimitEntry>();

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const existing = RATE_LIMIT_STORE.get(key);

  if (!existing || now >= existing.resetAt) {
    const next = { count: 1, resetAt: now + windowMs };
    RATE_LIMIT_STORE.set(key, next);
    return { ok: true, remaining: limit - 1, resetAt: next.resetAt };
  }

  existing.count += 1;
  RATE_LIMIT_STORE.set(key, existing);

  return {
    ok: existing.count <= limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function requireAdminFromBearer(
  req: NextRequest,
): Promise<{ ok: true; userId: string } | { ok: false; error: string; status: number }> {
  const token = getBearerToken(req);
  if (!token) {
    return { ok: false, error: "Unauthorized.", status: 401 };
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    return { ok: false, error: "Server auth is not configured.", status: 503 };
  }

  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) {
    return { ok: false, error: "Unauthorized.", status: 401 };
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  if (!adminRow) {
    return { ok: false, error: "Forbidden.", status: 403 };
  }

  return { ok: true, userId: userData.user.id };
}

export function esc(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}
