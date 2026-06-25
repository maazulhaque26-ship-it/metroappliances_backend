import React from 'react';
import EmptyState   from '../../components/shared/EmptyState';
import SectionHeader from '../../components/shared/SectionHeader';

export default function SupplierInvoices() {
  return (
    <div className="p-6 space-y-4">
      <SectionHeader title="Invoices" subtitle="Invoice management" />
      <EmptyState message="Invoice management coming soon. Invoices will appear here once generated from completed purchase orders." />
    </div>
  );
}
