import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import api from '../../services/api';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { useConfirm } from '../../hooks/useModal';
import { toast } from 'react-toastify';

const fmtDate     = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtCurrency = v => `₹${(v || 0).toLocaleString('en-IN')}`;

const PO_FLOW = ['draft','pending_approval','approved','released','sent','acknowledged','supplier_accepted','completed'];
const STEP_ACTIONS = {
  draft:            { label: 'Submit for Approval', action: 'submit',  color: '#3B82F6' },
  pending_approval: { label: 'Approve',             action: 'approve', color: '#10B981' },
  approved:         { label: 'Release PO',          action: 'release', color: '#8B5CF6' },
  released:         { label: 'Mark as Sent',        action: 'send',    color: '#06B6D4' },
  sent:             null,
  acknowledged:     null,
  supplier_accepted: null,
  partially_delivered: null,
};

export default function AdminPurchaseOrderDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [po,      setPO]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [acting,  setActing]  = useState(false);
  const { open: confirmOpen, ask, cancel, confirm: runConfirm, loading: confirming, title: confirmTitle, message: confirmMsg } = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/admin/procurement/orders/${id}`)
      .then(r => setPO(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (action, body = {}) => {
    setActing(true);
    try {
      await api.put(`/admin/procurement/orders/${id}/${action}`, body);
      toast.success(`PO ${action}d`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActing(false); }
  };

  if (loading) return <LoadingState message="Loading purchase order…" />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  const stepIdx     = PO_FLOW.indexOf(po?.status);
  const nextAction  = STEP_ACTIONS[po?.status];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/procurement/orders')} className="p-2 rounded-lg" style={{ background: 'var(--bg-2)' }}>
          <FiArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-lg" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>{po?.poNumber}</h2>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>{po?.vendor?.companyName}</p>
        </div>
        <StatusBadge status={po?.status} />
        <div className="flex gap-2">
          {nextAction && (
            <button onClick={() => ask({ title: nextAction.label, message: `Proceed to ${nextAction.action} this PO?`, type: 'info', onConfirm: () => doAction(nextAction.action) })} disabled={acting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: nextAction.color }}>
              {nextAction.label}
            </button>
          )}
          {!['completed','cancelled'].includes(po?.status) && (
            <button onClick={() => ask({ title: 'Cancel PO', message: 'Cancel this purchase order?', type: 'danger', onConfirm: () => doAction('cancel') })} disabled={acting}
              className="px-3 py-2 rounded-xl text-xs font-bold"
              style={{ background: 'var(--bg-2)', color: '#EF4444' }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Status stepper */}
      <div className="overflow-x-auto">
        <div className="flex items-center gap-1 min-w-max">
          {PO_FLOW.slice(0, 6).map((s, i) => (
            <React.Fragment key={s}>
              <div className="flex items-center gap-1">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: i <= stepIdx ? '#FF7A00' : 'var(--bg-2)', color: i <= stepIdx ? '#fff' : 'var(--text-4)' }}>
                  {i < stepIdx ? <FiCheck size={8} /> : i + 1}
                </div>
                <span className="text-xs capitalize hidden md:block" style={{ color: i <= stepIdx ? '#FF7A00' : 'var(--text-4)' }}>{s.replace(/_/g,' ')}</span>
              </div>
              {i < 5 && <div className="w-6 h-px" style={{ background: i < stepIdx ? '#FF7A00' : 'var(--border)' }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Vendor Info */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold text-xs uppercase mb-3" style={{ color: 'var(--text-4)' }}>Vendor</h3>
          <p className="font-semibold" style={{ color: 'var(--text)' }}>{po?.vendor?.companyName}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>{po?.vendor?.email}</p>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>{po?.vendor?.phone}</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-4)' }}>Payment: <span style={{ color: 'var(--text)' }}>{po?.paymentTerms || po?.vendor?.paymentTerms}</span></p>
        </div>

        {/* Order Info */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold text-xs uppercase mb-3" style={{ color: 'var(--text-4)' }}>Order Info</h3>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>Created by: <span style={{ color: 'var(--text)' }}>{po?.createdByName}</span></p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>Created: <span style={{ color: 'var(--text)' }}>{fmtDate(po?.createdAt)}</span></p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>Expected: <span style={{ color: new Date(po?.expectedDeliveryDate) < new Date() && po?.status !== 'completed' ? '#EF4444' : 'var(--text)' }}>{fmtDate(po?.expectedDeliveryDate)}</span></p>
          {po?.approvedAt && <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>Approved: <span style={{ color: 'var(--text)' }}>{fmtDate(po?.approvedAt)}</span></p>}
        </div>

        {/* Financials */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold text-xs uppercase mb-3" style={{ color: 'var(--text-4)' }}>Financial Summary</h3>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs"><span style={{ color: 'var(--text-4)' }}>Subtotal</span><span style={{ color: 'var(--text)' }}>{fmtCurrency(po?.subtotal)}</span></div>
            <div className="flex justify-between text-xs"><span style={{ color: 'var(--text-4)' }}>Tax</span><span style={{ color: 'var(--text)' }}>{fmtCurrency(po?.taxAmount)}</span></div>
            {po?.discount > 0 && <div className="flex justify-between text-xs"><span style={{ color: 'var(--text-4)' }}>Discount</span><span style={{ color: '#10B981' }}>-{fmtCurrency(po?.discount)}</span></div>}
            <div className="flex justify-between text-sm font-bold border-t pt-1.5 mt-1.5" style={{ borderColor: 'var(--border)' }}>
              <span style={{ color: 'var(--text)' }}>Total</span>
              <span style={{ color: '#FF7A00' }}>{fmtCurrency(po?.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Order Items</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--border)' }}>
                {['Product','Qty','Unit Price','Tax','Total'].map(h => (
                  <th key={h} className="py-2 text-left text-xs font-semibold" style={{ color: 'var(--text-4)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {po?.items?.map((item, i) => (
                <tr key={i} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="py-2" style={{ color: 'var(--text)' }}>{item.productName}</td>
                  <td className="py-2 text-center" style={{ color: 'var(--text-4)' }}>{item.quantity} {item.unit}</td>
                  <td className="py-2" style={{ color: 'var(--text-4)' }}>{fmtCurrency(item.unitPrice)}</td>
                  <td className="py-2" style={{ color: 'var(--text-4)' }}>{item.taxRate}%</td>
                  <td className="py-2 font-bold" style={{ color: '#10B981' }}>{fmtCurrency(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Approval Steps */}
      {po?.approvalSteps?.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Approval Chain</h3>
          <div className="space-y-2">
            {po.approvalSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--bg-2)' }}>
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: step.status === 'approved' ? '#10B981' : step.status === 'rejected' ? '#EF4444' : '#F59E0B', color: '#fff' }}>
                  {step.step}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold capitalize" style={{ color: 'var(--text)' }}>{step.role.replace(/_/g,' ')}</p>
                  {step.approverName && <p className="text-xs" style={{ color: 'var(--text-4)' }}>{step.approverName} · {fmtDate(step.actedAt)}</p>}
                  {step.comments && <p className="text-xs italic" style={{ color: 'var(--text-4)' }}>{step.comments}</p>}
                </div>
                <StatusBadge status={step.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {po?.supplierNotes && (
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold text-xs uppercase mb-2" style={{ color: 'var(--text-4)' }}>Supplier Notes</h3>
          <p className="text-sm" style={{ color: 'var(--text)' }}>{po.supplierNotes}</p>
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
