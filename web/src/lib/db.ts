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

  // Serverless環境向けに最適化されたプール設定
  return new Pool({
    connectionString,
    // 最大接続数を制限（serverlessでは重要）
    max: 5,
    // アイドル接続のタイムアウト（30秒）
    idleTimeoutMillis: 30000,
    // 接続タイムアウト（10秒）
    connectionTimeoutMillis: 10000,
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

// 遅延初期化: 実際に使用される時のみPrismaClientを作成
function getPrismaClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Proxyを使用して遅延初期化を実現
// インポート時ではなく、実際にアクセスされた時にのみPrismaClientを作成
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    const client = getPrismaClient();
    const value = client[prop as keyof PrismaClient];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

// Poolのエクスポート（seed.tsなどで使用）
export function getPool(): Pool {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = createPool();
  }
  return globalForPrisma.pool;
}

export default prisma;
