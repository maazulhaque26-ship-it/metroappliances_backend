import React from 'react';

const PRESETS = {
  active:      { bg: '#D1FAE5', color: '#065F46' },
  inactive:    { bg: '#F3F4F6', color: '#6B7280' },
  pending:     { bg: '#FEF3C7', color: '#92400E' },
  approved:    { bg: '#D1FAE5', color: '#065F46' },
  rejected:    { bg: '#FEE2E2', color: '#991B1B' },
  suspended:   { bg: '#FEE2E2', color: '#991B1B' },
  cancelled:   { bg: '#FEE2E2', color: '#991B1B' },
  delivered:   { bg: '#D1FAE5', color: '#065F46' },
  shipped:     { bg: '#DBEAFE', color: '#1E40AF' },
  processing:  { bg: '#EDE9FE', color: '#5B21B6' },
  won:         { bg: '#D1FAE5', color: '#065F46' },
  lost:        { bg: '#FEE2E2', color: '#991B1B' },
  qualified:   { bg: '#DBEAFE', color: '#1E40AF' },
  prospect:    { bg: '#F3F4F6', color: '#6B7280' },
  proposal:    { bg: '#FEF3C7', color: '#92400E' },
  negotiation: { bg: '#EDE9FE', color: '#5B21B6' },
  platinum:    { bg: '#F3F0FF', color: '#5B21B6' },
  gold:        { bg: '#FEF3C7', color: '#92400E' },
  silver:      { bg: '#F3F4F6', color: '#374151' },
  bronze:      { bg: '#FFF7ED', color: '#9A3412' },
  paid:        { bg: '#D1FAE5', color: '#065F46' },
  unpaid:      { bg: '#FEE2E2', color: '#991B1B' },
  partial:     { bg: '#FEF3C7', color: '#92400E' },
  low:         { bg: '#F3F4F6', color: '#6B7280' },
  medium:      { bg: '#DBEAFE', color: '#1E40AF' },
  high:        { bg: '#FEF3C7', color: '#92400E' },
  urgent:      { bg: '#FEE2E2', color: '#991B1B' },
  'super_admin': { bg: '#EDE9FE', color: '#5B21B6' },
  admin:         { bg: '#DBEAFE', color: '#1E40AF' },
  moderator:     { bg: '#D1FAE5', color: '#065F46' },
  user:          { bg: '#F3F4F6', color: '#6B7280' },
  // Warehouse statuses
  maintenance:   { bg: '#FEF3C7', color: '#92400E' },
  available:     { bg: '#D1FAE5', color: '#065F46' },
  occupied:      { bg: '#FEE2E2', color: '#991B1B' },
  reserved:      { bg: '#FEF3C7', color: '#92400E' },
  blocked:       { bg: '#F3F4F6', color: '#6B7280' },
  // WH user roles
  warehouse_manager: { bg: '#EDE9FE', color: '#5B21B6' },
  supervisor:    { bg: '#DBEAFE', color: '#1E40AF' },
  picker:        { bg: '#D1FAE5', color: '#065F46' },
  packer:        { bg: '#D1FAE5', color: '#065F46' },
  loader:        { bg: '#F3F4F6', color: '#6B7280' },
  auditor:       { bg: '#FEF3C7', color: '#92400E' },
  // Inventory — GRN / Adjustment / CycleCount statuses
  draft:         { bg: '#F3F4F6', color: '#6B7280' },
  receiving:     { bg: '#DBEAFE', color: '#1E40AF' },
  quality_check: { bg: '#FEF3C7', color: '#92400E' },
  completed:     { bg: '#D1FAE5', color: '#065F46' },
  applied:       { bg: '#D1FAE5', color: '#065F46' },
  fulfilled:     { bg: '#D1FAE5', color: '#065F46' },
  released:      { bg: '#F3F4F6', color: '#6B7280' },
  expired:       { bg: '#FEE2E2', color: '#991B1B' },
  // Inventory — Stock / Serial Number statuses
  in_stock:      { bg: '#D1FAE5', color: '#065F46' },
  low_stock:     { bg: '#FEF3C7', color: '#92400E' },
  out_of_stock:  { bg: '#FEE2E2', color: '#991B1B' },
  sold:          { bg: '#F3F4F6', color: '#6B7280' },
  returned:      { bg: '#DBEAFE', color: '#1E40AF' },
  // Inventory — Batch statuses
  depleted:      { bg: '#F3F4F6', color: '#6B7280' },
  quarantine:    { bg: '#FEF3C7', color: '#92400E' },
  // Procurement — Vendor statuses
  pending_approval:   { bg: '#FEF3C7', color: '#92400E' },
  blacklisted:        { bg: '#FEE2E2', color: '#991B1B' },
  // Procurement — PO supplier response statuses
  supplier_accepted:  { bg: '#D1FAE5', color: '#065F46' },
  supplier_rejected:  { bg: '#FEE2E2', color: '#991B1B' },
  partially_delivered:{ bg: '#DBEAFE', color: '#1E40AF' },
  // Procurement — RFQ/PO workflow statuses
  awarded:            { bg: '#D1FAE5', color: '#065F46' },
  sent:               { bg: '#DBEAFE', color: '#1E40AF' },
  acknowledged:       { bg: '#EDE9FE', color: '#5B21B6' },
  published:          { bg: '#DBEAFE', color: '#1E40AF' },
  // Procurement — Approval chain
  pending_approval_step: { bg: '#FEF3C7', color: '#92400E' },
  // Procurement — PR statuses
  submitted:          { bg: '#DBEAFE', color: '#1E40AF' },
  manager_review:     { bg: '#EDE9FE', color: '#5B21B6' },
  finance_review:     { bg: '#FEF3C7', color: '#92400E' },
  converted:          { bg: '#D1FAE5', color: '#065F46' },
  // Procurement — Vendor/Quotation sub-statuses
  invited:            { bg: '#F3F4F6', color: '#6B7280' },
  viewed:             { bg: '#DBEAFE', color: '#1E40AF' },
  responded:          { bg: '#EDE9FE', color: '#5B21B6' },
  declined:           { bg: '#FEE2E2', color: '#991B1B' },
  selected:           { bg: '#D1FAE5', color: '#065F46' },
  // Sprint 10D — Dispatch/Picking statuses
  picking:            { bg: '#FEF3C7', color: '#92400E' },
  picked:             { bg: '#D1FAE5', color: '#065F46' },
  packing:            { bg: '#DBEAFE', color: '#1E40AF' },
  packed:             { bg: '#EDE9FE', color: '#5B21B6' },
  ready:              { bg: '#D1FAE5', color: '#065F46' },
  assigned:           { bg: '#DBEAFE', color: '#1E40AF' },
  dispatched:         { bg: '#CFFAFE', color: '#0E7490' },
  in_transit:         { bg: '#DBEAFE', color: '#1E40AF' },
  out_for_delivery:   { bg: '#FEF3C7', color: '#92400E' },
  failed:             { bg: '#FEE2E2', color: '#991B1B' },
  // Shipment additional
  in_progress:        { bg: '#DBEAFE', color: '#1E40AF' },
  // Challan
  generated:          { bg: '#DBEAFE', color: '#1E40AF' },
  // Transfer
  received:           { bg: '#EDE9FE', color: '#5B21B6' },
  // Sprint 11A — Service Request statuses
  open:               { bg: '#DBEAFE', color: '#1E40AF' },
  verified:           { bg: '#EDE9FE', color: '#5B21B6' },
  warranty_check:     { bg: '#FEF3C7', color: '#92400E' },
  accepted:           { bg: '#CFFAFE', color: '#0E7490' },
  travelling:         { bg: '#DBEAFE', color: '#1E40AF' },
  reached:            { bg: '#EDE9FE', color: '#5B21B6' },
  diagnosis:          { bg: '#FEF3C7', color: '#92400E' },
  repair:             { bg: '#FFF7ED', color: '#9A3412' },
  testing:            { bg: '#DBEAFE', color: '#1E40AF' },
  awaiting_confirmation: { bg: '#FEF3C7', color: '#92400E' },
  closed:             { bg: '#D1FAE5', color: '#065F46' },
  escalated:          { bg: '#FEE2E2', color: '#991B1B' },
  reopened:           { bg: '#FEF3C7', color: '#92400E' },
  // Warranty/AMC statuses
  amc_active:         { bg: '#D1FAE5', color: '#065F46' },
  pending_activation: { bg: '#FEF3C7', color: '#92400E' },
  transferred:        { bg: '#EDE9FE', color: '#5B21B6' },
  void:               { bg: '#F3F4F6', color: '#6B7280' },
  renewal_due:        { bg: '#FEF3C7', color: '#92400E' },
  on_leave:           { bg: '#DBEAFE', color: '#1E40AF' },
  // Sprint 11C — Installation Request statuses
  confirmed:          { bg: '#D1FAE5', color: '#065F46' },
  arrived:            { bg: '#EDE9FE', color: '#5B21B6' },
  demo_in_progress:   { bg: '#FEF3C7', color: '#92400E' },
  rescheduled:        { bg: '#DBEAFE', color: '#1E40AF' },
  // Sprint 11C — Product Registration statuses
  warranty_activated: { bg: '#D1FAE5', color: '#065F46' },
  invalid:            { bg: '#FEE2E2', color: '#991B1B' },
  // Sprint 11C — Priority
  normal:             { bg: '#F3F4F6', color: '#6B7280' },
  vip:                { bg: '#FEF3C7', color: '#92400E' },
  // Sprint 11C — Engineer availability
  engineer_active:    { bg: '#D1FAE5', color: '#065F46' },
  engineer_inactive:  { bg: '#F3F4F6', color: '#6B7280' },
  // Sprint 12A — Manufacturing ERP
  scheduled:          { bg: '#EDE9FE', color: '#5B21B6' },
  paused:             { bg: '#FEF3C7', color: '#92400E' },
  running:            { bg: '#D1FAE5', color: '#065F46' },
  idle:               { bg: '#F3F4F6', color: '#6B7280' },
  breakdown:          { bg: '#FEE2E2', color: '#991B1B' },
  decommissioned:     { bg: '#F3F4F6', color: '#374151' },
  obsolete:           { bg: '#F3F4F6', color: '#9CA3AF' },
};

export default function StatusBadge({ status, label, size = 'sm' }) {
  const key  = (status || '').toLowerCase();
  const conf = PRESETS[key] || { bg: '#F3F4F6', color: '#6B7280' };
  const text = label || status || '—';

  const pad = size === 'lg' ? '5px 14px' : '3px 10px';
  const fs  = size === 'lg' ? '12px' : '10px';

  return (
    <span style={{
      display: 'inline-block',
      padding: pad,
      borderRadius: '20px',
      background: conf.bg,
      color: conf.color,
      fontSize: fs,
      fontWeight: 700,
      textTransform: 'capitalize',
      letterSpacing: '0.02em',
      fontFamily: 'var(--font-body, Poppins, sans-serif)',
      whiteSpace: 'nowrap',
    }}>
      {text}
    </span>
  );
}
