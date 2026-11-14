import { AppError } from "../lib/errors";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

/** Simple in-process rate limiter (per instance). Suitable as a baseline control. */
export function assertRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): void {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > limit) {
    throw new AppError(
      "rate_limited",
      "Too many requests. Please try again shortly.",
      429,
    );
  }
}
