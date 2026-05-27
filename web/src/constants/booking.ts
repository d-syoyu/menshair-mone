// constants/booking.ts
// MONË - 予約システム設定

import {
  addDaysToDbDate,
  dbDateToJstDateString,
  getJstDateString,
  getJstTodayDbDate,
  getJstWeekday,
  jstDateTimeStringToInstant,
} from "@/lib/date-utils";

export const BOOKING_CONFIG = {
  // 営業時間（最大値。実際の営業時間は曜日により異なる）
  openTime: "09:00", // 土日祝の開店時間（平日は10:00）
  closeTime: "21:00", // 平日の閉店時間（土日祝は20:30）

  // 予約枠
  slotInterval: 10, // 10分刻み
  maxConcurrentBookings: 1, // 同時予約上限（1人営業）

  // キャンセルポリシー
  cancelDeadline: {
    daysBefore: 1, // 前日
    time: "19:00", // 19時まで
  },

  // 定休日
  closedDayOfWeek: 1, // 月曜日 (0=日, 1=月, ...)

  // 予約可能期間
  bookingAdvanceDays: 90, // 90日先まで予約可能
} as const;

// 時間スロットを生成
export const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  const [openHour, openMinute] = BOOKING_CONFIG.openTime.split(":").map(Number);
  const [closeHour, closeMinute] = BOOKING_CONFIG.closeTime.split(":").map(Number);

  let currentHour = openHour;
  let currentMinute = openMinute;

  while (
    currentHour < closeHour ||
    (currentHour === closeHour && currentMinute < closeMinute)
  ) {
    const timeString = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
    slots.push(timeString);

    currentMinute += BOOKING_CONFIG.slotInterval;
    if (currentMinute >= 60) {
      currentMinute = 0;
      currentHour++;
    }
  }

  return slots;
};

// 時間文字列を分に変換
export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

// 分を時間文字列に変換
export const minutesToTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
};

// 終了時間を計算
export const calculateEndTime = (startTime: string, durationMinutes: number): string => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + durationMinutes;
  return minutesToTime(endMinutes);
};

// 月曜日かどうかをチェック
export const isClosedDay = (date: Date): boolean => {
  return getJstWeekday(date) === BOOKING_CONFIG.closedDayOfWeek;
};

// キャンセル可能かどうかをチェック
export const canCancel = (reservationDate: Date): boolean => {
  const now = new Date();
  const deadlineDate = addDaysToDbDate(
    reservationDate,
    -BOOKING_CONFIG.cancelDeadline.daysBefore
  );
  const deadline = jstDateTimeStringToInstant(
    dbDateToJstDateString(deadlineDate),
    BOOKING_CONFIG.cancelDeadline.time
  );

  return now < deadline;
};

// 予約可能日かどうかをチェック
export const isBookableDate = (date: Date): boolean => {
  const today = getJstTodayDbDate();
  const todayString = dbDateToJstDateString(today);
  const targetDateString = getJstDateString(date);

  // 過去日はNG
  if (targetDateString < todayString) return false;

  // 定休日はNG
  if (isClosedDay(date)) return false;

  // 予約可能期間を超えていたらNG
  const maxDate = new Date(today);
  maxDate.setUTCDate(maxDate.getUTCDate() + BOOKING_CONFIG.bookingAdvanceDays);
  if (targetDateString > dbDateToJstDateString(maxDate)) return false;

  return true;
};

// 時間スロットの生成（予め生成）
export const TIME_SLOTS = generateTimeSlots();

// エイリアス（APIで使用）
export const isWithinBookingWindow = isBookableDate;
export const canCancelReservation = canCancel;
