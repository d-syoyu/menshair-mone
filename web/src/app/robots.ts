// src/app/robots.ts
// MONË - robots.txt 生成

import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.mone0601.com";

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
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
