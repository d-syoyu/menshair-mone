import { getNews, type BlogPost } from '@/lib/notion';
import NewsClient from './NewsClient';

// モックニュースデータ（Notion未設定時のフォールバック）
const mockNews: BlogPost[] = [
  {
    id: '1',
    slug: 'year-end-notice',
    title: '年末年始の営業時間のお知らせ',
    excerpt: '年末年始の営業時間についてお知らせいたします。12月30日〜1月3日は休業とさせていただきます。',
    coverImage: null,
    publishedAt: '2025.12.10',
    category: 'お知らせ',
  },
  {
    id: '2',
    slug: 'new-premium-headspa',
    title: '新メニュー「プレミアムヘッドスパ」登場',
    excerpt: '頭皮の深層からケアする新しいヘッドスパメニューが登場しました。特別なアロマオイルを使用した極上のリラクゼーションをお楽しみください。',
    coverImage: null,
    publishedAt: '2025.12.01',
    category: '新メニュー',
  },
  {
    id: '3',
    slug: 'website-renewal',
    title: '公式Webサイトをリニューアルしました',
    excerpt: 'より使いやすく、見やすいWebサイトにリニューアルいたしました。オンライン予約も承っております。',
    coverImage: null,
    publishedAt: '2025.11.20',
    category: 'お知らせ',
  },
  {
    id: '4',
    slug: 'winter-campaign',
    title: '冬季限定キャンペーンのお知らせ',
    excerpt: '11月15日〜12月31日まで、ヘッドスパとシェービングのセットメニューが10% OFFとなるキャンペーンを実施中です。',
    coverImage: null,
    publishedAt: '2025.11.15',
    category: 'キャンペーン',
  },
  {
    id: '5',
    slug: 'november-holiday',
    title: '11月の定休日のお知らせ',
    excerpt: '11月の定休日は毎週月曜日と第3火曜日（21日）となります。ご予約の際はご確認ください。',
    coverImage: null,
    publishedAt: '2025.11.01',
    category: 'お知らせ',
  },
  {
    id: '6',
    slug: 'mens-depilation',
    title: 'メンズ脱毛メニュー開始',
    excerpt: 'ヒゲ脱毛、VIO脱毛、全身脱毛など、メンズ向け脱毛メニューを開始いたしました。清潔感を高めたい方におすすめです。',
    coverImage: null,
    publishedAt: '2025.10.20',
    category: '新メニュー',
  },
];

export const revalidate = 60; // 60秒ごとに再検証

export default async function NewsPage() {
  // Notionからニュースを取得
  let news = await getNews();

  // Notionデータがない場合はモックデータを使用
  if (news.length === 0) {
    news = mockNews;
  }

  return (
    <div className="min-h-screen pt-32">
      {/* Hero */}
      <section className="container-wide pb-20">
        <div className="text-center animate-fade-up">
          <p className="text-subheading mb-4">News</p>
          <h1 className="text-display mb-6">お知らせ</h1>
          <div className="divider-line mx-auto mb-8" />
          <p className="text-body max-w-lg mx-auto">
            サロンからのお知らせや<br />
            キャンペーン情報をお届けします。
          </p>
        </div>
      </section>

      {/* News List & CTA */}
      <NewsClient news={news} />
    </div>
  );
}
