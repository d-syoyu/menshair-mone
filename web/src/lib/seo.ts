import { SALON_INFO } from "@/constants/salon";
import type { BlogPost, BlogPostDetail, GalleryItem, Product } from "@/lib/notion";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.mone.hair";

const SCHEMA_WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

export function absoluteUrl(pathOrUrl: string | null | undefined): string | undefined {
  if (!pathOrUrl) return undefined;
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
}

export function toIsoDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined;

  const normalized = value.includes(".") ? value.replace(/\./g, "-") : value;
  const date = new Date(normalized);

  if (Number.isNaN(date.getTime())) {
    return undefined;
  }

  return date.toISOString();
}

export function buildOpeningHoursSpecification(closedDays: number[]) {
  const closed = new Set(closedDays);
  const weekdayDays = [1, 2, 3, 4, 5].filter((day) => !closed.has(day));
  const weekendDays = [0, 6].filter((day) => !closed.has(day));
  const specs = [];

  if (weekdayDays.length > 0) {
    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: weekdayDays.map((day) => SCHEMA_WEEKDAYS[day]),
      opens: SALON_INFO.hours.weekday.open,
      closes: SALON_INFO.hours.weekday.close,
    });
  }

  if (weekendDays.length > 0) {
    specs.push({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: weekendDays.map((day) => SCHEMA_WEEKDAYS[day]),
      opens: SALON_INFO.hours.weekend.open,
      closes: SALON_INFO.hours.weekend.close,
    });
  }

  return specs;
}

export function buildHairSalonJsonLd(closedDays: number[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HairSalon",
    "@id": `${SITE_URL}/#hair-salon`,
    name: "Men's hair MONE",
    alternateName: "MONË",
    url: SITE_URL,
    image: absoluteUrl("/og-image.jpg"),
    logo: absoluteUrl("/android-chrome-512x512.png"),
    telephone: SALON_INFO.phone,
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
    openingHoursSpecification: buildOpeningHoursSpecification(closedDays),
    sameAs: ["https://instagram.com/barber_shop0601mone"],
  };
}

export function buildArticleJsonLd(post: BlogPostDetail) {
  const image = absoluteUrl(post.coverImage) || absoluteUrl("/og-image.jpg");
  const published = toIsoDate(post.publishedAt) || toIsoDate(post.createdAt);

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${SITE_URL}/news/${post.slug}#article`,
    mainEntityOfPage: `${SITE_URL}/news/${post.slug}`,
    headline: post.title,
    description: post.excerpt || post.subtitle || `${post.title} | Men's hair MONEからのお知らせです。`,
    image: image ? [image] : undefined,
    datePublished: published,
    dateModified: toIsoDate(post.updatedAt) || published,
    author: {
      "@type": "Organization",
      name: "Men's hair MONE",
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Men's hair MONE",
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/android-chrome-512x512.png"),
      },
    },
  };
}

export function buildGalleryJsonLd(items: GalleryItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ImageGallery",
    "@id": `${SITE_URL}/gallery#gallery`,
    name: "Men's hair MONE ギャラリー",
    url: `${SITE_URL}/gallery`,
    image: items.map((item) => absoluteUrl(item.image)).filter(Boolean),
    hasPart: items
      .filter((item) => item.image)
      .slice(0, 30)
      .map((item, index) => ({
        "@type": "ImageObject",
        position: index + 1,
        name: item.title,
        caption: [item.category, item.title].filter(Boolean).join(" - "),
        contentUrl: absoluteUrl(item.image),
      })),
  };
}

export function buildProductsJsonLd(products: Product[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/products#products`,
    name: "Men's hair MONE 商品紹介",
    itemListElement: products.slice(0, 30).map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        description: product.description || product.category,
        image: absoluteUrl(product.image),
        brand: {
          "@type": "Organization",
          name: "Men's hair MONE",
        },
        offers: product.price
          ? {
              "@type": "Offer",
              priceCurrency: "JPY",
              price: product.price.replace(/[^\d]/g, "") || undefined,
              availability: "https://schema.org/InStock",
              seller: {
                "@type": "HairSalon",
                name: "Men's hair MONE",
              },
            }
          : undefined,
      },
    })),
  };
}

export function renderJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function getNewsImage(post: BlogPost): string {
  return absoluteUrl(post.coverImage) || absoluteUrl("/og-image.jpg") || `${SITE_URL}/og-image.jpg`;
}
