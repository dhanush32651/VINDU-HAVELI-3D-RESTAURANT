// Builds a standalone, print-ready HTML receipt (used by "Download receipt"). Opens in any browser; print it to save as PDF.
import { RESTAURANT as R } from '@/data/restaurant';
import { BOOKING_PAY, BOOKING_STATUS, METHOD, ORDER_PAY, ORDER_STATUS } from './labels';
import { dateLabel, minutesLabel } from './time';

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const row = (k: string, v: string) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`;

export function bookingRows(b: any): [string, string][] {
  return [['Booking ID', b.code], ['Customer name', b.customer_name], ['Phone number', b.customer_phone], ['Table', b.table_label], ['Booking date', dateLabel(b.booking_date)],
    ['Booking time', `${minutesLabel(b.start_min)} – ${minutesLabel(b.end_min)}`], ['Number of guests', String(b.guests)], ['Advance amount', `₹${b.advance_paise / 100}`],
    ['Payment status', BOOKING_PAY[b.payment_status] ?? b.payment_status], ['Booking status', BOOKING_STATUS[b.status]?.[0] ?? b.status]];
}

export function receiptHtml(kind: 'booking' | 'order', d: any, logoDataUrl: string | null): string {
  const brand = logoDataUrl ? `<img src="${logoDataUrl}" alt="VINDU HAVELI logo" style="max-height:70px;max-width:240px">` : `<div class="brand">VINDU HAVELI</div>`;
  let body: string; let title: string;
  if (kind === 'booking') { title = 'Table Booking Receipt'; body = bookingRows(d).map(([k, v]) => row(k, v)).join('') ; }
  else {
    title = 'Order Receipt';
    body = [row('Order ID', d.code), row('Customer name', d.customer_name), row('Phone number', d.customer_phone), row('Order type', d.order_type === 'dine_in' ? `Dine-in (${d.table_label ?? ''})` : 'Delivery'), d.address ? row('Delivery address', d.address) : '',
      d.instructions ? row('Instructions', d.instructions) : '', row('Order time', new Date(d.created_at).toLocaleString('en-IN')), row('Payment method', METHOD[d.payment_method] ?? d.payment_method),
      row('Payment status', ORDER_PAY[d.payment_status] ?? d.payment_status), row('Order status', ORDER_STATUS[d.status] ?? d.status)].join('')
      + `<tr><th>Items</th><td>${d.items.map((i: any) => `${esc(i.qty)} × ${esc(i.name)} — ₹${i.qty * i.unit_price}`).join('<br>')}</td></tr>`
      + row('Subtotal', `₹${d.subtotal}`) + (d.discount ? row('Discount', `-₹${d.discount}`) : '') + row('GST', `₹${d.tax}`) + row('Delivery', d.delivery_fee ? `₹${d.delivery_fee}` : 'Free') + `<tr class="tot"><th>Total</th><td>₹${d.total}</td></tr>`;
  }
  const note = kind === 'booking' ? '<p class="note">Please show this booking receipt when you arrive at the restaurant.</p>' : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} ${esc(d.code)}</title>
<style>body{font-family:Georgia,serif;background:#f6efe0;margin:0;padding:24px;color:#2a2113}.card{max-width:560px;margin:auto;background:#fffdf7;border:2px solid #b8893a;border-radius:14px;padding:28px}
.head{text-align:center;border-bottom:1px dashed #b8893a;padding-bottom:16px;margin-bottom:12px}.brand{font-size:30px;letter-spacing:.2em;color:#8a6416;font-weight:bold}h2{margin:8px 0 0;font-weight:normal;letter-spacing:.15em;text-transform:uppercase;font-size:14px}
table{width:100%;border-collapse:collapse}th{text-align:left;font-weight:normal;color:#6b5b3e;padding:7px 12px 7px 0;vertical-align:top;width:40%}td{padding:7px 0;font-weight:bold}tr{border-bottom:1px solid #eadfc4}.tot td,.tot th{font-size:18px;color:#8a6416;font-weight:bold}
.note{text-align:center;font-weight:bold;margin:18px 0 6px}.foot{text-align:center;color:#6b5b3e;font-size:13px;margin-top:14px;line-height:1.6}@media print{body{background:#fff;padding:0}}</style></head>
<body><div class="card"><div class="head">${brand}<h2>${esc(title)}</h2></div><table>${body}</table>${note}<div class="foot">${esc(R.address)}<br>${esc(R.phone)} · ${esc(R.hours)}</div></div></body></html>`;
}
