import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import AdminLayout from './AdminLayout';
import { SectionHeader, StatusBadge, LoadingState, ErrorState } from '../../components/shared';
import api from '../../services/api';
import { toast } from 'react-toastify';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const formatINR = (v) => `₹${Number(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

const WORKFLOW = ['draft', 'pending', 'receiving', 'quality_check', 'completed', 'cancelled'];

export default function AdminGRNDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [grn,     setGrn]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [acting,  setActing]  = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get(`/admin/grn/${id}`)
      .then(r => setGrn(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Not found'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const doAction = async (action, label) => {
    setActing(true);
    try {
      await api.put(`/admin/grn/${id}/${action}`);
      toast.success(`${label} successful`);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || `${label} failed`); }
    finally { setActing(false); }
  };

  if (loading) return <AdminLayout><LoadingState /></AdminLayout>;
  if (error)   return <AdminLayout><ErrorState message={error} onRetry={fetchData} /></AdminLayout>;
  if (!grn)    return null;

  const nextActions = {
    draft:         { label: 'Submit for Receiving', action: 'submit' },
    pending:       { label: 'Start Receiving',       action: 'start-receiving' },
    receiving:     { label: 'Mark Quality Check',    action: 'quality-check' },
    quality_check: { label: 'Complete GRN',          action: 'complete' },
  };
  const next = nextActions[grn.status];

  const stepIdx = WORKFLOW.indexOf(grn.status);

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <SectionHeader
          title={`GRN: ${grn.grnNumber}`}
          subtitle={`${grn.warehouse?.name || '—'} · ${grn.supplier || 'No supplier'}`}
          actions={
            <div className="flex gap-2">
              <button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 rounded-lg border text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
                <FiArrowLeft size={14} /> Back
              </button>
              {next && (
                <button
                  onClick={() => doAction(next.action, next.label)}
                  disabled={acting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: '#FF7A00' }}
                >
                  {acting ? 'Processing…' : next.label}
                </button>
              )}
              {!['completed', 'cancelled'].includes(grn.status) && (
                <button
                  onClick={() => doAction('cancel', 'Cancel')}
                  disabled={acting}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: '#EF4444' }}
                >
                  Cancel GRN
                </button>
              )}
            </div>
          }
        />

        {/* Status stepper */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 overflow-x-auto">
            {WORKFLOW.filter(s => s !== 'cancelled').map((s, i) => {
              const done    = stepIdx > i || (grn.status === 'completed' && s !== 'cancelled');
              const current = grn.status === s;
              return (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors`}
                         style={{
                           background: current ? '#FF7A00' : done ? '#10B981' : 'var(--bg-2)',
                           color:      (current || done) ? '#fff' : 'var(--text-4)',
                         }}>
                      {done && !current ? <FiCheckCircle size={14} /> : i + 1}
                    </div>
                    <p className="text-xs mt-1 capitalize text-center" style={{ color: current ? '#FF7A00' : 'var(--text-4)' }}>
                      {s.replace(/_/g, ' ')}
                    </p>
                  </div>
                  {i < WORKFLOW.filter(s => s !== 'cancelled').length - 1 && (
                    <div className="flex-1 h-0.5 mx-1 min-w-[16px]"
                         style={{ background: done ? '#10B981' : 'var(--border)' }} />
                  )}
                </React.Fragment>
              );
            })}
            {grn.status === 'cancelled' && (
              <div className="ml-auto flex items-center gap-2 text-red-500 text-sm">
                <FiAlertCircle size={16} /> Cancelled
              </div>
            )}
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="font-bold text-sm" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>GRN Details</p>
            {[
              ['GRN Number',       grn.grnNumber],
              ['Status',           <StatusBadge key="s" status={grn.status} label={grn.status.replace(/_/g, ' ')} />],
              ['Supplier',         grn.supplier || '—'],
              ['Supplier Invoice', grn.supplierInvoice || '—'],
              ['Purchase Order',   grn.purchaseOrder || '—'],
              ['Received By',      grn.receivedByName || '—'],
              ['Created',          fmtDate(grn.createdAt)],
              ['Completed',        fmtDate(grn.completedAt)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between items-center text-sm">
                <span style={{ color: 'var(--text-4)' }}>{k}</span>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-5 space-y-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <p className="font-bold text-sm" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Summary</p>
            {[
              ['Total Items (received)', grn.totalItems],
              ['Total Accepted',         grn.totalAccepted],
              ['Total Rejected',         grn.totalRejected],
              ['Total Damaged',          grn.totalDamaged],
              ['Total Value',            formatINR(grn.totalValue)],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span style={{ color: 'var(--text-4)' }}>{k}</span>
                <span style={{ color: 'var(--text)', fontWeight: 700 }}>{v ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Items table */}
        <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="font-bold text-sm mb-4" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Items ({grn.items?.length || 0})</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Product', 'Ordered', 'Received', 'Accepted', 'Rejected', 'Damaged', 'Unit Cost', 'Total', 'Zone / Location'].map(h => (
                    <th key={h} className="pb-3 pr-4 text-left text-xs font-semibold" style={{ color: 'var(--text-4)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(grn.items || []).map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-3 pr-4">
                      <p className="font-medium" style={{ color: 'var(--text)' }}>{item.product?.name || item.productName || '—'}</p>
                      {item.batchNumber && <p className="text-xs" style={{ color: 'var(--text-4)' }}>Batch: {item.batchNumber}</p>}
                    </td>
                    {[item.orderedQty, item.receivedQty, item.acceptedQty, item.rejectedQty, item.damageQty].map((v, j) => (
                      <td key={j} className="py-3 pr-4" style={{ color: 'var(--text)' }}>{v ?? 0}</td>
                    ))}
                    <td className="py-3 pr-4" style={{ color: 'var(--text)' }}>{formatINR(item.unitCost)}</td>
                    <td className="py-3 pr-4 font-semibold" style={{ color: 'var(--text)' }}>{formatINR((item.acceptedQty || 0) * (item.unitCost || 0))}</td>
                    <td className="py-3 pr-4 text-xs" style={{ color: 'var(--text-4)' }}>
                      {item.zone?.name || '—'} / {item.storageLocation?.rack || '—'}-{item.storageLocation?.shelf || ''}
                    </td>
                  </tr>
                ))}
                {!grn.items?.length && (
                  <tr><td colSpan={9} className="py-8 text-center text-sm" style={{ color: 'var(--text-4)' }}>No items added yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
