import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getJstMonthRange, getJstYearRange, parseLocalDate } from "@/lib/date-utils";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createSpecialOpenDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません"),
  startTime: z.string().regex(timeRegex, "開始時刻の形式が正しくありません").optional(),
  endTime: z.string().regex(timeRegex, "終了時刻の形式が正しくありません").optional(),
  reason: z.string().optional(),
}).refine(
  (data) => !((data.startTime && !data.endTime) || (!data.startTime && data.endTime)),
  { message: "開始時刻と終了時刻は両方を指定してください" }
).refine(
  (data) => {
    if (data.startTime && data.endTime) {
      return data.startTime < data.endTime;
    }
    return true;
  },
  { message: "終了時刻は開始時刻より後にしてください" }
);

async function requireAdmin() {
  const session = await auth();
  return !!session?.user && session.user.role === "ADMIN";
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const range = year
      ? month
        ? getJstMonthRange(Number(year), Number(month))
        : getJstYearRange(Number(year))
      : null;

    const specialOpenDays = await prisma.specialOpenDay.findMany({
      where: range ? { date: { gte: range.start, lt: range.end } } : {},
      orderBy: { date: "asc" },
    });

    return NextResponse.json(specialOpenDays);
  } catch (error) {
    console.error("Get special open days error:", error);
    return NextResponse.json(
      { error: "特別営業日の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const validationResult = createSpecialOpenDaySchema.safeParse(await request.json());
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { date, startTime, endTime, reason } = validationResult.data;
    const specialDate = parseLocalDate(date);

    const existingSpecialOpenDay = await prisma.specialOpenDay.findFirst({
      where: {
        date: specialDate,
        startTime: startTime || null,
        endTime: endTime || null,
      },
    });

    if (existingSpecialOpenDay) {
      return NextResponse.json(
        { error: "この日付と時間帯は既に特別営業日として登録されています" },
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
    return NextResponse.json(
      { error: "特別営業日の作成に失敗しました" },
      { status: 500 }
    );
  }
}
