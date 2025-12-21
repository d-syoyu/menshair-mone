import * as dotenv from 'dotenv'

// 本番環境変数を読み込み
dotenv.config({ path: '.env' })

import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined')
}

const pool = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🧹 データベースクリーンアップを開始します...\n')

  // 外部キー制約を考慮した順序で削除

  // 1. ReservationItem（Reservationに依存）
  const reservationItems = await prisma.reservationItem.deleteMany()
  console.log(`✅ ReservationItem: ${reservationItems.count}件 削除`)

  // 2. CouponUsage（Couponに依存）
  const couponUsages = await prisma.couponUsage.deleteMany()
  console.log(`✅ CouponUsage: ${couponUsages.count}件 削除`)

  // 3. Payment（Saleに依存）
  const payments = await prisma.payment.deleteMany()
  console.log(`✅ Payment: ${payments.count}件 削除`)

  // 4. SaleItem（Saleに依存）
  const saleItems = await prisma.saleItem.deleteMany()
  console.log(`✅ SaleItem: ${saleItems.count}件 削除`)

  // 5. Sale（User, Reservation, Couponに依存 - SetNull）
  const sales = await prisma.sale.deleteMany()
  console.log(`✅ Sale: ${sales.count}件 削除`)

  // 6. Session（Userに依存）
  const sessions = await prisma.session.deleteMany()
  console.log(`✅ Session: ${sessions.count}件 削除`)

  // 7. Account（Userに依存）
  const accounts = await prisma.account.deleteMany()
  console.log(`✅ Account: ${accounts.count}件 削除`)

  // 8. VerificationToken（独立）
  const verificationTokens = await prisma.verificationToken.deleteMany()
  console.log(`✅ VerificationToken: ${verificationTokens.count}件 削除`)

  // 9. Reservation（User, Couponに依存）
  const reservations = await prisma.reservation.deleteMany()
  console.log(`✅ Reservation: ${reservations.count}件 削除`)

  // 10. User
  const users = await prisma.user.deleteMany()
  console.log(`✅ User: ${users.count}件 削除`)

  // 11. Coupon
  const coupons = await prisma.coupon.deleteMany()
  console.log(`✅ Coupon: ${coupons.count}件 削除`)

  // 12. Discount（独立）
  const discounts = await prisma.discount.deleteMany()
  console.log(`✅ Discount: ${discounts.count}件 削除`)

  // 13. News（独立）
  const news = await prisma.news.deleteMany()
  console.log(`✅ News: ${news.count}件 削除`)

  // 14. Holiday（独立）
  const holidays = await prisma.holiday.deleteMany()
  console.log(`✅ Holiday: ${holidays.count}件 削除`)

  console.log('\n🎉 クリーンアップ完了！')
}

main()
  .catch((e) => {
    console.error('❌ エラー:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
