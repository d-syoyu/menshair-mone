import HomeContent from "./HomeContent";
import { getHomeNews } from "@/lib/home-news";
import { getClosedDaysForPublicSeo, getClosedDaysText } from "@/lib/business-settings";
import { buildHairSalonJsonLd, renderJsonLd } from "@/lib/seo";

// お知らせ・定休日はキャッシュタグで即時に破棄されるため、時間ベースの再生成は1日1回の保険だけにする。
// （以前は1時間ごと＋cronで15分ごとに無条件で破棄しており、CDNキャッシュが頻繁に捨てられていた）
export const revalidate = 86400;

export default async function HomePage() {
  const [newsItems, closedDaysText, closedDays] = await Promise.all([
    getHomeNews(),
    getClosedDaysText(),
    getClosedDaysForPublicSeo(),
  ]);
  const localBusinessJsonLd = buildHairSalonJsonLd(closedDays);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: renderJsonLd(localBusinessJsonLd),
        }}
      />
      <HomeContent initialNewsItems={newsItems} closedDaysText={closedDaysText} />
    </>
  );
}
