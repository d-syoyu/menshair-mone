// src/app/api/availability/route.ts
// MONË - Availability API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getBusinessHours } from "@/constants/salon";
import {
  generateTimeSlots,
  isWithinBookingWindow,
} from "@/constants/booking";

interface TimeSlot {
  time: string;
  available: boolean;
}

interface AvailabilityResponse {
  date: string;
  dayOfWeek: number;
  isClosed: boolean;
  slots: TimeSlot[];
  totalDuration?: number;
  totalPrice?: number;
}

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
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const specialOpenDay = await prisma.specialOpenDay.findFirst({
    where: { date: targetDate },
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
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: "日付の形式が正しくありません" },
        { status: 400 }
      );
    }

    const dayOfWeek = date.getDay();

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
    const holidayDate = new Date(dateStr);
    holidayDate.setHours(0, 0, 0, 0);
    const holidays = await prisma.holiday.findMany({
      where: { date: holidayDate },
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
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const existingReservations = await prisma.reservation.findMany({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: "CONFIRMED",
      },
      select: {
        startTime: true,
        endTime: true,
        totalDuration: true,
      },
    });

    // タイムスロット生成
    const allSlots = generateTimeSlots();

    // 現在時刻チェック用
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    // 開店時間以降のスロットのみをフィルタリング
    const filteredSlots = allSlots.filter((slotTime) => slotTime >= businessHours.open);

    const slots: TimeSlot[] = filteredSlots.map((slotTime) => {
        // 1. 最終受付時間チェック（最優先）
        //    営業時間の最終受付時間（平日20:00、土日祝19:30）を超えていたら予約不可
        if (slotTime > earliestLastBookingTime) {
          return { time: slotTime, available: false };
        }

        // 2. 今日の場合、過去の時間は除外
        if (isToday) {
          const [hours, minutes] = slotTime.split(":").map(Number);
          const slotDate = new Date(date);
          slotDate.setHours(hours, minutes, 0, 0);
          if (slotDate <= now) {
            return { time: slotTime, available: false };
          }
        }

        // 3. 施術終了時間を計算
        const [startHours, startMinutes] = slotTime.split(":").map(Number);
        const endMinutes = startHours * 60 + startMinutes + totalDuration;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;

        // 4. 施術終了が閉店時間を超える場合は予約不可
        //    最終受付時間内でも、施術が閉店までに終わらない場合は選択不可
        if (endTime > businessHours.close) {
          return { time: slotTime, available: false };
        }

        // 既存予約との重複チェック
        const hasConflict = existingReservations.some((reservation) => {
          const resStart = reservation.startTime;
          const resEnd = reservation.endTime;

          // 重複判定: 新予約の開始 < 既存の終了 && 新予約の終了 > 既存の開始
          return slotTime < resEnd && endTime > resStart;
        });

        // 時間帯休業との重複チェック
        const hasHolidayConflict = timeRangeHolidays.some((holiday) => {
          const holidayStart = holiday.startTime!;
          const holidayEnd = holiday.endTime!;

          // 重複判定: 新予約の開始 < 休業終了 && 新予約の終了 > 休業開始
          return slotTime < holidayEnd && endTime > holidayStart;
        });

        return { time: slotTime, available: !hasConflict && !hasHolidayConflict };
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
