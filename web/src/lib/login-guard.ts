// src/lib/login-guard.ts
// Limits failed administrator sign-ins per address and per IP, in Upstash Redis.
// Without Redis configured the limit is off (logged once); a Redis error lets the
// sign-in through, so an outage never locks the owner out.

import { createHash } from "node:crypto";

const WINDOW_SECONDS = 15 * 60;
export const MAX_FAILURES_PER_EMAIL = 5;
export const MAX_FAILURES_PER_IP = 20;
const TIMEOUT_MS = 2_000;

type Command = (string | number)[];

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/+$/, ""), token } : null;
}

let warnedUnconfigured = false;

async function pipeline(commands: Command[]): Promise<unknown[] | null> {
  const config = redisConfig();
  if (!config) {
    if (!warnedUnconfigured) {
      warnedUnconfigured = true;
      console.warn("[LoginGuard] ADMIN_LOGIN_RATE_LIMIT_DISABLED: Upstash Redis is not configured");
    }
    return null;
  }
  try {
    const response = await fetch(`${config.url}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(commands),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`HTTP_${response.status}`);
    const results = (await response.json()) as { result?: unknown; error?: string }[];
    return results.map((item) => item.result ?? null);
  } catch (error) {
    console.error("[LoginGuard] ADMIN_LOGIN_RATE_LIMIT_UNAVAILABLE", error instanceof Error ? error.name : "UNKNOWN");
    return null;
  }
}

const digest = (value: string) => createHash("sha256").update(value).digest("hex").slice(0, 32);

export function loginGuardKeys(email: string, ip: string) {
  return {
    email: `mone:admin-login:email:${digest(email.trim().toLowerCase())}`,
    ip: `mone:admin-login:ip:${digest(ip)}`,
  };
}

export function clientIp(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim() || "unknown";
}

/** True when this address or IP already failed too often within the window. */
export async function loginBlocked(email: string, ip: string) {
  const keys = loginGuardKeys(email, ip);
  const results = await pipeline([["GET", keys.email], ["GET", keys.ip]]);
  if (!results) return false;
  const [byEmail, byIp] = results.map((value) => Number(value ?? 0));
  return byEmail >= MAX_FAILURES_PER_EMAIL || byIp >= MAX_FAILURES_PER_IP;
}

export async function recordLoginFailure(email: string, ip: string) {
  const keys = loginGuardKeys(email, ip);
  await pipeline([
    ["INCR", keys.email], ["EXPIRE", keys.email, WINDOW_SECONDS, "NX"],
    ["INCR", keys.ip], ["EXPIRE", keys.ip, WINDOW_SECONDS, "NX"],
  ]);
}

/** A successful sign-in clears the address's count (the IP's stays). */
export async function clearLoginFailures(email: string, ip: string) {
  await pipeline([["DEL", loginGuardKeys(email, ip).email]]);
}

/** True when a browser sent the request from this site's own pages. */
export function sameOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) return origin === new URL(request.url).origin;
  return request.headers.get("sec-fetch-site") === "same-origin";
}

/** Compared against when the address has no password, so both cases take the same time. */
export const UNKNOWN_USER_HASH = "$2b$12$jkftWpXerSvRx5/CZHfBWuF0ETVn1.zbpezeUbCS0szRoxkqemRbu";
