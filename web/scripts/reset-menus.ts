import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// カテゴリ定義
const categories = [
  { name: 'カット', nameEn: 'Cut', color: '#8B7355', displayOrder: 1 },
  { name: 'カラー', nameEn: 'Color', color: '#CD853F', displayOrder: 2 },
  { name: 'パーマ', nameEn: 'Perm', color: '#6B8E23', displayOrder: 3 },
  { name: '縮毛矯正', nameEn: 'Straight Perm', color: '#4682B4', displayOrder: 4 },
  { name: 'スパ＆トリートメント', nameEn: 'Spa & Treatment', color: '#9370DB', displayOrder: 5 },
  { name: 'シャンプー＆セット', nameEn: 'Sp & Set', color: '#20B2AA', displayOrder: 6 },
  { name: 'メンズシェービング', nameEn: "Men's SV", color: '#708090', displayOrder: 7 },
]

// メニュー定義（価格の後ろに〜があるものはpriceVariable: true）
const menus: { category: string; name: string; price: number; priceVariable: boolean; duration: number; lastBookingTime: string }[] = [
  // Cut
  { category: 'カット', name: 'カット', price: 4950, priceVariable: false, duration: 60, lastBookingTime: '19:00' },
  { category: 'カット', name: 'カット＋ケアSV', price: 5500, priceVariable: false, duration: 75, lastBookingTime: '18:45' },
  { category: 'カット', name: 'カット＋メンズエステSV', price: 7150, priceVariable: false, duration: 90, lastBookingTime: '18:30' },
  { category: 'カット', name: 'カット＋メンズエステSV〜美顔器エステ〜', price: 8800, priceVariable: false, duration: 105, lastBookingTime: '18:15' },
  { category: 'カット', name: 'フェードカット', price: 5500, priceVariable: false, duration: 75, lastBookingTime: '18:45' },
  { category: 'カット', name: 'フェードカット＋ケアSV', price: 6050, priceVariable: false, duration: 90, lastBookingTime: '18:30' },
  { category: 'カット', name: 'フェードカット＋メンズエステSV', price: 7700, priceVariable: false, duration: 105, lastBookingTime: '18:15' },
  { category: 'カット', name: 'フェードカット＋メンズエステSV〜美顔器エステ〜', price: 9350, priceVariable: false, duration: 120, lastBookingTime: '18:00' },
  { category: 'カット', name: 'ジュニア', price: 2420, priceVariable: false, duration: 45, lastBookingTime: '19:15' },
  { category: 'カット', name: '小学生', price: 2970, priceVariable: false, duration: 45, lastBookingTime: '19:15' },
  { category: 'カット', name: '中学生', price: 3520, priceVariable: false, duration: 50, lastBookingTime: '19:10' },
  { category: 'カット', name: '高校生', price: 4070, priceVariable: false, duration: 55, lastBookingTime: '19:05' },

  // Color
  { category: 'カラー', name: 'カラー', price: 4950, priceVariable: true, duration: 60, lastBookingTime: '19:00' },
  { category: 'カラー', name: '白髪染', price: 4400, priceVariable: true, duration: 60, lastBookingTime: '19:00' },
  { category: 'カラー', name: '白髪ぼかし', price: 3850, priceVariable: false, duration: 45, lastBookingTime: '19:15' },
  { category: 'カラー', name: 'ブリーチ', price: 7150, priceVariable: true, duration: 90, lastBookingTime: '18:30' },
  { category: 'カラー', name: 'ハイライト・メッシュ', price: 7150, priceVariable: true, duration: 90, lastBookingTime: '18:30' },

  // Perm
  { category: 'パーマ', name: 'ポイントパーマ', price: 4400, priceVariable: false, duration: 60, lastBookingTime: '19:00' },
  { category: 'パーマ', name: 'デザインパーマ', price: 7700, priceVariable: true, duration: 90, lastBookingTime: '18:30' },
  { category: 'パーマ', name: 'スパイラルパーマ', price: 7700, priceVariable: true, duration: 90, lastBookingTime: '18:30' },
  { category: 'パーマ', name: 'ツイスト・波巻き系パーマ', price: 10450, priceVariable: true, duration: 120, lastBookingTime: '18:00' },
  { category: 'パーマ', name: 'アイロンパーマハーフ', price: 4400, priceVariable: false, duration: 60, lastBookingTime: '19:00' },
  { category: 'パーマ', name: 'アイロンパーマ', price: 7700, priceVariable: false, duration: 90, lastBookingTime: '18:30' },
  { category: 'パーマ', name: 'ボリュームダウンパーマ', price: 4400, priceVariable: false, duration: 60, lastBookingTime: '19:00' },

  // Straight Perm
  { category: '縮毛矯正', name: 'フロント矯正', price: 4400, priceVariable: false, duration: 60, lastBookingTime: '19:00' },
  { category: '縮毛矯正', name: 'フロント＋サイド', price: 6600, priceVariable: false, duration: 75, lastBookingTime: '18:45' },
  { category: '縮毛矯正', name: '全頭矯正', price: 11000, priceVariable: true, duration: 120, lastBookingTime: '18:00' },

  // Spa & Treatment
  { category: 'スパ＆トリートメント', name: 'もみほぐしクレンジングSPA', price: 2200, priceVariable: false, duration: 30, lastBookingTime: '19:30' },
  { category: 'スパ＆トリートメント', name: '頭皮エイジング予防ヘッドスパ〜皮脂・フケ・ニオイ改善〜', price: 4400, priceVariable: false, duration: 45, lastBookingTime: '19:15' },
  { category: 'スパ＆トリートメント', name: 'とろとろスパミルクの頭皮柔らかトリートメントスパ', price: 2200, priceVariable: false, duration: 30, lastBookingTime: '19:30' },
  { category: 'スパ＆トリートメント', name: 'オーガニックノートシステムトリートメント3step', price: 3300, priceVariable: false, duration: 30, lastBookingTime: '19:30' },
  { category: 'スパ＆トリートメント', name: 'オーガニックノートシステムトリートメント5step', price: 5500, priceVariable: false, duration: 45, lastBookingTime: '19:15' },
  { category: 'スパ＆トリートメント', name: '魔法のナノバブル', price: 1100, priceVariable: false, duration: 15, lastBookingTime: '19:45' },

  // Sp & Set
  { category: 'シャンプー＆セット', name: 'シャンプーブロー', price: 1650, priceVariable: false, duration: 30, lastBookingTime: '19:30' },
  { category: 'シャンプー＆セット', name: 'ヘアセット', price: 1100, priceVariable: false, duration: 20, lastBookingTime: '19:40' },

  // Men's SV
  { category: 'メンズシェービング', name: 'ケアSV', price: 2200, priceVariable: false, duration: 30, lastBookingTime: '19:30' },
  { category: 'メンズシェービング', name: 'メンズエステSV', price: 3850, priceVariable: false, duration: 45, lastBookingTime: '19:15' },
  { category: 'メンズシェービング', name: 'メンズエステSV〜美顔器エステ〜', price: 5500, priceVariable: false, duration: 60, lastBookingTime: '19:00' },
  { category: 'メンズシェービング', name: 'ノーズワックス', price: 1000, priceVariable: false, duration: 15, lastBookingTime: '19:45' },
]

async function main() {
  console.log('🗑️  既存のメニューとカテゴリを削除中...')

  // 既存のメニューを削除
  await prisma.menu.deleteMany()
  console.log('✅ Menu削除完了')

  // 既存のカテゴリを削除
  await prisma.category.deleteMany()
  console.log('✅ Category削除完了')

  console.log('\n📝 新しいカテゴリを作成中...')

  // カテゴリを作成
  const categoryMap: Record<string, string> = {}
  for (const cat of categories) {
    const created = await prisma.category.create({
      data: cat
    })
    categoryMap[cat.name] = created.id
    console.log(`  ✅ ${cat.name} (${cat.nameEn})`)
  }

  console.log('\n📝 新しいメニューを作成中...')

  // メニューを作成
  let displayOrder = 0
  let currentCategory = ''
  for (const menu of menus) {
    if (menu.category !== currentCategory) {
      displayOrder = 0
      currentCategory = menu.category
    }
    displayOrder++

    await prisma.menu.create({
      data: {
        name: menu.name,
        categoryId: categoryMap[menu.category],
        price: menu.price,
        priceVariable: menu.priceVariable,
        duration: menu.duration,
        lastBookingTime: menu.lastBookingTime,
        displayOrder,
        isActive: true,
      }
    })
  }

  console.log(`✅ ${menus.length}件のメニューを作成完了`)

  // 確認
  console.log('\n--- 変動ありメニュー ---')
  const variableMenus = await prisma.menu.findMany({
    where: { priceVariable: true },
    select: { name: true, price: true }
  })
  variableMenus.forEach(m => console.log(`  - ${m.name}: ¥${m.price}〜`))
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
