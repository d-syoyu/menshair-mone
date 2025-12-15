// Neonデータベースに直接接続
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const DATABASE_URL = "postgresql://neondb_owner:npg_pBoMxrlRK7N2@ep-plain-hall-a1do0dps-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require";

async function main() {
  const pool = new Pool({ connectionString: DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.user.count();
    const sales = await prisma.sale.count();
    const categories = await prisma.category.count();
    const menus = await prisma.menu.count();
    const reservations = await prisma.reservation.count();

    console.log("=== Neon テーブル件数 ===");
    console.log("User:", users);
    console.log("Sale:", sales);
    console.log("Category:", categories);
    console.log("Menu:", menus);
    console.log("Reservation:", reservations);

    // 管理者ユーザーを確認
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true, name: true }
    });
    console.log("\n=== 管理者ユーザー ===");
    console.log(admins);

    // 最新のSaleを確認
    const latestSales = await prisma.sale.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      select: { id: true, saleNumber: true, createdAt: true, totalAmount: true }
    });
    console.log("\n=== 最新のSale ===");
    console.log(latestSales);

    // カテゴリ一覧
    const cats = await prisma.category.findMany({
      select: { id: true, name: true }
    });
    console.log("\n=== カテゴリ ===");
    console.log(cats);

  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
