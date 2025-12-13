// src/app/api/admin/holidays/[id]/route.ts
// MONË - Holiday Delete API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/admin/holidays/[id] - 不定休削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { id } = await params;

    // 存在チェック
    const existingHoliday = await prisma.holiday.findUnique({
      where: { id },
    });

    if (!existingHoliday) {
      return NextResponse.json(
        { error: "不定休が見つかりません" },
        { status: 404 }
      );
    }

    await prisma.holiday.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete holiday error:", error);
    const errorMessage = error instanceof Error ? error.message : "不定休の削除に失敗しました";
    return NextResponse.json(
      { error: "不定休の削除に失敗しました", details: errorMessage },
      { status: 500 }
    );
  }
}
