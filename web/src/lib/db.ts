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

  const max = Number(process.env.DB_POOL_MAX ?? 5);

  // Neon Serverless環境向けに最適化されたプール設定
  return new Pool({
    connectionString,
    // ServerlessではインスタンスごとにPoolが作られるため控えめにする
    max,
    min: 0,
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
    log: process.env.PRISMA_CLIENT_LOGS
      ? process.env.PRISMA_CLIENT_LOGS.split(",").map((level) => level.trim()).filter(Boolean) as ("query" | "info" | "warn" | "error")[]
      : ["warn"],
  });
}

export function getPrisma(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }

  return globalForPrisma.prisma;
}

// 既存の `prisma.xxx` 呼び出しを保ったまま、初回アクセスまでDB接続を遅延する
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrisma();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});

// Poolのエクスポート（seed.tsなどで使用）
export function getPool(): Pool {
  if (!globalForPrisma.pool) {
    globalForPrisma.pool = createPool();
  }
  return globalForPrisma.pool;
}

export function getDatabaseErrorSummary(error: unknown): string {
  if (!error || typeof error !== "object") {
    return String(error);
  }

  const maybeError = error as {
    code?: string;
    message?: string;
    meta?: { code?: string } | null;
  };
  const code = maybeError.code ?? maybeError.meta?.code;
  const message = maybeError.message?.split("\n").find(Boolean)?.trim();

  return [code, message].filter(Boolean).join(": ") || "unknown database error";
}

export function logDatabaseFallback(scope: string, error: unknown, fallback: string) {
  console.warn(`[${scope}] Database unavailable (${getDatabaseErrorSummary(error)}). Using ${fallback}.`);
}

export default prisma;
