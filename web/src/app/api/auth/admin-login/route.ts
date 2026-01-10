// src/app/api/auth/admin-login/route.ts
// 管理者専用のログインAPI（NextAuth.js Credentialsプロバイダーの代替）

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  console.log("[Admin Login] API called");
  try {
    const body = await request.json();
    const { email, password } = body;
    console.log("[Admin Login] Email:", email);

    if (!email || !password) {
      console.log("[Admin Login] Missing credentials");
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // ユーザーを検索
    console.log("[Admin Login] Looking up user");
    const user = await prisma.user.findUnique({
      where: { email },
    });
    console.log("[Admin Login] User found:", !!user);

    if (!user || !user.password) {
      console.log("[Admin Login] User not found or no password");
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // パスワード検証
    console.log("[Admin Login] Checking password");
    const isValid = await bcrypt.compare(password, user.password);
    console.log("[Admin Login] Password valid:", isValid);
    if (!isValid) {
      console.log("[Admin Login] Invalid password");
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // 管理者チェック
    console.log("[Admin Login] Checking role:", user.role);
    if (user.role !== "ADMIN") {
      console.log("[Admin Login] Not admin");
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // JWTトークンを生成
    console.log("[Admin Login] Generating JWT");
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      console.log("[Admin Login] AUTH_SECRET missing");
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
    console.log("[Admin Login] Cookie name:", cookieName);

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

    console.log("[Admin Login] Setting cookie");
    const cookieStore = await cookies();
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
      path: "/",
      maxAge: 90 * 24 * 60 * 60, // 90日間
    });

    console.log("[Admin Login] Success");
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
    console.error("[Admin Login] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
