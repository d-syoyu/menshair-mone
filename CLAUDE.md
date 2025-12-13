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

現在のコードは「LUMINA HAIR STUDIO」テンプレートをベースにしており、MONËブランド向けにカスタマイズが必要。

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 (PostCSS)
- **Animation:** Framer Motion
- **Icons:** Lucide React
- **Fonts:** Cormorant Garamond (serif), Zen Kaku Gothic New (sans)
- **Hosting:** Vercel (planned)

## Commands

```bash
cd web                # Navigate to web directory first
npm install           # Install dependencies
npm run dev           # Start development server (localhost:3000)
npm run build         # Production build
npm run lint          # Run ESLint
```

## Architecture

### Directory Structure

```
web/
├── src/
│   ├── app/              # App Router pages
│   │   ├── page.tsx      # Homepage
│   │   ├── menu/         # Menu & pricing
│   │   ├── staff/        # Staff profiles
│   │   ├── blog/         # Blog with [slug] dynamic route
│   │   ├── contact/      # Contact form
│   │   ├── layout.tsx    # Root layout with Header/Footer
│   │   └── globals.css   # Global styles & CSS variables
│   ├── components/       # Shared components (Header, Footer)
│   └── lib/utils.ts      # cn() utility for class merging
├── public/               # Static assets (images)
└── tailwind.config.ts    # Tailwind theme configuration
```

### Styling System

CSS variables defined in `globals.css` under `@theme`:
- `--color-cream`, `--color-cream-dark` - Background colors
- `--color-sage`, `--color-sage-light`, `--color-sage-dark` - Accent greens
- `--color-gold`, `--color-gold-light` - Gold accents
- `--color-charcoal`, `--color-warm-gray` - Text colors

Utility classes: `.container-narrow`, `.container-wide`, `.btn-primary`, `.btn-outline`, `.text-display`, `.text-heading`, `.text-subheading`

### Animation Pattern

Uses Framer Motion with reusable variants:
- `fadeInUp` - Fade in with upward motion
- `staggerContainer` - Container for staggered children
- `AnimatedSection` - Scroll-triggered section animation

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
- `/news` - お知らせ（CMS機能要）
- `/reservation` - 予約システム
- `/contact` - お問い合わせフォーム

**参考サイト:** https://beauty-salon-web.vercel.app/
