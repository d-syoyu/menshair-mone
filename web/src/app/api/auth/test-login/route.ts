// src/app/api/auth/test-login/route.ts
// E2Eテスト専用の認証バイパスAPI
// NODE_ENV=test または E2E_TEST=true のときのみ動作

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const isTestEnvironment =
  process.env.NODE_ENV === "test" ||
  process.env.E2E_TEST === "true" ||
  process.env.PLAYWRIGHT_TEST === "true";

export async function POST(request: Request) {
  // テスト環境でのみ動作
  if (!isTestEnvironment) {
    return NextResponse.json(
      { error: "This endpoint is only available in test environment" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // パスワード検証（パスワードが設定されている場合）
    if (user.password) {
      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid password" },
          { status: 401 }
        );
      }
    } else {
      // テスト環境ではパスワードがないユーザーも特定のテストパスワードで認証可能
      if (password !== "test-password-12345") {
        return NextResponse.json(
          { error: "Invalid test password" },
          { status: 401 }
        );
      }
    }

    // JWTトークンを生成
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "AUTH_SECRET not configured" },
        { status: 500 }
      );
    }

    const token = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24時間
      },
      secret,
      salt: "authjs.session-token",
    });

    // セッションCookieを設定
    const cookieStore = await cookies();
    cookieStore.set("authjs.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 24 * 60 * 60, // 24時間
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Test login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
