# MONË（モネ）公式Webサイト

男性専用プライベートビューティーサロン MONË の公式Webサイト

## 概要

- **サロン名**: MONË（モネ）- 印象派の画家クロード・モネから命名
- **コンセプト**: 「一人一人の男性に『光』と『印象』を…」
- **ターゲット**: 大人のビジネスマン
- **重点メニュー**: ヘッドスパ、シェービング

## 技術スタック

| 技術 | バージョン/詳細 |
|------|----------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Database | PostgreSQL + Prisma ORM |
| Authentication | NextAuth.js v5 |
| Email | Resend |
| CMS | Notion API |
| Hosting | Vercel（予定）|

## セットアップ

### 前提条件

- Node.js 18+
- PostgreSQL データベース
- 環境変数の設定

### インストール

```bash
# 依存関係のインストール
npm install

# Prisma クライアントの生成
npx prisma generate

# データベースのセットアップ
npx prisma db push

# シードデータの投入
npm run db:seed
```

### 環境変数

`.env.local` に以下を設定:

```env
# Database
DATABASE_URL="postgresql://..."

# NextAuth
AUTH_SECRET="..."
AUTH_URL="http://localhost:3000"

# LINE Login
LINE_CLIENT_ID="..."
LINE_CLIENT_SECRET="..."

# Notion (Blog/News)
NOTION_API_KEY="..."
NOTION_DATABASE_ID="..."

# Resend (Email)
RESEND_API_KEY="..."
```

### 開発サーバー

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) でアクセス

### その他のコマンド

```bash
npm run build      # 本番ビルド
npm run lint       # ESLint
npx prisma studio  # Prisma Studio（DB GUI）
```

## サイト構成

### 公開ページ
- `/` - トップページ
- `/menu` - メニュー・料金
- `/about` - 店舗情報
- `/news` - お知らせ（Notion連携）
- `/gallery` - ギャラリー
- `/products` - 店販商品
- `/staff` - スタイリスト紹介

### 認証ページ
- `/login` - ログイン（LINE / Magic Link）
- `/register` - 新規登録

### 顧客ページ（要認証）
- `/booking` - 予約（メニュー選択）
- `/booking/confirm` - 予約（確認）
- `/booking/complete` - 予約（完了）
- `/mypage` - マイページ
- `/mypage/reservations` - 予約履歴

### 管理画面（要管理者権限）
- `/admin` - ダッシュボード
- `/admin/reservations` - 予約管理
- `/admin/customers` - 顧客管理
- `/admin/menus` - メニュー管理
- `/admin/holidays` - 不定休設定
- `/admin/pos/*` - POS（会計・売上管理）

## 主要機能

### 予約システム
- 複数メニュー同時予約対応
- カレンダーによる空き状況確認
- クーポン適用
- 確認メール送信

### 管理画面
- 予約のタイムライン表示
- 顧客管理・検索
- メニュー・カテゴリ管理
- POS（会計・売上・クーポン・割引）
- 日報・月報

### 認証
- LINE Login（顧客向け）
- Magic Link（顧客向け）
- パスワード認証（管理者向け）

## ディレクトリ構成

```
web/
├── prisma/
│   ├── schema.prisma     # DBスキーマ
│   └── seed.ts           # シードデータ
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (admin)/      # 管理画面
│   │   ├── (auth)/       # 認証ページ
│   │   ├── (customer)/   # 顧客ページ
│   │   └── api/          # APIルート
│   ├── components/       # 共有コンポーネント
│   ├── constants/        # 定数
│   └── lib/              # ユーティリティ
└── public/               # 静的ファイル
```

## ライセンス

Private - All Rights Reserved
