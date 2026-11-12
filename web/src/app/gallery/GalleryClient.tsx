"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { X, ArrowRight, ChevronDown } from "lucide-react";
import { RevealSection } from "@/components/RevealSection";
import { revealOrder } from "@/components/reveal-order";
import type { GalleryItem } from "@/lib/notion";

// 初期表示件数
const INITIAL_DISPLAY_COUNT = 9;
const LOAD_MORE_COUNT = 9;

interface GalleryClientProps {
  items: GalleryItem[];
}

export default function GalleryClient({ items }: GalleryClientProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  // Get unique categories
  const categories = ["all", ...new Set(items.map((item) => item.category).filter(Boolean))];

  // Filter items
  const filteredItems = filter === "all" ? items : items.filter((item) => item.category === filter);

  // Pagination
  const visibleItems = filteredItems.slice(0, displayCount);
  const hasMore = displayCount < filteredItems.length;
  const remainingCount = filteredItems.length - displayCount;

  const handleLoadMore = () => {
    setDisplayCount((prev) => Math.min(prev + LOAD_MORE_COUNT, filteredItems.length));
  };

  // Reset display count when filter changes
  const handleFilterChange = (cat: string) => {
    setFilter(cat);
    setDisplayCount(INITIAL_DISPLAY_COUNT);
  };

  return (
    <div className="min-h-screen pt-32">
      {/* Hero */}
      <section className="container-wide pb-16">
        <div className="enter-up [--enter-y:30px] [--enter-duration:0.8s] text-center">
          <p className="text-subheading mb-4">Gallery</p>
          <h1 className="text-display mb-6">ギャラリー</h1>
          <div className="divider-line mx-auto mb-8" />
          <p className="text-body max-w-lg mx-auto">
            店内の雰囲気や施術の様子をご覧ください。
            <br />
            落ち着いた空間でお過ごしいただけます。
          </p>
        </div>
      </section>

      {/* Category Filter */}
      {categories.length > 1 && (
        <section className="container-wide pb-8">
          <div className="enter-up [--enter-delay:0.3s] flex flex-wrap justify-center gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => handleFilterChange(cat)}
                className={`px-4 py-2 text-sm tracking-wider transition-all duration-300 ${
                  filter === cat
                    ? "bg-accent text-white"
                    : "bg-glass border border-glass-border text-text-secondary hover:border-accent/50 hover:text-white"
                }`}
              >
                {cat === "all" ? "すべて" : cat}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Gallery Grid */}
      <section className="pb-20 section-dark">
        <div className="container-wide relative z-10">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 text-text-muted">
              <p>現在、公開中の画像はありません。</p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {visibleItems.map((item, index) => (
                <RevealSection
                  key={item.id}
                  as="div"
                  self
                  bottomOffset={50}
                  style={revealOrder(index % LOAD_MORE_COUNT)}
                  className="group relative aspect-[4/3] overflow-hidden cursor-pointer [--reveal-step:0.1s]"
                  onClick={() => setSelectedImage(item)}
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={[item.category, item.title, "Men's hair MONE"].filter(Boolean).join(" - ")}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-glass flex items-center justify-center">
                      <span className="text-text-muted">No Image</span>
                    </div>
                  )}
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-dark via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  {/* Caption */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    {item.category && (
                      <span className="inline-block px-2 py-1 bg-accent/80 text-[10px] tracking-wider text-white mb-2">
                        {item.category}
                      </span>
                    )}
                    <h3 className="text-white font-serif">{item.title}</h3>
                  </div>
                </RevealSection>
              ))}
            </div>

            {/* もっと見るボタン */}
            {hasMore && (
              <div className="enter-fade [--enter-duration:0.4s] mt-10 text-center">
                <button
                  onClick={handleLoadMore}
                  className="inline-flex items-center gap-2 px-8 py-3 border border-glass-border text-text-secondary hover:text-white hover:border-accent transition-all duration-300 group"
                >
                  <span className="text-sm tracking-wider">
                    もっと見る（残り {remainingCount} 件）
                  </span>
                  <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                </button>
              </div>
            )}

            {/* 全件表示時のメッセージ */}
            {!hasMore && filteredItems.length > INITIAL_DISPLAY_COUNT && (
              <p className="mt-8 text-center text-sm text-text-muted">
                全 {filteredItems.length} 件を表示中
              </p>
            )}
            </>
          )}
        </div>
      </section>

      {/* Lightbox */}
        {selectedImage && (
          <div
            className="enter-fade [--enter-duration:0.4s] fixed inset-0 z-50 flex items-center justify-center bg-dark/95 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-6 right-6 p-2 text-white hover:text-accent-light transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-8 h-8" />
            </button>
            <div
              className="enter-zoom [--enter-scale:0.9] [--enter-duration:0.3s] relative max-w-4xl w-full aspect-[4/3]"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedImage.image && (
                <Image
                  src={selectedImage.image}
                  alt={[selectedImage.category, selectedImage.title, "Men's hair MONE"].filter(Boolean).join(" - ")}
                  fill
                  sizes="(min-width: 896px) 896px, 100vw"
                  className="object-contain"
                />
              )}
              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-dark to-transparent">
                {selectedImage.category && (
                  <span className="inline-block px-2 py-1 bg-accent text-[10px] tracking-wider text-white mb-2">
                    {selectedImage.category}
                  </span>
                )}
                <h3 className="text-white text-xl font-serif">{selectedImage.title}</h3>
              </div>
            </div>
          </div>
        )}

      {/* CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-dark via-dark-gray to-dark" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent opacity-[0.02] blur-[120px]" />
        </div>

        <div className="container-narrow text-center relative z-10">
          <p className="text-subheading mb-4">Reservation</p>
          <h2 className="text-heading mb-6">ご予約はこちら</h2>
          <div className="divider-line mx-auto mb-8" />
          <p className="text-body max-w-lg mx-auto mb-10">
            落ち着いた空間で、至福のひとときをお過ごしください。
            <br />
            Web予約またはお電話にてご予約を承っております。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/booking" className="btn-primary">
              Web予約する
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a href="tel:06-6908-4859" className="btn-outline">
              06-6908-4859
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
