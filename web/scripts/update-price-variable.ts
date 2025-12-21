import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

async function main() {
  // 「～」を含むメニューを検索
  const menusWithTilde = await prisma.menu.findMany({
    where: {
      name: { contains: '〜' }
    },
    select: { id: true, name: true, priceVariable: true }
  })

  console.log('「～」を含むメニュー:', menusWithTilde.length, '件')
  menusWithTilde.forEach(m => console.log('  -', m.name))

  // priceVariable を true に更新
  const result = await prisma.menu.updateMany({
    where: {
      name: { contains: '〜' }
    },
    data: {
      priceVariable: true
    }
  })

  console.log('\n✅ 更新完了:', result.count, '件')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
