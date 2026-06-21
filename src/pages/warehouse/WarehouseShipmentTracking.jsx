import React, { useState, useCallback, useEffect } from 'react';
import warehouseAPI from '../../services/warehouseAPI';
import SectionHeader from '../../components/shared/SectionHeader';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import EmptyState    from '../../components/shared/EmptyState';
import { usePagination } from '../../hooks/usePagination';
import { toast } from 'react-toastify';

const fmtDate = d => d ? new Date(d).toLocaleString('en-IN') : '—';

export default function WarehouseShipmentTracking() {
  const [shipments, setShipments] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [active,    setActive]    = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    warehouseAPI.get('/warehouse/shipments')
      .then(r => setShipments(r.data.data || []))
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadTracking = async (id) => {
    try {
      const r = await warehouseAPI.get(`/warehouse/shipments/${id}/tracking`);
      setActive(r.data.data);
    } catch (err) { toast.error('Load failed'); }
  };

  if (loading) return <LoadingState message="Loading shipments…" />;

  if (active) {
    const events = [...(active.trackingEvents || [])].reverse();
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setActive(null)} className="p-2 rounded-lg" style={{ background: 'var(--bg-2)' }}>←</button>
          <div className="flex-1">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>{active.shipmentNumber}</h2>
            <p className="text-xs" style={{ color: 'var(--text-4)' }}>{active.courierName} · {active.trackingNumber || 'No tracking #'}</p>
          </div>
          <StatusBadge status={active.status} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-4)' }}>Recipient</p>
            <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{active.recipientName}</p>
            <p className="text-xs" style={{ color: 'var(--text-4)' }}>{active.recipientPhone}</p>
            {active.deliveryAddress && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
                {[active.deliveryAddress.city, active.deliveryAddress.state, active.deliveryAddress.pincode].filter(Boolean).join(', ')}
              </p>
            )}
          </div>
          <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-4)' }}>Timeline</p>
            {active.dispatchedAt && <p className="text-xs" style={{ color: 'var(--text-4)' }}>Dispatched: <span style={{ color: 'var(--text)' }}>{fmtDate(active.dispatchedAt)}</span></p>}
            {active.estimatedDelivery && <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>Est. Delivery: <span style={{ color: '#FF7A00' }}>{new Date(active.estimatedDelivery).toLocaleDateString('en-IN')}</span></p>}
            {active.deliveredAt && <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>Delivered: <span style={{ color: '#10B981' }}>{fmtDate(active.deliveredAt)}</span></p>}
          </div>
        </div>

        {/* Tracking timeline */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-xs font-bold uppercase mb-3" style={{ color: 'var(--text-4)' }}>Tracking Events</p>
          {events.length === 0 ? (
            <p className="text-xs text-center py-4" style={{ color: 'var(--text-4)' }}>No tracking events yet</p>
          ) : (
            <div className="space-y-3">
              {events.map((event, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full mt-1" style={{ background: i === 0 ? '#FF7A00' : 'var(--border)', flexShrink: 0 }} />
                    {i < events.length - 1 && <div className="w-px flex-1 mt-1" style={{ background: 'var(--border)' }} />}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-semibold capitalize" style={{ color: 'var(--text)' }}>{event.status?.replace(/_/g,' ')}</p>
                    {event.location && <p className="text-xs" style={{ color: 'var(--text-4)' }}>{event.location}</p>}
                    {event.description && <p className="text-xs" style={{ color: 'var(--text-4)' }}>{event.description}</p>}
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>{fmtDate(event.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <SectionHeader title="Shipment Tracking" subtitle="All shipments from this warehouse" />
      {shipments.length === 0 ? (
        <EmptyState message="No shipments yet" />
      ) : (
        <div className="space-y-3">
          {shipments.map(s => (
            <div key={s._id} onClick={() => loadTracking(s._id)}
              className="rounded-2xl p-4 cursor-pointer hover:opacity-90"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm" style={{ color: '#FF7A00' }}>{s.shipmentNumber}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text)' }}>{s.recipientName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>{s.courierName || 'Manual'} · {s.trackingNumber || '—'}</p>
                </div>
                <StatusBadge status={s.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
