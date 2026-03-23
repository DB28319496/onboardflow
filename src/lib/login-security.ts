// Login security: account lockout + failed attempt tracking
// In production with multiple instances, move to Redis

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

type LoginAttempt = {
  count: number;
  lastAttempt: number;
  lockedUntil: number | null;
};

const attempts = new Map<string, LoginAttempt>();

// Cleanup stale entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of attempts) {
    if (entry.lockedUntil && entry.lockedUntil < now) {
      attempts.delete(key);
    } else if (now - entry.lastAttempt > LOCKOUT_DURATION_MS * 2) {
      attempts.delete(key);
    }
  }
}, 10 * 60 * 1000);

/**
 * Check if an account is currently locked out.
 * Returns { locked: false } if OK, or { locked: true, remainingMs } if locked.
 */
export function checkLockout(email: string): { locked: boolean; remainingMs: number } {
  const key = email.toLowerCase();
  const entry = attempts.get(key);
  if (!entry?.lockedUntil) return { locked: false, remainingMs: 0 };

  const now = Date.now();
  if (entry.lockedUntil > now) {
    return { locked: true, remainingMs: entry.lockedUntil - now };
  }

  // Lockout expired — reset
  attempts.delete(key);
  return { locked: false, remainingMs: 0 };
}

/**
 * Record a failed login attempt. Returns true if the account is now locked.
 */
export function recordFailedAttempt(email: string, ip: string): boolean {
  const key = email.toLowerCase();
  const now = Date.now();
  const entry = attempts.get(key) ?? { count: 0, lastAttempt: 0, lockedUntil: null };

  // If previous attempts were long ago, reset count
  if (now - entry.lastAttempt > LOCKOUT_DURATION_MS) {
    entry.count = 0;
  }

  entry.count++;
  entry.lastAttempt = now;

  if (entry.count >= MAX_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    attempts.set(key, entry);

    // Log the lockout event
    console.warn(
      `[SECURITY] Account locked: email=${email} ip=${ip} attempts=${entry.count} locked_until=${new Date(entry.lockedUntil).toISOString()}`
    );
    return true;
  }

  attempts.set(key, entry);

  // Log every failed attempt
  console.warn(
    `[SECURITY] Failed login: email=${email} ip=${ip} attempt=${entry.count}/${MAX_ATTEMPTS}`
  );
  return false;
}

/**
 * Clear failed attempts after successful login.
 */
export function clearAttempts(email: string): void {
  attempts.delete(email.toLowerCase());
}

/**
 * Log a successful login.
 */
export function logSuccessfulLogin(email: string, ip: string, userId: string): void {
  console.info(
    `[SECURITY] Successful login: email=${email} ip=${ip} userId=${userId}`
  );
}
