import { Suspense } from "react";
import { ReservationStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireAdminUser } from "@/lib/admin-auth";
import {
  addDaysToDbDate,
  formatJstDate,
  getJstTodayDbDate,
  getJstWeekRange,
} from "@/lib/date-utils";
import { AdminPageSkeleton } from "@/components/admin/AdminPageSkeleton";
import DashboardClient, {
  type Holiday,
  type Reservation,
  type Stats,
} from "./DashboardClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "管理画面" };

function getTodayRange() {
  const now = new Date();
  const start = getJstTodayDbDate(now);
  const end = addDaysToDbDate(start, 1);
  return { now, start, end };
}

function getWeekRange(todayStart: Date) {
  const { weekStart, weekEnd } = getJstWeekRange(todayStart);
  const weekEndLabel = addDaysToDbDate(weekEnd, -1);

  return {
    weekStart,
    weekEnd,
    weekStartStr: formatJstDate(weekStart, "slash"),
    weekEndStr: formatJstDate(weekEndLabel, "slash"),
  };
}

async function DashboardContent() {
  const admin = await requireAdminUser();
  const { start: todayStart, end: tomorrowStart } = getTodayRange();
  const { weekStart, weekEnd, weekStartStr, weekEndStr } = getWeekRange(todayStart);

  const activeWhere = { status: { not: ReservationStatus.CANCELLED } };

  const [
    rawReservations,
    todayCount,
    weekCount,
    totalReservations,
    rawHolidays,
  ] = await Promise.all([
    prisma.reservation.findMany({
      where: {
        date: { gte: todayStart, lt: tomorrowStart },
        status: ReservationStatus.CONFIRMED,
      },
      select: {
        id: true,
        totalPrice: true,
        totalDuration: true,
        menuSummary: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        items: {
          select: {
            id: true,
            menuId: true,
            menuName: true,
            category: true,
            price: true,
            duration: true,
            orderIndex: true,
          },
          orderBy: { orderIndex: "asc" },
        },
      },
      orderBy: { startTime: "asc" },
    }),
    prisma.reservation.count({
      where: {
        ...activeWhere,
        date: { gte: todayStart, lt: tomorrowStart },
      },
    }),
    prisma.reservation.count({
      where: {
        ...activeWhere,
        date: { gte: weekStart, lt: weekEnd },
      },
    }),
    prisma.reservation.count({ where: activeWhere }),
    prisma.holiday.findMany({
      where: {
        date: { gte: todayStart, lt: tomorrowStart },
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        reason: true,
      },
      orderBy: { date: "asc" },
    }),
  ]);

  const reservations: Reservation[] = rawReservations.map((reservation) => ({
    ...reservation,
    date: reservation.date.toISOString(),
  }));

  const todayHolidays: Holiday[] = rawHolidays.map((holiday) => ({
    ...holiday,
    date: holiday.date.toISOString(),
  }));

  const stats: Stats = {
    todayCount,
    weekCount,
    totalReservations,
    weekStartStr,
    weekEndStr,
  };

  return (
    <DashboardClient
      initialReservations={reservations}
      stats={stats}
      todayHolidays={todayHolidays}
      adminEmail={admin.email}
    />
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<AdminPageSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
