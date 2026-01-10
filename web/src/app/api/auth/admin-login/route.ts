// src/app/api/auth/admin-login/route.ts
// 管理者専用のログインAPI（NextAuth.js Credentialsプロバイダーの代替）

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    console.error('[Admin Login API] Request received');

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      console.error('[Admin Login API] Missing credentials');
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    console.error(`[Admin Login API] Looking up user: ${email}`);

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.error(`[Admin Login API] User not found: ${email}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    if (!user.password) {
      console.error(`[Admin Login API] User has no password: ${email}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    console.error(`[Admin Login API] Checking password for: ${email}`);

    // パスワード検証
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      console.error(`[Admin Login API] Invalid password for: ${email}`);
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 管理者チェック
    if (user.role !== "ADMIN") {
      console.error(`[Admin Login API] User is not admin: ${email} (role: ${user.role})`);
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.error(`[Admin Login API] Password valid, generating JWT for: ${email}`);

    // JWTトークンを生成
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      console.error('[Admin Login API] AUTH_SECRET not configured');
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // 本番環境（HTTPS）では __Secure- プレフィックスが必要
    const isProduction = process.env.NODE_ENV === "production";
    const cookieName = isProduction
      ? "__Secure-authjs.session-token"
      : "authjs.session-token";

    const token = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 90 * 24 * 60 * 60, // 90日間
      },
      secret,
      salt: cookieName, // saltはcookie名と一致させる
    });

    console.error(`[Admin Login API] JWT generated, setting cookie: ${cookieName}`);

    const cookieStore = await cookies();
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 90 * 24 * 60 * 60, // 90日間
    });

    console.error(`[Admin Login API] Login successful: ${email}`);

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
    console.error("[Admin Login API] Error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
