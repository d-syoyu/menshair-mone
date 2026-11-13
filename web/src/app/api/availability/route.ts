// src/app/api/availability/route.ts
// MONË - Availability API

import { after, NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getBusinessHours } from "@/constants/salon";
import { isWithinBookingWindow } from "@/constants/booking";
import { computeDaySlots, type TimeSlot } from "@/lib/availability";
import {
  addDaysToDbDate,
  getJstDateString,
  getJstTimeString,
  getJstWeekday,
  parseLocalDate,
} from "@/lib/date-utils";
import { getSbOccupancy, sbHubEnabled, sendSbReadDemand } from "@/lib/sb-hub";

interface AvailabilityResponse {
  date: string;
  dayOfWeek: number;
  isClosed: boolean;
  slots: TimeSlot[];
  totalDuration?: number;
  totalPrice?: number;
  sbNotice?: string;
}

const SB_UNKNOWN_NOTICE = "この日の空き状況を確認しています。少し時間をおいてから、もう一度お選びください。お急ぎの場合はお店にご連絡ください";

// 定休日をデータベースから取得するヘルパー関数
async function getClosedDays(): Promise<number[]> {
  const setting = await prisma.settings.findUnique({
    where: { key: "closed_days" },
  });
  // デフォルトは月曜日
  return setting ? JSON.parse(setting.value) : [1];
}

// 特別営業日かどうかをチェックするヘルパー関数
async function isSpecialOpenDay(date: Date): Promise<boolean> {
  const specialOpenDay = await prisma.specialOpenDay.findFirst({
    where: { date },
  });

  return !!specialOpenDay;
}

// GET /api/availability?date=2024-01-15&menuIds=cut,color-short
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const dateStr = searchParams.get("date");
    const menuIdsParam = searchParams.get("menuIds");

    if (!dateStr) {
      return NextResponse.json(
        { error: "日付を指定してください" },
        { status: 400 }
      );
    }

    // 日付をパース
    const date = parseLocalDate(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "日付の形式が正しくありません" },
        { status: 400 }
      );
    }

    const dayOfWeek = getJstWeekday(date);

    // 定休日チェック（データベースから取得）
    const closedDays = await getClosedDays();
    const isClosedDay = closedDays.includes(dayOfWeek);

    // 定休日の場合でも、特別営業日なら営業
    if (isClosedDay) {
      const isSpecialOpen = await isSpecialOpenDay(date);
      if (!isSpecialOpen) {
        return NextResponse.json<AvailabilityResponse>({
          date: dateStr,
          dayOfWeek,
          isClosed: true,
          slots: [],
        });
      }
    }

    // 不定休チェック（全日休業と時間帯休業を区別）
    const holidays = await prisma.holiday.findMany({
      where: { date },
    });

    // 全日休業（startTimeとendTimeがnull）がある場合は完全に休業
    const hasAllDayHoliday = holidays.some(h => !h.startTime && !h.endTime);
    if (hasAllDayHoliday) {
      return NextResponse.json<AvailabilityResponse>({
        date: dateStr,
        dayOfWeek,
        isClosed: true,
        slots: [],
      });
    }

    // 時間帯休業のリスト（startTimeとendTimeが両方あるもの）
    const timeRangeHolidays = holidays.filter(h => h.startTime && h.endTime);

    // 予約可能期間チェック
    if (!isWithinBookingWindow(date)) {
      return NextResponse.json<AvailabilityResponse>({
        date: dateStr,
        dayOfWeek,
        isClosed: false,
        slots: [],
      });
    }

    // メニュー情報取得（複数対応）
    let totalDuration = 60;
    let totalPrice = 0;

    // 日付に応じた営業時間を取得（土日祝は19:30まで、平日は20:00まで）
    const businessHours = getBusinessHours(date);

    // 最終受付時間の初期値は曜日別の最終受付時間
    let earliestLastBookingTime: string = businessHours.lastBooking;

    if (menuIdsParam) {
      const menuIds = menuIdsParam.split(",").filter(Boolean);

      // DBからメニュー取得（UUID配列で検索）
      const menus = await prisma.menu.findMany({
        where: {
          id: { in: menuIds },
          isActive: true,
        },
        select: {
          id: true,
          price: true,
          duration: true,
          lastBookingTime: true,
        },
      });

      // 全メニューが存在するか確認
      if (menus.length !== menuIds.length) {
        const foundIds = new Set(menus.map(m => m.id));
        const invalidMenuId = menuIds.find(id => !foundIds.has(id));
        return NextResponse.json(
          { error: `指定されたメニューが見つかりません: ${invalidMenuId}` },
          { status: 400 }
        );
      }

      // 合計計算（DBメニューから直接）
      totalDuration = menus.reduce((sum, menu) => sum + menu.duration, 0);
      totalPrice = menus.reduce((sum, menu) => sum + menu.price, 0);

      // 最終受付時間 = 営業時間の最終受付時間のみ使用
      // ※メニューの lastBookingTime は使用しない（施術終了が閉店時間を超えるかは別途チェック）
      earliestLastBookingTime = businessHours.lastBooking;
    }

    // その日の予約を取得
    const startOfDay = date;
    const endOfDay = addDaysToDbDate(startOfDay, 1);

    const existingReservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: startOfDay,
          lt: endOfDay,
        },
        status: "CONFIRMED",
      },
      select: {
        startTime: true,
        endTime: true,
        totalDuration: true,
      },
    });

    // SB連携：SB側の占有を重ねる。分からない日は予約を受けない（設計 3-2-1・5-3）。
    let sbDay: Awaited<ReturnType<typeof getSbOccupancy>> = null;
    if (sbHubEnabled()) {
      // お客様が日付を選んだ時だけ、SOGAにその日を優先して読み直してもらう（答えは待たない）。
      if (searchParams.get("demand") === "1") after(() => sendSbReadDemand(dateStr));
      sbDay = await getSbOccupancy(dateStr);
      if (!sbDay || !sbDay.open) {
        return NextResponse.json<AvailabilityResponse>({
          date: dateStr,
          dayOfWeek,
          isClosed: false,
          slots: [],
          totalDuration,
          totalPrice,
          sbNotice: SB_UNKNOWN_NOTICE,
        });
      }
    }

    const now = new Date();
    const slots = computeDaySlots({
      businessHours: { ...businessHours, lastBooking: earliestLastBookingTime },
      totalDuration,
      reservations: existingReservations,
      timeRangeHolidays: timeRangeHolidays.map((h) => ({ startTime: h.startTime!, endTime: h.endTime! })),
      sbDay,
      nowTime: dateStr === getJstDateString(now) ? getJstTimeString(now) : null,
    });

    return NextResponse.json<AvailabilityResponse>({
      date: dateStr,
      dayOfWeek,
      isClosed: false,
      slots,
      totalDuration,
      totalPrice,
    });
  } catch (error) {
    console.error("Availability API error:", error);
    return NextResponse.json(
      { error: "空き状況の取得に失敗しました" },
      { status: 500 }
    );
  }
}
