import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { isAllowedAdminEmail } from "./admin-auth";
import { getUpstashRedis } from "./upstash";

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const RATE_LIMIT_STORE = new Map<string, RateLimitEntry>();
const IDEMPOTENCY_DONE_STORE = new Map<string, number>();
const IDEMPOTENCY_LOCK_STORE = new Map<string, number>();

function cleanupExpired(store: Map<string, number>, now: number): void {
  for (const [k, expiresAt] of store.entries()) {
    if (expiresAt <= now) store.delete(k);
  }
}

function getIdempotencyDoneKey(key: string): string {
  return `idempotency:done:${key}`;
}

function getIdempotencyLockKey(key: string): string {
  return `idempotency:lock:${key}`;
}

export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return req.headers.get("x-real-ip") ?? "unknown";
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<{ ok: boolean; remaining: number; resetAt: number }> {
  const now = Date.now();

  const redis = getUpstashRedis();
  if (redis) {
    try {
      const bucketKey = `ratelimit:${key}:${Math.floor(now / windowMs)}`;
      const count = Number(await redis.incr(bucketKey));
      if (count === 1) {
        await redis.pexpire(bucketKey, windowMs);
      }

      const ttlMs = Number(await redis.pttl(bucketKey));
      const resetAt = now + (ttlMs > 0 ? ttlMs : windowMs);
      return {
        ok: count <= limit,
        remaining: Math.max(0, limit - count),
        resetAt,
      };
    } catch {
      // Fall through to local memory limiter if Redis is temporarily unavailable.
    }
  }

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

export async function hasProcessedIdempotency(key: string): Promise<boolean> {
  const redis = getUpstashRedis();
  if (redis) {
    try {
      const exists = Number(await redis.exists(getIdempotencyDoneKey(key)));
      return exists > 0;
    } catch {
      // Fall through to local memory store.
    }
  }

  const now = Date.now();
  cleanupExpired(IDEMPOTENCY_DONE_STORE, now);
  return (IDEMPOTENCY_DONE_STORE.get(key) ?? 0) > now;
}

export async function acquireIdempotencyLock(
  key: string,
  ttlSeconds: number,
): Promise<boolean> {
  const redis = getUpstashRedis();
  if (redis) {
    try {
      const res = await redis.set(getIdempotencyLockKey(key), "1", {
        nx: true,
        ex: ttlSeconds,
      });
      return res === "OK";
    } catch {
      // Fall through to local memory store.
    }
  }

  const now = Date.now();
  cleanupExpired(IDEMPOTENCY_LOCK_STORE, now);
  const lockUntil = IDEMPOTENCY_LOCK_STORE.get(key) ?? 0;
  if (lockUntil > now) return false;

  IDEMPOTENCY_LOCK_STORE.set(key, now + ttlSeconds * 1000);
  return true;
}

export async function markProcessedIdempotency(
  key: string,
  ttlSeconds: number,
): Promise<void> {
  const redis = getUpstashRedis();
  if (redis) {
    try {
      await redis.set(getIdempotencyDoneKey(key), "1", { ex: ttlSeconds });
      return;
    } catch {
      // Fall through to local memory store.
    }
  }

  IDEMPOTENCY_DONE_STORE.set(key, Date.now() + ttlSeconds * 1000);
}

export async function releaseIdempotencyLock(key: string): Promise<void> {
  const redis = getUpstashRedis();
  if (redis) {
    try {
      await redis.del(getIdempotencyLockKey(key));
      return;
    } catch {
      // Fall through to local memory store.
    }
  }

  IDEMPOTENCY_LOCK_STORE.delete(key);
}

function getBearerToken(req: NextRequest): string | null {
  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

export async function requireAdminFromBearer(
  req: NextRequest,
): Promise<
  { ok: true; userId: string } | { ok: false; error: string; status: number }
> {
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

  if (!isAllowedAdminEmail(userData.user.email)) {
    return { ok: false, error: "Forbidden.", status: 403 };
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
