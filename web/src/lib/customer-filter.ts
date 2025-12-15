// src/lib/customer-filter.ts
// ニュースレター配信先フィルタリング（会計ベース）

import { prisma } from "@/lib/db";

export interface FilteredCustomer {
  email: string;
  name: string | null;
}

interface FilterParams {
  targets: string[]; // Notionから取得した配信先リスト
}

// セグメント定義
const SEGMENTS = {
  ALL: "すべて",
  ADMIN: "管理者",
  NEW_CUSTOMER: "新規顧客",
  REPEATER: "リピーター",
  RECENT_VISIT: "最近来店",
  DORMANT: "休眠顧客",
  HAS_RESERVATION: "予約あり",
} as const;

// カテゴリ利用パターン
const CATEGORY_USED_SUFFIX = "利用あり";
const CATEGORY_NOT_USED_SUFFIX = "利用なし";

// 日数定数
const NEW_CUSTOMER_DAYS = 30; // 新規顧客: 30日以内
const RECENT_VISIT_DAYS = 60; // 最近来店: 60日以内
const DORMANT_DAYS = 90; // 休眠顧客: 90日以上

/**
 * 配信先に基づいて顧客をフィルタリング
 * 複数選択時はOR条件で結合
 */
export async function filterCustomersByTargets(
  params: FilterParams
): Promise<FilteredCustomer[]> {
  const { targets } = params;

  if (targets.length === 0) {
    return [];
  }

  // 「すべて」が含まれている場合は全顧客を返す
  if (targets.includes(SEGMENTS.ALL)) {
    return getAllCustomers();
  }

  // 各セグメントの顧客IDを収集
  const customerIdSets: Set<string>[] = [];

  for (const target of targets) {
    const customerIds = await getCustomerIdsByTarget(target);
    if (customerIds.size > 0) {
      customerIdSets.push(customerIds);
    }
  }

  // OR条件で結合（和集合）
  const allCustomerIds = new Set<string>();
  for (const idSet of customerIdSets) {
    for (const id of idSet) {
      allCustomerIds.add(id);
    }
  }

  if (allCustomerIds.size === 0) {
    return [];
  }

  // 顧客情報を取得
  const customers = await prisma.user.findMany({
    where: {
      id: { in: Array.from(allCustomerIds) },
      email: { not: null },
    },
    select: {
      email: true,
      name: true,
    },
  });

  return customers
    .filter((c): c is { email: string; name: string | null } => c.email !== null)
    .map((c) => ({ email: c.email, name: c.name }));
}

/**
 * 全顧客を取得
 */
async function getAllCustomers(): Promise<FilteredCustomer[]> {
  const users = await prisma.user.findMany({
    where: {
      role: "CUSTOMER",
      email: { not: null },
    },
    select: {
      email: true,
      name: true,
    },
  });

  return users
    .filter((u): u is { email: string; name: string | null } => u.email !== null)
    .map((u) => ({ email: u.email, name: u.name }));
}

/**
 * ターゲットに基づいて顧客IDを取得
 * ※ 会計（Sale）ベースで判定
 */
async function getCustomerIdsByTarget(target: string): Promise<Set<string>> {
  const ids = new Set<string>();
  const now = new Date();

  switch (target) {
    case SEGMENTS.ADMIN: {
      // 管理者ユーザーを取得（テスト用）
      const admins = await prisma.user.findMany({
        where: {
          role: "ADMIN",
          email: { not: null },
        },
        select: {
          id: true,
        },
      });

      for (const admin of admins) {
        ids.add(admin.id);
      }
      break;
    }

    case SEGMENTS.NEW_CUSTOMER: {
      // 初回会計が30日以内
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - NEW_CUSTOMER_DAYS);

      // 支払い完了の会計を取得
      const sales = await prisma.sale.findMany({
        where: {
          paymentStatus: "PAID",
          userId: { not: null },
        },
        select: {
          userId: true,
          saleDate: true,
        },
        orderBy: {
          saleDate: "asc",
        },
      });

      // 各ユーザーの最初の会計日を確認
      const userFirstSale = new Map<string, Date>();
      for (const s of sales) {
        if (s.userId && !userFirstSale.has(s.userId)) {
          userFirstSale.set(s.userId, s.saleDate);
        }
      }

      // 初回会計が30日以内のユーザー
      for (const [userId, firstDate] of userFirstSale) {
        if (firstDate >= cutoffDate) {
          ids.add(userId);
        }
      }
      break;
    }

    case SEGMENTS.REPEATER: {
      // 支払い完了の会計が2件以上
      const saleCounts = await prisma.sale.groupBy({
        by: ["userId"],
        where: {
          paymentStatus: "PAID",
          userId: { not: null },
        },
        _count: {
          id: true,
        },
        having: {
          id: {
            _count: {
              gte: 2,
            },
          },
        },
      });

      for (const s of saleCounts) {
        if (s.userId) {
          ids.add(s.userId);
        }
      }
      break;
    }

    case SEGMENTS.RECENT_VISIT: {
      // 最終会計が60日以内
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - RECENT_VISIT_DAYS);

      const recentVisitors = await prisma.sale.findMany({
        where: {
          paymentStatus: "PAID",
          userId: { not: null },
          saleDate: { gte: cutoffDate },
        },
        select: {
          userId: true,
        },
        distinct: ["userId"],
      });

      for (const s of recentVisitors) {
        if (s.userId) {
          ids.add(s.userId);
        }
      }
      break;
    }

    case SEGMENTS.DORMANT: {
      // 最終会計が90日以上前
      const cutoffDate = new Date(now);
      cutoffDate.setDate(cutoffDate.getDate() - DORMANT_DAYS);

      // 会計履歴のある全顧客
      const allCustomersWithSales = await prisma.user.findMany({
        where: {
          role: "CUSTOMER",
          sales: {
            some: {
              paymentStatus: "PAID",
            },
          },
        },
        select: {
          id: true,
        },
      });

      // 90日以内に来店した顧客
      const recentVisitors = await prisma.sale.findMany({
        where: {
          paymentStatus: "PAID",
          userId: { not: null },
          saleDate: { gte: cutoffDate },
        },
        select: {
          userId: true,
        },
        distinct: ["userId"],
      });

      const recentVisitorIds = new Set(
        recentVisitors.filter((s) => s.userId).map((s) => s.userId as string)
      );

      for (const customer of allCustomersWithSales) {
        if (!recentVisitorIds.has(customer.id)) {
          ids.add(customer.id);
        }
      }
      break;
    }

    case SEGMENTS.HAS_RESERVATION: {
      // 今日以降のCONFIRMED予約あり（これは予約ベースのまま）
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const upcomingReservations = await prisma.reservation.findMany({
        where: {
          status: "CONFIRMED",
          date: { gte: today },
        },
        select: {
          userId: true,
        },
        distinct: ["userId"],
      });

      for (const r of upcomingReservations) {
        ids.add(r.userId);
      }
      break;
    }

    default: {
      // カテゴリ別フィルタリング
      if (target.endsWith(CATEGORY_USED_SUFFIX)) {
        // 「[カテゴリ名]利用あり」
        const categoryName = target.replace(CATEGORY_USED_SUFFIX, "");
        const categoryUsers = await getCustomersByCategory(categoryName, true);
        for (const id of categoryUsers) {
          ids.add(id);
        }
      } else if (target.endsWith(CATEGORY_NOT_USED_SUFFIX)) {
        // 「[カテゴリ名]利用なし」
        const categoryName = target.replace(CATEGORY_NOT_USED_SUFFIX, "");
        const categoryUsers = await getCustomersByCategory(categoryName, false);
        for (const id of categoryUsers) {
          ids.add(id);
        }
      }
      break;
    }
  }

  return ids;
}

/**
 * カテゴリ別に顧客IDを取得（会計ベース）
 * @param categoryName カテゴリ名
 * @param hasUsed true: 利用したことがある, false: 利用したことがない
 */
async function getCustomersByCategory(
  categoryName: string,
  hasUsed: boolean
): Promise<string[]> {
  // カテゴリを確認
  const category = await prisma.category.findFirst({
    where: {
      name: categoryName,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!category) {
    console.warn(`Category not found: ${categoryName}`);
    return [];
  }

  if (hasUsed) {
    // そのカテゴリの施術を受けたことがあるユーザー（会計ベース）
    const usersWithCategory = await prisma.sale.findMany({
      where: {
        paymentStatus: "PAID",
        userId: { not: null },
        items: {
          some: {
            itemType: "MENU",
            category: category.name,
          },
        },
      },
      select: {
        userId: true,
      },
      distinct: ["userId"],
    });

    return usersWithCategory
      .filter((s) => s.userId !== null)
      .map((s) => s.userId as string);
  } else {
    // そのカテゴリの施術を受けたことがないユーザー
    // 1. 全顧客を取得
    const allCustomers = await prisma.user.findMany({
      where: {
        role: "CUSTOMER",
        email: { not: null },
      },
      select: {
        id: true,
      },
    });

    // 2. そのカテゴリを利用したことがあるユーザーを取得
    const usersWithCategory = await prisma.sale.findMany({
      where: {
        paymentStatus: "PAID",
        userId: { not: null },
        items: {
          some: {
            itemType: "MENU",
            category: category.name,
          },
        },
      },
      select: {
        userId: true,
      },
      distinct: ["userId"],
    });

    const usedUserIds = new Set(
      usersWithCategory.filter((s) => s.userId).map((s) => s.userId as string)
    );

    // 3. 差分を返す
    return allCustomers
      .filter((c) => !usedUserIds.has(c.id))
      .map((c) => c.id);
  }
}

/**
 * DBからカテゴリ一覧を取得（同期用）
 */
export async function getActiveCategories(): Promise<
  { id: string; name: string }[]
> {
  return prisma.category.findMany({
    where: {
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      displayOrder: "asc",
    },
  });
}
