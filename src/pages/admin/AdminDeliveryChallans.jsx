import React, { useState, useCallback, useEffect } from 'react';
import { FiPrinter, FiFileText } from 'react-icons/fi';
import api from '../../services/api';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import SectionHeader from '../../components/shared/SectionHeader';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import { usePagination } from '../../hooks/usePagination';
import { useSearch }     from '../../hooks/useSearch';
import { toast } from 'react-toastify';

const fmtDate     = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtCurrency = v => `₹${(v || 0).toLocaleString('en-IN')}`;

export default function AdminDeliveryChallans() {
  const [challans,   setChallans]  = useState([]);
  const [total,      setTotal]     = useState(0);
  const [loading,    setLoading]   = useState(false);
  const [viewChallan, setView]     = useState(null);
  const [dispatches, setDispatches]= useState([]);
  const [showGen,    setShowGen]   = useState(false);
  const [genForm,    setGenForm]   = useState({ dispatchId: '', purpose: 'sale', remarks: '' });

  const { page, limit, setPage } = usePagination();
  const { query: search, setQuery: setSearch, debouncedQuery: debouncedSearch } = useSearch();

  const load = useCallback(() => {
    setLoading(true);
    api.get('/admin/logistics/challans', { params: { search: debouncedSearch, page, limit } })
      .then(r => { setChallans(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(e => toast.error(e.response?.data?.message || 'Load failed'))
      .finally(() => setLoading(false));
  }, [debouncedSearch, page, limit]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/admin/logistics/dispatches', { params: { limit: 100 } }).then(r => setDispatches(r.data.data || []));
  }, []);

  const handleGenerate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/logistics/challans/generate', genForm);
      toast.success('Challan generated');
      setShowGen(false);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const handlePrint = (challan) => {
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>Delivery Challan ${challan.challanNumber}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; font-size: 12px; }
        h2 { text-align: center; margin-bottom: 4px; }
        .meta { display: flex; justify-content: space-between; margin-bottom: 16px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; }
        .total-row td { font-weight: bold; background: #fafafa; }
        .footer { margin-top: 24px; display: flex; justify-content: space-between; }
        .sig { text-align: center; padding-top: 32px; border-top: 1px solid #ccc; }
      </style></head><body>
      <h2>DELIVERY CHALLAN</h2>
      <p style="text-align:center;font-size:10px">Original / Duplicate</p>
      <div class="meta">
        <div>
          <strong>${challan.supplierName || 'Metro Appliances'}</strong><br/>
          ${challan.supplierAddress || ''}<br/>
          ${challan.supplierPhone || ''}
        </div>
        <div style="text-align:right">
          <strong>Challan No:</strong> ${challan.challanNumber}<br/>
          <strong>Date:</strong> ${new Date(challan.challanDate).toLocaleDateString('en-IN')}<br/>
          ${challan.dispatchThrough ? `<strong>Via:</strong> ${challan.dispatchThrough}` : ''}
        </div>
      </div>
      <div class="meta" style="border:1px solid #ccc; padding:8px; margin-bottom:12px">
        <div>
          <strong>Consignee:</strong> ${challan.consigneeName}<br/>
          ${challan.consigneeAddress || ''}<br/>
          ${challan.consigneePhone || ''}
        </div>
      </div>
      <table>
        <thead><tr><th>S.No</th><th>Description</th><th>Qty</th><th>Unit</th><th>Rate</th><th>Amount</th></tr></thead>
        <tbody>
          ${(challan.items || []).map(i => `<tr><td>${i.srNo}</td><td>${i.description}</td><td>${i.quantity}</td><td>${i.unit}</td><td>₹${i.unitPrice || 0}</td><td>₹${i.amount || 0}</td></tr>`).join('')}
          <tr class="total-row"><td colspan="4"></td><td>Total</td><td>₹${challan.totalAmount || 0}</td></tr>
        </tbody>
      </table>
      <p style="margin-top:8px"><strong>Amount in Words:</strong> ${challan.amountInWords || 'Zero Rupees Only'}</p>
      ${challan.remarks ? `<p><strong>Remarks:</strong> ${challan.remarks}</p>` : ''}
      <div class="footer">
        <div class="sig" style="width:40%">Receiver Signature</div>
        <div class="sig" style="width:40%">Authorised Signatory</div>
      </div>
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const columns = [
    { header: 'Challan #',   accessor: 'challanNumber',  render: r => <span className="font-mono text-xs font-bold" style={{ color: '#FF7A00' }}>{r.challanNumber}</span> },
    { header: 'Date',        accessor: 'challanDate',     render: r => <span className="text-xs">{fmtDate(r.challanDate)}</span> },
    { header: 'Consignee',   accessor: 'consigneeName',   render: r => <span className="text-sm" style={{ color: 'var(--text)' }}>{r.consigneeName}</span> },
    { header: 'Purpose',     accessor: 'purpose',         render: r => <span className="text-xs capitalize">{r.purpose}</span> },
    { header: 'Amount',      accessor: 'totalAmount',     render: r => <span className="text-xs font-bold" style={{ color: '#10B981' }}>{fmtCurrency(r.totalAmount)}</span> },
    { header: 'Status',      accessor: 'status',          render: r => <StatusBadge status={r.status} /> },
    { header: 'Actions',     accessor: '_id', render: r => (
      <div className="flex gap-2">
        <button onClick={e => { e.stopPropagation(); api.get(`/admin/logistics/challans/${r._id}`).then(res => setView(res.data.data)); }}
          className="p-1.5 rounded-lg" style={{ background: 'var(--bg-2)' }}><FiFileText size={13} style={{ color: '#FF7A00' }} /></button>
      </div>
    )},
  ];

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SectionHeader title="Delivery Challans" subtitle={`${total} challans`} />
        <button onClick={() => setShowGen(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>
          <FiFileText size={16} /> Generate Challan
        </button>
      </div>
      <SearchToolbar value={search} onChange={setSearch} placeholder="Search challan #, consignee…" />
      <DataTable columns={columns} data={challans} loading={loading} emptyMessage="No challans generated yet" />
      <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />

      {/* Generate modal */}
      {showGen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-md mx-4 rounded-2xl p-6" style={{ background: 'var(--card)' }}>
            <h3 className="font-bold mb-4" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Generate Delivery Challan</h3>
            <form onSubmit={handleGenerate} className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Dispatch *</label>
                <select required value={genForm.dispatchId} onChange={e => setGenForm(f => ({ ...f, dispatchId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                  <option value="">Select dispatch</option>
                  {dispatches.map(d => <option key={d._id} value={d._id}>{d.dispatchNumber} — {d.recipientName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Purpose</label>
                <select value={genForm.purpose} onChange={e => setGenForm(f => ({ ...f, purpose: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}>
                  <option value="sale">Sale</option><option value="job_work">Job Work</option>
                  <option value="transfer">Transfer</option><option value="return">Return</option>
                  <option value="exhibition">Exhibition</option><option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--text-4)' }}>Remarks</label>
                <input value={genForm.remarks} onChange={e => setGenForm(f => ({ ...f, remarks: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowGen(false)} className="flex-1 py-2.5 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Cancel</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>Generate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Challan viewer */}
      {viewChallan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-2xl mx-4 rounded-2xl p-6 max-h-screen overflow-y-auto" style={{ background: 'var(--card)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>Challan: {viewChallan.challanNumber}</h3>
              <div className="flex gap-2">
                <button onClick={() => handlePrint(viewChallan)} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-white" style={{ background: '#FF7A00' }}>
                  <FiPrinter size={14} /> Print
                </button>
                <button onClick={() => setView(null)} className="px-3 py-2 rounded-xl text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>Close</button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div><p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-4)' }}>From</p><p style={{ color: 'var(--text)' }}>{viewChallan.supplierName}</p><p className="text-xs" style={{ color: 'var(--text-4)' }}>{viewChallan.supplierAddress}</p></div>
              <div><p className="text-xs font-bold uppercase mb-1" style={{ color: 'var(--text-4)' }}>To</p><p style={{ color: 'var(--text)' }}>{viewChallan.consigneeName}</p><p className="text-xs" style={{ color: 'var(--text-4)' }}>{viewChallan.consigneeAddress}</p></div>
            </div>
            <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
              <table className="w-full text-sm">
                <thead style={{ background: 'var(--bg-2)' }}>
                  <tr>{['S.No','Description','Qty','Unit','Rate','Amount'].map(h => <th key={h} className="py-2 px-3 text-left text-xs" style={{ color: 'var(--text-4)' }}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {viewChallan.items?.map((item, i) => (
                    <tr key={i} className="border-t" style={{ borderColor: 'var(--border)' }}>
                      <td className="py-2 px-3 text-xs" style={{ color: 'var(--text-4)' }}>{item.srNo}</td>
                      <td className="py-2 px-3" style={{ color: 'var(--text)' }}>{item.description}</td>
                      <td className="py-2 px-3 text-xs">{item.quantity}</td>
                      <td className="py-2 px-3 text-xs">{item.unit}</td>
                      <td className="py-2 px-3 text-xs">{fmtCurrency(item.unitPrice)}</td>
                      <td className="py-2 px-3 text-xs font-bold" style={{ color: '#10B981' }}>{fmtCurrency(item.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-right mt-3 font-bold" style={{ color: '#FF7A00' }}>Total: {fmtCurrency(viewChallan.totalAmount)}</p>
            {viewChallan.amountInWords && <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>{viewChallan.amountInWords}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
