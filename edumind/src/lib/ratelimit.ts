const rateLimitMap = new Map<
  string,
  {
    count: number;
    resetAt: number;
  }
>();

/**
 * Simple in-memory rate limiter.
 * @param userId  — unique key (usually the Clerk userId)
 * @param limit   — max requests allowed in the window
 * @param windowMs — time window in milliseconds
 */
export function rateLimit(
  userId: string,
  limit: number,
  windowMs: number
): { success: boolean } {
  const now = Date.now();
  const record = rateLimitMap.get(userId);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + windowMs });
    return { success: true };
  }

  if (record.count >= limit) {
    return { success: false };
  }

  record.count++;
  return { success: true };
}
