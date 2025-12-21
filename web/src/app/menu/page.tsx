import { getCachedMenus } from '@/lib/menu-cache';
import MenuContent from './MenuContent';

// ビルド時にDB接続しないよう動的レンダリングに設定
export const dynamic = 'force-dynamic';

export default async function MenuPage() {
  const { menus, categories } = await getCachedMenus();

  return <MenuContent menus={menus} categories={categories} />;
}
