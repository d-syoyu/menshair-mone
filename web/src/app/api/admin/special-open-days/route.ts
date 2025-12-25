// src/app/api/admin/special-open-days/route.ts
// MONË - Special Open Day Management API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { parseLocalDate } from "@/lib/date-utils";

// 時間形式のバリデーション
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// 特別営業日作成スキーマ
const createSpecialOpenDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません（例: 2024-01-15）"),
  startTime: z.string().regex(timeRegex, "開始時間の形式が正しくありません（例: 10:00）").optional(),
  endTime: z.string().regex(timeRegex, "終了時間の形式が正しくありません（例: 18:00）").optional(),
  reason: z.string().optional(),
}).refine(
  (data) => {
    // 両方指定されているか、両方未指定
    if ((data.startTime && !data.endTime) || (!data.startTime && data.endTime)) {
      return false;
    }
    return true;
  },
  { message: "開始時間と終了時間は両方指定するか、両方未指定にしてください" }
).refine(
  (data) => {
    // 時間が指定されている場合、開始時間 < 終了時間
    if (data.startTime && data.endTime) {
      return data.startTime < data.endTime;
    }
    return true;
  },
  { message: "終了時間は開始時間より後にしてください" }
);

// GET /api/admin/special-open-days - 特別営業日一覧取得
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

    const specialOpenDays = await prisma.specialOpenDay.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json(specialOpenDays);
  } catch (error) {
    console.error("Get special open days error:", error);
    const errorMessage = error instanceof Error ? error.message : "特別営業日の取得に失敗しました";
    return NextResponse.json(
      { error: "特別営業日の取得に失敗しました", details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/admin/special-open-days - 特別営業日作成
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const body = await request.json();
    const validationResult = createSpecialOpenDaySchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { date, startTime, endTime, reason } = validationResult.data;
    // タイムゾーン問題を避けるため、共通ユーティリティを使用
    const specialDate = parseLocalDate(date);

    // 既存チェック（同じ日付・時間帯の組み合わせ）
    const existingSpecialOpenDay = await prisma.specialOpenDay.findFirst({
      where: {
        date: specialDate,
        startTime: startTime || null,
        endTime: endTime || null,
      },
    });

    if (existingSpecialOpenDay) {
      return NextResponse.json(
        { error: "この日付・時間帯は既に特別営業日として登録されています" },
        { status: 409 }
      );
    }

    const specialOpenDay = await prisma.specialOpenDay.create({
      data: {
        date: specialDate,
        startTime: startTime || null,
        endTime: endTime || null,
        reason: reason || null,
      },
    });

    return NextResponse.json(specialOpenDay, { status: 201 });
  } catch (error) {
    console.error("Create special open day error:", error);
    const errorMessage = error instanceof Error ? error.message : "特別営業日の作成に失敗しました";
    return NextResponse.json(
      { error: "特別営業日の作成に失敗しました", details: errorMessage },
      { status: 500 }
    );
  }
}
