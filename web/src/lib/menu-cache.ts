// src/lib/menu-cache.ts
// MONË Salon - メニューデータのキャッシュ管理

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db";

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
    const menus = await prisma.menu.findMany({
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
    });

    const categories = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: {
        id: true,
        name: true,
        nameEn: true,
        color: true,
        displayOrder: true,
      },
    });

    return { menus, categories };
  },
  [MENU_CACHE_TAG],
  {
    tags: [MENU_CACHE_TAG],
    revalidate: 3600, // 1時間ごとに自動再検証（バックアップ）
  }
);
