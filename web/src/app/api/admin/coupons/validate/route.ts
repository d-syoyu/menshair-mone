// src/app/api/admin/coupons/validate/route.ts
// MONË Salon - Coupon Validation API

import { NextRequest, NextResponse } from "next/server";
import { checkAdminAuth } from "@/lib/auth";
import { validateCoupon } from "@/lib/coupon-validation";
import { z } from "zod";

// メニューアイテムスキーマ（部分適用計算用）
const menuItemSchema = z.object({
  menuId: z.string(),
  categoryId: z.string(),
  price: z.number().int().nonnegative(),
});

// バリデーションスキーマ
const validateCouponSchema = z.object({
  code: z.string().min(1, "クーポンコードは必須です"),
  subtotal: z.number().int().nonnegative(), // 税抜小計
  customerId: z.string().optional().nullable(), // 顧客ID（オプション）
  menuIds: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  weekday: z.number().int().min(0).max(6).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  // 部分適用計算用（対象メニューのみに割引を適用する場合）
  menuItems: z.array(menuItemSchema).optional(),
});

// POST /api/admin/coupons/validate - クーポン検証
export async function POST(request: NextRequest) {
  try {
    // 管理者権限チェック
    const { error } = await checkAdminAuth();
    if (error) return error;

    const body = await request.json();
    const validationResult = validateCouponSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message, valid: false },
        { status: 400 }
      );
    }

    const { code, subtotal, customerId, menuIds, categories, weekday, time, menuItems } =
      validationResult.data;

    // 共通検証関数を呼び出し
    const result = await validateCoupon({
      code,
      subtotal,
      customerId,
      menuIds,
      categories,
      weekday,
      time,
      menuItems,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Validate coupon error:", error);
    return NextResponse.json(
      { error: "クーポンの検証に失敗しました", valid: false },
      { status: 500 }
    );
  }
}
