// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { decode } from "next-auth/jwt";

const findUnique = vi.fn();
const cookieSet = vi.fn();
const loginBlocked = vi.fn();
const recordLoginFailure = vi.fn();
const clearLoginFailures = vi.fn();

vi.mock("@/lib/db", () => ({ prisma: { user: { findUnique: (...args: unknown[]) => findUnique(...args) } } }));
vi.mock("next/headers", () => ({ cookies: async () => ({ set: cookieSet }) }));
vi.mock("@/lib/login-guard", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/login-guard")>()),
  loginBlocked: (...args: unknown[]) => loginBlocked(...args),
  recordLoginFailure: (...args: unknown[]) => recordLoginFailure(...args),
  clearLoginFailures: (...args: unknown[]) => clearLoginFailures(...args),
}));

const { POST } = await import("./route");

const ORIGIN = "https://mone.example.com";
const SECRET = "test-secret-for-admin-login-route-0123456789";
const passwordHash = bcrypt.hashSync("correct horse", 4);

function login(body: unknown, headers: Record<string, string> = { origin: ORIGIN }) {
  return POST(new Request(`${ORIGIN}/api/auth/admin-login`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.1", ...headers },
    body: JSON.stringify(body),
  }));
}

describe("POST /api/auth/admin-login", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", SECRET);
    findUnique.mockReset();
    cookieSet.mockReset();
    loginBlocked.mockReset().mockResolvedValue(false);
    recordLoginFailure.mockReset();
    clearLoginFailures.mockReset();
  });

  it("refuses a request from another site before looking at the password", async () => {
    const response = await login({ email: "owner@example.com", password: "correct horse" }, { origin: "https://evil.example.net" });
    expect(response.status).toBe(403);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("refuses with 429 while the address or IP is blocked", async () => {
    loginBlocked.mockResolvedValue(true);
    const response = await login({ email: "owner@example.com", password: "correct horse" });
    expect(response.status).toBe(429);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("counts a wrong password, an unknown address and a non-administrator alike", async () => {
    findUnique.mockResolvedValueOnce({ id: "a", email: "owner@example.com", name: null, role: "ADMIN", password: passwordHash, sessionVersion: 0 });
    findUnique.mockResolvedValueOnce(null);
    findUnique.mockResolvedValueOnce({ id: "c", email: "guest@example.com", name: null, role: "CUSTOMER", password: passwordHash, sessionVersion: 0 });

    const responses = [
      await login({ email: "owner@example.com", password: "wrong" }),
      await login({ email: "nobody@example.com", password: "correct horse" }),
      await login({ email: "guest@example.com", password: "correct horse" }),
    ];

    expect(responses.map((response) => response.status)).toEqual([401, 401, 401]);
    expect(recordLoginFailure).toHaveBeenCalledTimes(3);
    expect(cookieSet).not.toHaveBeenCalled();
  });

  it("signs an administrator in for 12 hours with the session version", async () => {
    findUnique.mockResolvedValue({ id: "admin-1", email: "owner@example.com", name: "Owner", role: "ADMIN", password: passwordHash, sessionVersion: 3 });

    const response = await login({ email: "owner@example.com", password: "correct horse" });

    expect(response.status).toBe(200);
    expect(clearLoginFailures).toHaveBeenCalledOnce();
    const [name, value, options] = cookieSet.mock.calls[0];
    expect(options.maxAge).toBe(12 * 60 * 60);
    const token = await decode({ token: value, secret: SECRET, salt: name });
    expect(token).toMatchObject({ sub: "admin-1", role: "ADMIN", sv: 3 });
    expect(typeof token?.adminAt).toBe("number");
  });
});
