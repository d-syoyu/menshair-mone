// src/app/api/coupons/route.ts
// MONË Salon - Public Coupon List API (for customers)

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/coupons - 利用可能なクーポン一覧取得
export async function GET(request: NextRequest) {
  try {
    // ログインユーザーのみ利用可能
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const menuIds = searchParams.get("menuIds")?.split(",").filter(Boolean) || [];
    const categoryIds = searchParams.get("categoryIds")?.split(",").filter(Boolean) || [];
    const weekday = searchParams.get("weekday") ? parseInt(searchParams.get("weekday")!) : new Date().getDay();
    const time = searchParams.get("time") || new Date().toTimeString().slice(0, 5);
    const subtotal = searchParams.get("subtotal") ? parseInt(searchParams.get("subtotal")!) : 0;

    const now = new Date();
    const customerId = session.user.id;

    // 有効なクーポンを取得
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
      orderBy: [
        { value: "desc" }, // 割引額が大きい順
        { createdAt: "desc" },
      ],
    });

    // 各クーポンの利用可否を判定
    const availableCoupons = [];

    for (const coupon of coupons) {
      // 全体利用上限チェック
      if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
        continue;
      }

      // 顧客ごとの利用上限チェック
      if (coupon.usageLimitPerCustomer !== null) {
        const customerUsageCount = await prisma.couponUsage.count({
          where: {
            couponId: coupon.id,
            customerId: customerId,
          },
        });
        if (customerUsageCount >= coupon.usageLimitPerCustomer) {
          continue;
        }
      }

      // 初回来店限定チェック
      if (coupon.onlyFirstTime) {
        const saleCount = await prisma.sale.count({ where: { userId: customerId } });
        if (saleCount > 0) {
          continue;
        }
      }

      // リピーター限定チェック
      if (coupon.onlyReturning) {
        const saleCount = await prisma.sale.count({ where: { userId: customerId } });
        if (saleCount === 0) {
          continue;
        }
      }

      // 最低購入金額チェック
      if (coupon.minimumAmount !== null && subtotal < coupon.minimumAmount) {
        continue;
      }

      // メニュー/カテゴリ制限チェック（OR条件）
      const hasMenuRestriction = coupon.applicableMenuIds.length > 0;
      const hasCategoryRestriction = coupon.applicableCategoryIds.length > 0;

      if (hasMenuRestriction || hasCategoryRestriction) {
        const hasApplicableMenu = hasMenuRestriction
          ? menuIds.some((id) => coupon.applicableMenuIds.includes(id))
          : false;
        const hasApplicableCategory = hasCategoryRestriction
          ? categoryIds.some((cat) => coupon.applicableCategoryIds.includes(cat))
          : false;

        const isApplicable =
          (hasMenuRestriction && hasApplicableMenu) ||
          (hasCategoryRestriction && hasApplicableCategory);

        if (!isApplicable) {
          continue;
        }
      }

      // 曜日制限チェック
      if (coupon.applicableWeekdays.length > 0) {
        if (!coupon.applicableWeekdays.includes(weekday)) {
          continue;
        }
      }

      // 時間帯制限チェック
      if (coupon.startTime && coupon.endTime) {
        if (time < coupon.startTime || time > coupon.endTime) {
          continue;
        }
      }

      // 利用可能なクーポンとして追加
      availableCoupons.push({
        id: coupon.id,
        code: coupon.code,
        name: coupon.name,
        type: coupon.type,
        value: coupon.value,
        description: coupon.description,
        minimumAmount: coupon.minimumAmount,
        applicableMenuIds: coupon.applicableMenuIds,
        applicableCategoryIds: coupon.applicableCategoryIds,
        validUntil: coupon.validUntil,
        // 条件表示用
        conditions: buildConditionText(coupon),
      });
    }

    return NextResponse.json({ coupons: availableCoupons });
  } catch (error) {
    console.error("Get coupons error:", error);
    return NextResponse.json(
      { error: "クーポンの取得に失敗しました" },
      { status: 500 }
    );
  }
}

// クーポン条件テキストを生成
function buildConditionText(coupon: {
  minimumAmount: number | null;
  applicableWeekdays: number[];
  startTime: string | null;
  endTime: string | null;
  onlyFirstTime: boolean;
  onlyReturning: boolean;
}): string[] {
  const conditions: string[] = [];

  if (coupon.minimumAmount) {
    conditions.push(`¥${coupon.minimumAmount.toLocaleString()}以上のご利用で適用`);
  }

  if (coupon.applicableWeekdays.length > 0) {
    const weekdayNames = ["日", "月", "火", "水", "木", "金", "土"];
    const days = coupon.applicableWeekdays.map((d) => weekdayNames[d]).join("・");
    conditions.push(`${days}曜日限定`);
  }

  if (coupon.startTime && coupon.endTime) {
    conditions.push(`${coupon.startTime}〜${coupon.endTime}限定`);
  }

  if (coupon.onlyFirstTime) {
    conditions.push("ご新規様限定");
  }

  if (coupon.onlyReturning) {
    conditions.push("リピーター様限定");
  }

  return conditions;
}
