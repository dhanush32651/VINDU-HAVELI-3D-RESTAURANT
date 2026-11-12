# VINDU HAVELI
Next.js 14 · TypeScript · Tailwind · React Three Fiber · Zustand

    npm install
    npm run images -- YOUR_PEXELS_API_KEY    # downloads one matching photo per dish (free key: pexels.com/api)
    npm run dev                              # http://localhost:3000

Pages: / (home), /menu (search + filters), /menu/[category], /showcase (3D), /offers, /contact.
Themes: light, evening, dark (toggle in navbar). Edit address / FSSAI placeholders in components/Footer.tsx, AboutRestaurant.tsx and app/contact/page.tsx.

## Advanced features (added)
Customer & owner login, 8-table Book Dine with advance payment and receipts, food orders in a shared database, owner dashboard with kitchen view, FAQ chatbot, background videos and a custom logo.
**Start here: `SETUP-GUIDE.md`** (Windows). Extra pages: /login, /signup, /dashboard, /book-dine, /orders, /my-bookings, /owner/dashboard, /owner/kitchen.
Videos: `public/videos/README.md` · Logo: `public/images/branding/README.md` · Chatbot answers: `data/faqs.ts` · DB schema: `db/schema.sql` · Tests: `npm test`.

