// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const checkAdminAuth = vi.fn();
const createSbSetupLink = vi.fn();
const sbHubEnabled = vi.fn();

vi.mock("@/lib/auth", () => ({ checkAdminAuth: () => checkAdminAuth() }));
vi.mock("@/lib/sb-hub", () => ({
  createSbSetupLink: (...a: unknown[]) => createSbSetupLink(...a),
  sbHubEnabled: () => sbHubEnabled(),
}));

const { POST } = await import("./route");
const ORIGIN = "https://mone.example.com";

const request = (headers: Record<string, string> = { origin: ORIGIN }) =>
  POST(new Request(`${ORIGIN}/api/admin/sb-hub/setup-link`, { method: "POST", headers }));

beforeEach(() => {
  checkAdminAuth.mockReset().mockResolvedValue({ error: null, user: { id: "u1", email: "owner@example.com", role: "ADMIN" } });
  createSbSetupLink.mockReset().mockResolvedValue("https://admin.soga.test/salonboard-link/abc");
  sbHubEnabled.mockReset().mockReturnValue(true);
});

describe("POST /api/admin/sb-hub/setup-link", () => {
  it("gives a signed-in admin the link", async () => {
    const res = await request();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ url: "https://admin.soga.test/salonboard-link/abc" });
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(createSbSetupLink).toHaveBeenCalledWith("owner@example.com");
  });

  it("refuses another site's request before asking SOGA", async () => {
    expect((await request({ origin: "https://evil.test" })).status).toBe(403);
    expect(createSbSetupLink).not.toHaveBeenCalled();
  });

  it("refuses anyone who is not an admin", async () => {
    checkAdminAuth.mockResolvedValue({ error: new Response(null, { status: 403 }), user: null });
    expect((await request()).status).toBe(403);
    expect(createSbSetupLink).not.toHaveBeenCalled();
  });

  it("says when the hub is off or SOGA gives no link", async () => {
    sbHubEnabled.mockReturnValue(false);
    expect((await request()).status).toBe(404);
    sbHubEnabled.mockReturnValue(true);
    createSbSetupLink.mockResolvedValue(null);
    expect((await request()).status).toBe(503);
  });
});
