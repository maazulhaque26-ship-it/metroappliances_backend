import React, { useEffect, useState, useCallback } from 'react';
import SectionHeader from '../../components/shared/SectionHeader';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import { fetchInvoiceMatches, performInvoiceMatch, resolveInvoiceMatch } from '../../services/accountsPayableAPI';

const MATCH_COLORS = { matched: 'green', partial_match: 'yellow', mismatch: 'red', exception: 'red', manual_override: 'blue' };

export default function AdminInvoiceMatching() {
  const [data,       setData]    = useState([]);
  const [total,      setTotal]   = useState(0);
  const [page,       setPage]    = useState(1);
  const [matchStatus, setMS]     = useState('');
  const [loading,    setLoading] = useState(true);
  const [error,      setError]   = useState('');
  const [showMatch,  setShowMatch] = useState(false);
  const [matchForm,  setMatchForm] = useState({ vendorBillId: '', tolerancePct: 2 });
  const [matching,   setMatching] = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetchInvoiceMatches({ page, limit, matchStatus: matchStatus || undefined });
      setData(r.data.data || []); setTotal(r.data.pagination?.total || 0);
    } catch(e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page, matchStatus]);

  useEffect(() => { load(); }, [load]);

  const handleMatch = async e => {
    e.preventDefault(); setMatching(true);
    try {
      const r = await performInvoiceMatch({ ...matchForm, tolerancePct: Number(matchForm.tolerancePct) });
      alert(`Match result: ${r.data.message}`);
      setShowMatch(false); load();
    } catch(e) { alert(e.response?.data?.message || e.message); }
    finally { setMatching(false); }
  };

  const handleResolve = async id => {
    const notes   = prompt('Resolution notes:');
    if (notes === null) return;
    const override = window.confirm('Apply manual override? (OK=yes, Cancel=no)');
    try { await resolveInvoiceMatch(id, { notes, override }); load(); }
    catch(e) { alert(e.response?.data?.message || e.message); }
  };

  const columns = [
    { key: 'matchNumber',   label: 'Match #' },
    { key: 'vendorBill',    label: 'Bill',  render: v => v?.billNumber || '—' },
    { key: 'matchDate',     label: 'Date',  render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'tolerancePct',  label: 'Tol %', render: v => `${v}%` },
    { key: 'overallMatch',  label: 'Match', render: v => <span className={`text-xs font-medium ${v ? 'text-green-600' : 'text-red-500'}`}>{v ? '✓ Matched' : '✗ Mismatch'}</span> },
    { key: 'matchStatus',   label: 'Status', render: v => <StatusBadge status={v?.replace(/_/g,' ')} color={MATCH_COLORS[v]} /> },
    { key: '_id', label: 'Actions', render: (id, row) => !row.overallMatch && <button onClick={() => handleResolve(id)} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Resolve</button> },
  ];

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Invoice Matching" subtitle="3-way match: PO ↔ GRN ↔ Vendor Bill" action={<button onClick={() => setShowMatch(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">Run Match</button>} />

      <div className="flex gap-3">
        <select value={matchStatus} onChange={e => { setMS(e.target.value); setPage(1); }} className="border rounded-lg px-3 py-2 text-sm">
          <option value="">All Status</option>
          {['matched','partial_match','mismatch','exception','manual_override'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
        </select>
      </div>

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} />}
      {!loading && !error && data.length === 0 && <EmptyState title="No invoice matches found" />}
      {!loading && !error && data.length > 0 && <>
        <DataTable columns={columns} data={data} />
        <Pagination page={page} total={total} limit={limit} onPage={setPage} />
      </>}

      {showMatch && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Perform 3-Way Match</h3>
            <form onSubmit={handleMatch} className="space-y-3">
              <div><label className="text-xs text-gray-500">Vendor Bill ID</label><input required value={matchForm.vendorBillId} onChange={e=>setMatchForm(f=>({...f,vendorBillId:e.target.value}))} placeholder="MongoDB ID of VendorBill" className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
              <div><label className="text-xs text-gray-500">Tolerance %</label><input type="number" min={0} max={100} value={matchForm.tolerancePct} onChange={e=>setMatchForm(f=>({...f,tolerancePct:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={matching} className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm disabled:opacity-50">Run Match</button>
                <button type="button" onClick={()=>setShowMatch(false)} className="flex-1 border py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
