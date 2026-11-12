import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { proxy } from "./proxy";

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

const getTokenMock = vi.mocked(getToken);

function createRequest(pathname: string, cookie?: string) {
  return new NextRequest(`https://example.com${pathname}`, {
    headers: cookie ? { cookie } : undefined,
  });
}

describe("proxy authentication", () => {
  beforeEach(() => {
    getTokenMock.mockReset();
  });

  it("redirects an expired admin session to login without redirecting login back", async () => {
    getTokenMock.mockResolvedValue(null);
    const expiredCookie = "__Secure-authjs.session-token=expired";

    const adminResponse = await proxy(createRequest("/admin", expiredCookie));
    const loginResponse = await proxy(createRequest("/admin/login", expiredCookie));

    expect(adminResponse.status).toBe(307);
    expect(adminResponse.headers.get("location")).toBe(
      "https://example.com/admin/login",
    );
    expect(loginResponse.status).toBe(200);
    expect(loginResponse.headers.get("location")).toBeNull();
  });

  it("redirects an authenticated administrator away from the login page", async () => {
    getTokenMock.mockResolvedValue({ sub: "admin-1", role: "ADMIN", adminAt: Math.floor(Date.now() / 1000), sv: 0 });

    const response = await proxy(createRequest("/admin/login"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/admin");
  });

  it("does not treat an administrator token older than 12 hours, or one without its sign-in time, as an administrator", async () => {
    const thirteenHoursAgo = Math.floor(Date.now() / 1000) - 13 * 60 * 60;
    for (const token of [
      { sub: "admin-1", role: "ADMIN", adminAt: thirteenHoursAgo, sv: 0 },
      { sub: "admin-1", role: "ADMIN" },
    ]) {
      getTokenMock.mockResolvedValue(token);

      const pageResponse = await proxy(createRequest("/admin"));
      const apiResponse = await proxy(createRequest("/api/admin/customers"));

      expect(pageResponse.status).toBe(307);
      expect(pageResponse.headers.get("location")).toBe("https://example.com/admin/login");
      expect(apiResponse.status).toBe(403);
    }
  });

  it("does not treat a customer session as an administrator", async () => {
    getTokenMock.mockResolvedValue({ sub: "customer-1", role: "CUSTOMER" });

    const pageResponse = await proxy(createRequest("/admin"));
    const apiResponse = await proxy(createRequest("/api/admin/customers"));

    expect(pageResponse.status).toBe(307);
    expect(pageResponse.headers.get("location")).toBe(
      "https://example.com/admin/login",
    );
    expect(apiResponse.status).toBe(403);
  });
});
