import React, { useState, useCallback, useEffect } from 'react';
import warehouseAPI from '../../services/warehouseAPI';
import SectionHeader from '../../components/shared/SectionHeader';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import EmptyState    from '../../components/shared/EmptyState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { useConfirm } from '../../hooks/useModal';
import { toast } from 'react-toastify';

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';

export default function WarehouseTransfers() {
  const [transfers, setTransfers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [active,    setActive]    = useState(null);
  const [shipForm,  setShipForm]  = useState({ vehicle: '', driverName: '' });
  const [receiveItems, setRecvItems] = useState([]);
  const { open: confirmOpen, ask, cancel, confirm: runConfirm, loading: confirming, title: confirmTitle, message: confirmMsg } = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    warehouseAPI.get('/warehouse/transfers')
      .then(r => setTransfers(r.data.data || []))
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openTransfer = (t) => {
    setActive(t);
    setRecvItems((t.items || []).map((item, i) => ({ itemIndex: i, quantityReceived: item.quantityShipped || item.quantityRequested })));
  };

  const handleShip = async (e) => {
    e.preventDefault();
    try {
      await warehouseAPI.put(`/warehouse/transfers/${active._id}/ship`, shipForm);
      toast.success('Transfer shipped');
      setActive(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handleReceive = async () => {
    ask({
      title: 'Confirm Receipt',
      message: 'Mark transfer as received with the quantities entered?',
      type: 'info',
      onConfirm: async () => {
        await warehouseAPI.put(`/warehouse/transfers/${active._id}/receive`, { receivedItems: receiveItems });
        toast.success('Transfer received');
        setActive(null);
        load();
      },
    });
  };

  if (loading) return <LoadingState message="Loading transfers…" />;

  if (active) {
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setActive(null)} className="p-2 rounded-lg" style={{ background: 'var(--bg-2)' }}>←</button>
          <div className="flex-1">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>{active.transferNumber}</h2>
            <p className="text-xs" style={{ color: 'var(--text-4)' }}>{active.fromWarehouseName} → {active.toWarehouseName}</p>
          </div>
          <StatusBadge status={active.status} />
        </div>

        {/* Items list */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>Items</h3>
          <div className="space-y-2">
            {active.items?.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--bg-2)' }}>
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{item.productName}</p>
                  {item.sku && <p className="text-xs" style={{ color: 'var(--text-4)' }}>{item.sku}</p>}
                </div>
                <div className="text-right text-xs" style={{ color: 'var(--text-4)' }}>
                  <p>Req: <span style={{ color: 'var(--text)', fontWeight: 600 }}>{item.quantityRequested}</span></p>
                  {item.quantityShipped > 0 && <p>Shipped: <span style={{ color: '#3B82F6' }}>{item.quantityShipped}</span></p>}
                </div>
                {active.status === 'in_transit' && (
                  <input type="number" min={0} value={receiveItems[i]?.quantityReceived || 0}
                    onChange={e => setRecvItems(prev => {
                      const updated = [...prev];
                      updated[i] = { ...updated[i], itemIndex: i, quantityReceived: Number(e.target.value) };
                      return updated;
                    })}
                    className="w-20 px-2 py-1.5 rounded border text-sm outline-none text-center"
                    style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        {active.status === 'approved' && (
          <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)' }}>Ship Transfer</h3>
            <form onSubmit={handleShip} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Vehicle</label>
                  <input value={shipForm.vehicle} onChange={e => setShipForm(f => ({ ...f, vehicle: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Driver Name</label>
                  <input value={shipForm.driverName} onChange={e => setShipForm(f => ({ ...f, driverName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>Mark as Shipped</button>
            </form>
          </div>
        )}

        {active.status === 'in_transit' && (
          <button onClick={handleReceive} className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#10B981' }}>Confirm Receipt</button>
        )}

        <ConfirmDialog open={confirmOpen} title={confirmTitle} message={confirmMsg} onConfirm={runConfirm} onCancel={cancel} loading={confirming} />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <SectionHeader title="Stock Transfers" subtitle="Transfers involving your warehouse" />
      {transfers.length === 0 ? (
        <EmptyState message="No active transfers" />
      ) : (
        <div className="space-y-3">
          {transfers.map(t => (
            <div key={t._id} onClick={() => openTransfer(t)}
              className="rounded-2xl p-4 cursor-pointer hover:opacity-90"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm" style={{ color: '#FF7A00' }}>{t.transferNumber}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>{t.fromWarehouseName} → {t.toWarehouseName}</p>
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>{t.items?.length} items · {fmtDate(t.createdAt)}</p>
                </div>
                <StatusBadge status={t.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
