import { getCachedMenus } from '@/lib/menu-cache';
import MenuContent from './MenuContent';

export default async function MenuPage() {
  const { menus, categories } = await getCachedMenus();

  return <MenuContent menus={menus} categories={categories} />;
}
