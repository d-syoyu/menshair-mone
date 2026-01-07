// src/lib/coupon-validation.ts
// MONË Salon - クーポン検証共通ロジック

import { prisma } from "@/lib/db";

// メニューアイテム情報（部分適用計算用）
export interface MenuItemForCoupon {
  menuId: string;
  categoryId: string;
  price: number;
}

// 検証パラメータの型定義
export interface CouponValidationParams {
  code: string;
  subtotal: number;
  customerId?: string | null;
  menuIds?: string[];
  categories?: string[];
  weekday?: number;
  time?: string;
  // 部分適用計算用（対象メニューのみに割引を適用する場合に使用）
  menuItems?: MenuItemForCoupon[];
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
  // 部分適用時の追加情報
  applicableSubtotal?: number;
  applicableMenuIds?: string[];
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
    menuItems = [],
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

  // 9 & 10. メニュー制限・カテゴリ制限チェック（OR条件：どちらかに該当すればOK）
  const hasMenuRestriction = coupon.applicableMenuIds.length > 0;
  const hasCategoryRestriction = coupon.applicableCategoryIds.length > 0;

  if (hasMenuRestriction || hasCategoryRestriction) {
    // 対象メニューに含まれるか
    const hasApplicableMenu = hasMenuRestriction
      ? menuIds.some((id) => coupon.applicableMenuIds.includes(id))
      : false;
    // 対象カテゴリに含まれるか
    const hasApplicableCategory = hasCategoryRestriction
      ? categories.some((cat) => coupon.applicableCategoryIds.includes(cat))
      : false;

    // OR条件：どちらかに該当すればOK
    // - メニュー制限のみ → メニューが該当すればOK
    // - カテゴリ制限のみ → カテゴリが該当すればOK
    // - 両方制限 → どちらかに該当すればOK
    const isApplicable =
      (hasMenuRestriction && hasApplicableMenu) ||
      (hasCategoryRestriction && hasApplicableCategory);

    if (!isApplicable) {
      return {
        valid: false,
        error: "対象メニュー/カテゴリが含まれていません",
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

  // 13. 割引額計算（部分適用対応）
  let targetSubtotal = subtotal;
  const applicableMenuIdList: string[] = [];

  // カテゴリまたはメニュー制限がある場合、対象メニューのみの小計を計算
  const hasRestriction = hasMenuRestriction || hasCategoryRestriction;

  if (hasRestriction && menuItems.length > 0) {
    targetSubtotal = 0;
    for (const item of menuItems) {
      // OR条件で判定：
      // - メニュー制限あり && 対象メニューに含まれる → 対象
      // - カテゴリ制限あり && 対象カテゴリに含まれる → 対象
      const menuMatch =
        hasMenuRestriction && coupon.applicableMenuIds.includes(item.menuId);
      const categoryMatch =
        hasCategoryRestriction && coupon.applicableCategoryIds.includes(item.categoryId);

      // どちらかの条件を満たせば対象
      if (menuMatch || categoryMatch) {
        targetSubtotal += item.price;
        applicableMenuIdList.push(item.menuId);
      }
    }
  }

  // 割引計算（対象小計に対して適用）
  let discountAmount: number;
  if (coupon.type === "PERCENTAGE") {
    discountAmount = Math.floor((targetSubtotal * coupon.value) / 100);
  } else {
    discountAmount = Math.min(coupon.value, targetSubtotal); // 対象小計を超えない
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
    // 部分適用時の追加情報
    applicableSubtotal: hasRestriction ? targetSubtotal : undefined,
    applicableMenuIds: hasRestriction ? applicableMenuIdList : undefined,
  };
}
