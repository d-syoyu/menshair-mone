import { getCachedMenus } from '@/lib/menu-cache';
import MenuContent from './MenuContent';
import type { Metadata } from 'next';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'メニュー',
  description: "Men's hair MONEのカット、シェービング、ヘッドスパ、カラーなどのメニューと料金をご案内します。",
  alternates: {
    canonical: '/menu',
  },
};

export default async function MenuPage() {
  const { menus, categories } = await getCachedMenus();

  return <MenuContent menus={menus} categories={categories} />;
}
