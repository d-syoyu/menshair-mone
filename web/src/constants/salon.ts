// constants/salon.ts
// MONË / Men's hair MONE - 店舗情報

import HolidayJp from "@holiday-jp/holiday_jp";

export const SALON_INFO = {
  name: "MONË / Men's hair MONE",
  address: "〒570-0036 大阪府守口市八雲中町1-24-1",
  phone: "06-6908-4859",
  hours: {
    open: "10:00",
    // 平日（火〜金） 最終受付20:00 / クローズ21:00
    weekday: {
      lastBooking: "20:00",
      close: "21:00",
    },
    // 土日祝 最終受付19:30 / クローズ20:30
    weekend: {
      lastBooking: "19:30",
      close: "20:30",
    },
  },
  closedDay: 1, // 月曜日 (0=日, 1=月 ...)
  closedDayName: "月曜日",
} as const;

// 曜日が土日または祝日かを判定
export const isWeekendOrHoliday = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }
  return HolidayJp.isHoliday(date);
};

// 日付に応じた営業時間を取得
export const getBusinessHours = (date: Date) => {
  return isWeekendOrHoliday(date)
    ? SALON_INFO.hours.weekend
    : SALON_INFO.hours.weekday;
};

// 後方互換性のために残す
export const isWeekend = (dayOfWeek: number): boolean => {
  return dayOfWeek === 0 || dayOfWeek === 6;
};

// 後方互換性のため
export const BUSINESS_HOURS = {
  open: SALON_INFO.hours.open,
  close: SALON_INFO.hours.weekday.close,
};
export const CLOSED_DAY = SALON_INFO.closedDay;

export const STAFF = {
  name: "大木美帆",
  role: "店長・オーナー",
  specialty: "縮毛矯正",
  image: "/white_staff.png",
} as const;
