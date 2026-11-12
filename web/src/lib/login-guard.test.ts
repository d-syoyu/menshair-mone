import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();

async function loadGuard() {
  vi.resetModules();
  return import("./login-guard");
}

function redisAnswers(...results: unknown[]) {
  fetchMock.mockResolvedValueOnce(new Response(JSON.stringify(results.map((result) => ({ result }))), { status: 200 }));
}

describe("login guard", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    fetchMock.mockReset();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("blocks an address after 5 failures and an IP after 20", async () => {
    const guard = await loadGuard();
    redisAnswers("4", "19");
    expect(await guard.loginBlocked("owner@example.com", "203.0.113.1")).toBe(false);
    redisAnswers("5", "0");
    expect(await guard.loginBlocked("owner@example.com", "203.0.113.1")).toBe(true);
    redisAnswers(null, "20");
    expect(await guard.loginBlocked("other@example.com", "203.0.113.1")).toBe(true);
  });

  it("counts a failure for the address and the IP, each expiring after 15 minutes", async () => {
    const guard = await loadGuard();
    redisAnswers(1, 1, 1, 1);
    await guard.recordLoginFailure("Owner@Example.com ", "203.0.113.1");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://redis.example.test/pipeline");
    const keys = guard.loginGuardKeys("owner@example.com", "203.0.113.1");
    expect(JSON.parse(init.body)).toEqual([
      ["INCR", keys.email], ["EXPIRE", keys.email, 900, "NX"],
      ["INCR", keys.ip], ["EXPIRE", keys.ip, 900, "NX"],
    ]);
    // The address never reaches Redis in clear text.
    expect(init.body).not.toContain("owner@example.com");
  });

  it("lets the sign-in through when Redis is unreachable or not configured", async () => {
    const guard = await loadGuard();
    fetchMock.mockRejectedValueOnce(new Error("network"));
    expect(await guard.loginBlocked("owner@example.com", "203.0.113.1")).toBe(false);

    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("KV_REST_API_URL", "");
    const unconfigured = await loadGuard();
    expect(await unconfigured.loginBlocked("owner@example.com", "203.0.113.1")).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("accepts only requests sent from this site's own pages", async () => {
    const { sameOriginRequest } = await loadGuard();
    const url = "https://mone.example.com/api/auth/admin-login";
    expect(sameOriginRequest(new Request(url, { method: "POST", headers: { origin: "https://mone.example.com" } }))).toBe(true);
    expect(sameOriginRequest(new Request(url, { method: "POST", headers: { origin: "https://evil.example.net" } }))).toBe(false);
    expect(sameOriginRequest(new Request(url, { method: "POST", headers: { "sec-fetch-site": "same-origin" } }))).toBe(true);
    expect(sameOriginRequest(new Request(url, { method: "POST" }))).toBe(false);
  });
});
