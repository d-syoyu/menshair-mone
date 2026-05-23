// src/lib/business-settings.ts
// MONË - Business Settings Utilities

import { logDatabaseFallback, prisma } from "@/lib/db";
import { unstable_cache } from "next/cache";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
export const BUSINESS_SETTINGS_CACHE_TAG = "business-settings";

/**
 * 定休日の曜日配列を取得する。
 * @returns 定休日の曜日インデックス配列 (0=日, 1=月, ..., 6=土)
 */
export const getClosedDays = unstable_cache(
  async (): Promise<number[]> => {
    if (!process.env.DATABASE_URL) {
      console.warn("[Business Settings] DATABASE_URL is not configured");
      return [1];
    }

    const setting = await prisma.settings.findUnique({
      where: { key: "closed_days" },
    });

    return setting ? JSON.parse(setting.value) : [1];
  },
  ["closed-days"],
  {
    tags: [BUSINESS_SETTINGS_CACHE_TAG],
    revalidate: 3600,
  }
);

/**
 * 定休日の表示テキストを取得する。
 */
export async function getClosedDaysText(): Promise<string> {
  try {
    const closedDays = await getClosedDays();

    if (closedDays.length === 0) {
      return "不定休";
    }

    const dayNames = closedDays.map((day) => WEEKDAYS[day]).join("・");
    return `毎週${dayNames}曜日（不定休あり）`;
  } catch (error) {
    logDatabaseFallback("Business Settings", error, "Monday closed-days fallback");
    return "毎週月曜日（不定休あり）";
  }
}

export async function getClosedDaysForPublicSeo(): Promise<number[]> {
  try {
    return await getClosedDays();
  } catch (error) {
    logDatabaseFallback("Business Settings", error, "Monday closed-days SEO fallback");
    return [1];
  }
}

/**
 * 定休日の曜日名配列を取得する。
 */
export async function getClosedDayNames(): Promise<string[]> {
  const closedDays = await getClosedDays();
  return closedDays.map((day) => WEEKDAYS[day]);
}
