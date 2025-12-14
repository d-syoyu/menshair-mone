import { Phone, Instagram } from 'lucide-react';
import { getProducts, type Product } from '@/lib/notion';
import ProductsClient from './ProductsClient';

// モックデータ（Notion未設定時のフォールバック）
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'サンプルシャンプー',
    price: '¥3,300',
    category: 'シャンプー',
    description: 'サロン専売のプレミアムシャンプー。頭皮に優しく、髪にハリとコシを与えます。',
    image: null,
    order: 1,
  },
  {
    id: '2',
    name: 'サンプルトリートメント',
    price: '¥3,850',
    category: 'トリートメント',
    description: 'ダメージヘアを集中補修。サロン帰りのツヤ髪を自宅でも再現できます。',
    image: null,
    order: 2,
  },
  {
    id: '3',
    name: 'スタイリングワックス',
    price: '¥2,200',
    category: 'スタイリング',
    description: '自然なツヤと程よいホールド力。ビジネスシーンにも最適なマットな仕上がり。',
    image: null,
    order: 3,
  },
  {
    id: '4',
    name: 'スカルプエッセンス',
    price: '¥5,500',
    category: '美容液',
    description: '頭皮環境を整え、健やかな髪の成長をサポート。毎日のケアにおすすめです。',
    image: null,
    order: 4,
  },
];

export const revalidate = 60; // 60秒ごとに再検証

export default async function ProductsPage() {
  // Notionから商品を取得
  let products = await getProducts();

  // Notionデータがない場合はモックデータを使用
  if (products.length === 0) {
    products = mockProducts;
  }

  return (
    <div className="min-h-screen pt-32">
      {/* Hero */}
      <section className="container-wide pb-20">
        <div className="text-center animate-fade-up">
          <p className="text-subheading mb-4">Salon Products</p>
          <h1 className="text-display mb-6">商品紹介</h1>
          <div className="divider-line mx-auto mb-8" />
          <p className="text-body max-w-lg mx-auto">
            サロンで使用しているプロフェッショナル商品を<br />
            ご自宅でもお使いいただけます。
          </p>
        </div>
      </section>

      {/* Products Grid */}
      <ProductsClient products={products} />

      {/* Note & CTA */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-dark-gray via-dark to-dark-gray" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent opacity-[0.02] blur-[120px]" />
        </div>

        <div className="container-narrow text-center relative z-10">
          <h2 className="text-2xl font-serif mb-6">ご購入について</h2>
          <div className="divider-line mx-auto mb-8" />
          <div className="text-body space-y-4 mb-10">
            <p>商品はサロンにてご購入いただけます。</p>
            <p>
              在庫状況や商品についてのご質問は<br className="hidden md:inline" />
              お電話またはInstagram DMよりお気軽にお問い合わせください。
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="tel:06-6908-4859" className="btn-outline">
              <Phone className="w-4 h-4" />
              06-6908-4859
            </a>
            <a
              href="https://instagram.com/barber_shop0601mone"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline"
            >
              <Instagram className="w-4 h-4" />
              Instagram DM
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
