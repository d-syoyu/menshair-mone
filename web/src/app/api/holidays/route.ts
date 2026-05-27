import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { dbDateToJstDateString, getJstMonthRange, getJstYearRange } from "@/lib/date-utils";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const year = searchParams.get("year");
    const month = searchParams.get("month");

    if (!year) {
      return NextResponse.json({ error: "年を指定してください" }, { status: 400 });
    }

    const range = month
      ? getJstMonthRange(Number(year), Number(month))
      : getJstYearRange(Number(year));
    const where = { date: { gte: range.start, lt: range.end } };

    const [holidays, closedDaysSetting, specialOpenDays] = await Promise.all([
      prisma.holiday.findMany({
        where,
        select: {
          date: true,
          startTime: true,
          endTime: true,
        },
        orderBy: { date: "asc" },
      }),
      prisma.settings.findUnique({
        where: { key: "closed_days" },
      }),
      prisma.specialOpenDay.findMany({
        where,
        select: {
          date: true,
        },
        orderBy: { date: "asc" },
      }),
    ]);

    const closedDays: number[] = closedDaysSetting
      ? JSON.parse(closedDaysSetting.value)
      : [1];

    return NextResponse.json({
      holidays: holidays.map((holiday) => ({
        date: dbDateToJstDateString(holiday.date),
        startTime: holiday.startTime,
        endTime: holiday.endTime,
      })),
      closedDays,
      specialOpenDays: specialOpenDays.map((day) => dbDateToJstDateString(day.date)),
    });
  } catch (error) {
    console.error("Get holidays error:", error);
    return NextResponse.json(
      { error: "休業日の取得に失敗しました" },
      { status: 500 }
    );
  }
}
