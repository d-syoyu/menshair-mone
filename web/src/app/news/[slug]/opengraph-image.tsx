import { ImageResponse } from "next/og";
import { getNewsBySlug } from "@/lib/notion";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";
export const revalidate = 3600;

interface OpenGraphImageProps {
  params: Promise<{ slug: string }>;
}

export default async function OpenGraphImage({ params }: OpenGraphImageProps) {
  const { slug } = await params;
  const post = await getNewsBySlug(slug);
  const title = post?.title || "Men's hair MONE";
  const category = post?.category || "News";
  const date = post?.publishedAt || "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#111312",
          color: "#f5f2ec",
          padding: "72px",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            color: "#95b89a",
            fontSize: 26,
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          <span>{category}</span>
          <span>{date}</span>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 28,
          }}
        >
          <div
            style={{
              width: 120,
              height: 2,
              background: "#95b89a",
            }}
          />
          <h1
            style={{
              fontSize: 72,
              lineHeight: 1.18,
              margin: 0,
              fontWeight: 600,
              maxWidth: 940,
            }}
          >
            {title}
          </h1>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
          }}
        >
          <div
            style={{
              fontSize: 34,
              letterSpacing: 1,
              fontWeight: 600,
            }}
          >
            Men's hair MONE
          </div>
          <div
            style={{
              fontSize: 24,
              color: "#c6c0b6",
            }}
          >
            Moriguchi, Osaka
          </div>
        </div>
      </div>
    ),
    size
  );
}
