// src/lib/admin-session.ts
// An administrator's sign-in lasts 12 hours, and stops at once when the account
// stops being an administrator or signs out on every device (sessionVersion).
// No Prisma here: the proxy reads it too.

/** Seconds an administrator's sign-in lasts. Customers keep AUTH_SESSION_MAX_AGE. */
export const ADMIN_SESSION_MAX_AGE = 12 * 60 * 60;
const CLOCK_SKEW_SECONDS = 60;

export interface AdminTokenClaims {
  /** When the administrator signed in with the password (seconds). */
  adminAt: number;
  /** User.sessionVersion at that sign-in. */
  sv: number;
}

export const nowSeconds = () => Math.floor(Date.now() / 1000);

export function adminTokenClaims(sessionVersion: number, now = nowSeconds()): AdminTokenClaims {
  return { adminAt: now, sv: sessionVersion };
}

/** True while an ADMIN token is within its 12 hours. Says nothing about the database. */
export function adminTokenFresh(token: object | null | undefined, now = nowSeconds()) {
  const { role, adminAt } = (token ?? {}) as { role?: unknown; adminAt?: unknown };
  if (role !== "ADMIN" || typeof adminAt !== "number") return false;
  return adminAt <= now + CLOCK_SKEW_SECONDS && now - adminAt < ADMIN_SESSION_MAX_AGE;
}

/** True when the account behind an ADMIN token is still an administrator of the same session version. */
export function adminTokenMatches(
  token: object,
  user: { role: string; sessionVersion: number } | null | undefined,
) {
  const { sv } = token as { sv?: unknown };
  return !!user && user.role === "ADMIN" && typeof sv === "number" && sv === user.sessionVersion;
}
