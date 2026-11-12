// src/lib/menu-cache.ts
// MONË Salon - メニューデータのキャッシュ管理

import { unstable_cache } from "next/cache";
import { logDatabaseFallback, prisma } from "@/lib/db";

export interface CachedCategory {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  displayOrder: number;
}

export interface CachedMenu {
  id: string;
  name: string;
  price: number;
  priceVariable: boolean;
  duration: number;
  displayOrder: number;
  category: CachedCategory;
}

export interface MenuData {
  menus: CachedMenu[];
  categories: CachedCategory[];
}

// メニューデータ取得のキャッシュキー
export const MENU_CACHE_TAG = "menus";

// キャッシュされたメニューデータを取得
export const getCachedMenus = unstable_cache(
  async (): Promise<MenuData> => {
    if (!process.env.DATABASE_URL) {
      console.warn("[Menu Cache] DATABASE_URL is not configured");
      return { menus: [], categories: [] };
    }

    try {
      const [menus, categories] = await Promise.all([
        prisma.menu.findMany({
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            price: true,
            priceVariable: true,
            duration: true,
            displayOrder: true,
            category: {
              select: {
                id: true,
                name: true,
                nameEn: true,
                color: true,
                displayOrder: true,
              },
            },
          },
          orderBy: [
            { category: { displayOrder: "asc" } },
            { displayOrder: "asc" },
          ],
        }),
        prisma.category.findMany({
          where: { isActive: true },
          orderBy: { displayOrder: "asc" },
          select: {
            id: true,
            name: true,
            nameEn: true,
            color: true,
            displayOrder: true,
          },
        }),
      ]);

      return { menus, categories };
    } catch (error) {
      logDatabaseFallback("Menu Cache", error, "empty menu/category lists");
      return { menus: [], categories: [] };
    }
  },
  [MENU_CACHE_TAG],
  {
    tags: [MENU_CACHE_TAG],
    revalidate: 86400, // 変更時はタグで破棄。これは1日ごとの予備
  }
);

// 予約画面（/api/menus）用。予約フローが使う全項目（categoryId, lastBookingTime など）を含む。
// 以前は表示のたびに DB へ2クエリを直列で投げていた。管理画面でメニュー／カテゴリを変えると
// MENU_CACHE_TAG で破棄される。
export const getCachedBookingMenus = unstable_cache(
  async () => {
    const [menus, categories] = await Promise.all([
      prisma.menu.findMany({
        where: { isActive: true },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              nameEn: true,
              color: true,
              displayOrder: true,
            },
          },
        },
        orderBy: [
          { category: { displayOrder: "asc" } },
          { displayOrder: "asc" },
        ],
      }),
      prisma.category.findMany({
        where: { isActive: true },
        orderBy: { displayOrder: "asc" },
        select: {
          id: true,
          name: true,
          nameEn: true,
          color: true,
          displayOrder: true,
        },
      }),
    ]);

    return { menus, categories };
  },
  ["booking-menus"],
  {
    tags: [MENU_CACHE_TAG],
    revalidate: 86400, // 変更時はタグで破棄。これは1日ごとの予備
  }
);
