// prisma/seed.ts
// Database seeding script for Hair Salon White

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Create Prisma client with adapter
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// サンプル顧客データ
const sampleCustomers = [
  { email: "tanaka@example.com", name: "田中 美咲", phone: "090-1234-5678" },
  { email: "suzuki@example.com", name: "鈴木 花子", phone: "080-2345-6789" },
  { email: "yamamoto@example.com", name: "山本 由美", phone: "070-3456-7890" },
  { email: "sato@example.com", name: "佐藤 恵", phone: "090-4567-8901" },
  { email: "ito@example.com", name: "伊藤 さくら", phone: "080-5678-9012" },
];

// カテゴリデータ
const categoryData = [
  { name: "カット", nameEn: "Cut", color: "#8B7355", displayOrder: 0 },
  { name: "カラー", nameEn: "Color", color: "#9F86C0", displayOrder: 1 },
  { name: "パーマ", nameEn: "Perm", color: "#E0B1CB", displayOrder: 2 },
  { name: "縮毛矯正", nameEn: "Straightening", color: "#F4A261", displayOrder: 3 },
  { name: "トリートメント", nameEn: "Treatment", color: "#98C1D9", displayOrder: 4 },
  { name: "スパ", nameEn: "Head Spa", color: "#2A9D8F", displayOrder: 5 },
  { name: "その他", nameEn: "Other", color: "#ADB5BD", displayOrder: 6 },
];

// メニューデータ
const menuData = [
  { name: "カット", category: "カット", price: 4950, duration: 60, lastBookingTime: "19:00", displayOrder: 0 },
  { name: "カラー（ショート）", category: "カラー", price: 4950, duration: 90, lastBookingTime: "18:00", displayOrder: 0 },
  { name: "カラー（ミディアム）", category: "カラー", price: 5500, duration: 90, lastBookingTime: "18:00", displayOrder: 1 },
  { name: "カラー（ロング）", category: "カラー", price: 6050, duration: 90, lastBookingTime: "18:00", displayOrder: 2 },
  { name: "カラー（スーパーロング）", category: "カラー", price: 6600, duration: 90, lastBookingTime: "18:00", displayOrder: 3 },
  { name: "ポイントパーマ", category: "パーマ", price: 4400, duration: 90, lastBookingTime: "18:00", displayOrder: 0 },
  { name: "パーマオール", category: "パーマ", price: 7700, duration: 90, lastBookingTime: "18:00", displayOrder: 1 },
  { name: "縮毛矯正", category: "縮毛矯正", price: 11000, duration: 100, lastBookingTime: "18:00", displayOrder: 0 },
  { name: "トリートメント", category: "トリートメント", price: 3300, duration: 60, lastBookingTime: "19:00", displayOrder: 0 },
  { name: "もみほぐしスパ", category: "スパ", price: 2200, duration: 60, lastBookingTime: "19:00", displayOrder: 0 },
  { name: "トリートメントスパ", category: "スパ", price: 2200, duration: 60, lastBookingTime: "19:00", displayOrder: 1 },
  { name: "シャンプーブロー", category: "その他", price: 1650, duration: 60, lastBookingTime: "19:00", displayOrder: 0 },
  { name: "ヘアセット", category: "その他", price: 1100, duration: 60, lastBookingTime: "19:00", displayOrder: 1 },
];

// サンプルメニュー（予約作成用 - 旧形式）
const sampleMenus = [
  { id: "menu-cut", name: "カット", price: 4950, duration: 60, category: "カット" },
  { id: "menu-color-medium", name: "カラー（ミディアム）", price: 5500, duration: 90, category: "カラー" },
  { id: "menu-color-long", name: "カラー（ロング）", price: 6050, duration: 90, category: "カラー" },
  { id: "menu-perm", name: "パーマオール", price: 7700, duration: 90, category: "パーマ" },
  { id: "menu-treatment", name: "トリートメント", price: 3300, duration: 60, category: "トリートメント" },
  { id: "menu-straightening", name: "縮毛矯正", price: 11000, duration: 100, category: "縮毛矯正" },
  { id: "menu-spa", name: "もみほぐしスパ", price: 2200, duration: 60, category: "スパ" },
  { id: "menu-shampoo", name: "シャンプーブロー", price: 1650, duration: 60, category: "その他" },
];

// 時間を追加するヘルパー関数
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60);
  const newM = totalMinutes % 60;
  return `${newH.toString().padStart(2, "0")}:${newM.toString().padStart(2, "0")}`;
}

async function main() {
  console.log("🌱 Seeding database...");

  // 管理者アカウント作成
  const adminEmail = process.env.ADMIN_EMAIL || "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin123";

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log(`✓ Admin user already exists: ${adminEmail}`);
  } else {
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await prisma.user.create({
      data: {
        email: adminEmail,
        name: "管理者",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log(`✓ Admin user created: ${adminEmail}`);
  }

  // カテゴリ作成
  console.log("📂 Creating categories...");
  const categories: { id: string; name: string }[] = [];
  for (const cat of categoryData) {
    const existing = await prisma.category.findUnique({
      where: { name: cat.name },
    });
    if (existing) {
      categories.push(existing);
      console.log(`  ✓ Category already exists: ${cat.name}`);
    } else {
      const created = await prisma.category.create({
        data: cat,
      });
      categories.push(created);
      console.log(`  ✓ Category created: ${cat.name}`);
    }
  }

  // メニュー作成
  console.log("🍽️ Creating menus...");
  for (const menu of menuData) {
    const category = categories.find((c) => c.name === menu.category);
    if (category) {
      const existing = await prisma.menu.findFirst({
        where: { name: menu.name, categoryId: category.id },
      });
      if (existing) {
        console.log(`  ✓ Menu already exists: ${menu.name}`);
      } else {
        await prisma.menu.create({
          data: {
            name: menu.name,
            categoryId: category.id,
            price: menu.price,
            duration: menu.duration,
            lastBookingTime: menu.lastBookingTime,
            displayOrder: menu.displayOrder,
          },
        });
        console.log(`  ✓ Menu created: ${menu.name}`);
      }
    }
  }

  // サンプル顧客作成
  console.log("👥 Creating sample customers...");
  const customers: { id: string; email: string | null; name: string | null }[] = [];
  for (const customer of sampleCustomers) {
    const existing = await prisma.user.findUnique({
      where: { email: customer.email },
    });
    if (existing) {
      customers.push(existing);
      console.log(`  ✓ Customer already exists: ${customer.name}`);
    } else {
      const created = await prisma.user.create({
        data: {
          email: customer.email,
          name: customer.name,
          phone: customer.phone,
          role: "CUSTOMER",
        },
      });
      customers.push(created);
      console.log(`  ✓ Customer created: ${customer.name}`);
    }
  }

  // 既存の予約を削除（再シード時のため）
  await prisma.reservationItem.deleteMany({});
  await prisma.reservation.deleteMany({});
  console.log("🗑️ Cleared existing reservations");

  // サンプル予約作成
  console.log("📅 Creating sample reservations...");

  // 2025/12/12（金）を基準日とする
  const baseDate = new Date("2025-12-12T00:00:00");

  // 予約作成ヘルパー関数（複数メニュー対応）
  const createReservation = async (
    date: Date,
    customerIndex: number,
    menuIndices: number[], // 複数メニューに対応
    startTime: string,
    status: "CONFIRMED" | "CANCELLED" | "NO_SHOW"
  ) => {
    const menus = menuIndices.map(i => sampleMenus[i]);
    const customer = customers[customerIndex];

    // 合計計算
    const totalPrice = menus.reduce((sum, m) => sum + m.price, 0);
    const totalDuration = menus.reduce((sum, m) => sum + m.duration, 0);
    const menuSummary = menus.map(m => m.name).join(" + ");
    const endTime = addMinutes(startTime, totalDuration);

    // 予約作成
    const reservation = await prisma.reservation.create({
      data: {
        userId: customer.id,
        totalPrice,
        totalDuration,
        menuSummary,
        date: date,
        startTime: startTime,
        endTime: endTime,
        status: status,
      },
    });

    // 予約アイテム作成
    for (let i = 0; i < menus.length; i++) {
      const menu = menus[i];
      await prisma.reservationItem.create({
        data: {
          reservationId: reservation.id,
          menuId: menu.id,
          menuName: menu.name,
          category: menu.category,
          price: menu.price,
          duration: menu.duration,
          orderIndex: i,
        },
      });
    }

    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
    console.log(`  ✓ ${dateStr}: ${startTime} - ${menuSummary} (${customer.name}) [${status}]`);
  };

  // 12/12（金）- 本日の予約
  await createReservation(baseDate, 0, [0], "10:00", "CONFIRMED");        // 田中 - カット
  await createReservation(baseDate, 1, [1, 4], "11:30", "CONFIRMED");     // 鈴木 - カラー + トリートメント
  await createReservation(baseDate, 2, [4], "14:00", "CONFIRMED");        // 山本 - トリートメント
  await createReservation(baseDate, 3, [0, 2], "15:30", "CONFIRMED");     // 佐藤 - カット + カラー（ロング）
  await createReservation(baseDate, 4, [6], "17:30", "CONFIRMED");        // 伊藤 - もみほぐしスパ

  // 12/13（土）
  const dec13 = new Date("2025-12-13T00:00:00");
  await createReservation(dec13, 2, [5], "10:30", "CONFIRMED");           // 山本 - 縮毛矯正
  await createReservation(dec13, 0, [3, 4], "13:00", "CONFIRMED");        // 田中 - パーマ + トリートメント
  await createReservation(dec13, 4, [0], "16:00", "CONFIRMED");           // 伊藤 - カット
  await createReservation(dec13, 1, [7], "18:00", "CONFIRMED");           // 鈴木 - シャンプーブロー

  // 12/14（日）
  const dec14 = new Date("2025-12-14T00:00:00");
  await createReservation(dec14, 3, [0, 6], "11:00", "CONFIRMED");        // 佐藤 - カット + スパ
  await createReservation(dec14, 0, [4], "14:00", "CONFIRMED");           // 田中 - トリートメント

  // 12/15（月）- 定休日のためスキップ

  // 12/10（火）- 過去の予約
  const dec10 = new Date("2025-12-10T00:00:00");
  await createReservation(dec10, 1, [0], "11:00", "CONFIRMED");           // 鈴木 - カット
  await createReservation(dec10, 3, [4], "14:30", "CANCELLED");           // 佐藤 - トリートメント（キャンセル）

  // 12/11（木）- 過去の予約
  const dec11 = new Date("2025-12-11T00:00:00");
  await createReservation(dec11, 4, [1, 4], "10:00", "CONFIRMED");        // 伊藤 - カラー + トリートメント
  await createReservation(dec11, 2, [0], "13:00", "CONFIRMED");           // 山本 - カット
  await createReservation(dec11, 0, [6], "16:00", "NO_SHOW");             // 田中 - もみほぐしスパ（無断キャンセル）

  console.log("✅ Seeding completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
