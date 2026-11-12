import FoodVideoBackground from './FoodVideoBackground';
import { Phone, MapPin, Clock, ShieldCheck, ChefHat, Truck } from 'lucide-react';
const INFO: [React.ElementType, string, string][] = [
  [MapPin, 'Address', 'Vindu Haveli, [Your street, city, PIN]'],
  [Phone, 'Phone', '+91 80195 85772'],
  [Clock, 'Opening hours', 'Daily, 11:00 AM – 11:30 PM'],
  [ShieldCheck, 'FSSAI licence', '[Add your licence number]'],
];
export default function AboutRestaurant() {
  return (
    <section className="section">
      <FoodVideoBackground video="interior" overlay={0.7} as="div" className="overflow-hidden rounded-2xl border border-gold/20 bg-charcoal p-8 md:p-12" >
      <div>
        <p className="text-xs uppercase tracking-[0.5em] text-gold">About Us</p>
        <h2 className="mt-3 font-serif text-4xl md:text-5xl gold-text">About Vindu Haveli</h2>
        <p className="mt-5 max-w-3xl text-taupe">Vindu Haveli is a family restaurant devoted to the culinary heritage of India. Our kitchen prepares regional biryanis on slow dum, tandoor specialities, and a wide menu of pizzas, burgers, sandwiches, desserts and handcrafted beverages. Every order is cooked fresh, packed with care and delivered with the warmth of royal hospitality.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {([[ChefHat, 'Freshly prepared', 'Cooked to order from fresh ingredients and house-ground spices.'], [ShieldCheck, 'Hygiene first', 'Clean kitchen practices and tamper-safe packaging on every order.'], [Truck, 'Prompt delivery', 'Hot food, dependable delivery and live order confirmation.']] as [React.ElementType, string, string][]).map(([I, t, d]) => (
            <div key={t} className="rounded-xl border border-gold/20 p-5"><I className="text-gold" /><h3 className="mt-3 font-serif text-xl">{t}</h3><p className="mt-1 text-sm text-taupe">{d}</p></div>))}
        </div>
        <dl className="mt-8 grid gap-4 sm:grid-cols-2">{INFO.map(([I, k, v]) => (<div key={k} className="flex items-start gap-3"><I size={18} className="mt-1 text-gold" /><div><dt className="text-xs uppercase tracking-widest text-taupe">{k}</dt><dd>{v}</dd></div></div>))}</dl>
      </div>
      </FoodVideoBackground>
    </section>
  );
}
