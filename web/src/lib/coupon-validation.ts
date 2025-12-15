// src/lib/coupon-validation.ts
// MONË Salon - クーポン検証共通ロジック

import { prisma } from "@/lib/db";

// 検証パラメータの型定義
export interface CouponValidationParams {
  code: string;
  subtotal: number;
  customerId?: string | null;
  menuIds?: string[];
  categories?: string[];
  weekday?: number;
  time?: string;
}

// 検証成功時の戻り値
export interface CouponValidationSuccess {
  valid: true;
  coupon: {
    id: string;
    code: string;
    name: string;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    description: string | null;
  };
  discountAmount: number;
  message: string;
}

// 検証失敗時の戻り値
export interface CouponValidationFailure {
  valid: false;
  error: string;
}

// 検証結果の型
export type CouponValidationResult = CouponValidationSuccess | CouponValidationFailure;

/**
 * クーポン検証共通関数
 *
 * 検証項目（全13項目）:
 * 1. クーポン存在確認
 * 2. 有効状態（isActive）
 * 3. 有効期間（validFrom / validUntil）
 * 4. 全体利用上限（usageLimit / usageCount）
 * 5. 顧客利用上限（usageLimitPerCustomer）
 * 6. 初回来店限定（onlyFirstTime）
 * 7. リピーター限定（onlyReturning）
 * 8. 最低購入金額（minimumAmount）
 * 9. メニュー制限（applicableMenuIds）- 1つでも対象があればOK
 * 10. カテゴリ制限（applicableCategoryIds）- 1つでも対象があればOK
 * 11. 曜日制限（applicableWeekdays）
 * 12. 時間帯制限（startTime / endTime）
 * 13. 割引額計算
 */
export async function validateCoupon(
  params: CouponValidationParams
): Promise<CouponValidationResult> {
  const {
    code,
    subtotal,
    customerId,
    menuIds = [],
    categories = [],
    weekday,
    time,
  } = params;

  const now = new Date();

  // 1. クーポン存在確認
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() },
  });

  if (!coupon) {
    return {
      valid: false,
      error: "クーポンが見つかりません",
    };
  }

  // 2. 有効状態チェック
  if (!coupon.isActive) {
    return {
      valid: false,
      error: "このクーポンは現在無効です",
    };
  }

  // 3. 有効期間チェック
  if (now < coupon.validFrom) {
    return {
      valid: false,
      error: `このクーポンは${coupon.validFrom.toLocaleDateString("ja-JP")}から有効です`,
    };
  }

  if (now > coupon.validUntil) {
    return {
      valid: false,
      error: "このクーポンの有効期限が切れています",
    };
  }

  // 4. 全体利用上限チェック
  if (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) {
    return {
      valid: false,
      error: "このクーポンは利用上限に達しています",
    };
  }

  // 5. 顧客ごとの利用上限チェック
  if (customerId && coupon.usageLimitPerCustomer !== null) {
    const customerUsageCount = await prisma.couponUsage.count({
      where: {
        couponId: coupon.id,
        customerId: customerId,
      },
    });

    if (customerUsageCount >= coupon.usageLimitPerCustomer) {
      return {
        valid: false,
        error: "お客様はこのクーポンを既に利用上限まで使用しています",
      };
    }
  }

  // 6. 初回来店限定チェック
  if (customerId && coupon.onlyFirstTime) {
    const saleCount = await prisma.sale.count({ where: { userId: customerId } });
    if (saleCount > 0) {
      return {
        valid: false,
        error: "初回来店限定のクーポンです",
      };
    }
  }

  // 7. リピーター限定チェック
  if (customerId && coupon.onlyReturning) {
    const saleCount = await prisma.sale.count({ where: { userId: customerId } });
    if (saleCount === 0) {
      return {
        valid: false,
        error: "リピーター限定のクーポンです",
      };
    }
  }

  // 8. 最低購入金額チェック
  if (coupon.minimumAmount !== null && subtotal < coupon.minimumAmount) {
    return {
      valid: false,
      error: `このクーポンは¥${coupon.minimumAmount.toLocaleString()}以上のご購入で利用可能です`,
    };
  }

  // 9. メニュー制限チェック（1つでも対象があればOK）
  if (coupon.applicableMenuIds.length > 0 && menuIds.length > 0) {
    const hasApplicableMenu = menuIds.some((id) =>
      coupon.applicableMenuIds.includes(id)
    );
    if (!hasApplicableMenu) {
      return {
        valid: false,
        error: "対象メニューが含まれていません",
      };
    }
  }

  // 10. カテゴリ制限チェック（1つでも対象があればOK）
  if (coupon.applicableCategoryIds.length > 0 && categories.length > 0) {
    const hasApplicableCategory = categories.some((cat) =>
      coupon.applicableCategoryIds.includes(cat)
    );
    if (!hasApplicableCategory) {
      return {
        valid: false,
        error: "対象カテゴリが含まれていません",
      };
    }
  }

  // 11. 曜日制限チェック
  if (coupon.applicableWeekdays.length > 0) {
    const currentWeekday = typeof weekday === "number" ? weekday : now.getDay();
    if (!coupon.applicableWeekdays.includes(currentWeekday)) {
      return {
        valid: false,
        error: "利用できない曜日です",
      };
    }
  }

  // 12. 時間帯制限チェック
  if (coupon.startTime && coupon.endTime) {
    const currentTime = time || now.toTimeString().slice(0, 5);
    if (currentTime < coupon.startTime || currentTime > coupon.endTime) {
      return {
        valid: false,
        error: `利用可能時間は${coupon.startTime}〜${coupon.endTime}です`,
      };
    }
  }

  // 13. 割引額計算
  let discountAmount: number;
  if (coupon.type === "PERCENTAGE") {
    discountAmount = Math.floor((subtotal * coupon.value) / 100);
  } else {
    discountAmount = Math.min(coupon.value, subtotal); // 小計を超えない
  }

  // 検証成功
  return {
    valid: true,
    coupon: {
      id: coupon.id,
      code: coupon.code,
      name: coupon.name,
      type: coupon.type as "PERCENTAGE" | "FIXED",
      value: coupon.value,
      description: coupon.description,
    },
    discountAmount,
    message:
      coupon.type === "PERCENTAGE"
        ? `${coupon.value}% OFF: ¥${discountAmount.toLocaleString()}割引`
        : `¥${discountAmount.toLocaleString()}割引`,
  };
}
