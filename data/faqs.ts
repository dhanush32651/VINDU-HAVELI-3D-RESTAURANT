// DEFAULT FAQ KNOWLEDGE BASE for the chatbot. No AI service or API key needed.
//
// HOW TO EXTEND: add an object to FAQS. `keywords` are words/phrases a customer might type
// (multi-word phrases score higher). `answer` may use {{advance}}, {{duration}}, {{hours}} and
// {{phone}}, which are filled in with live values. `links` become buttons in the chat.
// Items marked "EDIT" contain sensible defaults you should adjust to your real kitchen policy.
import { ALL_DISHES } from './dishes';
import { CATEGORIES } from './categories';
import { COUPONS } from './coupons';
import { RESTAURANT as R } from './restaurant';

export interface FaqLink { label: string; href: string }
export interface Faq { id: string; question: string; keywords: string[]; answer: string; links?: FaqLink[] }

const inCat = (slug: string) => ALL_DISHES.filter((d) => d.category === slug);
const list = (slug: string, max = 8) => inCat(slug).slice(0, max).map((d) => `• ${d.name} – ₹${d.price}`).join('\n');
const range = (slug: string) => { const p = inCat(slug).map((d) => d.price); return p.length ? `₹${Math.min(...p)} – ₹${Math.max(...p)}` : ''; };
const prices = ALL_DISHES.map((d) => d.price);
const veg = ALL_DISHES.filter((d) => d.veg).length;
const cat = (slug: string) => CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;

export const FAQS: Faq[] = [
  { id: 'greeting', question: 'Hello', keywords: ['hi', 'hello', 'hey', 'namaste', 'good morning', 'good evening', 'good afternoon'],
    answer: 'Namaste! 🙏 Welcome to VINDU HAVELI. I can help with our menu, offers, table bookings, orders and more. What would you like to know?' },
  { id: 'thanks', question: 'Thank you', keywords: ['thanks', 'thank you', 'thx', 'great', 'awesome'],
    answer: "You're most welcome! 😊 Is there anything else I can help you with?" },
  { id: 'location', question: 'Where is the restaurant located?', keywords: ['location', 'address', 'where', 'located', 'directions', 'map', 'find you', 'reach', 'landmark'],
    answer: `You can find us at:\n${R.address}\n\nOpen the Contact page for the live map.`, links: [{ label: 'Open map & contact', href: '/contact' }] },
  { id: 'hours', question: 'What are your opening hours?', keywords: ['hours', 'timing', 'timings', 'open', 'opening', 'closing', 'close', 'closed', 'time', 'when open', 'till what time', 'what time'],
    answer: `We are open ${R.hours}.\nTable bookings can be made for {{hours}}.`, links: [{ label: 'Book a table', href: '/book-dine' }] },
  { id: 'contact', question: 'What is your contact number?', keywords: ['contact', 'phone', 'number', 'call', 'mobile', 'email', 'whatsapp', 'reach you'],
    answer: `📞 ${R.phone}\n✉️ ${R.email}\nWe are happy to help during opening hours (${R.hours}).`, links: [{ label: 'Call now', href: R.phoneHref }, { label: 'Contact page', href: '/contact' }] },
  { id: 'menu', question: 'What is on your menu?', keywords: ['menu', 'food', 'dishes', 'what do you serve', 'what do you have', 'items', 'cuisine', 'eat', 'serve', 'categories'],
    answer: `Our menu has ${ALL_DISHES.length} dishes across ${CATEGORIES.length} categories:\n${CATEGORIES.map((c) => `${c.emoji} ${c.label} (${inCat(c.slug).length})`).join('\n')}\n\nPrices range from ₹${Math.min(...prices)} to ₹${Math.max(...prices)}.`,
    links: [{ label: 'View full menu', href: '/menu' }] },
  { id: 'biryani', question: 'Which biryani varieties do you have?', keywords: ['biryani', 'biriyani', 'dum', 'hyderabadi', 'lucknowi', 'kolkata', 'malabar', 'chettinad'],
    answer: `Our royal biryanis (${range('biryani')}):\n${list('biryani', 12)}`, links: [{ label: 'See all biryanis', href: '/menu/biryani' }, { label: '3D biryani showcase', href: '/showcase' }] },
  { id: 'veg-nonveg', question: 'Do you have veg and non-veg food?', keywords: ['veg', 'non veg', 'nonveg', 'non-veg', 'vegetarian', 'vegan', 'chicken', 'mutton', 'fish', 'egg', 'paneer'],
    answer: `Yes! We serve both. ${veg} of our ${ALL_DISHES.length} dishes are vegetarian (🟢) and ${ALL_DISHES.length - veg} are non-vegetarian (🔴). Use the Veg / Non-Veg filter on the menu page to see only what you like.`, links: [{ label: 'Browse menu', href: '/menu' }] },
  { id: 'pizza', question: 'Which pizzas do you serve?', keywords: ['pizza', 'pizzas', 'margherita', 'cheese pizza'],
    answer: `${cat('pizzas')} (${range('pizzas')}):\n${list('pizzas')}`, links: [{ label: 'See pizzas', href: '/menu/pizzas' }] },
  { id: 'sandwich', question: 'Do you have sandwiches?', keywords: ['sandwich', 'sandwiches', 'club', 'grilled sandwich', 'toast'],
    answer: `${cat('sandwiches')} (${range('sandwiches')}):\n${list('sandwiches')}`, links: [{ label: 'See sandwiches', href: '/menu/sandwiches' }] },
  { id: 'burger', question: 'Which burgers do you serve?', keywords: ['burger', 'burgers', 'cheeseburger'],
    answer: `${cat('burgers')} (${range('burgers')}):\n${list('burgers')}`, links: [{ label: 'See burgers', href: '/menu/burgers' }] },
  { id: 'drinks', question: 'What cool drinks do you have?', keywords: ['drink', 'drinks', 'cool drink', 'cool drinks', 'cold drink', 'beverage', 'beverages', 'juice', 'soda', 'mojito', 'mocktail', 'mocktails', 'lassi', 'soft drink', 'thirsty'],
    answer: `Soft drinks (${range('soft-drinks')}):\n${list('soft-drinks', 6)}\n\nMocktails (${range('mocktails')}):\n${list('mocktails', 6)}`, links: [{ label: 'Soft drinks', href: '/menu/soft-drinks' }, { label: 'Mocktails', href: '/menu/mocktails' }] },
  { id: 'starters', question: 'What starters do you have?', keywords: ['starter', 'starters', 'appetizer', 'appetizers', 'snacks', 'kebab', 'tikka', 'tandoori'],
    answer: `Starters (${range('starters')}):\n${list('starters')}`, links: [{ label: 'See starters', href: '/menu/starters' }] },
  { id: 'desserts', question: 'What desserts do you serve?', keywords: ['dessert', 'desserts', 'sweet', 'sweets', 'gulab jamun', 'ice cream', 'mithai', 'cake'],
    answer: `Desserts (${range('desserts')}):\n${list('desserts')}`, links: [{ label: 'See desserts', href: '/menu/desserts' }] },
  { id: 'prices', question: 'What are the food prices?', keywords: ['price', 'prices', 'cost', 'costs', 'rate', 'rates', 'expensive', 'cheap', 'budget'],
    answer: `Dishes start at ₹${Math.min(...prices)} and go up to ₹${Math.max(...prices)}. Typical ranges:\n${['biryani', 'pizzas', 'burgers', 'sandwiches', 'starters', 'desserts', 'soft-drinks'].map((s) => `• ${cat(s)}: ${range(s)}`).join('\n')}\n\nGST (5%) is added at checkout. Delivery is free above ₹500 (₹40 below that).`, links: [{ label: 'Filter by price', href: '/menu' }] },
  { id: 'offers', question: "What are today's offers?", keywords: ['offer', 'offers', 'discount', 'deal', 'deals', 'sale', 'save', 'cheaper', 'todays offers', "today's offers"],
    answer: `🎁 Current offers:\n${COUPONS.map((c) => `• ${c.code} – ${c.label}`).join('\n')}\n\nCopy a code and paste it in your cart.`, links: [{ label: 'See offers', href: '/offers' }, { label: 'Order now', href: '/menu' }] },
  { id: 'coupons', question: 'How do I use a coupon code?', keywords: ['coupon', 'coupons', 'promo', 'promo code', 'voucher', 'code', 'apply code'],
    answer: `Open your cart, type the code in the "Coupon code" box and tap Apply. Available codes: ${COUPONS.map((c) => c.code).join(', ')}. Each code has a minimum order value shown on the Offers page.`, links: [{ label: 'View coupons', href: '/offers' }] },
  { id: 'order-food', question: 'How do I order food?', keywords: ['order', 'ordering', 'how to order', 'place order', 'order food', 'buy', 'cart', 'checkout', 'order online'],
    answer: '1. Log in (or create a free account).\n2. Browse the menu and tap ADD on your dishes.\n3. Open your cart, apply a coupon if you have one, and tap Proceed to Checkout.\n4. Enter delivery details, add any special cooking instructions, choose how to pay, and place the order.', links: [{ label: 'Order food', href: '/menu' }, { label: 'Log in', href: '/login' }] },
  { id: 'book-table', question: 'How do I book a table?', keywords: ['book', 'booking', 'book table', 'book a table', 'reserve', 'reservation', 'reservations', 'table', 'dine', 'dine in', 'book dine', 'seat', 'seats'],
    answer: 'Booking takes a minute:\n1. Log in as a customer and choose BOOK DINE.\n2. Pick a date, time and number of guests.\n3. Choose one of our 8 tables on the floor plan.\n4. Enter your details and pay the advance of ₹{{advance}}.\nYou will get a booking receipt to show when you arrive.', links: [{ label: 'Book a table', href: '/book-dine' }] },
  { id: 'advance', question: 'How much is the advance booking payment?', keywords: ['advance', 'deposit', 'booking fee', 'booking amount', 'advance payment', 'pay advance', 'how much to book'],
    answer: 'A table booking needs an advance payment of ₹{{advance}}. Your table is held for {{duration}} minutes from the start time you choose.', links: [{ label: 'Book a table', href: '/book-dine' }] },
  { id: 'cancel', question: 'How do I cancel a reservation?', keywords: ['cancel', 'cancellation', 'cancel booking', 'cancel reservation', 'refund', 'change booking', 'reschedule'],
    answer: `Open My Bookings in your dashboard and tap Cancel on an upcoming booking. If you paid an advance, it is marked for refund and the restaurant processes it. To reschedule or ask about a refund, call ${R.phone}.`, links: [{ label: 'My bookings', href: '/my-bookings' }, { label: 'Call us', href: R.phoneHref }] },
  { id: 'delivery', question: 'Do you offer delivery and pickup?', keywords: ['delivery', 'deliver', 'home delivery', 'pickup', 'pick up', 'takeaway', 'take away', 'collect', 'delivery charge', 'delivery fee', 'free delivery'],
    answer: `Yes, we deliver! Delivery is free on orders of ₹500 and above, otherwise ₹40. For takeaway/pickup, call ${R.phone} and we will have it ready for you. (EDIT: adjust this answer in data/faqs.ts to match your delivery area.)`, links: [{ label: 'Order now', href: '/menu' }] },
  { id: 'payment', question: 'Which payment methods do you accept?', keywords: ['payment', 'payments', 'pay', 'upi', 'card', 'cash', 'cod', 'cash on delivery', 'gpay', 'phonepe', 'paytm', 'credit card', 'debit card', 'net banking'],
    answer: 'You can pay by UPI, debit/credit card, or Cash on Delivery for food orders. Table booking advances are paid online. If the restaurant has not switched on live payments yet, checkout shows a clear DEMO label and no money is taken.' },
  { id: 'track-order', question: 'How do I track my order?', keywords: ['track', 'tracking', 'order status', 'where is my order', 'my order', 'order update', 'status of order'],
    answer: 'Log in and open My Orders. Your order moves through: New → Accepted → Preparing → Ready → Completed, and the page refreshes by itself.', links: [{ label: 'My orders', href: '/orders' }] },
  { id: 'booking-status', question: 'How can I check my booking status?', keywords: ['booking status', 'reservation status', 'my booking', 'my reservation', 'booking confirmed', 'is my table confirmed', 'receipt', 'booking id'],
    answer: 'Open My Bookings in your dashboard to see each booking, its status (Pending, Confirmed, etc.) and to reopen or print your receipt.', links: [{ label: 'My bookings', href: '/my-bookings' }] },
  { id: 'prep-time', question: 'How long does food preparation take?', keywords: ['preparation', 'prepare', 'how long', 'wait', 'waiting', 'ready in', 'quick', 'fast', 'preparation time', 'cooking time', 'minutes'],
    answer: 'Most dishes are cooked fresh to order. Starters, drinks and desserts are usually quick; biryani is slow-cooked on dum and takes a little longer, so please allow extra time at busy hours. (EDIT: add your real timings in data/faqs.ts.) Watch the live status in My Orders.', links: [{ label: 'My orders', href: '/orders' }] },
  { id: 'staff', question: 'How can I contact restaurant staff?', keywords: ['staff', 'owner', 'manager', 'human', 'speak', 'talk', 'person', 'support', 'help', 'complaint', 'feedback', 'agent', 'customer care'],
    answer: `You can speak to our team on ${R.phone} (${R.hours}) or email ${R.email}.`, links: [{ label: 'Call now', href: R.phoneHref }, { label: 'Contact page', href: '/contact' }] },
];

export const QUICK_REPLIES: { label: string; faq: string }[] = [
  { label: 'View Menu', faq: 'menu' }, { label: 'Book a Table', faq: 'book-table' }, { label: 'Order Food', faq: 'order-food' },
  { label: "Today's Offers", faq: 'offers' }, { label: 'Restaurant Location', faq: 'location' }, { label: 'Contact Us', faq: 'contact' },
];
export const FALLBACK_TEXT = "I'm not sure I understood that, but I'd love to help! Try one of these questions, or speak to our team directly.";
export const FALLBACK_LINKS: FaqLink[] = [{ label: 'Call us', href: R.phoneHref }, { label: 'Contact page', href: '/contact' }];
export const FAQ_PHONE = R.phone;
