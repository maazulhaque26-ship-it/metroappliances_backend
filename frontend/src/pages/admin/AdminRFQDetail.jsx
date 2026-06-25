import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck } from 'react-icons/fi';
import api from '../../services/api';
import StatusBadge   from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import { toast } from 'react-toastify';

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtCurrency = v => v ? `₹${Number(v).toLocaleString('en-IN')}` : '—';

export default function AdminRFQDetail() {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [rfq,     setRFQ]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [acting,  setActing]  = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/admin/procurement/rfq/${id}`)
      .then(r => setRFQ(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const doAction = async (action, body = {}) => {
    setActing(true);
    try {
      await api.put(`/admin/procurement/rfq/${id}/${action}`, body);
      toast.success(`RFQ ${action}d`);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setActing(false); }
  };

  const awardVendor = async (vendorId) => {
    setActing(true);
    try {
      await api.put(`/admin/procurement/rfq/${id}/award/${vendorId}`);
      toast.success('RFQ awarded');
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Award failed'); }
    finally { setActing(false); }
  };

  if (loading) return <LoadingState message="Loading RFQ…" />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  const STATUS_STEPS = ['draft', 'published', 'closed', 'awarded'];
  const stepIdx = STATUS_STEPS.indexOf(rfq?.status);

  const respondedVendors = rfq?.vendors?.filter(v => v.status === 'responded') || [];
  const allVendors       = rfq?.vendors || [];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/procurement/rfq')} className="p-2 rounded-lg" style={{ background: 'var(--bg-2)' }}>
          <FiArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-lg" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>{rfq?.title}</h2>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>{rfq?.rfqNumber}</p>
        </div>
        <StatusBadge status={rfq?.status} />
        <div className="flex gap-2">
          {rfq?.status === 'draft'     && <button onClick={() => doAction('publish')} disabled={acting} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#3B82F6' }}>Publish</button>}
          {rfq?.status === 'published' && <button onClick={() => doAction('close')}   disabled={acting} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ background: '#8B5CF6' }}>Close RFQ</button>}
          {rfq?.status === 'cancelled' || rfq?.status === 'awarded' ? null :
            rfq?.status !== 'draft' && <button onClick={() => doAction('cancel')} disabled={acting} className="px-4 py-2 rounded-xl text-xs font-bold" style={{ background: 'var(--bg-2)', color: '#EF4444' }}>Cancel</button>
          }
        </div>
      </div>

      {/* Status stepper */}
      <div className="flex items-center gap-2">
        {STATUS_STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: i <= stepIdx ? '#FF7A00' : 'var(--bg-2)', color: i <= stepIdx ? '#fff' : 'var(--text-4)' }}>
                {i < stepIdx ? <FiCheck size={10} /> : i + 1}
              </div>
              <span className="text-xs capitalize" style={{ color: i <= stepIdx ? '#FF7A00' : 'var(--text-4)' }}>{s}</span>
            </div>
            {i < STATUS_STEPS.length - 1 && <div className="flex-1 h-px" style={{ background: i < stepIdx ? '#FF7A00' : 'var(--border)' }} />}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Required Items</h3>
          <div className="space-y-2">
            {rfq?.items?.map((item, i) => (
              <div key={i} className="flex justify-between py-1.5 border-b" style={{ borderColor: 'var(--border)' }}>
                <span className="text-sm" style={{ color: 'var(--text)' }}>{item.productName}</span>
                <span className="text-xs font-semibold" style={{ color: 'var(--text-4)' }}>{item.quantity} {item.unit}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs" style={{ color: 'var(--text-4)' }}>
            <div>Deadline: <span style={{ color: 'var(--text)' }}>{fmtDate(rfq?.submissionDeadline)}</span></div>
            <div>Delivery: <span style={{ color: 'var(--text)' }}>{fmtDate(rfq?.deliveryDate)}</span></div>
          </div>
        </div>

        {/* Vendor Summary */}
        <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <h3 className="font-bold text-sm mb-3" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Vendor Responses ({respondedVendors.length}/{allVendors.length})</h3>
          <div className="space-y-2">
            {allVendors.map(v => (
              <div key={v._id} className="p-3 rounded-xl" style={{ background: 'var(--bg-2)' }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{v.vendor?.companyName || v.vendorName}</p>
                    <p className="text-xs" style={{ color: 'var(--text-4)' }}>
                      {v.status === 'responded' ? `${fmtCurrency(v.totalAmount)} · ${v.leadTime}d lead` : v.status}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={v.status} />
                    {v.status === 'responded' && ['closed', 'published'].includes(rfq?.status) && rfq?.status !== 'awarded' && (
                      <button onClick={() => awardVendor(v.vendor?._id || v.vendor)}
                        disabled={acting}
                        className="px-2 py-1 rounded text-xs font-bold text-white"
                        style={{ background: '#10B981' }}>
                        Award
                      </button>
                    )}
                    {v.status === 'selected' && <span className="text-xs font-bold" style={{ color: '#10B981' }}>✓ Selected</span>}
                  </div>
                </div>
              </div>
            ))}
            {allVendors.length === 0 && <p className="text-xs text-center py-4" style={{ color: 'var(--text-4)' }}>No vendors invited yet</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
