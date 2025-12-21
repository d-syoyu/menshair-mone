import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

// 変動ありのメニュー名リスト
const variableMenus = [
  // Color
  'カラー',
  '白髪染',
  'ブリーチ',
  'ハイライト・メッシュ',
  // Perm
  'デザインパーマ',
  'スパイラルパーマ',
  'ツイスト・波巻き系パーマ',
  // Straight Perm
  '全頭矯正',
]

// 変動なしのメニュー名リスト
const fixedMenus = [
  // Color
  '白髪ぼかし',
  // Perm
  'ポイントパーマ',
  'アイロンパーマハーフ',
  'アイロンパーマ',
  'ボリュームダウンパーマ',
  // Straight Perm
  'フロント矯正',
  'フロント＋サイド',
]

async function main() {
  console.log('📋 価格変動フラグを更新します...\n')

  // まず全メニューをリセット（priceVariable: false）
  await prisma.menu.updateMany({
    data: { priceVariable: false }
  })
  console.log('✅ 全メニューを変動なしにリセット')

  // 変動ありのメニューを更新
  for (const name of variableMenus) {
    const result = await prisma.menu.updateMany({
      where: { name },
      data: { priceVariable: true }
    })
    if (result.count > 0) {
      console.log(`✅ ${name}: 変動あり`)
    } else {
      console.log(`⚠️  ${name}: 見つかりません`)
    }
  }

  console.log('\n--- 確認 ---')
  const updated = await prisma.menu.findMany({
    where: { priceVariable: true },
    select: { name: true, price: true },
    orderBy: { name: 'asc' }
  })
  console.log('変動ありのメニュー:', updated.length, '件')
  updated.forEach(m => console.log(`  - ${m.name}: ¥${m.price}`))
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
