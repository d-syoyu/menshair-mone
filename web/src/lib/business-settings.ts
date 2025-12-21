// src/lib/business-settings.ts
// MONË - Business Settings Utilities

import { prisma } from "@/lib/db";

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

/**
 * 定休日の曜日配列を取得
 * @returns 定休日の曜日インデックス配列 (0=日, 1=月, ..., 6=土)
 */
export async function getClosedDays(): Promise<number[]> {
  const setting = await prisma.settings.findUnique({
    where: { key: "closed_days" },
  });
  return setting ? JSON.parse(setting.value) : [1]; // デフォルトは月曜日
}

/**
 * 定休日の表示テキストを取得
 * @returns "毎週月曜日（不定休あり）" のような形式
 */
export async function getClosedDaysText(): Promise<string> {
  const closedDays = await getClosedDays();

  if (closedDays.length === 0) {
    return "不定休";
  }

  const dayNames = closedDays.map(d => WEEKDAYS[d]).join('・');
  return `毎週${dayNames}曜日（不定休あり）`;
}

/**
 * 定休日の曜日名配列を取得
 * @returns ["月", "火"] のような形式
 */
export async function getClosedDayNames(): Promise<string[]> {
  const closedDays = await getClosedDays();
  return closedDays.map(d => WEEKDAYS[d]);
}
