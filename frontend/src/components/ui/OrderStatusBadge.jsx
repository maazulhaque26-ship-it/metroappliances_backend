import React from 'react';
import { getOrderStatusMeta } from '../../utils/orderStatus';

/** Minimal dot + label — the grammar Stripe Dashboard / Linear use for status,
 *  instead of a loud colored pill. Color only appears for the destination
 *  states (Delivered/Cancelled); everything mid-flight stays brand-neutral. */
export default function OrderStatusBadge({ status, size = 'md' }) {
  const meta = getOrderStatusMeta(status);
  const isLg = size === 'lg';
  return (
    <div className="inline-flex items-center gap-2" role="status" aria-label={`Order status: ${meta.label}`}>
      <span
        className={`rounded-full flex-shrink-0 ${isLg ? 'w-2.5 h-2.5' : 'w-2 h-2'}`}
        style={{ background: meta.color }}
        aria-hidden="true"
      />
      <span className={`font-bold ${isLg ? 'text-sm' : 'text-[11px]'}`} style={{ color: meta.color }}>
        {meta.label}
      </span>
    </div>
  );
}
