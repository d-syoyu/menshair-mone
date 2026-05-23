// src/app/robots.ts
// MONË - robots.txt 生成

import { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/api/",
          "/mypage/",
          "/booking/confirm",
          "/booking/complete",
          "/login",
          "/register",
          "/verify-request",
          "/auth-error",
          "/unsubscribe",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
