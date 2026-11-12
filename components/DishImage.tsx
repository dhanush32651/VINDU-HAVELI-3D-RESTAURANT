'use client';
import { useState } from 'react';
import { Dish } from '@/types/restaurant';
// Shows /public/images/<id>.jpg, or an emoji placeholder until the image exists.
export default function DishImage({ dish, className = '' }: { dish: Dish; className?: string }) {
  const [bad, setBad] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-gold/10 ${className}`}>
      {!bad ? <img src={dish.image} alt={dish.name} loading="lazy" onError={() => setBad(true)} className="h-full w-full object-cover" /> : <div className="grid h-full w-full place-items-center text-4xl opacity-60">🍽️</div>}
    </div>
  );
}
