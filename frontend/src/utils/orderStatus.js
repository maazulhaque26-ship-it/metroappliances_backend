// Single source of truth for order-status presentation. Color is reserved for
// meaning (green = good, red = stop) — everything in between stays neutral ink,
// matching a dot+label grammar rather than five competing background pills.
export const ORDER_STATUS = {
  Pending:    { label: 'Order Placed', color: 'var(--text-2)' },
  Processing: { label: 'Processing',   color: 'var(--accent)' },
  Shipped:    { label: 'Shipped',      color: 'var(--accent)' },
  Delivered:  { label: 'Delivered',    color: '#16A34A' },
  Cancelled:  { label: 'Cancelled',    color: '#DC2626' },
};

export function getOrderStatusMeta(status) {
  return ORDER_STATUS[status] || ORDER_STATUS.Pending;
}
