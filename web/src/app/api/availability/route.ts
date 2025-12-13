// src/app/api/availability/route.ts
// Hair Salon White - Availability API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { MENU_ITEMS, calculateMenuTotals } from "@/constants/menu";
import { BUSINESS_HOURS, CLOSED_DAY } from "@/constants/salon";
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

    // 定休日チェック
    if (dayOfWeek === CLOSED_DAY) {
      return NextResponse.json<AvailabilityResponse>({
        date: dateStr,
        dayOfWeek,
        isClosed: true,
        slots: [],
      });
    }

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
    let earliestLastBookingTime: string = BUSINESS_HOURS.close;

    if (menuIdsParam) {
      const menuIds = menuIdsParam.split(",").filter(Boolean);

      // 全メニューが存在するか確認
      const invalidMenuId = menuIds.find(id => !MENU_ITEMS.find(m => m.id === id));
      if (invalidMenuId) {
        return NextResponse.json(
          { error: `指定されたメニューが見つかりません: ${invalidMenuId}` },
          { status: 400 }
        );
      }

      // 合計計算
      const totals = calculateMenuTotals(menuIds);
      totalDuration = totals.totalDuration;
      totalPrice = totals.totalPrice;
      earliestLastBookingTime = totals.earliestLastBookingTime;
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

    const slots: TimeSlot[] = allSlots
      .filter((slot) => {
        // 最終受付時間を超えている場合は除外
        if (slot >= earliestLastBookingTime) {
          return false;
        }
        return true;
      })
      .map((slotTime) => {
        // 今日の場合、過去の時間は除外
        if (isToday) {
          const [hours, minutes] = slotTime.split(":").map(Number);
          const slotDate = new Date(date);
          slotDate.setHours(hours, minutes, 0, 0);
          if (slotDate <= now) {
            return { time: slotTime, available: false };
          }
        }

        // 予約時間の終了時刻を計算
        const [startHours, startMinutes] = slotTime.split(":").map(Number);
        const endMinutes = startHours * 60 + startMinutes + totalDuration;
        const endHours = Math.floor(endMinutes / 60);
        const endMins = endMinutes % 60;
        const endTime = `${endHours.toString().padStart(2, "0")}:${endMins.toString().padStart(2, "0")}`;

        // 営業時間外チェック
        if (endTime > BUSINESS_HOURS.close) {
          return { time: slotTime, available: false };
        }

        // 既存予約との重複チェック
        const hasConflict = existingReservations.some((reservation) => {
          const resStart = reservation.startTime;
          const resEnd = reservation.endTime;

          // 重複判定: 新予約の開始 < 既存の終了 && 新予約の終了 > 既存の開始
          return slotTime < resEnd && endTime > resStart;
        });

        return { time: slotTime, available: !hasConflict };
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
