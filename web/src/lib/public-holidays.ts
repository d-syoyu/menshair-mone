// src/lib/public-holidays.ts
// MONË - 公開カレンダー（フッター・予約画面）用の休業日。
// ページを見るたびに DB を起こさないよう、キャッシュする。管理画面で休業日・特別営業日・定休日を変えると、
// タグで即時に破棄する（revalidateTag(..., { expire: 0 })）。空き枠の判定（/api/availability）はキャッシュしない。

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";
import { dbDateToJstDateString, getJstMonthRange, getJstYearRange } from "@/lib/date-utils";
import { BUSINESS_SETTINGS_CACHE_TAG } from "@/lib/business-settings";

export const HOLIDAY_CACHE_TAG = "holidays";

export type PublicHolidays = {
  holidays: { date: string; startTime: string | null; endTime: string | null }[];
  closedDays: number[];
  specialOpenDays: string[];
};

export const getPublicHolidays = unstable_cache(
  async (year: number, month: number | null): Promise<PublicHolidays> => {
    const range = month ? getJstMonthRange(year, month) : getJstYearRange(year);
    const where = { date: { gte: range.start, lt: range.end } };

    const [holidays, closedDaysSetting, specialOpenDays] = await Promise.all([
      prisma.holiday.findMany({
        where,
        select: { date: true, startTime: true, endTime: true },
        orderBy: { date: "asc" },
      }),
      prisma.settings.findUnique({ where: { key: "closed_days" } }),
      prisma.specialOpenDay.findMany({
        where,
        select: { date: true },
        orderBy: { date: "asc" },
      }),
    ]);

    return {
      holidays: holidays.map((holiday) => ({
        date: dbDateToJstDateString(holiday.date),
        startTime: holiday.startTime,
        endTime: holiday.endTime,
      })),
      closedDays: closedDaysSetting ? JSON.parse(closedDaysSetting.value) : [1],
      specialOpenDays: specialOpenDays.map((day) => dbDateToJstDateString(day.date)),
    };
  },
  ["public-holidays"],
  { tags: [HOLIDAY_CACHE_TAG, BUSINESS_SETTINGS_CACHE_TAG], revalidate: 86400 }
);
