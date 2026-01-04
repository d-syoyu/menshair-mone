// lib/db.ts
// Prisma Client instance with PostgreSQL adapter
// Serverless最適化: 接続プーリングとコールドスタート対策

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not defined");
  }

  // Neon Serverless環境向けに最適化されたプール設定
  return new Pool({
    connectionString,
    // 最大接続数（Neon poolerに合わせて調整）
    max: 20,
    // 最小接続数（コールドスタート対策）
    min: 2,
    // アイドル接続のタイムアウト（60秒）
    idleTimeoutMillis: 60000,
    // 接続タイムアウト（30秒に延長）
    connectionTimeoutMillis: 30000,
    // 接続がアイドル状態でも維持
    allowExitOnIdle: false,
  });
}

function createPrismaClient(): PrismaClient {
  // Poolをグローバルにキャッシュして再利用
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = createPool();
  }

  const adapter = new PrismaPg(globalForPrisma.pool);

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });
}

// シングルトンパターンでPrismaClientを取得
// 開発環境ではホットリロード時に複数インスタンスが作られるのを防ぐ
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Poolのエクスポート（seed.tsなどで使用）
export function getPool(): Pool {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = createPool();
  }
  return globalForPrisma.pool;
}

export default prisma;
