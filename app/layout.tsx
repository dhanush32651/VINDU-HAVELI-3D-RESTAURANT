import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CartDrawer from '@/components/CartDrawer';
import CheckoutModal from '@/components/CheckoutModal';
import CursorRing from '@/components/CursorRing';
import ChatWidget from '@/components/ChatWidget';
import ReservationBanner from '@/components/ReservationBanner';
const serif = Cormorant_Garamond({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-serif' });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });
export const metadata: Metadata = { title: 'VINDU HAVELI | Royal Indian Dining', description: 'Biryani, pizzas, burgers, desserts and more. Order online from Vindu Haveli.' };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning className={`${serif.variable} ${sans.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: `try{document.documentElement.dataset.theme=localStorage.getItem('vh-theme')||'dark'}catch(e){}` }} /></head>
      <body><Navbar /><div className="min-h-screen">{children}</div><Footer /><CartDrawer /><CheckoutModal /><ReservationBanner /><ChatWidget /><CursorRing /></body>
    </html>
  );
}
