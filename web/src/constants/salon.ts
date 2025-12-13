// constants/salon.ts
// Hair Salon White - 店舗情報

export const SALON_INFO = {
  name: "Hair Salon White",
  address: "大阪府茨木市中津町",
  phone: "070-5266-7994",
  hours: {
    open: "10:00",
    close: "20:00",
  },
  closedDay: 1, // 月曜日 (0=日, 1=月, ...)
  closedDayName: "月曜日",
} as const;

// エイリアス（APIで使用）
export const BUSINESS_HOURS = SALON_INFO.hours;
export const CLOSED_DAY = SALON_INFO.closedDay;

export const STAFF = {
  name: "大木美奈",
  role: "店長・オーナー",
  specialty: "縮毛矯正",
  image: "/white_staff.png",
} as const;
