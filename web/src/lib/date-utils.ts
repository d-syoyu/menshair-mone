// src/lib/date-utils.ts
// 日付関連のユーティリティ関数

/**
 * YYYY-MM-DD形式の日付文字列をローカルタイムゾーンのDateオブジェクトに変換
 * タイムゾーンのずれを防ぐため、正午（12:00）に設定
 *
 * @param dateString - "2025-01-15" 形式の日付文字列
 * @returns ローカルタイムゾーンのDateオブジェクト
 *
 * @example
 * parseLocalDate("2025-01-15") // 2025-01-15 12:00:00 JST
 */
export function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

/**
 * YYYY-MM-DD形式の日付文字列を、その日の開始時刻（00:00:00）のDateオブジェクトに変換
 *
 * @param dateString - "2025-01-15" 形式の日付文字列
 * @returns その日の開始時刻のDateオブジェクト
 */
export function parseLocalDateStart(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * YYYY-MM-DD形式の日付文字列を、その日の終了時刻（23:59:59.999）のDateオブジェクトに変換
 *
 * @param dateString - "2025-01-15" 形式の日付文字列
 * @returns その日の終了時刻のDateオブジェクト
 */
export function parseLocalDateEnd(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 23, 59, 59, 999);
}
