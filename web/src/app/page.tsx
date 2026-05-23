import HomeClient from "./HomeClient";
import { getNews, type BlogPost } from "@/lib/notion";
import { getClosedDaysForPublicSeo, getClosedDaysText } from "@/lib/business-settings";
import { buildHairSalonJsonLd, renderJsonLd } from "@/lib/seo";

export const revalidate = 3600;

function getDateKey(item: BlogPost) {
  if (item.publishedAt) {
    return item.publishedAt.replace(/\./g, "");
  }

  return item.createdAt?.replace(/[-T:.Z]/g, "").slice(0, 8) || "0";
}

function getLatestNewsItems(news: BlogPost[]) {
  return [...news]
    .sort((a, b) => getDateKey(b).localeCompare(getDateKey(a)))
    .slice(0, 3);
}

export default async function HomePage() {
  const [news, closedDaysText, closedDays] = await Promise.all([
    getNews(),
    getClosedDaysText(),
    getClosedDaysForPublicSeo(),
  ]);
  const initialNewsItems = getLatestNewsItems(news);
  const localBusinessJsonLd = buildHairSalonJsonLd(closedDays);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: renderJsonLd(localBusinessJsonLd),
        }}
      />
      <HomeClient initialNewsItems={initialNewsItems} closedDaysText={closedDaysText} />
    </>
  );
}
