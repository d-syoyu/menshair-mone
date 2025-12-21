// src/app/api/admin/special-open-days/[id]/route.ts
// MONË - Special Open Day Delete API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// DELETE /api/admin/special-open-days/[id] - 特別営業日削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await auth();

    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "権限がありません" }, { status: 403 });
    }

    const { id } = await params;

    // 存在チェック
    const existingSpecialOpenDay = await prisma.specialOpenDay.findUnique({
      where: { id },
    });

    if (!existingSpecialOpenDay) {
      return NextResponse.json(
        { error: "特別営業日が見つかりません" },
        { status: 404 }
      );
    }

    await prisma.specialOpenDay.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete special open day error:", error);
    const errorMessage = error instanceof Error ? error.message : "特別営業日の削除に失敗しました";
    return NextResponse.json(
      { error: "特別営業日の削除に失敗しました", details: errorMessage },
      { status: 500 }
    );
  }
}
