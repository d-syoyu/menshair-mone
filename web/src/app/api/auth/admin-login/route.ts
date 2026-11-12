// src/app/api/auth/admin-login/route.ts
// 管理者専用のログインAPI（NextAuth.js Credentialsプロバイダーの代替）
// 自分のサイトの画面からだけ受け、失敗の回数を数え、12時間で切れるセッションを作る

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { encode } from "next-auth/jwt";
import { prisma } from "@/lib/db";
import { ADMIN_SESSION_MAX_AGE, adminTokenClaims } from "@/lib/admin-session";
import { SESSION_COOKIE_NAME, SESSION_COOKIE_SECURE } from "@/lib/auth-constants";
import {
  clearLoginFailures,
  clientIp,
  loginBlocked,
  recordLoginFailure,
  sameOriginRequest,
  UNKNOWN_USER_HASH,
} from "@/lib/login-guard";
import bcrypt from "bcryptjs";

const invalid = () => NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

export async function POST(request: Request) {
  try {
    // 別のサイトの画面からの送信は受けない
    if (!sameOriginRequest(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password || email.length > 254 || password.length > 1024) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const ip = clientIp(request.headers);
    if (await loginBlocked(email, ip)) {
      return NextResponse.json(
        { error: "Too many attempts" },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    // ユーザーを検索
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, password: true, sessionVersion: true },
    });

    // パスワード検証。登録のないアドレスでも同じだけ時間をかけ、応答の速さで登録の有無を分からなくする
    const isValid = await bcrypt.compare(password, user?.password ?? UNKNOWN_USER_HASH);

    // 管理者でないアカウントも、同じ失敗として扱う（管理者かどうかを教えない）
    if (!user?.password || !isValid || user.role !== "ADMIN") {
      await recordLoginFailure(email, ip);
      return invalid();
    }

    await clearLoginFailures(email, ip);

    // JWTトークンを生成
    const secret = process.env.AUTH_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // 本番環境では __Secure- プレフィックス付き（Auth.js・proxy と同じ規則）
    const cookieName = SESSION_COOKIE_NAME;

    const token = await encode({
      token: {
        sub: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        ...adminTokenClaims(user.sessionVersion),
      },
      secret,
      salt: cookieName, // saltはcookie名と一致させる
      maxAge: ADMIN_SESSION_MAX_AGE,
    });

    const cookieStore = await cookies();
    cookieStore.set(cookieName, token, {
      httpOnly: true,
      secure: SESSION_COOKIE_SECURE,
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_SESSION_MAX_AGE,
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
    console.error("[Admin Login] Error:", error instanceof Error ? error.name : "UNKNOWN");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
