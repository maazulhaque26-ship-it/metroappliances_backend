import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import { fetchInvoice, submitInvoice, approveInvoice, rejectInvoice, postInvoiceToGL } from '../../services/accountsReceivableAPI';

export default function AdminCustomerInvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [inv,     setInv]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [glModal, setGLModal] = useState(false);
  const [glForm,  setGLForm]  = useState({ arAccount: '', revenueAccount: '' });
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');

  const load = () => {
    setLoading(true);
    fetchInvoice(id).then(r => setInv(r.data.data)).catch(() => setError('Invoice not found')).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, [id]);

  const act = async (fn, ...args) => {
    setSaving(true); setMsg('');
    try { await fn(...args); load(); setMsg('Done'); }
    catch (e) { setMsg(e?.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handlePostGL = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await postInvoiceToGL(id, glForm); setGLModal(false); load(); setMsg('Posted to GL'); }
    catch (e) { setMsg(e?.response?.data?.message || 'GL post failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '-';

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/accounts-receivable/invoices')} className="text-[12px]" style={{ color: 'var(--text-4)' }}>← Back</button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{inv.invoiceNumber}</h1>
            <StatusBadge status={inv.status} />
            {inv.glPosted && <span className="text-[10px] px-2 py-0.5 rounded font-semibold" style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}>GL Posted</span>}
          </div>
          <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-4)' }}>{inv.customerName}</p>
        </div>
      </div>

      {msg && <div className="text-[12px] px-3 py-2 rounded-lg" style={{ background: 'rgba(255,122,0,0.08)', color: 'var(--accent)' }}>{msg}</div>}

      {/* Details */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-xl space-y-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Invoice Details</p>
          {[['Invoice Date', fmtDate(inv.invoiceDate)], ['Due Date', fmtDate(inv.dueDate)], ['Payment Term', inv.paymentTerm], ['Invoice Type', inv.invoiceType]].map(([l,v]) => (
            <div key={l} className="flex justify-between text-[12.5px]">
              <span style={{ color: 'var(--text-4)' }}>{l}</span>
              <span style={{ color: 'var(--text)' }}>{v}</span>
            </div>
          ))}
        </div>
        <div className="p-5 rounded-xl space-y-3" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-4)' }}>Amounts</p>
          {[['Subtotal', fmt(inv.subtotal)], ['GST', fmt(inv.gstTotal)], ['Total', fmt(inv.totalAmount)], ['Paid', fmt(inv.paidAmount)], ['Outstanding', fmt(inv.outstandingAmount)]].map(([l,v]) => (
            <div key={l} className="flex justify-between text-[12.5px]">
              <span style={{ color: 'var(--text-4)' }}>{l}</span>
              <span className="font-semibold" style={{ color: l === 'Outstanding' ? 'var(--accent)' : 'var(--text)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Line items */}
      {inv.items && inv.items.length > 0 && (
        <div className="p-5 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <p className="text-[12px] font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-4)' }}>Line Items</p>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead><tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Description','Qty','Unit Price','Tax%','Line Total'].map(h => <th key={h} className="py-2 text-left font-medium" style={{ color: 'var(--text-4)' }}>{h}</th>)}
              </tr></thead>
              <tbody>
                {inv.items.map((item, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td className="py-2" style={{ color: 'var(--text)' }}>{item.description || '-'}</td>
                    <td className="py-2" style={{ color: 'var(--text-2)' }}>{item.quantity}</td>
                    <td className="py-2" style={{ color: 'var(--text-2)' }}>{fmt(item.unitPrice)}</td>
                    <td className="py-2" style={{ color: 'var(--text-2)' }}>{item.taxRate}%</td>
                    <td className="py-2 font-medium" style={{ color: 'var(--text)' }}>{fmt(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 flex-wrap">
        {inv.status === 'draft'     && <button disabled={saving} onClick={() => act(submitInvoice, id)} className="px-4 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: '#3b82f6' }}>Submit</button>}
        {inv.status === 'submitted' && <button disabled={saving} onClick={() => act(approveInvoice, id)} className="px-4 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: '#22c55e' }}>Approve</button>}
        {['submitted','approved'].includes(inv.status) && <button disabled={saving} onClick={() => act(rejectInvoice, id, { reason: 'Rejected by admin' })} className="px-4 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: '#ef4444' }}>Reject</button>}
        {inv.status === 'approved' && !inv.glPosted && <button onClick={() => setGLModal(true)} className="px-4 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>Post to GL</button>}
      </div>

      {/* GL Post Modal */}
      {glModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm p-6 rounded-2xl space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <h3 className="text-[14px] font-semibold" style={{ color: 'var(--text)' }}>Post Invoice to GL</h3>
            <form onSubmit={handlePostGL} className="space-y-3">
              {[['arAccount','AR Account (Account ID)'],['revenueAccount','Revenue Account (Account ID)']].map(([k,l]) => (
                <div key={k}>
                  <label className="text-[11px] font-medium block mb-1" style={{ color: 'var(--text-3)' }}>{l}</label>
                  <input required value={glForm[k]} onChange={e => setGLForm(f => ({...f, [k]: e.target.value}))}
                    className="w-full px-3 py-2 text-[12.5px] rounded-lg outline-none"
                    style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text)' }} />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setGLModal(false)} className="flex-1 py-2 text-[12.5px] rounded-lg" style={{ border: '1px solid var(--border)', color: 'var(--text-3)' }}>Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-[12.5px] font-semibold rounded-lg text-white" style={{ background: 'var(--accent)' }}>{saving ? 'Posting…' : 'Post to GL'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
