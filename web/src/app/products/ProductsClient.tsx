'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Product } from '@/lib/notion';

interface ProductsClientProps {
  products: Product[];
}

// 初期表示件数（モバイルでのスクロール軽減）
const INITIAL_DISPLAY_COUNT = 8;
const LOAD_MORE_COUNT = 8;

export default function ProductsClient({ products }: ProductsClientProps) {
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  const visibleProducts = products.slice(0, displayCount);
  const hasMore = displayCount < products.length;
  const remainingCount = products.length - displayCount;

  const handleLoadMore = () => {
    setDisplayCount((prev) => Math.min(prev + LOAD_MORE_COUNT, products.length));
  };

  return (
    <section className="py-12 section-gradient">
      <div className="container-wide">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {visibleProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="glass-card overflow-hidden group"
            >
              {/* Product Image */}
              <div className="relative aspect-square overflow-hidden bg-dark-lighter">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-muted">
                    <span className="text-4xl">📦</span>
                  </div>
                )}
                {/* Category Badge */}
                {product.category && (
                  <div className="absolute top-3 left-3">
                    <span className="px-3 py-1 bg-dark/80 backdrop-blur-sm text-xs tracking-wider text-accent-light uppercase">
                      {product.category}
                    </span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5">
                <h3 className="text-lg font-serif text-white mb-2">
                  {product.name}
                </h3>
                <p className="text-gold text-lg mb-3">
                  {product.price}
                </p>
                {product.description && (
                  <p className="text-sm text-text-secondary line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* もっと見るボタン */}
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-10 text-center"
          >
            <button
              onClick={handleLoadMore}
              className="inline-flex items-center gap-2 px-8 py-3 border border-glass-border text-text-secondary hover:text-white hover:border-accent transition-all duration-300 group"
            >
              <span className="text-sm tracking-wider">
                もっと見る（残り {remainingCount} 件）
              </span>
              <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
            </button>
          </motion.div>
        )}

        {/* 全件表示時のメッセージ */}
        {!hasMore && products.length > INITIAL_DISPLAY_COUNT && (
          <p className="mt-8 text-center text-sm text-text-muted">
            全 {products.length} 件を表示中
          </p>
        )}
      </div>
    </section>
  );
}
