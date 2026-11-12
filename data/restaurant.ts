// Single place for restaurant details used by NEW features (receipts, chatbot, dashboards).
// Your existing pages keep their own text; edit this file (or the .env.local values) to set your real address.
export const RESTAURANT = {
  name: 'VINDU HAVELI',
  phone: '+91 80195 85772',
  phoneHref: 'tel:+918019585772',
  email: 'reserve@vinduhaveli.example',
  address: process.env.NEXT_PUBLIC_RESTAURANT_ADDRESS || 'Vindu Haveli, [Your street, city, PIN]',
  hours: 'Daily, 11:00 AM – 11:30 PM',
  mapQuery: 'Markapur, Andhra Pradesh',
};
