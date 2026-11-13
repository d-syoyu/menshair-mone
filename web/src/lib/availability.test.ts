import { describe, expect, it } from "vitest";
import { classifyDay, computeDaySlots, countBookingWindows, type TimeSlot } from "./availability";

const weekday = { open: "10:00", lastBooking: "20:00", close: "21:00" };
const day = (overrides: Partial<Parameters<typeof computeDaySlots>[0]> = {}) =>
  computeDaySlots({ businessHours: weekday, totalDuration: 60, reservations: [], timeRangeHolidays: [], sbDay: null, nowTime: null, ...overrides });
const free = (slots: TimeSlot[]) => slots.filter((s) => s.available).map((s) => s.time);

describe("computeDaySlots", () => {
  it("offers starts from opening until the menu still ends by closing", () => {
    const times = free(day());
    expect(times[0]).toBe("10:00");
    expect(times.at(-1)).toBe("20:00");
  });

  it("blocks reservations, part-day closures, SB occupancy and past times", () => {
    const times = free(day({
      reservations: [{ startTime: "12:00", endTime: "13:00" }],
      timeRangeHolidays: [{ startTime: "15:00", endTime: "16:00" }],
      sbDay: { open: true, busy: [{ start: "18:00", end: "19:00" }] },
      nowTime: "10:30",
    }));
    expect(times).not.toContain("10:30");
    expect(times).toContain("10:40");
    expect(times).not.toContain("11:10");
    expect(times).toContain("13:00");
    expect(times).not.toContain("15:30");
    expect(times).toContain("16:00");
    expect(times).not.toContain("17:30");
    expect(times).toContain("19:00");
  });
});

describe("classifyDay", () => {
  const baseline = day();
  it("counts windows that fit without overlapping", () => {
    expect(countBookingWindows(["10:00", "10:10", "11:00", "11:30", "12:00"], 60)).toBe(3);
  });

  it("marks a free day plenty, a nearly full one limited and a full one full", () => {
    expect(classifyDay(baseline, baseline, 60)).toBe("plenty");
    const oneLeft = day({ reservations: [{ startTime: "10:00", endTime: "20:00" }] });
    expect(classifyDay(oneLeft, baseline, 60)).toBe("limited");
    const none = day({ reservations: [{ startTime: "10:00", endTime: "21:00" }] });
    expect(classifyDay(none, baseline, 60)).toBe("full");
  });

  it("marks a half-booked day available", () => {
    const half = day({ reservations: [{ startTime: "10:00", endTime: "16:00" }] });
    expect(classifyDay(half, baseline, 60)).toBe("available");
  });
});
