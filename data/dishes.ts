import raw from './menu.json';
import { Dish } from '@/types/restaurant';
export const ALL_DISHES: Dish[] = (raw as any[]).map((r) => ({ ...r, image: `/images/${r.id}.jpg` }));
export const SIGNATURE: Dish[] = ['hyderabadi-dum', 'lucknowi-mutton', 'kolkata-special', 'malabar-fish', 'chettinad-spicy'].map((id) => ALL_DISHES.find((d) => d.id === id)!);
export const BOWL_COLORS: Record<string, string> = { 'hyderabadi-dum': '#E0A94B', 'lucknowi-mutton': '#D9B36A', 'kolkata-special': '#EBD08F', 'malabar-fish': '#C98F4A', 'chettinad-spicy': '#B5651D' };
export const TOP_PICKS = [...ALL_DISHES].sort((a, b) => b.orders - a.orders).slice(0, 10);
