// Keyword-scoring FAQ matcher. Runs in the browser (no server, no paid API).
// To add AI later: keep this as the fallback and call your model from app/api/chat/route.ts.
import { FAQS, FALLBACK_LINKS, FALLBACK_TEXT, FAQ_PHONE, Faq, FaqLink, QUICK_REPLIES } from '@/data/faqs';

export interface ChatReply { text: string; links: FaqLink[]; suggestions: { label: string; faq: string }[]; matched: boolean; faqId?: string }

const STOP = new Set(['the', 'a', 'an', 'is', 'are', 'do', 'does', 'you', 'your', 'i', 'my', 'me', 'we', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'can', 'what', 'how', 'which', 'it', 'there', 'have', 'has', 'please', 'tell', 'about', 'any', 'want', 'would', 'like', 'get', 'with']);
const norm = (s: string) => s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9ऀ-෿ ]+/g, ' ').replace(/\s+/g, ' ').trim();
const stem = (w: string) => (w.length > 4 && w.endsWith('s') ? w.slice(0, -1) : w);
const tokens = (s: string) => norm(s).split(' ').filter((w) => w && !STOP.has(w)).map(stem);

export function score(message: string, faq: Faq): number {
  const n = ' ' + norm(message) + ' '; const tk = tokens(message); const toks = new Set(tk); const core = ' ' + tk.join(' ') + ' '; let s = 0;
  for (const k of faq.keywords) {
    const kn = norm(k); if (!kn) continue;
    if (kn.includes(' ')) { if (n.includes(' ' + kn + ' ') || (tokens(kn).length > 0 && core.includes(' ' + tokens(kn).join(' ') + ' '))) s += 3 + kn.split(' ').length; }
    else if (toks.has(stem(kn))) s += 2;
  }
  for (const t of tokens(faq.question)) if (toks.has(t)) s += 0.5;
  return s;
}

const byId = (id: string) => FAQS.find((f) => f.id === id)!;
const suggest = (ids: string[]) => ids.map((id) => ({ label: byId(id).question, faq: id }));
const DEFAULT_SUGGEST = ['menu', 'book-table', 'order-food', 'offers'];

export function replyFor(faq: Faq): ChatReply {
  return { text: faq.answer, links: faq.links ?? [], suggestions: faq.id === 'greeting' || faq.id === 'thanks' ? QUICK_REPLIES.map((q) => ({ label: q.label, faq: q.faq })) : [], matched: true, faqId: faq.id };
}

export function answer(message: string): ChatReply {
  const ranked = FAQS.map((f, i) => ({ f, s: score(message, f), i })).filter((x) => x.s > 0).sort((a, b) => b.s - a.s || a.i - b.i);
  if (ranked.length && ranked[0].s >= 2) return replyFor(ranked[0].f);
  const ids = ranked.filter((x) => x.f.id !== 'greeting' && x.f.id !== 'thanks').slice(0, 3).map((x) => x.f.id);
  return { text: FALLBACK_TEXT, links: FALLBACK_LINKS, suggestions: suggest(ids.length ? ids : DEFAULT_SUGGEST), matched: false };
}
export const answerById = (id: string): ChatReply => replyFor(byId(id));

/** Replace {{tokens}} with live values (booking settings come from /api/public-settings). */
export function fillTokens(text: string, v: Record<string, string | number>): string {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k) => (k in v ? String(v[k]) : k === 'phone' ? FAQ_PHONE : ''));
}
