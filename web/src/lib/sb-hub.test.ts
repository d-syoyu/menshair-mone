// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSbOccupancyCache,
  createSbSetupLink,
  deleteSbBooking,
  getSbOccupancy,
  getSbOccupancyRange,
  getSbShopStatus,
  putSbBooking,
  sbBusyOverlaps,
  sbHubConfig,
  sbNoteName,
  sendSbReadDemand,
  type SbHubConfig,
} from "./sb-hub";

const config: SbHubConfig = { url: "https://admin.soga.test/api/salonboard/hub/v1", apiKey: "sbh_key", shopId: "shop_1", staffId: "staff_1" };

function respond(status: number, json: unknown) {
  return vi.fn(async () => new Response(JSON.stringify(json), { status, headers: { "content-type": "application/json" } }));
}

const booking = {
  reservationId: "res_1", version: 1, date: "2026-11-20", startTime: "10:00", endTime: "11:00",
  customerName: "山田 太郎", origin: "PUBLIC" as const,
};

beforeEach(() => {
  clearSbOccupancyCache();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("sbHubConfig", () => {
  it("is off until the URL, key, shop and staff are all set", () => {
    expect(sbHubConfig({})).toBeNull();
    expect(sbHubConfig({ SB_HUB_URL: "https://x", SB_HUB_API_KEY: "k" })).toBeNull();
    expect(sbHubConfig({ SB_HUB_URL: "https://x/", SB_HUB_API_KEY: "k", SB_HUB_SHOP_ID: "s" })).toBeNull();
    expect(sbHubConfig({ SB_HUB_URL: "https://x/", SB_HUB_API_KEY: "k", SB_HUB_SHOP_ID: "s", SB_HUB_STAFF_ID: "t" }))
      .toEqual({ url: "https://x", apiKey: "k", shopId: "s", staffId: "t" });
  });

  it("never sends the key over plain HTTP", () => {
    expect(sbHubConfig({ SB_HUB_URL: "http://x", SB_HUB_API_KEY: "k", SB_HUB_SHOP_ID: "s", SB_HUB_STAFF_ID: "t" })).toBeNull();
  });
});

describe("putSbBooking", () => {
  it.each(["CONFIRMED", "REQUESTED", "CONFLICT", "PAUSED"])("returns SOGA's answer %s", async (answer) => {
    const fetchImpl = respond(answer === "CONFLICT" ? 409 : 200, { answer });
    expect(await putSbBooking(booking, { config, fetchImpl })).toBe(answer);
  });

  it("sends only the slot and the note name, with the key in the header", async () => {
    const fetchImpl = respond(200, { answer: "CONFIRMED" });
    await putSbBooking(booking, { config, fetchImpl });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://admin.soga.test/api/salonboard/hub/v1/shops/shop_1/bookings/res_1");
    expect(init.method).toBe("PUT");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer sbh_key");
    expect(init.redirect).toBe("error");
    expect(JSON.parse(init.body as string)).toEqual({
      version: 1, staffId: "staff_1", date: "2026-11-20", start: "10:00", end: "11:00",
      status: "ACTIVE", noteName: "山田 太郎", origin: "PUBLIC",
    });
  });

  it("treats a failure, a timeout or an unknown answer as unreachable", async () => {
    expect(await putSbBooking(booking, { config, fetchImpl: vi.fn(async () => { throw new Error("timeout"); }) })).toBe("UNREACHABLE");
    expect(await putSbBooking(booking, { config, fetchImpl: respond(500, { answer: "CONFIRMED" }) })).toBe("UNREACHABLE");
    expect(await putSbBooking(booking, { config, fetchImpl: respond(200, { answer: "MAYBE" }) })).toBe("UNREACHABLE");
    expect(await putSbBooking(booking, { config: null })).toBe("UNREACHABLE");
  });
});

describe("getSbOccupancyRange", () => {
  it("asks for up to 14 days at a time and answers every day", async () => {
    const fetchImpl = vi.fn(async (url: string | URL | Request) => {
      const u = new URL(String(url));
      const from = u.searchParams.get("from")!;
      return new Response(JSON.stringify({ days: [{ date: from, open: true, busy: [] }] }), { status: 200 });
    });
    const result = await getSbOccupancyRange("2026-11-01", "2026-11-30", { config, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect([...fetchImpl.mock.calls.map((c) => new URL(String(c[0])).search)]).toEqual([
      "?from=2026-11-01&to=2026-11-14", "?from=2026-11-15&to=2026-11-28", "?from=2026-11-29&to=2026-11-30",
    ]);
    expect(result.size).toBe(30);
    expect(result.get("2026-11-01")).toEqual({ open: true, busy: [] });
    expect(result.get("2026-11-02")).toBeNull();
    // 覚えている日は聞き直さない
    await getSbOccupancy("2026-11-01", { config, fetchImpl });
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("answers every day as unknown without the hub", async () => {
    const result = await getSbOccupancyRange("2026-11-01", "2026-11-03", { config: null });
    expect([...result.values()]).toEqual([null, null, null]);
  });
});

describe("getSbOccupancy", () => {
  const day = { date: "2026-11-20", open: true, busy: [
    { staffId: "staff_1", start: "10:00", end: "11:00" },
    { staffId: "staff_2", start: "12:00", end: "13:00" },
    { start: "15:00", end: "16:00" },
  ] };

  it("keeps MONË's staff and the whole-shop ranges", async () => {
    const result = await getSbOccupancy("2026-11-20", { config, fetchImpl: respond(200, { days: [day] }) });
    expect(result).toEqual({ open: true, busy: [{ start: "10:00", end: "11:00" }, { start: "15:00", end: "16:00" }] });
    expect(sbBusyOverlaps(result!, "10:30", "11:30")).toBe(true);
    expect(sbBusyOverlaps(result!, "11:00", "12:00")).toBe(false);
  });

  it("is unknown (null) when SOGA cannot answer or the answer is malformed", async () => {
    expect(await getSbOccupancy("2026-11-20", { config, fetchImpl: respond(503, {}) })).toBeNull();
    clearSbOccupancyCache();
    expect(await getSbOccupancy("2026-11-20", { config, fetchImpl: respond(200, { days: [{ date: "2026-11-20", busy: [{ start: "x" }] }] }) })).toBeNull();
    clearSbOccupancyCache();
    expect(await getSbOccupancy("2026-11-21", { config, fetchImpl: respond(200, { days: [day] }) })).toBeNull();
  });

  it("passes on a closed day as closed", async () => {
    const result = await getSbOccupancy("2026-11-20", { config, fetchImpl: respond(200, { days: [{ ...day, open: false }] }) });
    expect(result?.open).toBe(false);
  });

  it("asks once per 15 seconds for the same day", async () => {
    const fetchImpl = respond(200, { days: [day] });
    await getSbOccupancy("2026-11-20", { config, fetchImpl, now: 1_000 });
    await getSbOccupancy("2026-11-20", { config, fetchImpl, now: 10_000 });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    await getSbOccupancy("2026-11-20", { config, fetchImpl, now: 17_000 });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });
});

describe("other calls", () => {
  it("read demand posts the date", async () => {
    const fetchImpl = respond(202, {});
    await sendSbReadDemand("2026-11-20", { config, fetchImpl });
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/shops\/shop_1\/read-demand$/);
    expect(JSON.parse(init.body as string)).toEqual({ dates: ["2026-11-20"] });
  });

  it("delete counts SOGA not knowing the booking as done", async () => {
    expect(await deleteSbBooking("res_1", 2, { config, fetchImpl: respond(404, {}) })).toBe(true);
    expect(await deleteSbBooking("res_1", 2, { config, fetchImpl: respond(500, {}) })).toBe(false);
  });

  it("status hides links that are not https", async () => {
    expect(await getSbShopStatus({ config, fetchImpl: respond(200, { state: "CONNECTED", settingsUrl: "javascript:alert(1)" }) }))
      .toEqual({ reachable: true, state: "CONNECTED", settingsUrl: null });
    expect(await getSbShopStatus({ config, fetchImpl: respond(200, { state: "WEIRD" }) }))
      .toEqual({ reachable: true, state: "UNKNOWN", settingsUrl: null });
    expect(await getSbShopStatus({ config, fetchImpl: respond(500, {}) })).toEqual({ reachable: false });
  });

  it("note name is one short line", () => {
    expect(sbNoteName(null)).toBe("お客様");
    expect(sbNoteName("  a\nb\tc  ")).toBe("a b c");
    expect(sbNoteName("x".repeat(100))).toHaveLength(60);
  });
});

describe("createSbSetupLink", () => {
  it("returns SOGA's one-time link and says who asked", async () => {
    const fetchImpl = respond(201, { url: "https://admin.soga.test/salonboard-link/abc", expiresAt: "2026-11-13T00:05:00Z" });
    expect(await createSbSetupLink("owner@example.com", { config, fetchImpl })).toBe("https://admin.soga.test/salonboard-link/abc");
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/shops\/shop_1\/setup-link$/);
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual({ actor: "owner@example.com" });
  });

  it("never sends the admin to another site", async () => {
    for (const link of ["https://evil.test/salonboard-link/abc", "http://admin.soga.test/x", "javascript:alert(1)", "nonsense"]) {
      expect(await createSbSetupLink("a", { config, fetchImpl: respond(200, { url: link }) })).toBeNull();
    }
  });

  it("is null when SOGA does not give one", async () => {
    expect(await createSbSetupLink("a", { config, fetchImpl: respond(429, {}) })).toBeNull();
    expect(await createSbSetupLink("a", { config: null })).toBeNull();
  });
});
