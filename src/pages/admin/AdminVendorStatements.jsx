import React, { useEffect, useState, useCallback } from 'react';
import SectionHeader from '../../components/shared/SectionHeader';
import DataTable     from '../../components/shared/DataTable';
import Pagination    from '../../components/shared/Pagination';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import EmptyState    from '../../components/shared/EmptyState';
import { fetchVendorStatements, generateStatement, deleteStatement } from '../../services/accountsPayableAPI';

const fmt = v => `₹${(v||0).toLocaleString('en-IN')}`;

export default function AdminVendorStatements() {
  const [data,    setData]    = useState([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [showGen, setShowGen] = useState(false);
  const [genForm, setGenForm] = useState({ vendor: '', fromDate: '', toDate: '' });
  const [saving,  setSaving]  = useState(false);
  const limit = 20;

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const r = await fetchVendorStatements({ page, limit });
      setData(r.data.data || []); setTotal(r.data.pagination?.total || 0);
    } catch(e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async e => {
    e.preventDefault(); setSaving(true);
    try { await generateStatement(genForm); setShowGen(false); load(); }
    catch(e) { alert(e.response?.data?.message || e.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this statement?')) return;
    try { await deleteStatement(id); load(); } catch(e) { alert(e.response?.data?.message || e.message); }
  };

  const columns = [
    { key: 'statementNumber', label: 'Statement #' },
    { key: 'vendorName',      label: 'Vendor' },
    { key: 'fromDate', label: 'From', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'toDate',   label: 'To',   render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'openingBalance', label: 'Opening', render: v => fmt(v) },
    { key: 'closingBalance', label: 'Closing', render: v => fmt(v) },
    { key: 'reconciliationStatus', label: 'Reconciled', render: v => <StatusBadge status={v} color={{ pending:'gray', reconciled:'green', disputed:'red' }[v]} /> },
    { key: '_id', label: 'Actions', render: id => <button onClick={() => handleDelete(id)} className="text-xs text-red-500 hover:underline">Delete</button> },
  ];

  return (
    <div className="p-6 space-y-6">
      <SectionHeader title="Vendor Statements" subtitle="AP account statements" action={<button onClick={() => setShowGen(true)} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">Generate Statement</button>} />

      {loading && <LoadingState />}
      {error   && <ErrorState message={error} />}
      {!loading && !error && data.length === 0 && <EmptyState title="No statements generated yet" />}
      {!loading && !error && data.length > 0 && <>
        <DataTable columns={columns} data={data} />
        <Pagination page={page} total={total} limit={limit} onPage={setPage} />
      </>}

      {showGen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Generate Vendor Statement</h3>
            <form onSubmit={handleGenerate} className="space-y-3">
              <input required placeholder="Vendor ID" value={genForm.vendor} onChange={e=>setGenForm(f=>({...f,vendor:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/>
              <div><label className="text-xs text-gray-500">From Date</label><input type="date" required value={genForm.fromDate} onChange={e=>setGenForm(f=>({...f,fromDate:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
              <div><label className="text-xs text-gray-500">To Date</label><input type="date" required value={genForm.toDate} onChange={e=>setGenForm(f=>({...f,toDate:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm"/></div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving} className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm disabled:opacity-50">Generate</button>
                <button type="button" onClick={()=>setShowGen(false)} className="flex-1 border py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
