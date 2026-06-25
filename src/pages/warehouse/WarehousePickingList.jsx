import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiList, FiCheck } from 'react-icons/fi';
import warehouseAPI from '../../services/warehouseAPI';
import SectionHeader from '../../components/shared/SectionHeader';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import EmptyState    from '../../components/shared/EmptyState';
import { toast } from 'react-toastify';

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';

export default function WarehousePickingList() {
  const navigate = useNavigate();
  const [lists,    setLists]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [active,   setActive]  = useState(null);
  const [working,  setWorking] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    warehouseAPI.get('/warehouse/picking-lists')
      .then(r => setLists(r.data.data || []))
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadDetail = async (id) => {
    try {
      const r = await warehouseAPI.get(`/warehouse/picking-lists/${id}`);
      setActive(r.data.data);
    } catch (err) { toast.error('Load failed'); }
  };

  const handleStart = async (id) => {
    try {
      setWorking(true);
      await warehouseAPI.put(`/warehouse/picking-lists/${id}/start`);
      toast.success('Picking started');
      loadDetail(id);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setWorking(false); }
  };

  const handleUpdateQty = async (listId, itemIndex, qty) => {
    try {
      await warehouseAPI.put(`/warehouse/picking-lists/${listId}/items`, {
        items: [{ itemIndex, quantityPicked: qty }],
      });
      loadDetail(listId);
    } catch (err) { toast.error('Update failed'); }
  };

  const handleComplete = async (id) => {
    try {
      setWorking(true);
      await warehouseAPI.put(`/warehouse/picking-lists/${id}/complete`);
      toast.success('Picking completed!');
      setActive(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setWorking(false); }
  };

  if (loading && lists.length === 0) return <LoadingState message="Loading picking lists…" />;

  if (active) {
    const allPicked = active.items?.every(i => i.status === 'picked');
    return (
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={() => setActive(null)} className="p-2 rounded-lg" style={{ background: 'var(--bg-2)' }}>←</button>
          <div className="flex-1">
            <h2 className="font-bold text-lg" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>{active.pickingNumber}</h2>
            <p className="text-xs" style={{ color: 'var(--text-4)' }}>{active.items?.length} items to pick</p>
          </div>
          <StatusBadge status={active.status} />
          {active.status === 'pending' && (
            <button onClick={() => handleStart(active._id)} disabled={working}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#3B82F6' }}>Start Picking</button>
          )}
          {active.status === 'in_progress' && allPicked && (
            <button onClick={() => handleComplete(active._id)} disabled={working}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#10B981' }}>Complete</button>
          )}
        </div>

        <div className="space-y-3">
          {active.items?.map((item, i) => (
            <div key={i} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: `1px solid ${item.status === 'picked' ? '#10B981' : 'var(--border)'}` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{item.productName}</p>
                  {item.sku && <p className="text-xs" style={{ color: 'var(--text-4)' }}>SKU: {item.sku}</p>}
                  {item.locationCode && <p className="text-xs font-bold mt-1" style={{ color: '#FF7A00' }}>Location: {item.locationCode}</p>}
                  {item.zone && <p className="text-xs" style={{ color: 'var(--text-4)' }}>Zone: {item.zone}</p>}
                </div>
                <div className="text-right">
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>Required</p>
                  <p className="font-bold text-lg" style={{ color: 'var(--text)' }}>{item.quantityRequired}</p>
                </div>
              </div>
              {active.status === 'in_progress' && (
                <div className="flex items-center gap-3 mt-3">
                  <input type="number" min={0} max={item.quantityRequired} defaultValue={item.quantityPicked}
                    onBlur={e => handleUpdateQty(active._id, i, Number(e.target.value))}
                    placeholder="Qty picked" className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none text-center"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                  <StatusBadge status={item.status} />
                  {item.status === 'picked' && <FiCheck size={18} style={{ color: '#10B981' }} />}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <SectionHeader title="Picking Lists" subtitle="Items assigned to you for picking" />
      {lists.length === 0 ? (
        <EmptyState message="No picking lists assigned" />
      ) : (
        <div className="space-y-3">
          {lists.map(list => (
            <div key={list._id} onClick={() => loadDetail(list._id)}
              className="rounded-2xl p-4 cursor-pointer hover:opacity-90 transition-opacity"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm" style={{ color: '#FF7A00' }}>{list.pickingNumber}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-4)' }}>{list.items?.length} items · Created {fmtDate(list.createdAt)}</p>
                </div>
                <StatusBadge status={list.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
