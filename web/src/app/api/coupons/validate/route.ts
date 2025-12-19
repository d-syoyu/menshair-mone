// src/app/api/coupons/validate/route.ts
// MONË Salon - Public Coupon Validation API (for customers)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { validateCoupon } from "@/lib/coupon-validation";
import { z } from "zod";

// バリデーションスキーマ
const validateCouponSchema = z.object({
  code: z.string().min(1, "クーポンコードは必須です"),
  subtotal: z.number().int().nonnegative(), // 税抜小計
  menuIds: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
  weekday: z.number().int().min(0).max(6).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

// POST /api/coupons/validate - クーポン検証（顧客向け）
export async function POST(request: NextRequest) {
  try {
    // ログインユーザーのみ利用可能
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "認証が必要です", valid: false },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = validateCouponSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message, valid: false },
        { status: 400 }
      );
    }

    const { code, subtotal, menuIds, categories, weekday, time } =
      validationResult.data;

    // 共通検証関数を呼び出し（顧客IDを渡す）
    const result = await validateCoupon({
      code,
      subtotal,
      customerId: session.user.id,
      menuIds,
      categories,
      weekday,
      time,
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
