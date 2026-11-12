import test from 'node:test';
import assert from 'node:assert/strict';
import { answer, answerById, fillTokens } from '@/lib/chatbot';
import { FAQS, QUICK_REPLIES } from '@/data/faqs';

const id = (m: string) => answer(m).faqId;

test('required FAQ topics all exist', () => {
  const need = ['location', 'hours', 'contact', 'menu', 'biryani', 'veg-nonveg', 'pizza', 'sandwich', 'burger', 'drinks', 'starters', 'desserts', 'prices', 'offers', 'coupons', 'order-food', 'book-table', 'advance', 'cancel', 'delivery', 'payment', 'track-order', 'booking-status', 'prep-time', 'staff'];
  for (const n of need) assert.ok(FAQS.find((f) => f.id === n), n);
  assert.equal(new Set(FAQS.map((f) => f.id)).size, FAQS.length);
});
test('quick replies resolve to real answers', () => {
  assert.deepEqual(QUICK_REPLIES.map((q) => q.label), ['View Menu', 'Book a Table', 'Order Food', "Today's Offers", 'Restaurant Location', 'Contact Us']);
  for (const q of QUICK_REPLIES) assert.ok(answerById(q.faq).text.length > 10);
});
test('natural questions map to the right answer', () => {
  const cases: [string, string][] = [
    ['Where are you located?', 'location'], ['what time do you close', 'hours'], ['What is your phone number', 'contact'],
    ['show me the menu', 'menu'], ['which biryani do you have', 'biryani'], ['any vegetarian options?', 'veg-nonveg'], ['do you have pizza', 'pizza'],
    ['sandwiches?', 'sandwich'], ['I want a burger', 'burger'], ['what cold drinks', 'drinks'], ['any starters', 'starters'], ['desserts please', 'desserts'],
    ['how much does food cost', 'prices'], ["today's offers", 'offers'], ['promo code', 'coupons'], ['how to order online', 'order-food'],
    ['how can i book a table', 'book-table'], ['how much is the advance', 'advance'], ['cancel my reservation', 'cancel'], ['do you do home delivery', 'delivery'],
    ['can I pay by UPI', 'payment'], ['where is my order', 'track-order'], ['is my table confirmed', 'booking-status'], ['how long will food take', 'prep-time'], ['I want to speak to the manager', 'staff'], ['hello', 'greeting'], ['thank you!', 'thanks'],
  ];
  for (const [m, want] of cases) assert.equal(id(m), want, m);
});
test('unknown questions get a useful fallback with suggestions and contact links', () => {
  const r = answer('what is the capital of france'); assert.equal(r.matched, false);
  assert.ok(r.suggestions.length >= 3); assert.ok(r.links.some((l) => l.href.startsWith('tel:'))); assert.ok(answer('asdfgh').text.length > 20); assert.ok(answer('').suggestions.length);
});
test('tokens are filled with live values; every link points to a real route or tel:', () => {
  assert.equal(fillTokens('Pay ₹{{advance}} for {{duration}} min', { advance: 250, duration: 120 }), 'Pay ₹250 for 120 min');
  const routes = new Set(['/menu', '/book-dine', '/login', '/offers', '/contact', '/showcase', '/orders', '/my-bookings', '/menu/biryani', '/menu/pizzas', '/menu/sandwiches', '/menu/burgers', '/menu/soft-drinks', '/menu/mocktails', '/menu/starters', '/menu/desserts']);
  for (const f of FAQS) for (const l of f.links ?? []) assert.ok(l.href.startsWith('tel:') || routes.has(l.href), l.href);
});
