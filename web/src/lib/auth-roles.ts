// src/lib/auth-roles.ts
// Which role a sign-in may carry. An administrator signs in with the password
// only: a magic link or LINE proves only that someone reads the mailbox or holds
// the LINE account, so neither may start an administrator session.

import type { UserRole } from "@prisma/client";

export const ADMIN_SIGN_IN_PROVIDER = "credentials";

/** False for an administrator's account signing in by any other way than the password. */
export function signInAllowedForRole(provider: string | undefined, role: UserRole | null | undefined) {
  return role !== "ADMIN" || provider === ADMIN_SIGN_IN_PROVIDER;
}

/** The role a new session gets: ADMIN only through the password sign-in. */
export function sessionRoleFor(provider: string | undefined, role: UserRole | null | undefined): UserRole {
  if (role === "ADMIN") return provider === ADMIN_SIGN_IN_PROVIDER ? "ADMIN" : "CUSTOMER";
  return "CUSTOMER";
}
