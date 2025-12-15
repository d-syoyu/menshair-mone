'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  displayOrder: number;
}

interface Menu {
  id: string;
  name: string;
  price: number;
  duration: number;
  displayOrder: number;
  category: Category;
}

export default function MenuPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMenus = async () => {
      try {
        const res = await fetch('/api/menus');
        const data = await res.json();
        setMenus(data.menus || []);
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Failed to fetch menus:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMenus();
  }, []);

  // カテゴリごとにメニューをグループ化
  const menusByCategory = categories.map(category => ({
    category,
    items: menus.filter(menu => menu.category.id === category.id),
  })).filter(group => group.items.length > 0);

  const formatPrice = (price: number) => `¥${price.toLocaleString()}`;
  const formatDuration = (duration: number) => `${duration}分`;

  return (
    <div className="min-h-screen pt-32">
      {/* Hero */}
      <section className="container-wide pb-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="text-subheading mb-4">Price List</p>
          <h1 className="text-display mb-6">Menu</h1>
          <div className="divider-line mx-auto mb-8" />
          <p className="text-body max-w-lg mx-auto">
            すべての施術はプライベート空間で<br />
            丁寧にご提供いたします。
          </p>
        </motion.div>
      </section>

      {/* Menu List */}
      <section className="py-12 section-gradient">
        <div className="container-narrow">
          {isLoading ? (
            <div className="text-center py-12 text-text-muted">読み込み中...</div>
          ) : menusByCategory.length === 0 ? (
            <div className="text-center py-12 text-text-muted">メニューがありません</div>
          ) : (
            <div className="space-y-10 md:space-y-12">
              {menusByCategory.map(({ category, items }) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="space-y-4"
                >
                  <div className="border-b border-glass-border pb-3">
                    <h2 className="text-xl md:text-2xl font-serif text-white">{category.nameEn}</h2>
                  </div>

                  <div className="space-y-3">
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-wrap sm:flex-nowrap justify-between items-start sm:items-center py-3 text-text-secondary hover:text-white transition-colors"
                      >
                        <div className="w-full sm:w-auto sm:flex-1 sm:min-w-0 sm:mr-4 mb-2 sm:mb-0">
                          <span className="text-base md:text-lg">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-3 sm:gap-4">
                          <span className="text-sm text-text-muted whitespace-nowrap">
                            {formatDuration(item.duration)}
                          </span>
                          <span className="text-lg md:text-xl text-gold font-light min-w-[100px] text-right">
                            {formatPrice(item.price)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Note & CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-dark-gray via-dark to-dark-gray" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent opacity-[0.02] blur-[120px]" />
        </div>

        <div className="container-narrow text-center relative z-10">
          <h2 className="text-2xl font-serif mb-6">ご予約について</h2>
          <div className="divider-line mx-auto mb-8" />
          <div className="text-body space-y-4 mb-10">
            <p>表示価格はすべて税込です。</p>
            <p>初回のお客様には丁寧なカウンセリングを行うため、<br className="hidden md:inline" />お時間に余裕を持ってお越しください。</p>
            <p>メニューの組み合わせにより、セット割引もございます。</p>
          </div>
          <Link href="/booking" className="btn-primary">
            ご予約はこちら
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
