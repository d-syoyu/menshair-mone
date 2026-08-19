// src/proxy.ts
// MONË - Route Protection Proxy
// Validate the Auth.js JWT before treating a request as authenticated.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProduction = process.env.NODE_ENV === "production";
  const cookieName = isProduction
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    salt: cookieName,
    cookieName,
    secureCookie: isProduction,
  });
  const isLoggedIn = !!token?.sub;
  const isAdmin = isLoggedIn && token.role === "ADMIN";

  // 認証ページ（顧客用ログイン・登録）
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // スタッフログインページ
  const isAdminLoginPage = pathname === "/admin/login";

  // 顧客専用ページ
  const isCustomerPage = pathname.startsWith("/booking") || pathname.startsWith("/mypage");

  // 管理者専用ページ（ログインページを除く）
  const isAdminPage = pathname.startsWith("/admin") && !isAdminLoginPage;

  // 管理者専用API
  const isAdminAPI = pathname.startsWith("/api/admin");

  // 顧客認証ページにアクセス時、既にログインしていればリダイレクト
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/mypage", request.url));
  }

  // スタッフログインページにアクセス時、管理者としてログイン済みならリダイレクト
  if (isAdminLoginPage && isAdmin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // 顧客ページにアクセス時、未ログインならログインページへ
  if (isCustomerPage && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
  }

  // 管理者ページにアクセス時、未認証または管理者でなければスタッフログインページへ
  // ページ側でも権限を再確認する
  if (isAdminPage && !isAdmin) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // 管理者APIにアクセス時、未認証または管理者でなければ403エラー
  if (isAdminAPI && !isAdmin) {
    return NextResponse.json({ error: "権限がありません" }, { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/register",
    "/booking/:path*",
    "/mypage/:path*",
    "/admin",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
