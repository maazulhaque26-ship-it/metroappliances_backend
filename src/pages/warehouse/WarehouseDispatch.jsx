import React, { useState, useCallback, useEffect } from 'react';
import warehouseAPI from '../../services/warehouseAPI';
import SectionHeader from '../../components/shared/SectionHeader';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import EmptyState    from '../../components/shared/EmptyState';
import { toast } from 'react-toastify';

export default function WarehouseDispatch() {
  const [shipments, setShipments] = useState([]);
  const [loading,   setLoading]   = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    warehouseAPI.get('/warehouse/shipments', { params: { status: 'ready' } })
      .then(r => setShipments(r.data.data || []))
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingState message="Loading ready shipments…" />;

  return (
    <div className="p-6 space-y-4">
      <SectionHeader title="Dispatch" subtitle="Shipments ready for handover" />

      {shipments.length === 0 ? (
        <EmptyState message="No shipments ready for dispatch" />
      ) : (
        <div className="space-y-3">
          {shipments.map(s => (
            <div key={s._id} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-bold text-sm" style={{ color: '#FF7A00' }}>{s.shipmentNumber}</p>
                  <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>{s.recipientName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>{s.courierName} · {s.trackingNumber || 'No tracking'}</p>
                  {s.deliveryAddress && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
                      {[s.deliveryAddress.city, s.deliveryAddress.state, s.deliveryAddress.pincode].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
                <StatusBadge status={s.status} />
              </div>
              {s.weight && (
                <div className="mt-2 text-xs" style={{ color: 'var(--text-4)' }}>
                  Weight: <span style={{ color: 'var(--text)' }}>{s.weight} kg</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
