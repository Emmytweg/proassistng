import { Redis } from "@upstash/redis";

let upstashRedis: Redis | null | undefined;

export function getUpstashRedis(): Redis | null {
  if (upstashRedis !== undefined) {
    return upstashRedis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    upstashRedis = null;
    return upstashRedis;
  }

  upstashRedis = new Redis({ url, token });
  return upstashRedis;
}
