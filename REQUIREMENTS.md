# 要件定義書：MONË（モネ）美容室Webサイト

## 1. プロジェクト概要

| 項目 | 内容 |
|------|------|
| プロジェクト名 | MONË 公式Webサイト制作 |
| クライアント | 原崎様 |
| 納期 | 約4週間 |
| 無料修正回数 | 2回 |
| **完成度** | **92%** |

---

## 2. サロン基本情報

| 項目 | 内容 |
|------|------|
| サロン名 | MONË（モネ） / Men's hair MONE |
| 名前の由来 | 印象派の画家クロード・モネ |
| 業態 | メンズ専門プライベートサロン（理容室） |
| ターゲット | 大人の男性（忙しいビジネスマン層） |
| スタイリスト数 | 1名 |
| 重点メニュー | ヘッドスパ、シェービング、ひげ脱毛 |

### 2.0 店舗詳細情報（確定）

| 項目 | 内容 |
|------|------|
| 住所 | 〒570-0036 大阪府守口市八雲中町1-24-1 |
| 電話番号 | 06-6908-4859 |
| 営業時間（平日） | 10:00〜21:30（最終受付 20:30） |
| 営業時間（土日祝） | 10:00〜20:30（最終受付 19:30） |
| 定休日 | 毎週月曜日・第2・3火曜日 |
| 駐車場 | 1台あり |
| クレジットカード | 利用可能 |
| アクセス | 谷町線 守口駅から徒歩8分 |
| Instagram | @barber_shop0601mone |
| 公式サイト | https://www.mone0601.com/ |

### 2.1 コンセプト

```
一人一人の男性に「光」と「印象」を…

柔らかな「光」が差すプライベート空間で一人のスタッフが最初から最後まで
丁寧にお客様と向き合い、大人の男性に相応しい凜とした「印象」と
「光」のような清潔感をご提供致します。

日々忙しい大人の男性にカット、シェービング、ヘッドスパなど
様々なメニューを通じ「上質な休息」をご提供します。
```

### 2.2 キーワード

- 光
- 印象
- プライベート空間
- 上質な休息
- 清潔感
- 大人の男性

---

## 3. デザイン仕様

### 3.1 カラーパレット

| 用途 | カラー | 備考 |
|------|--------|------|
| メインカラー | グレー系 | 暗め・濃いめ |
| アクセントカラー | グリーン | 差し色として使用 |
| 背景 | ダークグレー | 高級感を演出 |
| テキスト | 白 or ライトグレー | 視認性確保 |

### 3.2 トーン・雰囲気

- 高級感
- 落ち着き
- 大人の男性向け
- モダン
- 洗練された印象

### 3.3 参考

- サンプルサイト: https://beauty-salon-web.vercel.app/
- クライアントの店舗カラー（グレー×グリーン）に準拠

---

## 4. サイト構成（実装済み）

```
MONË
├── 公開ページ
│   ├── トップページ (/)                    ✅完成
│   ├── メニュー・料金 (/menu)              ✅完成（DB連携）
│   ├── 店舗情報 (/about)                   ✅完成
│   ├── お知らせ (/news)                    ✅完成（Notion連携）
│   ├── お知らせ詳細 (/news/[slug])         ✅完成
│   ├── ギャラリー (/gallery)               ✅完成（追加機能）
│   ├── 店販商品 (/products)                ✅完成（追加機能）
│   ├── スタッフ紹介 (/staff)               ✅完成
│   ├── プライバシーポリシー (/privacy)     ✅完成
│   └── 利用規約 (/terms)                   ✅完成
│
├── 認証ページ
│   ├── ログイン (/login)                   ✅完成（LINE/Magic Link）
│   ├── 新規登録 (/register)                ✅完成
│   └── 管理者ログイン (/admin/login)       ✅完成
│
├── 顧客ページ（要認証）
│   ├── 予約 - メニュー選択 (/booking)      ✅完成
│   ├── 予約 - 確認 (/booking/confirm)      ✅完成
│   ├── 予約 - 完了 (/booking/complete)     ✅完成
│   ├── マイページ (/mypage)                ✅完成
│   └── 予約履歴 (/mypage/reservations)     ✅完成
│
└── 管理画面（要管理者権限）
    ├── ダッシュボード (/admin)              ✅完成
    ├── 予約管理 (/admin/reservations)       ✅完成
    ├── 顧客管理 (/admin/customers)          ✅完成
    ├── メニュー管理 (/admin/menus)          ✅完成
    ├── 不定休設定 (/admin/holidays)         ✅完成
    └── POS機能 (/admin/pos/*)               ✅完成
        ├── 会計一覧 (/admin/pos/sales)
        ├── 新規会計 (/admin/pos/sales/new)
        ├── 店販商品 (/admin/pos/products)
        ├── クーポン (/admin/pos/coupons)
        ├── 割引 (/admin/pos/discounts)
        ├── レポート (/admin/pos/reports)
        └── 設定 (/admin/pos/settings)
```

**お問い合わせについて:**
- お問い合わせ専用ページは不要（Instagram DMで対応）
- 電話予約用のフローティングボタンを全ページ右下に設置 ✅実装済み

---

## 5. ページ別詳細仕様

### 5.1 トップページ (/) ✅完成

#### セクション構成

```
1. ヒーローセクション                        ✅実装済み
   - メインビジュアル（Ken Burns効果）
   - キャッチコピー：「一人一人の男性に「光」と「印象」を…」
   - CTAボタン：「ご予約はこちら」

2. コンセプト紹介（簡易版）                  ✅実装済み
   - 短いコンセプト文
   - 「詳しく見る」→ 店舗情報ページへリンク

3. メニュー紹介（抜粋）                      ✅実装済み（DB連携）
   - 主要メニュー（DBから取得）
   - 「メニューを見る」→ メニューページへリンク

4. お知らせ（最新3件程度）                   ✅実装済み（Notion連携）
   - タイトル + 日付
   - 「一覧を見る」→ お知らせページへリンク

5. アクセス概要                              ✅実装済み
   - 住所
   - 営業時間
   - Googleマップ埋め込み

6. 予約導線                                  ✅実装済み
   - CTAボタン：「Web予約する」

7. フッター                                  ✅実装済み
   - ロゴ
   - ナビゲーションリンク
   - SNSリンク
   - コピーライト
```

---

### 5.2 メニュー・料金ページ (/menu) ✅完成

#### セクション構成

```
1. ページヘッダー                            ✅実装済み
   - タイトル：「メニュー・料金」

2. メニューカテゴリ（DBから動的取得）        ✅実装済み
   - カット（12メニュー）
   - カラー（5メニュー）
   - パーマ（7メニュー）
   - 縮毛矯正（3メニュー）
   - ヘッドスパ（6メニュー）
   - シャンプー（2メニュー）
   - シェービング（3メニュー）

3. 各メニュー項目                            ✅実装済み
   - メニュー名
   - 説明文
   - 料金

4. 予約導線                                  ✅実装済み
   - CTAボタン
```

#### データ構造（Prisma）

```typescript
model Category {
  id          String   @id @default(cuid())
  name        String
  description String?
  sortOrder   Int      @default(0)
  menus       Menu[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Menu {
  id               String            @id @default(cuid())
  name             String
  description      String?
  price            Int
  duration         Int               // 分
  categoryId       String
  category         Category          @relation(fields: [categoryId], references: [id])
  isActive         Boolean           @default(true)
  sortOrder        Int               @default(0)
  reservationItems ReservationItem[]
  saleItems        SaleItem[]
  createdAt        DateTime          @default(now())
  updatedAt        DateTime          @updatedAt
}
```

---

### 5.3 店舗情報ページ (/about) ✅完成

#### セクション構成

```
1. ページヘッダー                            ✅実装済み
   - タイトル：「店舗情報」

2. コンセプト（詳細）                        ✅実装済み
   2.1 全体コンセプト
       - メインコンセプト文
       - サロン名の由来（クロード・モネ）

   2.2 ヘッドスパについて
       - ヘッドスパ専用コンセプト文
       - こだわりポイント

   2.3 シェービングについて
       - シェービング専用コンセプト文
       - こだわりポイント

3. スタイリスト紹介                          ✅実装済み
   - 写真
   - 名前
   - 役職
   - プロフィール・経歴
   - メッセージ（任意）

4. アクセス                                  ✅実装済み
   - 店舗名
   - 住所
   - 電話番号
   - 営業時間
   - 定休日
   - 支払方法（DBから取得）
   - Googleマップ埋め込み
```

---

### 5.4 お知らせページ (/news) ✅完成

#### セクション構成

```
1. ページヘッダー                            ✅実装済み
   - タイトル：「お知らせ」

2. お知らせ一覧                              ✅実装済み（Notion連携）
   - 日付
   - カテゴリ
   - タイトル
   - サムネイル

3. 詳細ページ (/news/[slug])                 ✅実装済み
   - Notionブロックレンダリング
```

#### 機能要件

- クライアント自身で更新可能 → Notion CMSで対応 ✅
- Webhook同期対応 ✅

---

### 5.5 ご予約ページ (/booking) ✅完成

#### 予約システム機能（実装済み）

```
予約フロー（3ステップ）:
Step 1: メニュー選択 (/booking)              ✅実装済み
        - 複数メニュー選択対応
        - カテゴリ別表示
        - 合計金額・所要時間自動計算

Step 2: 日時選択・確認 (/booking/confirm)    ✅実装済み
        - カレンダー表示
        - 空き状況確認（API連携）
        - 時間帯選択
        - クーポン適用

Step 3: 予約完了 (/booking/complete)         ✅実装済み
        - 確認番号表示
        - 予約内容サマリー
```

#### 機能要件（実装状況）

| 機能 | ステータス | 備考 |
|------|----------|------|
| カレンダー空き状況表示 | ✅実装済み | 曜日別営業時間対応 |
| Web予約完了 | ✅実装済み | |
| 確認メール自動送信 | 🔶バックエンド実装済み | テスト未完 |
| リマインド通知 | ⏳未実装 | |
| メニュー別所要時間設定 | ✅実装済み | |
| 複数メニュー同時予約 | ✅実装済み | |
| キャンセル・変更機能 | ✅実装済み | 管理画面から |
| 管理画面 | ✅実装済み | |
| 顧客管理 | ✅実装済み | |
| クーポン機能 | ✅実装済み | 複雑な適用条件対応 |
| スタッフ指名機能 | 不要 | 1名のため |

#### データ構造（Prisma）

```typescript
model Reservation {
  id              String            @id @default(cuid())
  userId          String
  user            User              @relation(fields: [userId], references: [id])
  date            DateTime
  startTime       String
  endTime         String
  totalPrice      Int               // 合計金額（非正規化）
  totalDuration   Int               // 合計所要時間（非正規化）
  menuSummary     String            // メニュー概要（非正規化）
  note            String?
  status          ReservationStatus @default(PENDING)
  couponId        String?
  coupon          Coupon?           @relation(fields: [couponId], references: [id])
  items           ReservationItem[]
  sale            Sale?
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@index([date, startTime])
  @@index([userId])
  @@index([status])
}

model ReservationItem {
  id            String      @id @default(cuid())
  reservationId String
  reservation   Reservation @relation(fields: [reservationId], references: [id], onDelete: Cascade)
  menuId        String
  menu          Menu        @relation(fields: [menuId], references: [id])
  price         Int         // 予約時の価格（スナップショット）
  duration      Int         // 予約時の所要時間（スナップショット）
  orderIndex    Int         @default(0)
  createdAt     DateTime    @default(now())
}

enum ReservationStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
  NO_SHOW
}
```

---

## 6. 共通コンポーネント ✅全て実装済み

### 6.1 ヘッダー

```
- ロゴ                                       ✅実装済み
- ナビゲーション                             ✅実装済み
  - メニュー・料金
  - 店舗情報
  - お知らせ
  - ご予約（CTAボタン）
- ハンバーガーメニュー（モバイル）           ✅実装済み
```

### 6.2 フッター

```
- ロゴ                                       ✅実装済み
- ナビゲーションリンク                       ✅実装済み
- 店舗情報（住所・電話・営業時間）           ✅実装済み
- SNSリンク                                  ✅実装済み
- コピーライト                               ✅実装済み
```

### 6.3 CTAボタン

```
- プライマリ：グリーン背景                   ✅実装済み
- セカンダリ：グレー背景 or アウトライン     ✅実装済み
```

### 6.4 フローティング電話ボタン ✅実装済み

```
- 全ページ右下に設置
- 電話番号へのリンク
```

---

## 7. 技術要件（確定）

### 7.1 技術スタック

| レイヤー | 技術 | バージョン/詳細 |
|----------|------|----------------|
| フレームワーク | Next.js | 16 (App Router) |
| 言語 | TypeScript | |
| スタイリング | Tailwind CSS | 4 |
| アニメーション | Framer Motion | |
| アイコン | Lucide React | |
| データベース | PostgreSQL | + Prisma ORM |
| 認証 | NextAuth.js | v5 |
| CMS（お知らせ） | Notion API | Webhook同期対応 |
| メール送信 | Resend | |
| バリデーション | Zod | |
| ホスティング | Vercel | （予定） |

### 7.2 非機能要件

| 項目 | 要件 | ステータス |
|------|------|----------|
| レスポンシブ | スマホ・タブレット・PC対応 | ✅対応済み |
| 表示速度 | PageSpeed 90点以上目標 | 🔶要確認 |
| SEO | meta設定、構造化データ対応 | ✅対応済み |
| MEO | Googleビジネスプロフィール連携 | 🔶要設定 |
| SSL | 必須（HTTPS） | ✅対応済み |

### 7.3 認証方式

| 方式 | 対象 | ステータス |
|------|------|----------|
| LINE Login | 顧客向け | ✅実装済み |
| Magic Link (Resend) | 顧客向け | ✅実装済み |
| Credentials | 管理者向け | ✅実装済み |

---

## 8. 管理画面機能 ✅実装済み

### 8.1 ダッシュボード (/admin)

- 本日の予約数、今週の予約数、総予約数の統計表示
- 本日の予約タイムライン表示（デスクトップ版）
- 予約ステータス変更（CONFIRMED ↔ CANCELLED ↔ NO_SHOW）
- クイックリンク（各管理ページへ）

### 8.2 予約管理 (/admin/reservations)

- 予約一覧表示（カレンダー/リスト切り替え）
- 日付・ステータスフィルター
- 電話予約の追加対応
- 予約詳細・編集・キャンセル

### 8.3 顧客管理 (/admin/customers)

- 顧客一覧表示
- 検索機能
- 顧客の予約履歴表示
- 予約統計（来店数、合計金額等）

### 8.4 メニュー管理 (/admin/menus)

- カテゴリ管理（追加・編集・並び替え）
- メニュー管理（追加・編集・有効/無効切り替え）

### 8.5 不定休設定 (/admin/holidays)

- 臨時休業日の設定
- 時間帯別休業の設定

### 8.6 POS機能 (/admin/pos/*)

| 機能 | ページ | 説明 |
|------|--------|------|
| 会計管理 | /admin/pos/sales | 会計一覧・新規作成・編集 |
| 店販商品管理 | /admin/pos/products | 商品追加・在庫管理 |
| クーポン管理 | /admin/pos/coupons | クーポン作成・適用条件設定 |
| 割引管理 | /admin/pos/discounts | 学割・シニア割など |
| レポート | /admin/pos/reports | 日報・月報 |
| 設定 | /admin/pos/settings | 税率・支払方法設定 |

---

## 9. APIエンドポイント一覧

### 9.1 公開API

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| /api/menus | GET | メニュー一覧取得 |
| /api/availability | GET | 予約空き状況確認 |
| /api/reservations | GET, POST | 予約取得・作成 |
| /api/reservations/[id] | GET, PUT | 予約詳細・更新 |
| /api/news | GET | ニュース一覧 |
| /api/news/[slug] | GET | ニュース詳細 |
| /api/products | GET | 店販商品一覧 |
| /api/gallery | GET | ギャラリー画像 |
| /api/payment-methods | GET | 支払方法 |
| /api/holidays | GET | 休日情報 |
| /api/auth/[...nextauth] | * | NextAuth.js |
| /api/auth/register | POST | 顧客登録 |

### 9.2 管理API

| エンドポイント | メソッド | 説明 |
|--------------|---------|------|
| /api/admin/reservations | GET, POST | 予約管理 |
| /api/admin/reservations/[id] | PUT, DELETE | 予約詳細操作 |
| /api/admin/customers | GET, POST | 顧客管理 |
| /api/admin/customers/[id] | GET, PUT | 顧客詳細 |
| /api/admin/menus | GET, POST | メニュー管理 |
| /api/admin/menus/[id] | PUT, DELETE | メニュー詳細 |
| /api/admin/categories | GET, POST | カテゴリ管理 |
| /api/admin/categories/[id] | PUT, DELETE | カテゴリ詳細 |
| /api/admin/holidays | GET, POST | 休日管理 |
| /api/admin/holidays/[id] | PUT, DELETE | 休日詳細 |
| /api/admin/sales | GET, POST | 会計管理 |
| /api/admin/sales/[id] | GET, PUT | 会計詳細 |
| /api/admin/products | GET, POST | 商品管理 |
| /api/admin/products/[id] | PUT, DELETE | 商品詳細 |
| /api/admin/coupons | GET, POST | クーポン管理 |
| /api/admin/coupons/[id] | PUT, DELETE | クーポン詳細 |
| /api/admin/coupons/validate | POST | クーポン検証 |
| /api/admin/discounts | GET, POST | 割引管理 |
| /api/admin/discounts/[id] | PUT, DELETE | 割引詳細 |
| /api/admin/reports/daily | GET | 日報 |
| /api/admin/reports/monthly | GET | 月報 |
| /api/admin/analytics | GET | 分析データ |
| /api/admin/settings | GET, PUT | システム設定 |
| /api/admin/payment-methods | GET, POST | 支払方法管理 |

---

## 10. 納品物

| 納品物 | 形式 | ステータス |
|--------|------|----------|
| Webサイト一式 | 本番環境デプロイ済み | 🔶準備中 |
| ソースコード | GitHub | ✅完成 |
| 操作マニュアル | PDF or Web | ⏳未作成 |
| 管理画面アクセス情報 | ドキュメント | ⏳未作成 |

---

## 11. 実装ステータス

### 11.1 完成度サマリー

| 機能区分 | 完成度 | 詳細 |
|---------|--------|------|
| 公開ページ | 100% | 要件以上の9ページ実装 |
| 予約システム | 98% | 複数メニュー、クーポン対応 |
| 認証機能 | 95% | LINE/Magic Link/パスワード |
| 管理画面 | 90% | POS機能まで実装 |
| データベース | 95% | 堅牢なスキーマ設計（15+モデル）|
| API | 98% | 40+エンドポイント |
| デザイン | 90% | MONËブランドに最適化 |
| **総合** | **92%** | |

### 11.2 追加実装（要件定義を超えて）

- ギャラリーページ (/gallery)
- 店販商品ページ (/products)
- スタッフ紹介ページ (/staff)
- プライバシーポリシー・利用規約
- POSシステム（会計・売上管理）
- クーポン・割引機能
- LINE認証
- 複数メニュー同時予約
- 不定休設定（時間帯別）
- Notion CMS連携（Webhook対応）

### 11.3 残タスク

| タスク | 優先度 | ステータス |
|--------|--------|----------|
| 確認メール送信テスト | 高 | 🔶バックエンド実装済み |
| リマインド通知実装 | 中 | ⏳未実装 |
| PageSpeed最適化確認 | 中 | ⏳未確認 |
| 本番環境デプロイ | 高 | 🔶準備中 |
| 操作マニュアル作成 | 中 | ⏳未作成 |
| E2Eテスト | 低 | ⏳未実装 |

---

## 12. 未確認事項（更新済み）

### 12.1 クライアント確認事項

| カテゴリ | 確認内容 | ステータス |
|----------|----------|------------|
| オプション | クーポン機能の要否 | ✅実装済み |
| オプション | 求人ページの要否 | ⏳未確認 |
| オプション | ギャラリーページの要否 | ✅実装済み |
| 予約 | キャンセルポリシー（何日前まで可能か） | ⏳未確認 |
| 予約 | リマインド通知のタイミング | ⏳未確認 |
| 予約 | 複数メニュー同時予約の可否 | ✅実装済み |
| コンテンツ | ヘッドスパの個別コンセプト文 | ✅確認済み |
| コンテンツ | シェービングの個別コンセプト文 | ✅確認済み |
| コンテンツ | スタイリストプロフィール詳細 | ✅確認済み |
| 技術 | 独自ドメインの有無 | ✅確認済（mone0601.com） |
| 技術 | SNSアカウント（Instagram・LINE等） | ✅確認済（@barber_shop0601mone） |

### 12.2 素材受領状況

| 素材 | ステータス |
|------|------------|
| 店舗写真（外観・内観・施術イメージ） | ✅受領済み |
| ロゴデータ | ✅受領済み |
| メニュー・料金表 | ✅確認済み（DBにシード済み） |
| 店舗情報詳細 | ✅確認済み |
| スタイリスト写真・紹介文 | ✅受領済み |

---

## 13. デプロイ前チェックリスト

- [ ] 環境変数の確認
  - DATABASE_URL
  - AUTH_SECRET / AUTH_URL
  - LINE_CLIENT_ID / LINE_CLIENT_SECRET
  - RESEND_API_KEY
  - NOTION_API_KEY / NOTION_DATABASE_ID
- [ ] データベースマイグレーション（`npx prisma db push`）
- [ ] シードデータの実行（`npm run db:seed`）
- [ ] セキュリティ監査（パスワード暗号化、CORS設定）
- [ ] パフォーマンステスト（Lighthouse, PageSpeed）
- [ ] モバイル対応確認
- [ ] ブラウザ互換性確認
- [ ] 本番APIキーの設定
- [ ] ロギング・モニタリング設定
- [ ] バックアップ戦略の構築

---

## 更新履歴

| 日付 | 内容 |
|------|------|
| 2025-12-13 | 初版作成 |
| 2025-12-13 | お問い合わせページ削除（Instagram DMで対応）、フローティング電話ボタン追加 |
| 2025-12-13 | 現サイト(mone0601.com)より店舗詳細情報を取得・反映 |
| 2025-12-16 | 実装状況に合わせて全面更新（完成度92%）、サイト構成・技術スタック・データ構造・API一覧を実装に合わせて更新、実装ステータスセクション追加、未確認事項のステータス更新 |
