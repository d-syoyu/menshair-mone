"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, useInView, AnimatePresence, type Variants } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import type { GalleryItem } from "@/lib/notion";

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

function AnimatedSection({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.section
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.section>
  );
}

interface GalleryClientProps {
  items: GalleryItem[];
}

export default function GalleryClient({ items }: GalleryClientProps) {
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // Get unique categories
  const categories = ["all", ...new Set(items.map((item) => item.category).filter(Boolean))];

  // Filter items
  const filteredItems = filter === "all" ? items : items.filter((item) => item.category === filter);

  return (
    <div className="min-h-screen pt-32">
      {/* Hero */}
      <section className="container-wide pb-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="text-subheading mb-4">Gallery</p>
          <h1 className="text-display mb-6">ギャラリー</h1>
          <div className="divider-line mx-auto mb-8" />
          <p className="text-body max-w-lg mx-auto">
            店内の雰囲気や施術の様子をご覧ください。
            <br />
            落ち着いた空間でお過ごしいただけます。
          </p>
        </motion.div>
      </section>

      {/* Category Filter */}
      {categories.length > 2 && (
        <section className="container-wide pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-3"
          >
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 text-sm tracking-wider transition-all duration-300 ${
                  filter === cat
                    ? "bg-accent text-white"
                    : "bg-glass border border-glass-border text-text-secondary hover:border-accent/50 hover:text-white"
                }`}
              >
                {cat === "all" ? "すべて" : cat}
              </button>
            ))}
          </motion.div>
        </section>
      )}

      {/* Gallery Grid */}
      <AnimatedSection className="pb-20 section-dark">
        <div className="container-wide relative z-10">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 text-text-muted">
              <p>現在、公開中の画像はありません。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  variants={fadeInUp}
                  className="group relative aspect-[4/3] overflow-hidden cursor-pointer"
                  onClick={() => setSelectedImage(item)}
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-dark/95 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              className="absolute top-6 right-6 p-2 text-white hover:text-accent-light transition-colors"
              onClick={() => setSelectedImage(null)}
            >
              <X className="w-8 h-8" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="relative max-w-4xl w-full aspect-[4/3]"
              onClick={(e) => e.stopPropagation()}
            >
              {selectedImage.image && (
                <img
                  src={selectedImage.image}
                  alt={selectedImage.title}
                  className="absolute inset-0 w-full h-full object-contain"
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
