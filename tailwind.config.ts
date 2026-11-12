import type { Config } from 'tailwindcss';
const v = (n: string) => `rgb(var(--${n}) / <alpha-value>)`;
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}', './data/**/*.{ts,tsx}'],
  theme: { extend: {
    colors: { royal: v('royal'), charcoal: v('charcoal'), gold: v('gold'), champagne: v('champagne'), ivory: v('ivory'), taupe: v('taupe') },
    fontFamily: { serif: ['var(--font-serif)', 'serif'], sans: ['var(--font-sans)', 'sans-serif'] },
    boxShadow: { glow: '0 0 24px rgb(var(--champagne) / 0.4)' },
  } },
  plugins: [],
};
export default config;
