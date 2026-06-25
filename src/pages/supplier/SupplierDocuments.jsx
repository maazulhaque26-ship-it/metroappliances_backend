import React from 'react';
import EmptyState    from '../../components/shared/EmptyState';
import SectionHeader from '../../components/shared/SectionHeader';

export default function SupplierDocuments() {
  return (
    <div className="p-6 space-y-4">
      <SectionHeader title="Documents" subtitle="Compliance & certifications" />
      <EmptyState message="Document management coming soon. Your GST certificate, PAN card, and other compliance documents will appear here for verification." />
    </div>
  );
}
