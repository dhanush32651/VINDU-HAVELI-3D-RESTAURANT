// Browser-side fetch helper that throws readable errors.
export async function api<T = any>(url: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  const res = await fetch(url, { method: init.method ?? (init.body ? 'POST' : 'GET'), headers: init.body ? { 'Content-Type': 'application/json' } : undefined, body: init.body ? JSON.stringify(init.body) : undefined, cache: 'no-store' });
  let data: any = null; try { data = await res.json(); } catch {}
  if (!res.ok) { const err: any = new Error(data?.error || `Request failed (${res.status})`); err.data = data; err.status = res.status; throw err; }
  return data as T;
}
export const rupees = (n: number) => `₹${(Math.round(n * 100) / 100).toLocaleString('en-IN')}`;
