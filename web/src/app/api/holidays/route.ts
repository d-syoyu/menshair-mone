// src/app/api/holidays/route.ts
// MONË - Public Holiday API (for booking page)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/holidays?year=2025&month=12 - 公開用不定休・定休日・特別営業日一覧
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (!year) {
      return NextResponse.json(
        { error: "年を指定してください" },
        { status: 400 }
      );
    }

    let where = {};

    if (month) {
      // 特定の月
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      endDate.setHours(23, 59, 59, 999);

      where = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    } else {
      // 年全体
      const startDate = new Date(parseInt(year), 0, 1);
      const endDate = new Date(parseInt(year), 11, 31);
      endDate.setHours(23, 59, 59, 999);

      where = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    // 不定休を取得
    const holidays = await prisma.holiday.findMany({
      where,
      select: {
        date: true,
        startTime: true,
        endTime: true,
      },
      orderBy: { date: "asc" },
    });

    // 定休日設定を取得
    const closedDaysSetting = await prisma.settings.findUnique({
      where: { key: "closed_days" },
    });
    const closedDays: number[] = closedDaysSetting
      ? JSON.parse(closedDaysSetting.value)
      : [1]; // デフォルトは月曜日

    // 特別営業日を取得
    const specialOpenDays = await prisma.specialOpenDay.findMany({
      where,
      select: {
        date: true,
      },
      orderBy: { date: "asc" },
    });

    // 日付と時間帯情報を返す
    const holidayResult = holidays.map((h) => {
      const d = new Date(h.date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return {
        date: `${y}-${m}-${day}`,
        startTime: h.startTime,
        endTime: h.endTime,
      };
    });

    const specialOpenDaysResult = specialOpenDays.map((s) => {
      const d = new Date(s.date);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    });

    return NextResponse.json({
      holidays: holidayResult,
      closedDays,
      specialOpenDays: specialOpenDaysResult,
    });
  } catch (error) {
    console.error("Get holidays error:", error);
    return NextResponse.json(
      { error: "不定休の取得に失敗しました" },
      { status: 500 }
    );
  }
}
