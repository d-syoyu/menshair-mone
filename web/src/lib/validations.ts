// src/lib/validations.ts
// MONË - Zod Validation Schemas

import { z } from "zod";

// 予約作成スキーマ（複数メニュー対応 + 顧客情報）
export const createReservationSchema = z.object({
  menuIds: z.array(z.string()).min(1, "メニューを選択してください"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "時間の形式が正しくありません"),
  note: z.string().max(500, "備考は500文字以内で入力してください").optional(),
  couponCode: z.string().max(50, "クーポンコードは50文字以内で入力してください").optional(),
  // 顧客情報
  customerName: z.string().min(1, "お名前を入力してください").max(100, "お名前は100文字以内で入力してください"),
  customerPhone: z.string().min(1, "電話番号を入力してください").max(20, "電話番号は20文字以内で入力してください"),
});

// 予約キャンセルスキーマ
export const cancelReservationSchema = z.object({
  id: z.string().min(1, "予約IDが必要です"),
});

// お問い合わせスキーマ
export const contactSchema = z.object({
  name: z.string().min(1, "お名前を入力してください").max(100, "お名前は100文字以内で入力してください"),
  email: z.string().email("メールアドレスの形式が正しくありません"),
  phone: z.string().optional(),
  message: z.string().min(1, "お問い合わせ内容を入力してください").max(2000, "お問い合わせ内容は2000文字以内で入力してください"),
});

// ユーザープロフィール更新スキーマ
export const updateProfileSchema = z.object({
  name: z.string().min(1, "お名前を入力してください").max(100, "お名前は100文字以内で入力してください"),
  phone: z.string().optional(),
});

// 管理者ニュース作成スキーマ
export const createNewsSchema = z.object({
  title: z.string().min(1, "タイトルを入力してください").max(200, "タイトルは200文字以内で入力してください"),
  slug: z.string().min(1, "スラッグを入力してください").max(100, "スラッグは100文字以内で入力してください").regex(/^[a-z0-9-]+$/, "スラッグは小文字英数字とハイフンのみ使用できます"),
  content: z.string().min(1, "本文を入力してください"),
  isPublished: z.boolean().default(false),
});

// 日付クエリスキーマ
export const dateQuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "日付の形式が正しくありません"),
});

// 月クエリスキーマ
export const monthQuerySchema = z.object({
  year: z.coerce.number().min(2024).max(2100),
  month: z.coerce.number().min(1).max(12),
});
