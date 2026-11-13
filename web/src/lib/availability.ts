// src/lib/availability.ts
// その日の予約枠の計算と、カレンダーに付ける空き状況の印（◎○△×）。
// /api/availability（1日分の枠）と /api/availability/calendar（月の印）が同じ計算を使う。

import { generateTimeSlots } from "@/constants/booking";
import { sbBusyOverlaps, type SbHubDayOccupancy } from "@/lib/sb-hub";

export interface TimeSlot {
  time: string;
  available: boolean;
}

export interface TimeRange {
  startTime: string;
  endTime: string;
}

export interface DaySlotInput {
  businessHours: { open: string; close: string; lastBooking: string };
  totalDuration: number;
  reservations: TimeRange[];
  timeRangeHolidays: TimeRange[];
  sbDay: SbHubDayOccupancy | null;
  /** 今日なら今の時刻（HH:MM）。それ以前の枠は選べない。 */
  nowTime: string | null;
}

function endTimeOf(start: string, duration: number) {
  const [h, m] = start.split(":").map(Number);
  const end = h * 60 + m + duration;
  return `${String(Math.floor(end / 60)).padStart(2, "0")}:${String(end % 60).padStart(2, "0")}`;
}

const overlaps = (start: string, end: string, range: TimeRange) => start < range.endTime && end > range.startTime;

/** その日の開始時刻ごとの予約可否（開店時刻から10分刻み）。 */
export function computeDaySlots(input: DaySlotInput): TimeSlot[] {
  const { businessHours, totalDuration, reservations, timeRangeHolidays, sbDay, nowTime } = input;
  return generateTimeSlots()
    .filter((time) => time >= businessHours.open)
    .map((time) => {
      if (time > businessHours.lastBooking) return { time, available: false };
      if (nowTime && time <= nowTime) return { time, available: false };
      const end = endTimeOf(time, totalDuration);
      if (end > businessHours.close) return { time, available: false };
      const taken =
        reservations.some((r) => overlaps(time, end, r)) ||
        timeRangeHolidays.some((h) => overlaps(time, end, h)) ||
        (sbDay ? sbBusyOverlaps(sbDay, time, end) : false);
      return { time, available: !taken };
    });
}

export type DayMark = "plenty" | "available" | "limited" | "full" | "closed" | "unavailable" | "unknown";

const minutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

/** 重ならずに入る予約の数（開始時刻は昇順）。 */
export function countBookingWindows(startTimes: string[], duration: number) {
  let count = 0;
  let next = -Infinity;
  for (const start of startTimes.map(minutes)) {
    if (start < next) continue;
    count += 1;
    next = start + Math.max(1, duration);
  }
  return count;
}

/**
 * 残っている枠と、予約が1件もない時の枠を比べて印を決める（SOGAの予約カレンダーと同じ基準）。
 * ×：入らない　△：残り1件、または1/4以下　◎：4件以上かつ3/5以上　○：それ以外
 */
export function classifyDay(slots: TimeSlot[], baseline: TimeSlot[], duration: number): DayMark {
  const free = slots.filter((s) => s.available).map((s) => s.time);
  if (free.length === 0) return "full";
  const remaining = countBookingWindows(free, duration);
  const total = countBookingWindows(baseline.filter((s) => s.available).map((s) => s.time), duration);
  if (remaining <= 1 || remaining * 4 <= total) return "limited";
  if (remaining >= 4 && remaining * 5 >= total * 3) return "plenty";
  return "available";
}
