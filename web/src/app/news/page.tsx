import { getNews } from '@/lib/notion';
import NewsClient from './NewsClient';

// 動的レンダリングに変更（キャッシュなし）
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewsPage() {
  // Notionからニュースを取得
  const news = await getNews();

  // 公開日の降順（新しい順）にソート
  // publishedAtがない場合はcreatedAtでソート
  const sortedNews = [...news].sort((a, b) => {
    // publishedAt は "YYYY.MM.DD" 形式、createdAt は ISO 8601 形式
    const dateA = a.publishedAt?.replace(/\./g, '') || a.createdAt?.replace(/[-T:Z.]/g, '').slice(0, 8) || '0';
    const dateB = b.publishedAt?.replace(/\./g, '') || b.createdAt?.replace(/[-T:Z.]/g, '').slice(0, 8) || '0';
    // 降順（新しい順）: dateB - dateA
    return dateB.localeCompare(dateA);
  });

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
      <NewsClient news={sortedNews} />
    </div>
  );
}
