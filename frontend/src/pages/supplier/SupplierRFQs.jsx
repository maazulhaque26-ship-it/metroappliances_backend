import React, { useEffect, useState, useCallback } from 'react';
import supplierAPI from '../../services/supplierAPI';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import StatusBadge   from '../../components/shared/StatusBadge';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState  from '../../components/shared/LoadingState';
import { usePagination } from '../../hooks/usePagination';
import { toast } from 'react-toastify';

const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';

export default function SupplierRFQs() {
  const [rfqs,    setRFQs]   = useState([]);
  const [total,   setTotal]  = useState(0);
  const [loading, setLoading]= useState(false);
  const [quoting, setQuoting]= useState(null);
  const [quote,   setQuote]  = useState({ totalAmount: '', leadTime: '', notes: '', items: [] });
  const { page, limit, setPage } = usePagination();

  const load = useCallback(() => {
    setLoading(true);
    supplierAPI.get('/supplier/rfq', { params: { page, limit } })
      .then(r => { setRFQs(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [page, limit]);

  useEffect(() => { load(); }, [load]);

  const openQuote = (rfq) => {
    const items = (rfq.items || []).map(i => ({ productName: i.productName, quantity: i.quantity, unit: i.unit, unitPrice: 0 }));
    setQuote({ totalAmount: '', leadTime: '', notes: '', items });
    setQuoting(rfq);
  };

  const submitQuote = async (e) => {
    e.preventDefault();
    try {
      const total = quote.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0);
      await supplierAPI.put(`/supplier/rfq/${quoting._id}/quote`, { ...quote, totalAmount: total, items: quote.items });
      toast.success('Quote submitted');
      setQuoting(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const updateItem = (i, v) => setQuote(q => { const items = [...q.items]; items[i] = { ...items[i], unitPrice: Number(v) }; return { ...q, items }; });

  const columns = [
    { header: 'RFQ #',    accessor: 'rfqNumber',    render: r => <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.rfqNumber}</span> },
    { header: 'Title',    accessor: 'title',         render: r => <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{r.title}</span> },
    { header: 'Deadline', accessor: 'submissionDeadline', render: r => <span className="text-xs">{fmtDate(r.submissionDeadline)}</span> },
    { header: 'Status',   accessor: 'status',        render: r => <StatusBadge status={r.status} /> },
    {
      header: 'Action', accessor: '_id', render: r => {
        const myEntry = r.vendors?.find(v => v.status === 'invited' || v.status === 'viewed');
        return myEntry && r.status === 'published' ? (
          <button onClick={e => { e.stopPropagation(); openQuote(r); }}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: '#3B82F6' }}>Submit Quote</button>
        ) : null;
      },
    },
  ];

  if (loading && rfqs.length === 0) return <LoadingState message="Loading RFQs…" />;

  return (
    <div className="p-6 space-y-4">
      <SectionHeader title="RFQ Invitations" subtitle={`${total} total`} />
      <DataTable columns={columns} data={rfqs} loading={loading} emptyMessage="No RFQ invitations" />
      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {quoting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-lg mx-4 rounded-2xl p-6 max-h-screen overflow-y-auto" style={{ background: 'var(--card)' }}>
            <h3 className="font-bold mb-1" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Submit Quotation</h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-4)' }}>{quoting.rfqNumber} — {quoting.title}</p>
            <form onSubmit={submitQuote} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Lead Time (days) *</label>
                  <input type="number" min={1} required value={quote.leadTime} onChange={e => setQuote(q => ({ ...q, leadTime: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
                <div>
                  <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Notes</label>
                  <input value={quote.notes} onChange={e => setQuote(q => ({ ...q, notes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold" style={{ color: 'var(--text-4)' }}>UNIT PRICES</p>
                {quote.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: 'var(--bg-2)' }}>
                    <span className="flex-1 text-sm" style={{ color: 'var(--text)' }}>{item.productName} ({item.quantity} {item.unit})</span>
                    <input type="number" min={0} step="0.01" required value={item.unitPrice} onChange={e => updateItem(i, e.target.value)}
                      placeholder="Unit price ₹" className="w-32 px-2 py-1.5 rounded border text-sm text-right outline-none"
                      style={{ borderColor: 'var(--border)', background: 'var(--card)', color: 'var(--text)' }} />
                  </div>
                ))}
                <p className="text-right text-sm font-bold" style={{ color: '#FF7A00' }}>
                  Total: ₹{quote.items.reduce((s, i) => s + (i.quantity * i.unitPrice), 0).toLocaleString('en-IN')}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setQuoting(null)} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>Submit Quote</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
