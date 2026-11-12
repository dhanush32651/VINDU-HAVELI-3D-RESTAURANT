export interface Dish {
  id: string; name: string; category: string; veg: boolean; price: number; spice: number;
  rating: number; orders: number; description: string; image: string; query?: string;
}
export interface CartItem { dish: Dish; qty: number }
export interface Coupon { code: string; label: string; type: 'percent' | 'flat'; value: number; minSubtotal: number }
