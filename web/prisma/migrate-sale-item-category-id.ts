// prisma/migrate-sale-item-category-id.ts
// 既存のSaleItemにcategoryIdを設定するマイグレーションスクリプト

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Create Prisma client with adapter
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🔄 Migrating SaleItem categoryId...");

  // メニューとカテゴリの関連を取得
  const menus = await prisma.menu.findMany({
    select: {
      id: true,
      categoryId: true,
    },
  });

  const menuCategoryMap = new Map<string, string>();
  for (const menu of menus) {
    menuCategoryMap.set(menu.id, menu.categoryId);
  }

  console.log(`📋 Found ${menus.length} menus`);

  // categoryIdがnullのSaleItemを取得（MENUタイプのもの）
  const saleItems = await prisma.saleItem.findMany({
    where: {
      itemType: "MENU",
      categoryId: null,
      menuId: { not: null },
    },
    select: {
      id: true,
      menuId: true,
      menuName: true,
    },
  });

  console.log(`📦 Found ${saleItems.length} SaleItems to update`);

  let updated = 0;
  let skipped = 0;

  for (const item of saleItems) {
    if (item.menuId) {
      const categoryId = menuCategoryMap.get(item.menuId);
      if (categoryId) {
        await prisma.saleItem.update({
          where: { id: item.id },
          data: { categoryId },
        });
        updated++;
        console.log(`  ✓ Updated: ${item.menuName} → categoryId: ${categoryId}`);
      } else {
        skipped++;
        console.log(`  ⚠ Skipped (menu not found): ${item.menuName}`);
      }
    }
  }

  console.log("");
  console.log("✅ Migration completed!");
  console.log(`   Updated: ${updated}`);
  console.log(`   Skipped: ${skipped}`);
}

main()
  .catch((e) => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
