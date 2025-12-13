// src/app/api/auth/register/route.ts
// 会員登録API - 名前・電話番号・メールアドレスを登録

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email } = body;

    // バリデーション
    if (!email) {
      return NextResponse.json(
        { error: "メールアドレスは必須です" },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: "お名前は必須です" },
        { status: 400 }
      );
    }

    if (!phone) {
      return NextResponse.json(
        { error: "電話番号は必須です" },
        { status: 400 }
      );
    }

    // メールアドレスの形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "有効なメールアドレスを入力してください" },
        { status: 400 }
      );
    }

    // 電話番号の形式チェック（日本の電話番号）
    const phoneRegex = /^[0-9-]{10,14}$/;
    if (!phoneRegex.test(phone.replace(/\s/g, ""))) {
      return NextResponse.json(
        { error: "有効な電話番号を入力してください" },
        { status: 400 }
      );
    }

    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // 既存ユーザーの情報を更新
      await prisma.user.update({
        where: { email },
        data: {
          name,
          phone,
        },
      });

      return NextResponse.json({
        success: true,
        message: "ユーザー情報を更新しました",
        isExisting: true,
      });
    }

    // 新規ユーザー作成
    await prisma.user.create({
      data: {
        email,
        name,
        phone,
        role: "CUSTOMER",
      },
    });

    return NextResponse.json({
      success: true,
      message: "ユーザーを作成しました",
      isExisting: false,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "登録に失敗しました。しばらく経ってからお試しください。" },
      { status: 500 }
    );
  }
}
