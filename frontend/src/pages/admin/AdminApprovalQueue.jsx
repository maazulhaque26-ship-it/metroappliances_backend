import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import api from '../../services/api';
import StatusBadge  from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { useConfirm } from '../../hooks/useModal';
import { toast } from 'react-toastify';

const fmtDate     = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtCurrency = v => `₹${(v || 0).toLocaleString('en-IN')}`;
const PRIORITY_COLORS = { low: '#6B7280', medium: '#3B82F6', high: '#F59E0B', urgent: '#EF4444' };

export default function AdminApprovalQueue() {
  const navigate = useNavigate();
  const [data,    setData]    = useState({ requisitions: { data: [], total: 0 }, purchaseOrders: { data: [], total: 0 } });
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('requisitions');
  const { open: confirmOpen, ask, cancel, confirm: runConfirm, loading: confirming, title: confirmTitle, message: confirmMsg } = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/vendors/approval-queue')
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handlePRAction = async (id, action) => {
    try {
      await api.put(`/admin/procurement/requisitions/${id}/${action}`);
      toast.success(`Requisition ${action}d`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  const handlePOAction = async (id, action) => {
    try {
      await api.put(`/admin/procurement/orders/${id}/${action}`);
      toast.success(`PO ${action}d`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Action failed'); }
  };

  if (loading) return <LoadingState message="Loading approval queue…" />;

  const prs = data.requisitions?.data || [];
  const pos = data.purchaseOrders?.data || [];

  return (
    <div className="p-6 space-y-5">
      <SectionHeader
        title="Approval Queue"
        subtitle={`${(data.requisitions?.total || 0) + (data.purchaseOrders?.total || 0)} items pending`}
      />

      <div className="flex gap-2">
        {[
          { label: `Requisitions (${data.requisitions?.total || 0})`, value: 'requisitions' },
          { label: `Purchase Orders (${data.purchaseOrders?.total || 0})`, value: 'orders' },
        ].map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ background: tab === t.value ? '#FF7A00' : 'var(--bg-2)', color: tab === t.value ? '#fff' : 'var(--text-4)' }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'requisitions' && (
        <div className="space-y-3">
          {prs.length === 0 && <p className="text-center py-12 text-sm" style={{ color: 'var(--text-4)' }}>No requisitions pending approval</p>}
          {prs.map(pr => (
            <div key={pr._id} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{pr.prNumber}</span>
                    <StatusBadge status={pr.status} />
                    <span className="text-xs font-bold capitalize" style={{ color: PRIORITY_COLORS[pr.priority] }}>{pr.priority}</span>
                  </div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{pr.title}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
                    by {pr.requestedByName} · Est. {fmtCurrency(pr.totalEstimatedCost)} · Required by {fmtDate(pr.requiredByDate)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>{pr.items?.length || 0} items · {pr.justification}</p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => ask({ title: 'Approve Requisition', message: 'Approve this purchase requisition?', type: 'info', onConfirm: () => handlePRAction(pr._id, 'approve') })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: '#10B981' }}>
                    <FiCheckCircle size={12} /> Approve
                  </button>
                  <button onClick={() => ask({ title: 'Reject Requisition', message: 'Reject this purchase requisition?', type: 'danger', onConfirm: () => handlePRAction(pr._id, 'reject') })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: '#EF4444' }}>
                    <FiXCircle size={12} /> Reject
                  </button>
                  <button onClick={() => navigate(`/admin/procurement/requisitions/${pr._id}`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {pos.length === 0 && <p className="text-center py-12 text-sm" style={{ color: 'var(--text-4)' }}>No purchase orders pending approval</p>}
          {pos.map(po => (
            <div key={po._id} className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{po.poNumber}</span>
                    <StatusBadge status={po.status} />
                  </div>
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{po.vendor?.companyName || po.vendorName}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>
                    by {po.createdBy?.name} · {fmtCurrency(po.totalAmount)} · Expected {fmtDate(po.expectedDeliveryDate)}
                  </p>
                </div>
                <div className="flex gap-2 ml-4">
                  <button onClick={() => ask({ title: 'Approve Purchase Order', message: 'Approve this purchase order?', type: 'info', onConfirm: () => handlePOAction(po._id, 'approve') })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: '#10B981' }}>
                    <FiCheckCircle size={12} /> Approve
                  </button>
                  <button onClick={() => ask({ title: 'Reject Purchase Order', message: 'Reject this purchase order?', type: 'danger', onConfirm: () => handlePOAction(po._id, 'reject') })}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                    style={{ background: '#EF4444' }}>
                    <FiXCircle size={12} /> Reject
                  </button>
                  <button onClick={() => navigate(`/admin/procurement/orders/${po._id}`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold border"
                    style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMsg}
        onConfirm={runConfirm}
        onCancel={cancel}
        loading={confirming}
      />
    </div>
  );
}
