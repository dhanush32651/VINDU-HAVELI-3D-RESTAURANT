import { create } from 'zustand';
import { CartItem, Dish } from '@/types/restaurant';
import { COUPONS, discountFor } from '@/data/coupons';

interface State {
  items: CartItem[]; coupon: string | null; couponError: string | null;
  cartOpen: boolean; checkoutOpen: boolean; selected: number;
  add: (d: Dish) => void; setQty: (id: string, q: number) => void; clear: () => void;
  applyCoupon: (code: string) => void; removeCoupon: () => void;
  setCart: (b: boolean) => void; setCheckout: (b: boolean) => void; select: (i: number) => void;
}
export const useStore = create<State>((set, get) => ({
  items: [], coupon: null, couponError: null, cartOpen: false, checkoutOpen: false, selected: 0,
  add: (dish) => set((s) => {
    const f = s.items.find((i) => i.dish.id === dish.id);
    return { items: f ? s.items.map((i) => (i === f ? { ...i, qty: i.qty + 1 } : i)) : [...s.items, { dish, qty: 1 }] };
  }),
  setQty: (id, q) => set((s) => ({ items: s.items.map((i) => (i.dish.id === id ? { ...i, qty: q } : i)).filter((i) => i.qty > 0) })),
  clear: () => set({ items: [], coupon: null, couponError: null }),
  applyCoupon: (code) => {
    const c = COUPONS.find((x) => x.code === code.trim().toUpperCase());
    const sub = totals(get().items, null).subtotal;
    if (!c) return set({ couponError: 'Invalid coupon code', coupon: null });
    if (sub < c.minSubtotal) return set({ couponError: `Add items worth ₹${c.minSubtotal} to use ${c.code}`, coupon: null });
    set({ coupon: c.code, couponError: null });
  },
  removeCoupon: () => set({ coupon: null, couponError: null }),
  setCart: (b) => set({ cartOpen: b }), setCheckout: (b) => set({ checkoutOpen: b, cartOpen: false }),
  select: (i) => set({ selected: i }),
}));

export function totals(items: CartItem[], coupon: string | null) {
  const subtotal = items.reduce((a, i) => a + i.dish.price * i.qty, 0);
  const discount = discountFor(coupon, subtotal);
  const tax = Math.round((subtotal - discount) * 0.05);
  const delivery = subtotal === 0 || subtotal >= 500 ? 0 : 40;
  return { subtotal, discount, tax, delivery, total: subtotal - discount + tax + delivery, count: items.reduce((a, i) => a + i.qty, 0) };
}
