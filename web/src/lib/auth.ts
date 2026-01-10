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
import type { Adapter, AdapterAccount } from "next-auth/adapters";
import { createMagicLinkHtml, createMagicLinkText } from "./email";
import { Resend as ResendClient } from "resend";

// カスタムPrismaAdapter - useVerificationTokenの問題を修正
function CustomPrismaAdapter(): Adapter {
  const baseAdapter = PrismaAdapter(prisma);

  return {
    ...baseAdapter as object,
    // useVerificationTokenをオーバーライドして、identifier + tokenで削除
    async useVerificationToken(params: { identifier: string; token: string }) {
      try {
        // パラメータのバリデーション（identifier欠落エラーを防止）
        if (!params?.identifier || !params?.token) {
          console.error("[Auth] useVerificationToken: Missing required parameters", {
            hasIdentifier: !!params?.identifier,
            hasToken: !!params?.token,
          });
          return null;
        }

        // まずトークンを検索
        const verificationToken = await prisma.verificationToken.findUnique({
          where: {
            identifier_token: {
              identifier: params.identifier,
              token: params.token,
            },
          },
        });

        if (!verificationToken) {
          return null;
        }

        // トークンを削除（identifier + tokenの複合キーで削除）
        await prisma.verificationToken.delete({
          where: {
            identifier_token: {
              identifier: params.identifier,
              token: params.token,
            },
          },
        });

        return verificationToken;
      } catch (error) {
        // トークンが見つからない場合はnullを返す
        console.error("[Auth] useVerificationToken error:", error);
        return null;
      }
    },
    // linkAccountも型を修正
    async linkAccount(account: AdapterAccount) {
      await prisma.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state as string | undefined,
        },
      });
      return account;
    },
  };
}

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
  adapter: CustomPrismaAdapter(),
  trustHost: true,
  debug: true, // デバッグモードを有効化
  session: {
    strategy: "jwt",
    // セッション有効期限: 90日間（ブラウザを閉じても維持）
    maxAge: 90 * 24 * 60 * 60, // 90 days in seconds
    // セッション更新間隔: 1日ごとに延長
    updateAge: 24 * 60 * 60, // 24 hours in seconds
  },
  pages: {
    signIn: "/register",
    error: "/auth-error",
    verifyRequest: "/verify-request",
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
      from: "Men's hair MONE <noreply@mone.hair>",
      async sendVerificationRequest({ identifier: email, url, provider }) {
        const resend = new ResendClient(process.env.RESEND_API_KEY!);
        const host = new URL(url).host;
        const from = provider.from || "Men's hair MONE <noreply@mone.hair>";

        await resend.emails.send({
          from,
          to: email,
          subject: "【MONË】ログイン認証",
          html: createMagicLinkHtml({ url, host }),
          text: createMagicLinkText({ url, host }),
        });
      },
    }),

    // Credentials (管理者向け)
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "メールアドレス", type: "email" },
        password: { label: "パスワード", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.error('[Admin Login] Authorization attempt started');
          console.error('[Admin Login] Environment check:', {
            hasDatabaseUrl: !!process.env.DATABASE_URL,
            nodeEnv: process.env.NODE_ENV,
          });

          if (!credentials?.email || !credentials?.password) {
            console.error('[Admin Login] Missing credentials');
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          console.error(`[Admin Login] Looking up user: ${email}`);

          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.error(`[Admin Login] User not found: ${email}`);
            return null;
          }

          if (!user.password) {
            console.error(`[Admin Login] User has no password set: ${email}`);
            return null;
          }

          console.error(`[Admin Login] User found, checking password for: ${email}`);

          const isPasswordValid = await bcrypt.compare(password, user.password);

          if (!isPasswordValid) {
            console.error(`[Admin Login] Invalid password for: ${email}`);
            return null;
          }

          console.error(`[Admin Login] Login successful: ${email} (role: ${user.role})`);

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('[Admin Login] Authorization error:', {
            message: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            name: error instanceof Error ? error.name : undefined,
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 初回サインイン時（userが存在する場合）
      if (user) {
        // Credentialsプロバイダーの場合、userオブジェクトに直接roleが含まれている
        if (user.role) {
          token.sub = user.id;
          token.role = user.role;
        } else {
          // LINE/Emailプロバイダーの場合、データベースからroleを取得
          const dbUser = await prisma.user.findUnique({
            where: { email: user.email! },
            select: { id: true, role: true },
          });

          if (dbUser) {
            token.sub = dbUser.id;
            token.role = dbUser.role;
          } else {
            // フォールバック
            token.role = "CUSTOMER";
            token.sub = user.id;
          }
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
