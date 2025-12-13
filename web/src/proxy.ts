// src/proxy.ts
// Hair Salon White - Route Protection Middleware
// Simple token-based check for Edge Runtime compatibility

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for session token (NextAuth.js stores it in cookies)
  const sessionToken = request.cookies.get("authjs.session-token")?.value
    || request.cookies.get("__Secure-authjs.session-token")?.value;

  const isLoggedIn = !!sessionToken;

  // 認証ページ（顧客用ログイン・登録）
  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/register");

  // スタッフログインページ
  const isAdminLoginPage = pathname === "/admin/login";

  // 顧客専用ページ
  const isCustomerPage = pathname.startsWith("/booking") || pathname.startsWith("/mypage");

  // 管理者専用ページ（ログインページを除く）
  const isAdminPage = pathname.startsWith("/admin") && !isAdminLoginPage;

  // 顧客認証ページにアクセス時、既にログインしていればリダイレクト
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/mypage", request.url));
  }

  // スタッフログインページにアクセス時、既にログインしていればリダイレクト
  if (isAdminLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // 顧客ページにアクセス時、未ログインならログインページへ
  if (isCustomerPage && !isLoggedIn) {
    const callbackUrl = encodeURIComponent(pathname);
    return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, request.url));
  }

  // 管理者ページにアクセス時、未ログインならスタッフログインページへ
  // Note: 管理者権限チェックはページ側で行う
  if (isAdminPage && !isLoggedIn) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
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
  ],
};
