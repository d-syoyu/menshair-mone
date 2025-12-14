// src/app/api/admin/coupons/validate/route.ts
// MONË Salon - Coupon Validation API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdminAuth } from "@/lib/auth";
import { z } from "zod";

// バリデーションスキーマ
const validateCouponSchema = z.object({
  code: z.string().min(1, "クーポンコードは必須です"),
  subtotal: z.number().int().nonnegative(), // 税抜小計
  customerId: z.string().optional().nullable(), // 顧客ID（オプション）
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

    const { code, subtotal, customerId } = validationResult.data;
    const now = new Date();

    // クーポンを検索
    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return NextResponse.json({
        valid: false,
        error: "クーポンが見つかりません",
      });
    }

    // 有効状態チェック
    if (!coupon.isActive) {
      return NextResponse.json({
        valid: false,
        error: "このクーポンは現在無効です",
      });
    }

    // 有効期間チェック
    if (now < coupon.validFrom) {
      return NextResponse.json({
        valid: false,
        error: `このクーポンは${coupon.validFrom.toLocaleDateString("ja-JP")}から有効です`,
      });
    }

    if (now > coupon.validUntil) {
      return NextResponse.json({
        valid: false,
        error: "このクーポンの有効期限が切れています",
      });
    }

    // 全体利用上限チェック
    if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
      return NextResponse.json({
        valid: false,
        error: "このクーポンは利用上限に達しています",
      });
    }

    // 顧客ごとの利用上限チェック
    if (customerId && coupon.usageLimitPerCustomer !== null) {
      const customerUsageCount = await prisma.couponUsage.count({
        where: {
          couponId: coupon.id,
          customerId: customerId,
        },
      });

      if (customerUsageCount >= coupon.usageLimitPerCustomer) {
        return NextResponse.json({
          valid: false,
          error: "お客様はこのクーポンを既に利用上限まで使用しています",
        });
      }
    }

    // 最低購入金額チェック
    if (coupon.minimumAmount !== null && subtotal < coupon.minimumAmount) {
      return NextResponse.json({
        valid: false,
        error: `このクーポンは¥${coupon.minimumAmount.toLocaleString()}以上のご購入で利用可能です`,
      });
    }

    // 割引額を計算
    let discountAmount: number;
    if (coupon.type === "PERCENTAGE") {
      discountAmount = Math.floor(subtotal * coupon.value / 100);
    } else {
      discountAmount = Math.min(coupon.value, subtotal); // 小計を超えない
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
      },
      discountAmount,
      message: coupon.type === "PERCENTAGE"
        ? `${coupon.value}% OFF: ¥${discountAmount.toLocaleString()}割引`
        : `¥${discountAmount.toLocaleString()}割引`,
    });
  } catch (error) {
    console.error("Validate coupon error:", error);
    return NextResponse.json(
      { error: "クーポンの検証に失敗しました", valid: false },
      { status: 500 }
    );
  }
}
