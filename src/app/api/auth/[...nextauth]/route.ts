import { handlers } from "@/lib/auth";
import { rateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

export const { GET } = handlers;

// Wrap POST with rate limiting for login/credential submission
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const { success, resetAt } = await rateLimit({
    key: `auth:${ip}`,
    limit: 10,
    windowMs: 60_000, // 10 attempts per minute per IP
  });
  if (!success) return rateLimitResponse(resetAt);

  return handlers.POST(req);
}
