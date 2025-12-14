// src/app/api/admin/holidays/route.ts
// MONË - Holiday Management API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { parseLocalDate } from "@/lib/date-utils";

// 不定休作成スキーマ
const createHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません（例: 2024-01-15）"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(), // "10:00" 形式、nullの場合は全日休業
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(), // "18:00" 形式、nullの場合は全日休業
  reason: z.string().optional(),
}).refine(
  (data) => {
    // startTimeとendTimeは両方指定するか、両方未指定
    if ((data.startTime && !data.endTime) || (!data.startTime && data.endTime)) {
      return false;
    }
    // startTimeとendTimeが両方指定されている場合、startTime < endTime
    if (data.startTime && data.endTime) {
      return data.startTime < data.endTime;
    }
    return true;
  },
  {
    message: "時間帯は開始時間と終了時間の両方を指定し、開始時間は終了時間より前にしてください",
  }
);

// GET /api/admin/holidays - 不定休一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    let where = {};

    // 年月でフィルタリング
    if (year && month) {
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      endDate.setHours(23, 59, 59, 999);

      where = {
        date: {
          gte: startDate,
          lte: endDate,
        },
      };
    } else if (year) {
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

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error("Get holidays error:", error);
    const errorMessage = error instanceof Error ? error.message : "不定休の取得に失敗しました";
    return NextResponse.json(
      { error: "不定休の取得に失敗しました", details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/admin/holidays - 不定休作成
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = createHolidaySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { date, startTime, endTime, reason } = validationResult.data;
    // タイムゾーン問題を避けるため、共通ユーティリティを使用
    const holidayDate = parseLocalDate(date);

    // 既存チェック（同じ日付・時間帯の組み合わせ）
    const existingHoliday = await prisma.holiday.findFirst({
      where: {
        date: holidayDate,
        startTime: startTime || null,
        endTime: endTime || null,
      },
    });

    if (existingHoliday) {
      return NextResponse.json(
        { error: "この日付・時間帯は既に不定休として登録されています" },
        { status: 409 }
      );
    }

    const holiday = await prisma.holiday.create({
      data: {
        date: holidayDate,
        startTime: startTime || null,
        endTime: endTime || null,
        reason: reason || null,
      },
    });

    return NextResponse.json(holiday, { status: 201 });
  } catch (error) {
    console.error("Create holiday error:", error);
    const errorMessage = error instanceof Error ? error.message : "不定休の作成に失敗しました";
    return NextResponse.json(
      { error: "不定休の作成に失敗しました", details: errorMessage },
      { status: 500 }
    );
  }
}
