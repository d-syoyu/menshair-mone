# AGENTS.md

このリポジトリで作業するエージェント向けの速習ドキュメントです。ブランドは「MONË / Men's hair MONE」。大人の男性向けプライベートサロンサイトで、予約・会員・管理(POS)を含むフルスタック構成です。

## 技術スタック
- Next.js 16 (App Router) / TypeScript / React 19
- Tailwind CSS 4 + Framer Motion / Lucide Icons
- Auth: NextAuth.js v5 (Resendメールマジックリンク + LINEログイン + 管理者用Credentials)
- DB: PostgreSQL + Prisma (adapter-pg、JWTセッション)
- CMS: Notion API (news / gallery / products)、画像は `/api/image-proxy` 経由
- Email: Resend

## ローカル開発の手順
1) `cd web`  
2) `npm install`  
3) `.env` に主要変数を設定  
   - DATABASE_URL, AUTH_SECRET, AUTH_URL
   - RESEND_API_KEY (メール送信)
   - LINE_CLIENT_ID / LINE_CLIENT_SECRET
   - NOTION_API_KEY, NOTION_DATABASE_ID_NEWS / _GALLERY / _PRODUCTS
   - ADMIN_EMAIL / ADMIN_PASSWORD (seed用の管理者資格情報)
4) よく使うコマンド  
   - `npm run dev` / `npm run build` / `npm run start`  
   - `npm run lint`  
   - `npm run db:seed` (Prisma Seed。サンプル顧客・メニュー・予約・POS売上・管理者アカウントを投入)  
   - `npx prisma db push` / `npx prisma generate` / `npx prisma studio`

## 主要機能とフロー
- 公開ページ: `/` トップ、`/menu`、`/about`、`/news`、`/gallery`、`/products`、`/blog`。Notion未設定時はフォールバックデータを表示。
- 認証: NextAuth v5 JWT。顧客は ResendメールまたはLINE、管理者は Credentials。`/register` で会員作成、`/login` で顧客ログイン、`/admin/login` で管理者ログイン。
- 予約: `/booking` でメニュー複数選択→空き枠検索(`/api/availability`が営業時間・不定休・既存予約を考慮)→`/booking/confirm`→`/booking/complete`。`/api/reservations` で作成/一覧/ステータス変更。`/mypage` で顧客の予約履歴。
- 管理(POS含む): `/admin` ダッシュボードで当日予約・週間/累計統計。配下に顧客、メニュー/カテゴリ、予約、休業日、クーポン/割引、店販カテゴリ・商品、決済方法、設定、売上/決済(POS)、レポート・分析(`/api/admin/*`)。管理者以外はアクセス不可。
- CMS連携: `src/lib/notion.ts` が news/gallery/products を取得し、環境変数未設定時は静的データを返す。

## データ/ドメインモデル(Prisma抜粋)
- User (CUSTOMER/ADMIN) と NextAuth用 Account/Session/VerificationToken
- Reservation / ReservationItem (複数メニュー・所要時間・金額をスナップショット保存)、Holiday(不定休/時間帯休業)
- Category / Menu (所要時間・最終受付時間含む)
- Sale / SaleItem / Payment (POS売上、複数決済対応)、Coupon / CouponUsage、Discount、Settings、PaymentMethodSetting
- Product / ProductCategory、News、Contact
- `prisma/seed.ts` はサンプル顧客・メニュー・予約・休業日・店販・クーポン/割引・売上データと管理者ユーザーを投入

## ディレクトリの要点
- `web/src/app` … ルートグループ (public, (auth), (customer), (admin), api) と各ページ/クライアントコンポーネント
- `web/src/components` … Header/Footer/FloatingButtons、UI、ブログレンダラー(Notion)
- `web/src/constants` … メニュー/予約/営業時間などの定数
- `web/src/lib` … NextAuth設定(`auth.ts`)、Prismaクライアント(`db.ts`)、Notion/画像プロキシ/バリデーション/日付ユーティリティ
- `prisma/` … `schema.prisma` と `seed.ts`
- `public/` … 画像・favicon 等

## デザイン/ブランドのヒント
- テーマ: ダークグレー基調 + グリーン差し色、上質・落ち着き・大人向け。`globals.css` でCSS変数が定義済み。
- `.claude/skills/` に背景・モーション・テーマ・タイポグラフィのプリセットメモあり。既存の高級感トーンを壊さないように。
