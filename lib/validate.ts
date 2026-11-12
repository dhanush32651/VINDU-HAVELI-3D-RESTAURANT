export class ApiError extends Error {
  constructor(public status: number, message: string, public extra?: Record<string, unknown>) { super(message); }
}
export const bad = (m: string) => new ApiError(400, m);
export const str = (v: unknown, name: string, max = 200, min = 1): string => {
  if (typeof v !== 'string') throw bad(`${name} is required.`);
  const t = v.trim().replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
  if (t.length < min) throw bad(`${name} is required.`);
  if (t.length > max) throw bad(`${name} is too long.`);
  return t;
};
export const optStr = (v: unknown, name: string, max = 500): string => (v == null || v === '' ? '' : str(v, name, max, 0));
export const phone = (v: unknown): string => {
  const p = String(v ?? '').replace(/[\s-]/g, '').replace(/^\+?91(?=\d{10}$)/, '');
  if (!/^[6-9]\d{9}$/.test(p) && !/^\d{10}$/.test(p)) throw bad('Enter a valid 10-digit mobile number.');
  return p;
};
export const email = (v: unknown): string => {
  const e = str(v, 'Email', 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) throw bad('Enter a valid email address.');
  return e;
};
export const int = (v: unknown, name: string, min: number, max: number): number => {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) throw bad(`${name} must be a whole number between ${min} and ${max}.`);
  return n;
};
