# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Language

日本語で回答して

## Project Overview

MONË（モネ）- 印象派の画家クロード・モネから名付けられた男性専用プライベートビューティーサロンのWebサイト。

**コンセプト:** 「一人一人の男性に『光』と『印象』を…」
**ターゲット:** 大人のビジネスマン
**重点メニュー:** ヘッドスパ、シェービング
**スタイリスト:** 1名

現在のコードは「hairsalon_white_1」テンプレートをベースにしており、MONËブランド向けにカスタマイズが必要。

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 (PostCSS)
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Database:** PostgreSQL + Prisma ORM
- **Authentication:** NextAuth.js v5
- **Email:** Resend
- **Blog/CMS:** Notion API
- **Validation:** Zod
- **Hosting:** Vercel (planned)

## Commands

```bash
cd web                    # Navigate to web directory first
npm install               # Install dependencies
npm run dev               # Start development server (localhost:3000)
npm run build             # Production build
npm run lint              # Run ESLint
npm run db:seed           # Seed database with initial data
npx prisma generate       # Generate Prisma client
npx prisma db push        # Push schema to database
npx prisma studio         # Open Prisma Studio (DB GUI)
```

## Environment Variables

`.env.local` に以下の環境変数が必要:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
AUTH_SECRET="..."
AUTH_URL="http://localhost:3000"

# Notion (Blog)
NOTION_API_KEY="..."
NOTION_DATABASE_ID="..."

# Resend (Email)
RESEND_API_KEY="..."
```

## Architecture

### Directory Structure

```
web/
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── seed.ts           # Seed data
├── src/
│   ├── app/
│   │   ├── (admin)/      # Admin routes (protected)
│   │   │   └── admin/
│   │   │       ├── page.tsx          # Dashboard
│   │   │       ├── customers/        # Customer management
│   │   │       ├── menus/            # Menu management
│   │   │       ├── reservations/     # Reservation management
│   │   │       └── login/            # Admin login
│   │   ├── (auth)/       # Auth routes
│   │   │   ├── login/    # Customer login
│   │   │   └── register/ # Customer registration
│   │   ├── (customer)/   # Customer routes (protected)
│   │   │   ├── booking/  # Reservation flow
│   │   │   │   ├── page.tsx      # Menu selection
│   │   │   │   ├── confirm/      # Confirmation
│   │   │   │   └── complete/     # Completion
│   │   │   └── mypage/   # Customer dashboard
│   │   │       └── reservations/ # Reservation history
│   │   ├── api/          # API routes
│   │   │   ├── admin/    # Admin APIs
│   │   │   ├── auth/     # NextAuth routes
│   │   │   ├── availability/  # Time slot availability
│   │   │   ├── blog/     # Blog API (Notion)
│   │   │   └── reservations/  # Reservation CRUD
│   │   ├── blog/         # Blog pages
│   │   ├── menu/         # Public menu page
│   │   ├── staff/        # Staff profiles
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Homepage
│   │   └── globals.css   # Global styles
│   ├── components/       # Shared components
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   └── ui/           # UI components
│   ├── constants/        # Constants & menu data
│   ├── lib/              # Utilities
│   │   ├── auth.ts       # NextAuth config
│   │   ├── prisma.ts     # Prisma client
│   │   └── utils.ts      # Helper functions
│   └── middleware.ts     # Auth middleware
├── public/               # Static assets
└── tailwind.config.ts    # Tailwind configuration
```

### Database Models (Prisma)

- **User** - ユーザー（CUSTOMER / ADMIN）
- **Reservation** - 予約
- **ReservationItem** - 予約アイテム（複数メニュー対応）
- **Category** - メニューカテゴリ
- **Menu** - メニュー
- **News** - お知らせ
- **Contact** - お問い合わせ

### Authentication Flow

1. **Customer:** メール認証（マジックリンク）またはソーシャルログイン
2. **Admin:** メール + パスワード認証
3. **Middleware:** `/admin/*`, `/booking/*`, `/mypage/*` を保護

### Reservation Flow

1. `/booking` - メニュー選択（複数選択可）
2. `/booking/confirm` - 日時選択 & 確認
3. `/booking/complete` - 予約完了

## MONË Design Requirements

**カラーパレット:**
- メイン: ダークグレー（高級感・落ち着き）
- アクセント: グリーン（差し色）
- テキスト: 白 / ライトグレー

**トーン:** 高級感、落ち着き、モダン、洗練された大人の男性向け

**サイト構成（目標）:**
- `/` - トップページ（ヒーロー、コンセプト、メニュー抜粋、お知らせ、アクセス、予約CTA）
- `/menu` - メニュー・料金
- `/about` - 店舗情報、コンセプト、スタイリスト紹介、アクセス
- `/blog` - お知らせ・ブログ（Notion連携）
- `/booking` - 予約システム
- `/mypage` - マイページ（予約履歴）
- `/admin` - 管理画面

**参考サイト:** https://beauty-salon-web.vercel.app/

## Available Skills

デザイン・フロントエンド開発に活用できるスキルが `.claude/skills/` に定義されています：

| スキル | 用途 |
|--------|------|
| `backgrounds` | 奥行きのある雰囲気的な背景デザイン（レイヤードグラデーション、パターン、グラス効果） |
| `motion` | Framer Motionを使用したアニメーション・マイクロインタラクション |
| `themes` | 一貫したテーマデザイン（カラーパレット、CSS変数の活用） |
| `typography` | 印象的なタイポグラフィ選択（汎用フォントの回避、コントラストの活用） |

### MONË向けスキル適用指針

- **Backgrounds:** ダークグレーベースに微細なグラデーション・パターンで高級感を演出
- **Motion:** ページロード時のスタッガードアニメーション、ホバー時の控えめなエフェクト
- **Themes:** グレー×グリーンの一貫したカラーシステム、CSS変数で管理
- **Typography:** 見出しと本文のコントラストを活かした洗練されたタイポグラフィ
