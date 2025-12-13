# 画像使用状況レポート

## 画像ファイル一覧（publicディレクトリ）

### スタッフ画像
- `person1.png` - 山田 花子（Director）
- `person2.png` - 佐藤 美咲（Top Stylist）
- `staff-placeholder-1.jpg` - 未使用
- `staff-placeholder-2.jpg` - 未使用
- `staff-placeholder-3.jpg` - 未使用
- `staff-placeholder-4.jpg` - 未使用

### ブログ画像
- `blog1.png` - スタッフおすすめ！ホームケア商品
- `blog2.png` - 2024年春のヘアトレンド
- `blog3.png` - サロンリニューアルのお知らせ
- `blog4.png` - ヘッドスパの効果と魅力

### メニュー画像
- `cut.png` - カット
- `color.png` - カラー、ヘアセット、セットメニュー
- `treatments.png` - パーマ、縮毛矯正、髪質改善、トリートメント、ヘッドスパ
- `goods.png` - 店販商品

### サロン内装画像
- `full.png` - サロン内観（ホームページ、コンタクトページ）
- `seet.png` - スタイリングステーション（ホームページ）
- `counter.png` - 受付カウンター（ホームページ）

### その他
- `hero-placeholder.jpg` - 未使用
- `file.svg`, `globe.svg`, `window.svg`, `next.svg`, `vercel.svg` - 未使用（Next.jsデフォルト）

## 各ページでの画像使用状況

### 1. ホームページ (`/`)
- `/full.png` - ヒーロー背景（2箇所）
- `/seet.png` - コンセプトセクション
- `/cut.png` - カットサービス
- `/color.png` - カラーサービス
- `/treatments.png` - 髪質改善サービス
- `/person1.png` - 山田 花子
- `/person2.png` - 佐藤 美咲
- `/counter.png` - アクセスセクション

### 2. メニューページ (`/menu`)
- `/cut.png` - カットカテゴリ
- `/color.png` - カラーカテゴリ（3箇所で使用）
- `/treatments.png` - パーマ、縮毛矯正、髪質改善、トリートメント、ヘッドスパ（5箇所で使用）
- `/goods.png` - 店販商品カテゴリ

### 3. スタッフページ (`/staff`)
- `/person1.png` - 山田 花子
- `/person2.png` - 佐藤 美咲

### 4. ブログ一覧ページ (`/blog`)
- `/blog2.png` - 2024年春のヘアトレンド
- `/blog1.png` - スタッフおすすめ！ホームケア商品
- `/blog4.png` - ヘッドスパの効果と魅力
- `/blog3.png` - サロンリニューアルのお知らせ

### 5. ブログ詳細ページ (`/blog/[slug]`)
- `/blog2.png` - 2024年春のヘアトレンド
- `/blog1.png` - スタッフおすすめ！ホームケア商品
- `/blog4.png` - ヘッドスパの効果と魅力
- `/blog3.png` - サロンリニューアルのお知らせ

### 6. コンタクトページ (`/contact`)
- `/person1.png` - 山田 花子（スタイリスト選択）
- `/person2.png` - 佐藤 美咲（スタイリスト選択）
- `/full.png` - サイドバー画像

## 確認事項

### ✅ 正常な対応関係
- すべての画像パスが `/` で始まっており、`public` ディレクトリのルートを正しく参照している
- 各ページで使用されている画像ファイルは `public` ディレクトリに存在している
- ブログ画像の対応関係が正しい（blog1-4.png が正しい記事に割り当てられている）

### ⚠️ 注意事項
- `staff-placeholder-1.jpg` から `staff-placeholder-4.jpg` は定義されているが、コード内で使用されていない
- `hero-placeholder.jpg` も定義されているが、使用されていない
- 一部のSVGファイル（`file.svg`, `globe.svg`, `window.svg`）は未使用

### 🔍 確認が必要な点
- ユーザーが `website/public/images` に変更を加えたとのことですが、現在 `web/public/images` ディレクトリは存在しません
- 画像を `public/images/` に移動する場合は、すべての画像パスを `/images/` で始まるように更新する必要があります

