/**
 * Rate limiter with Upstash Redis for production, in-memory fallback for dev.
 *
 * Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN env vars to enable Redis.
 * Without them, falls back to in-memory (single-instance only).
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ── Redis-backed rate limiter (production) ────────────────────────────

let redisLimiters: Map<string, Ratelimit> | null = null;

function getRedisLimiter(windowMs: number, limit: number): Ratelimit | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  const key = `${windowMs}:${limit}`;
  if (!redisLimiters) redisLimiters = new Map();

  if (!redisLimiters.has(key)) {
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    redisLimiters.set(
      key,
      new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
        analytics: true,
        prefix: "cadence:rl",
      })
    );
  }

  return redisLimiters.get(key)!;
}

// ── In-memory fallback (dev / single instance) ────────────────────────

type RateLimitEntry = { count: number; resetAt: number };
const memStore = new Map<string, RateLimitEntry>();

// Cleanup stale in-memory entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memStore) {
      if (v.resetAt < now) memStore.delete(k);
    }
  }, 5 * 60 * 1000);
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { success: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = memStore.get(key);

  if (!entry || entry.resetAt < now) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  entry.count++;
  if (entry.count > limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// ── Public API ────────────────────────────────────────────────────────

export async function rateLimit({
  key,
  limit = 60,
  windowMs = 60_000,
}: {
  key: string;
  limit?: number;
  windowMs?: number;
}): Promise<{ success: boolean; remaining: number; resetAt: number }> {
  const redisLimiter = getRedisLimiter(windowMs, limit);

  if (redisLimiter) {
    try {
      const result = await redisLimiter.limit(key);
      return {
        success: result.success,
        remaining: result.remaining,
        resetAt: result.reset,
      };
    } catch (err) {
      // Redis error — fall back to memory
      console.error("[rate-limit] Redis error, falling back to memory:", err);
    }
  }

  return memoryRateLimit(key, limit, windowMs);
}

export function rateLimitResponse(resetAt: number): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.max(retryAfter, 1)),
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    }
  );
}
