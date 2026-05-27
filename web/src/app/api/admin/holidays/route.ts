import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getJstMonthRange, getJstYearRange, parseLocalDate } from "@/lib/date-utils";

const createHolidaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  reason: z.string().optional(),
}).refine(
  (data) => {
    if ((data.startTime && !data.endTime) || (!data.startTime && data.endTime)) {
      return false;
    }
    if (data.startTime && data.endTime) {
      return data.startTime < data.endTime;
    }
    return true;
  },
  { message: "時間帯は開始時刻と終了時刻の両方を指定してください" }
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

    const where = year
      ? {
          date: {
            gte: month
              ? getJstMonthRange(Number(year), Number(month)).start
              : getJstYearRange(Number(year)).start,
            lt: month
              ? getJstMonthRange(Number(year), Number(month)).end
              : getJstYearRange(Number(year)).end,
          },
        }
      : {};

    const holidays = await prisma.holiday.findMany({
      where,
      orderBy: { date: "asc" },
    });

    return NextResponse.json(holidays);
  } catch (error) {
    console.error("Get holidays error:", error);
    return NextResponse.json(
      { error: "休業日の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const validationResult = createHolidaySchema.safeParse(await request.json());
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { date, startTime, endTime, reason } = validationResult.data;
    const holidayDate = parseLocalDate(date);

    const existingHoliday = await prisma.holiday.findFirst({
      where: {
        date: holidayDate,
        startTime: startTime || null,
        endTime: endTime || null,
      },
    });

    if (existingHoliday) {
      return NextResponse.json(
        { error: "この日付と時間帯は既に休業日として登録されています" },
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
    return NextResponse.json(
      { error: "休業日の作成に失敗しました" },
      { status: 500 }
    );
  }
}
