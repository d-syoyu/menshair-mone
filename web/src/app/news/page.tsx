import { getNews } from '@/lib/notion';
import NewsClient from './NewsClient';

export const revalidate = 60; // 60秒ごとに再検証

export default async function NewsPage() {
  // Notionからニュースを取得
  const news = await getNews();

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
