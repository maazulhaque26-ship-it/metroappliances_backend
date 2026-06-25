import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import supplierAPI from '../../services/supplierAPI';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { useConfirm } from '../../hooks/useModal';
import { toast } from 'react-toastify';

const fmtDate     = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtCurrency = v => `₹${(v || 0).toLocaleString('en-IN')}`;

export default function SupplierOrderDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [po,      setPO]      = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const { open: confirmOpen, ask, cancel, confirm: runConfirm, loading: confirming, title: confirmTitle, message: confirmMsg } = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    supplierAPI.get(`/supplier/orders/${id}`)
      .then(r => setPO(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (action) => {
    try {
      await supplierAPI.put(`/supplier/orders/${id}/${action}`);
      toast.success(`Order ${action}d`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  if (loading) return <LoadingState message="Loading order…" />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/supplier/orders')} className="p-2 rounded-lg" style={{ background: 'var(--bg-2)' }}>
          <FiArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-lg" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>{po?.poNumber}</h2>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>Created {fmtDate(po?.createdAt)}</p>
        </div>
        <StatusBadge status={po?.status} />
        <div className="flex gap-2">
          {po?.status === 'sent' && (
            <button onClick={() => ask({ title: 'Acknowledge Order', message: 'Acknowledge receipt of this PO?', type: 'info', onConfirm: () => doAction('acknowledge') })}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#3B82F6' }}>Acknowledge</button>
          )}
          {po?.status === 'acknowledged' && (
            <>
              <button onClick={() => ask({ title: 'Accept Order', message: 'Accept this purchase order?', type: 'info', onConfirm: () => doAction('accept') })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#10B981' }}>Accept</button>
              <button onClick={() => ask({ title: 'Reject Order', message: 'Reject this purchase order?', type: 'danger', onConfirm: () => doAction('reject') })}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#EF4444' }}>Reject</button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold text-xs uppercase mb-3" style={{ color: 'var(--text-4)' }}>Order Details</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span style={{ color: 'var(--text-4)' }}>Expected Delivery</span><span style={{ color: 'var(--text)' }}>{fmtDate(po?.expectedDeliveryDate)}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--text-4)' }}>Payment Terms</span><span style={{ color: 'var(--text)' }}>{po?.paymentTerms || '—'}</span></div>
          </div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold text-xs uppercase mb-3" style={{ color: 'var(--text-4)' }}>Financial Summary</h3>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span style={{ color: 'var(--text-4)' }}>Subtotal</span><span>{fmtCurrency(po?.subtotal)}</span></div>
            <div className="flex justify-between"><span style={{ color: 'var(--text-4)' }}>Tax</span><span>{fmtCurrency(po?.taxAmount)}</span></div>
            <div className="flex justify-between font-bold border-t pt-1.5" style={{ borderColor: 'var(--border)', color: '#FF7A00' }}>
              <span>Total</span><span>{fmtCurrency(po?.totalAmount)}</span>
            </div>
          </div>
        </div>
      </div>

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
                  <td className="py-2 text-center text-xs" style={{ color: 'var(--text-4)' }}>{item.quantity} {item.unit}</td>
                  <td className="py-2 text-xs" style={{ color: 'var(--text-4)' }}>{fmtCurrency(item.unitPrice)}</td>
                  <td className="py-2 text-xs" style={{ color: 'var(--text-4)' }}>{item.taxRate}%</td>
                  <td className="py-2 font-bold text-xs" style={{ color: '#10B981' }}>{fmtCurrency(item.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
