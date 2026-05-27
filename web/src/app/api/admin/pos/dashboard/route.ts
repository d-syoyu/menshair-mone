import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";
import { addDaysToDbDate, getJstMonthRange, getJstTodayDbDate, getJstWeekRange } from "@/lib/date-utils";

function getRanges() {
  const todayStart = getJstTodayDbDate();
  const tomorrowStart = addDaysToDbDate(todayStart, 1);
  const { weekStart } = getJstWeekRange(todayStart);
  const { start: monthStart } = getJstMonthRange(
    todayStart.getUTCFullYear(),
    todayStart.getUTCMonth() + 1
  );

  return { todayStart, tomorrowStart, weekStart, monthStart };
}

export async function GET() {
  const { error } = await checkAdminAuth();
  if (error) return error;

  try {
    const { todayStart, tomorrowStart, weekStart, monthStart } = getRanges();

    const [todayAggregate, weekAggregate, monthAggregate, todaySales] = await Promise.all([
      prisma.sale.aggregate({
        where: { saleDate: { gte: todayStart, lt: tomorrowStart } },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.sale.aggregate({
        where: { saleDate: { gte: weekStart } },
        _sum: { totalAmount: true },
      }),
      prisma.sale.aggregate({
        where: { saleDate: { gte: monthStart } },
        _sum: { totalAmount: true },
      }),
      prisma.sale.findMany({
        where: { saleDate: { gte: todayStart, lt: tomorrowStart } },
        select: {
          id: true,
          saleNumber: true,
          customerName: true,
          saleDate: true,
          saleTime: true,
          totalAmount: true,
          paymentMethod: true,
          user: { select: { name: true } },
          items: {
            select: {
              itemType: true,
              menuName: true,
              productName: true,
              quantity: true,
            },
            orderBy: { orderIndex: "asc" },
          },
        },
        orderBy: [{ saleDate: "desc" }, { saleTime: "desc" }],
        take: 10,
      }),
    ]);

    return NextResponse.json({
      todaySales,
      stats: {
        todaySales: todayAggregate._sum.totalAmount ?? 0,
        todayCount: todayAggregate._count._all,
        weekSales: weekAggregate._sum.totalAmount ?? 0,
        monthSales: monthAggregate._sum.totalAmount ?? 0,
      },
    });
  } catch (err) {
    console.error("Admin POS dashboard error:", err);
    return NextResponse.json(
      { error: "POSダッシュボードの取得に失敗しました" },
      { status: 500 }
    );
  }
}
