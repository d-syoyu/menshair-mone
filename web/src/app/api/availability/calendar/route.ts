// src/app/api/availability/calendar/route.ts
// 予約カレンダーの各日に付ける空き状況の印（◎○△×・休・－）。
// GET /api/availability/calendar?month=2026-11&menuIds=a,b
// 1か月分を1回で答える：休業日とメニューはキャッシュから、予約は1回のクエリで、SB側の占有は14日ずつまとめて聞く。

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getBusinessHours } from "@/constants/salon";
import { isWithinBookingWindow } from "@/constants/booking";
import {
  addDaysToDbDate,
  dbDateToJstDateString,
  getJstDateString,
  getJstTimeString,
  getJstWeekday,
  parseLocalDate,
} from "@/lib/date-utils";
import { getPublicHolidays } from "@/lib/public-holidays";
import { getCachedBookingMenus } from "@/lib/menu-cache";
import { classifyDay, computeDaySlots, type DayMark, type TimeRange } from "@/lib/availability";
import { getSbOccupancyRange, sbHubEnabled, type SbHubDayOccupancy } from "@/lib/sb-hub";

export const dynamic = "force-dynamic";

const MONTH = /^(\d{4})-(\d{2})$/;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const match = MONTH.exec(searchParams.get("month") ?? "");
    const year = match ? Number(match[1]) : NaN;
    const month = match ? Number(match[2]) : NaN;
    if (!match || year < 2000 || year > 2100 || month < 1 || month > 12) {
      return NextResponse.json({ error: "月の指定が正しくありません" }, { status: 400 });
    }

    // メニューの合計時間（キャッシュから。DBは起こさない）
    let totalDuration = 60;
    const menuIds = (searchParams.get("menuIds") ?? "").split(",").filter(Boolean);
    if (menuIds.length > 0) {
      const { menus } = await getCachedBookingMenus();
      const byId = new Map(menus.map((m) => [m.id, m]));
      if (menuIds.some((id) => !byId.has(id))) {
        return NextResponse.json({ error: "指定されたメニューが見つかりません" }, { status: 400 });
      }
      totalDuration = menuIds.reduce((sum, id) => sum + byId.get(id)!.duration, 0);
    }

    const pad = (n: number) => String(n).padStart(2, "0");
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
    const dates = Array.from({ length: lastDay }, (_, i) => `${year}-${pad(month)}-${pad(i + 1)}`);

    const { holidays, closedDays, specialOpenDays } = await getPublicHolidays(year, month);
    const today = getJstDateString();

    // 予約を受けうる日（過去・休業日・受付期間外を除く）
    const marks: Record<string, DayMark> = {};
    const open: string[] = [];
    for (const dateStr of dates) {
      const date = parseLocalDate(dateStr);
      const isClosedDay = closedDays.includes(getJstWeekday(date)) && !specialOpenDays.includes(dateStr);
      const allDayHoliday = holidays.some((h) => h.date === dateStr && !h.startTime && !h.endTime);
      if (dateStr < today) marks[dateStr] = "unavailable";
      else if (isClosedDay || allDayHoliday) marks[dateStr] = "closed";
      else if (!isWithinBookingWindow(date)) marks[dateStr] = "unavailable";
      else open.push(dateStr);
    }
    if (open.length === 0) return NextResponse.json({ month: `${year}-${pad(month)}`, totalDuration, marks });

    const first = open[0];
    const last = open[open.length - 1];
    const [reservations, sbDays] = await Promise.all([
      prisma.reservation.findMany({
        where: { date: { gte: parseLocalDate(first), lt: addDaysToDbDate(parseLocalDate(last), 1) }, status: "CONFIRMED" },
        select: { date: true, startTime: true, endTime: true },
      }),
      sbHubEnabled()
        ? getSbOccupancyRange(first, last)
        : Promise.resolve(null as Map<string, SbHubDayOccupancy | null> | null),
    ]);

    const reservationsByDate = new Map<string, TimeRange[]>();
    for (const r of reservations) {
      const key = dbDateToJstDateString(r.date);
      reservationsByDate.set(key, [...(reservationsByDate.get(key) ?? []), r]);
    }

    const now = new Date();
    const nowTime = getJstTimeString(now);
    for (const dateStr of open) {
      const sbDay = sbDays ? sbDays.get(dateStr) ?? null : null;
      // SB連携中にSOGAが答えられない日は、枠を出さない（1日分の画面と同じ扱い）。
      if (sbDays && (!sbDay || !sbDay.open)) {
        marks[dateStr] = "unknown";
        continue;
      }
      const businessHours = getBusinessHours(parseLocalDate(dateStr));
      const timeRangeHolidays = holidays
        .filter((h) => h.date === dateStr && h.startTime && h.endTime)
        .map((h) => ({ startTime: h.startTime!, endTime: h.endTime! }));
      const base = { businessHours, totalDuration, timeRangeHolidays };
      const slots = computeDaySlots({
        ...base,
        reservations: reservationsByDate.get(dateStr) ?? [],
        sbDay,
        nowTime: dateStr === today ? nowTime : null,
      });
      // 比べる基準：予約もSBの占有もない、その日の営業時間いっぱいの枠
      const baseline = computeDaySlots({ ...base, reservations: [], sbDay: null, nowTime: null });
      marks[dateStr] = classifyDay(slots, baseline, totalDuration);
    }

    return NextResponse.json({ month: `${year}-${pad(month)}`, totalDuration, marks });
  } catch (error) {
    console.error("Availability calendar API error:", error);
    return NextResponse.json({ error: "空き状況の取得に失敗しました" }, { status: 500 });
  }
}
