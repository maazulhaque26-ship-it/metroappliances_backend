// Maps the DB's 5-value status enum (Pending/Processing/Shipped/Delivered/Cancelled)
// onto a richer 7-stage visual journey, and synthesizes a timeline from
// `statusHistory` (real recorded events) plus interpolated gap-fillers so the
// tracking page is never empty even for orders with only one history entry.

export const STAGES = [
  { key: 'placed',      label: 'Order Placed' },
  { key: 'confirmed',   label: 'Confirmed' },
  { key: 'packed',      label: 'Packed' },
  { key: 'shipped',     label: 'Shipped' },
  { key: 'in_transit',  label: 'In Transit' },
  { key: 'out_for_delivery', label: 'Out For Delivery' },
  { key: 'delivered',   label: 'Delivered' },
];

const DAY = 24 * 60 * 60 * 1000;

function findHistoryDate(order, status) {
  const entry = order.statusHistory?.find(h => h.status === status);
  return entry ? new Date(entry.updatedAt) : null;
}

/** Returns { currentIndex, cancelled } describing where the order sits on the 7-stage journey. */
export function getStageProgress(order) {
  if (!order) return { currentIndex: 0, cancelled: false };
  if (order.status === 'Cancelled') return { currentIndex: -1, cancelled: true };
  if (order.status === 'Delivered') return { currentIndex: 6, cancelled: false };
  if (order.status === 'Processing') return { currentIndex: 2, cancelled: false };

  if (order.status === 'Shipped') {
    const shippedAt = findHistoryDate(order, 'Shipped') || new Date(order.createdAt);
    const daysSinceShipped = (Date.now() - shippedAt.getTime()) / DAY;
    if (daysSinceShipped >= 2) return { currentIndex: 5, cancelled: false }; // Out For Delivery
    if (daysSinceShipped >= 1) return { currentIndex: 4, cancelled: false }; // In Transit
    return { currentIndex: 3, cancelled: false }; // Shipped
  }

  return { currentIndex: 0, cancelled: false }; // Pending
}

/** Best-effort delivery estimate — no DB field for it, so derive from order age / shipped date. */
export function estimateExpectedDelivery(order) {
  if (!order) return null;
  if (order.status === 'Delivered') return order.deliveredAt ? new Date(order.deliveredAt) : null;
  if (order.status === 'Cancelled') return null;

  const shippedAt = findHistoryDate(order, 'Shipped');
  if (shippedAt) return new Date(shippedAt.getTime() + 3 * DAY);
  return new Date(new Date(order.createdAt).getTime() + 6 * DAY);
}

/**
 * Builds a chronological timeline. Real `statusHistory` entries are authoritative;
 * any visual stage between two real entries (e.g. "Confirmed"/"Packed" between a
 * recorded Pending and a recorded Shipped) is interpolated so the page never looks empty.
 */
export function buildTimeline(order) {
  if (!order) return [];

  const history = order.statusHistory?.length
    ? order.statusHistory
    : [{ status: 'Pending', note: 'Order placed successfully', updatedAt: order.createdAt }];

  const sorted = [...history].sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt));
  const { cancelled } = getStageProgress(order);

  const STATUS_TO_STAGE_INDEX = { Pending: 0, Processing: 2, Shipped: 3, Delivered: 6, Cancelled: -1 };
  const STATUS_LABEL = {
    Pending: 'Order Placed',
    Processing: 'Order Confirmed & Packed',
    Shipped: 'Shipped',
    Delivered: 'Delivered',
    Cancelled: 'Order Cancelled',
  };

  const events = sorted.map(h => ({
    date: new Date(h.updatedAt),
    title: STATUS_LABEL[h.status] || h.status,
    description: h.note || (h.trackingId ? `Tracking ID: ${h.trackingId}` : ''),
    stageIndex: STATUS_TO_STAGE_INDEX[h.status] ?? 0,
    real: true,
  }));

  if (cancelled) return events;

  // Fill visual gaps between consecutive real events with interpolated stages.
  const filled = [];
  for (let i = 0; i < events.length; i++) {
    filled.push(events[i]);
    const next = events[i + 1];
    if (!next) continue;
    const gapStart = events[i].stageIndex;
    const gapEnd = next.stageIndex;
    if (gapEnd - gapStart <= 1) continue;

    const span = next.date.getTime() - events[i].date.getTime();
    for (let stage = gapStart + 1; stage < gapEnd; stage++) {
      const ratio = (stage - gapStart) / (gapEnd - gapStart);
      filled.push({
        date: new Date(events[i].date.getTime() + span * ratio),
        title: STAGES[stage].label,
        description: '',
        stageIndex: stage,
        real: false,
      });
    }
  }

  return filled.sort((a, b) => a.date - b.date);
}
