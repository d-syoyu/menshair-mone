import * as dotenv from 'dotenv'
import { execSync } from 'child_process'

// 本番環境変数を読み込み
dotenv.config({ path: '.env' })

console.log('本番DBにスキーマをプッシュします...')
console.log('DATABASE_URL:', process.env.DATABASE_URL?.substring(0, 50) + '...')

execSync('npx prisma db push', {
  stdio: 'inherit',
  env: { ...process.env }
})
