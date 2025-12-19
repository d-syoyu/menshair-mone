// src/app/api/user/profile/route.ts
// MONË - User Profile API

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { updateProfileSchema } from "@/lib/validations";

// GET /api/user/profile - ユーザー情報取得
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Get user profile error:", error);
    return NextResponse.json(
      { error: "ユーザー情報の取得に失敗しました" },
      { status: 500 }
    );
  }
}

// PUT /api/user/profile - ユーザー情報更新
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "認証が必要です" }, { status: 401 });
    }

    const body = await request.json();
    const validationResult = updateProfileSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, phone } = validationResult.data;

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name,
        phone: phone || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
      },
    });

    return NextResponse.json({
      message: "プロフィールを更新しました",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update user profile error:", error);
    return NextResponse.json(
      { error: "プロフィールの更新に失敗しました" },
      { status: 500 }
    );
  }
}
