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
    revalidate: 3600, // 1時間ごとに自動再検証（バックアップ）
  }
);
