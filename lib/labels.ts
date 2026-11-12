export const BOOKING_STATUS: Record<string, [string, string]> = {
  held: ['Awaiting payment', 'text-amber-400 border-amber-400/40'], pending: ['Pending restaurant confirmation', 'text-amber-400 border-amber-400/40'],
  confirmed: ['Confirmed', 'text-green-400 border-green-400/40'], seated: ['Seated', 'text-sky-400 border-sky-400/40'], completed: ['Completed', 'text-taupe border-taupe/40'],
  rejected: ['Rejected', 'text-red-400 border-red-400/40'], cancelled: ['Cancelled', 'text-red-400 border-red-400/40'], no_show: ['No-show', 'text-red-400 border-red-400/40'], expired: ['Expired', 'text-taupe border-taupe/40'],
};
export const BOOKING_PAY: Record<string, string> = { unpaid: 'Unpaid', paid: 'Paid', demo: 'DEMO – no money was charged', refund_pending: 'Refund pending', refunded: 'Refunded' };
export const ORDER_STATUS: Record<string, string> = { new: 'New', accepted: 'Accepted', preparing: 'Preparing', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled' };
export const ORDER_COLOR: Record<string, string> = { new: 'text-amber-400 border-amber-400/40', accepted: 'text-sky-400 border-sky-400/40', preparing: 'text-orange-400 border-orange-400/40', ready: 'text-green-400 border-green-400/40', completed: 'text-taupe border-taupe/40', cancelled: 'text-red-400 border-red-400/40' };
export const ORDER_PAY: Record<string, string> = { pending: 'Awaiting payment', paid: 'Paid', demo: 'DEMO – not charged', cod: 'Pay on delivery / at table', failed: 'Failed', refund_pending: 'Refund pending', refunded: 'Refunded' };
export const METHOD: Record<string, string> = { upi: 'UPI', card: 'Card', cod: 'Cash on Delivery / at table' };
export const plain = <T,>(x: T): T => JSON.parse(JSON.stringify(x));
