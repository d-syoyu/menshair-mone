// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSbOccupancyCache,
  deleteSbBooking,
  getSbOccupancy,
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
  it("is off until the URL, key and shop are all set", () => {
    expect(sbHubConfig({} as NodeJS.ProcessEnv)).toBeNull();
    expect(sbHubConfig({ SB_HUB_URL: "https://x", SB_HUB_API_KEY: "k" } as NodeJS.ProcessEnv)).toBeNull();
    expect(sbHubConfig({ SB_HUB_URL: "https://x/", SB_HUB_API_KEY: "k", SB_HUB_SHOP_ID: "s" } as NodeJS.ProcessEnv))
      .toEqual({ url: "https://x", apiKey: "k", shopId: "s", staffId: null });
  });

  it("never sends the key over plain HTTP", () => {
    expect(sbHubConfig({ SB_HUB_URL: "http://x", SB_HUB_API_KEY: "k", SB_HUB_SHOP_ID: "s" } as NodeJS.ProcessEnv)).toBeNull();
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
