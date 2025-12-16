// src/lib/auth.ts
// MONË - NextAuth.js v5 Configuration

import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Line from "next-auth/providers/line";
import Resend from "next-auth/providers/resend";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import type { UserRole } from "@prisma/client";
import type { Adapter } from "next-auth/adapters";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }

  interface User {
    role: UserRole;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role: UserRole;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as Adapter,
  trustHost: true,
  session: {
    strategy: "jwt",
    // セッション有効期限: 90日間（ブラウザを閉じても維持）
    maxAge: 90 * 24 * 60 * 60, // 90 days in seconds
    // セッション更新間隔: 1日ごとに延長
    updateAge: 24 * 60 * 60, // 24 hours in seconds
  },
  pages: {
    signIn: "/register",
    error: "/register",
  },
  providers: [
    // LINE Login (顧客向け)
    Line({
      clientId: process.env.LINE_CLIENT_ID!,
      clientSecret: process.env.LINE_CLIENT_SECRET!,
    }),

    // Email Magic Link (顧客向け)
    Resend({
      apiKey: process.env.RESEND_API_KEY!,
      from: "Men's hair MONE <noreply@mone0601.com>",
    }),

    // Credentials (管理者向け)
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // 初回サインイン時（userが存在する場合）
      if (user && account) {
        // データベースからユーザーを取得して正しいIDを設定
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { id: true, role: true },
        });

        if (dbUser) {
          token.sub = dbUser.id;
          token.role = dbUser.role;
        } else {
          // フォールバック
          token.role = user.role || "CUSTOMER";
          token.sub = user.id;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.role = token.role as UserRole;
      }
      return session;
    },
    async signIn({ user, account }) {
      // LINE/Email でサインインした場合、ユーザーが存在しなければ作成
      if (account?.provider === "line" || account?.provider === "resend") {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name,
              image: user.image,
              role: "CUSTOMER",
            },
          });
        }
      }
      return true;
    },
  },
});

// ヘルパー関数
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}

export async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden");
  }
  return user;
}

// API Route用: 管理者権限チェック
// 管理者でない場合は403レスポンスを返す、管理者の場合はnullを返す
export async function checkAdminAuth(): Promise<{
  error: Response | null;
  user: { id: string; name?: string | null; email?: string | null; role: string } | null;
}> {
  const session = await auth();

  if (!session?.user) {
    const { NextResponse } = await import("next/server");
    return {
      error: NextResponse.json({ error: "認証が必要です" }, { status: 401 }),
      user: null,
    };
  }

  if (session.user.role !== "ADMIN") {
    const { NextResponse } = await import("next/server");
    return {
      error: NextResponse.json({ error: "管理者権限が必要です" }, { status: 403 }),
      user: null,
    };
  }

  return { error: null, user: session.user };
}
