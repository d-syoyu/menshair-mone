// Date helpers are standardized on JST calendar dates.
// DB columns declared as @db.Date are represented as UTC midnight Date objects.

export const JST_TIME_ZONE = "Asia/Tokyo";

export type DateParts = {
  year: number;
  month: number;
  day: number;
};

const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function parseDateParts(dateString: string): DateParts {
  const match = DATE_RE.exec(dateString);
  if (!match) {
    throw new Error(`Invalid date string: ${dateString}`);
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function datePartsToString({ year, month, day }: DateParts): string {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0"),
  ].join("-");
}

export function getJstDateParts(date = new Date()): DateParts {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const get = (type: "year" | "month" | "day") =>
    Number(parts.find((part) => part.type === type)?.value);

  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
  };
}

export function getJstDateString(date = new Date()): string {
  return datePartsToString(getJstDateParts(date));
}

export function getJstTimeString(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: JST_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}

export function jstDateStringToDbDate(dateString: string): Date {
  const { year, month, day } = parseDateParts(dateString);
  return new Date(Date.UTC(year, month - 1, day));
}

export function jstDateTimeStringToInstant(dateString: string, timeString: string): Date {
  const { year, month, day } = parseDateParts(dateString);
  const [hour, minute] = timeString.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 9, minute, 0, 0));
}

export function dbDateToJstDateString(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return [
    String(value.getUTCFullYear()).padStart(4, "0"),
    String(value.getUTCMonth() + 1).padStart(2, "0"),
    String(value.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

export function addDaysToDbDate(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function getJstTodayDbDate(date = new Date()): Date {
  return jstDateStringToDbDate(getJstDateString(date));
}

export function getJstMonthRange(year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  return { start, end };
}

export function getJstYearRange(year: number) {
  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));
  return { start, end };
}

export function getJstWeekRange(todayStart = getJstTodayDbDate()) {
  const weekStart = new Date(todayStart);
  const dayOfWeek = weekStart.getUTCDay();
  const daysToMonday = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
  weekStart.setUTCDate(weekStart.getUTCDate() + daysToMonday);

  const weekEnd = addDaysToDbDate(weekStart, 7);
  return { weekStart, weekEnd };
}

export function formatJstDate(date: Date | string, format: "slash" | "jp" | "input" = "input"): string {
  const dateString = typeof date === "string" && DATE_RE.test(date)
    ? date
    : getJstDateString(typeof date === "string" ? new Date(date) : date);
  const { year, month, day } = parseDateParts(dateString);

  if (format === "slash") {
    return `${month}/${day}`;
  }

  if (format === "jp") {
    const weekday = ["日", "月", "火", "水", "木", "金", "土"][
      jstDateStringToDbDate(dateString).getUTCDay()
    ];
    return `${year}年${month}月${day}日（${weekday}）`;
  }

  return dateString;
}

export function getJstWeekday(date: Date | string): number {
  const dateString = typeof date === "string" && DATE_RE.test(date)
    ? date
    : getJstDateString(typeof date === "string" ? new Date(date) : date);
  return jstDateStringToDbDate(dateString).getUTCDay();
}

// Backward-compatible names used by existing route handlers.
export const parseLocalDate = jstDateStringToDbDate;
export const parseLocalDateStart = jstDateStringToDbDate;
export const parseLocalDateEnd = jstDateStringToDbDate;
