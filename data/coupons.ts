import { Coupon } from '@/types/restaurant';
export const COUPONS: Coupon[] = [
  { code: 'WELCOME10', label: '10% off your first royal order', type: 'percent', value: 10, minSubtotal: 0 },
  { code: 'ROYAL15', label: '15% off orders above ₹800', type: 'percent', value: 15, minSubtotal: 800 },
  { code: 'FEAST200', label: '₹200 off orders above ₹1500', type: 'flat', value: 200, minSubtotal: 1500 },
];
export const discountFor = (code: string | null, subtotal: number) => {
  const c = COUPONS.find((x) => x.code === code);
  if (!c || subtotal < c.minSubtotal) return 0;
  return Math.min(subtotal, Math.round(c.type === 'percent' ? (subtotal * c.value) / 100 : c.value));
};
