import HomeClient from "./HomeClient";
import { getNews, type BlogPost } from "@/lib/notion";
import { getClosedDaysText } from "@/lib/business-settings";

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

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "HairSalon",
  name: "Men's hair MONE",
  alternateName: "MONË",
  url: "https://www.mone.hair",
  image: "https://www.mone.hair/og-image.jpg",
  telephone: "06-6908-4859",
  priceRange: "¥¥",
  address: {
    "@type": "PostalAddress",
    postalCode: "570-0036",
    addressRegion: "大阪府",
    addressLocality: "守口市",
    streetAddress: "八雲中町1-24-1",
    addressCountry: "JP",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 34.7411,
    longitude: 135.5708,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "10:00",
      closes: "21:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Saturday", "Sunday"],
      opens: "09:00",
      closes: "20:30",
    },
  ],
  sameAs: ["https://instagram.com/barber_shop0601mone"],
};

export default async function HomePage() {
  const [news, closedDaysText] = await Promise.all([
    getNews(),
    getClosedDaysText(),
  ]);
  const initialNewsItems = getLatestNewsItems(news);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localBusinessJsonLd).replace(/</g, "\\u003c"),
        }}
      />
      <HomeClient initialNewsItems={initialNewsItems} closedDaysText={closedDaysText} />
    </>
  );
}
