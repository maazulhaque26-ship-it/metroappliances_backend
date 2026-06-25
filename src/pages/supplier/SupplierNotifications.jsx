import React from 'react';
import EmptyState    from '../../components/shared/EmptyState';
import SectionHeader from '../../components/shared/SectionHeader';

export default function SupplierNotifications() {
  return (
    <div className="p-6 space-y-4">
      <SectionHeader title="Notifications" subtitle="Alerts & updates" />
      <EmptyState message="No notifications yet. You'll be notified here when new POs are sent, RFQ invitations arrive, or order status changes." />
    </div>
  );
}
