// src/app/api/menus/route.ts
// MONË Salon - 公開用メニューAPI

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/menus - 有効なメニュー一覧を取得（公開API）
export async function GET() {
  try {
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

    // カテゴリも取得
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

    return NextResponse.json({ menus, categories });
  } catch (error) {
    console.error("Get menus error:", error);
    return NextResponse.json(
      { error: "メニューの取得に失敗しました" },
      { status: 500 }
    );
  }
}
