import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiEdit2, FiTrendingUp, FiTrendingDown } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import { SectionHeader, StatusBadge, LoadingState, ErrorState, MetricCard } from '../../components/shared';
import api from '../../services/api';
import { toast } from 'react-toastify';
import { FiPackage, FiAlertTriangle } from 'react-icons/fi';

const formatINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmtDate  = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';

export default function AdminInventoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inv,       setInv]       = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [editModal, setEditModal] = useState(false);
  const [thresholds,setThresholds]= useState({ safetyStock: 0, reorderLevel: 0, reorderQty: 0 });
  const [saving,    setSaving]    = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get(`/admin/inventory/${id}`)
      .then(r => {
        setInv(r.data.data);
        setThresholds({ safetyStock: r.data.data.safetyStock, reorderLevel: r.data.data.reorderLevel, reorderQty: r.data.data.reorderQty });
      })
      .catch(e => setError(e.response?.data?.message || 'Not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveThresholds = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/inventory/${id}/thresholds`, thresholds);
      toast.success('Thresholds updated');
      setEditModal(false);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} onRetry={fetchData} /></AdminLayout>;
  if (!inv)    return null;

  const txnTypeColor = { purchase: '#10B981', sale: '#EF4444', adjustment: '#8B5CF6', damage: '#F97316', return: '#3B82F6', cycle_count: '#6B7280', reservation: '#F59E0B', release: '#06B6D4', transfer: '#EC4899', manual: '#6B7280' };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <SectionHeader
          title={inv.product?.name || 'Inventory Detail'}
          subtitle={`SKU: ${inv.product?.sku || '—'} · ${inv.warehouse?.name || '—'}`}
          actions={
            <div className="flex gap-2">
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                <FiArrowLeft size={14} /> Back
              </button>
              <button onClick={() => setEditModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-white font-semibold" style={{ background: '#FF7A00' }}>
                <FiEdit2 size={14} /> Edit Thresholds
              </button>
            </div>
          }
        />

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Available" value={inv.availableQty} icon={FiPackage} accentColor="#10B981" />
          <MetricCard label="Reserved"  value={inv.reservedQty}  icon={FiAlertTriangle} accentColor="#8B5CF6" />
          <MetricCard label="Damaged"   value={inv.damagedQty}   icon={FiAlertTriangle} accentColor="#EF4444" />
          <MetricCard label="Stock Value" value={formatINR(inv.availableQty * inv.averageCost)} icon={FiPackage} accentColor="#FF7A00" />
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="font-bold text-sm" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Stock Info</p>
            {[
              ['Safety Stock', inv.safetyStock],
              ['Reorder Level', inv.reorderLevel],
              ['Reorder Qty',   inv.reorderQty],
              ['Average Cost',  formatINR(inv.averageCost)],
              ['Last Purchase Cost', formatINR(inv.lastPurchaseCost)],
              ['Last Updated', fmtDate(inv.lastUpdated)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-4)' }}>{k}</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{v ?? '—'}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-5 space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="font-bold text-sm" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Location</p>
            {[
              ['Warehouse', inv.warehouse?.name],
              ['Zone',      inv.zone?.name],
              ['Rack',      inv.storageLocation?.rack],
              ['Shelf',     inv.storageLocation?.shelf],
              ['Bin',       inv.storageLocation?.bin],
              ['Barcode',   inv.storageLocation?.barcode],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-4)' }}>{k}</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{v || '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        {inv.recentTransactions?.length > 0 && (
          <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="font-bold text-sm mb-4" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Recent Transactions</p>
            <div className="space-y-2">
              {inv.recentTransactions.map(t => (
                <div key={t._id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
                  <div className="flex items-center gap-3">
                    {t.quantity > 0
                      ? <FiTrendingUp size={14} style={{ color: '#10B981' }} />
                      : <FiTrendingDown size={14} style={{ color: '#EF4444' }} />}
                    <div>
                      <p className="text-xs font-semibold capitalize" style={{ color: txnTypeColor[t.type] || '#6B7280' }}>{t.type.replace(/_/g, ' ')}</p>
                      {t.referenceNumber && <p className="text-xs" style={{ color: 'var(--text-4)' }}>{t.referenceNumber}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: t.quantity > 0 ? '#10B981' : '#EF4444' }}>
                      {t.quantity > 0 ? '+' : ''}{t.quantity}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--text-4)' }}>{fmtDate(t.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit thresholds modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl shadow-2xl" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'var(--border)' }}>
              <h2 className="font-bold text-sm" style={{ color: 'var(--text)' }}>Edit Thresholds</h2>
              <button onClick={() => setEditModal(false)} className="text-xs" style={{ color: 'var(--text-4)' }}>✕</button>
            </div>
            <form onSubmit={saveThresholds} className="p-5 space-y-4">
              {[['safetyStock', 'Safety Stock'], ['reorderLevel', 'Reorder Level'], ['reorderQty', 'Reorder Quantity']].map(([k, lbl]) => (
                <div key={k}>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-4)' }}>{lbl}</label>
                  <input
                    type="number" min="0"
                    value={thresholds[k] || 0}
                    onChange={e => setThresholds(p => ({ ...p, [k]: Number(e.target.value) }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none"
                    style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
                  />
                </div>
              ))}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setEditModal(false)} className="px-4 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-semibold text-white" style={{ background: '#FF7A00' }}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
