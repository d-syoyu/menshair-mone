// constants/salon.ts
// Hair Salon White - 店舗情報

import HolidayJp from '@holiday-jp/holiday_jp';

export const SALON_INFO = {
  name: "Hair Salon White",
  address: "大阪府茨木市中津町",
  phone: "070-5266-7994",
  hours: {
    open: "10:00",
    // 平日（火〜金）: 最終受付 20:00、閉店 21:00
    weekday: {
      lastBooking: "20:00",
      close: "21:00",
    },
    // 土日祝: 最終受付 19:30、閉店 20:30
    weekend: {
      lastBooking: "19:30",
      close: "20:30",
    },
  },
  closedDay: 1, // 月曜日 (0=日, 1=月, ...)
  closedDayName: "月曜日",
} as const;

// 曜日が土日または祝日かどうかを判定
export const isWeekendOrHoliday = (date: Date): boolean => {
  const dayOfWeek = date.getDay();
  // 土日チェック
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return true;
  }
  // 祝日チェック
  return HolidayJp.isHoliday(date);
};

// 日付に応じた営業時間を取得
export const getBusinessHours = (date: Date) => {
  return isWeekendOrHoliday(date) ? SALON_INFO.hours.weekend : SALON_INFO.hours.weekday;
};

// 後方互換性のため（廃止予定）
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
  name: "大木美奈",
  role: "店長・オーナー",
  specialty: "縮毛矯正",
  image: "/white_staff.png",
} as const;
