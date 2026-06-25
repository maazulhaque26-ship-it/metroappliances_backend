import React, { useEffect, useState, useCallback } from 'react';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import EmptyState   from '../../components/shared/EmptyState';
import { fetchVoucherSeries, createVoucherSeries, updateVoucherSeries } from '../../services/financeAPI';

const TYPES = ['JV','PV','RV','CV','DN','CN','BV','OB','CL'];
const BLANK  = { name: '', voucherType: 'JV', prefix: 'JV/', startNumber: 1, padding: 5 };

export default function AdminVoucherSeries() {
  const [items,    setItems]    = useState([]);
  const [total,    setTotal]    = useState(0);
  const [page,     setPage]     = useState(1);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState(BLANK);
  const [editing,  setEditing]  = useState(null);
  const LIMIT = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchVoucherSeries({ page, limit: LIMIT });
      setItems(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
    } catch (e) { setError(e.response?.data?.message || e.message); }
    finally { setLoading(false); }
  }, [page]);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (editing) await updateVoucherSeries(editing._id, form);
      else         await createVoucherSeries(form);
      setShowForm(false); setEditing(null); setForm(BLANK); load();
    } catch (e) { alert(e.response?.data?.message || e.message); }
  };

  const columns = [
    { key: 'seriesCode',     label: 'Code',    render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'name',           label: 'Name' },
    { key: 'voucherType',    label: 'Type' },
    { key: 'prefix',         label: 'Prefix',  render: v => <span className="font-mono text-xs">{v}</span> },
    { key: 'currentNumber',  label: 'Current', render: v => v || 0 },
    { key: 'isDefault',      label: 'Default', render: v => v ? <span className="text-green-600 text-xs">Yes</span> : '—' },
    { key: 'isActive',       label: 'Active',  render: v => <span className={`text-xs ${v ? 'text-green-600' : 'text-red-500'}`}>{v ? 'Yes' : 'No'}</span> },
    { key: '_id', label: 'Actions', render: (v, row) => (
        <button onClick={() => { setEditing(row); setForm({ name: row.name, voucherType: row.voucherType, prefix: row.prefix, startNumber: row.startNumber, padding: row.padding }); setShowForm(true); }} className="text-xs text-blue-600 hover:underline">Edit</button>
      )},
  ];

  return (
    <div className="p-6">
      <SectionHeader title="Voucher Series" subtitle={`${total} series`}>
        <button onClick={() => { setEditing(null); setForm(BLANK); setShowForm(true); }} className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">+ New Series</button>
      </SectionHeader>

      {loading ? <LoadingState /> : error ? <ErrorState message={error} onRetry={load} /> :
        items.length === 0 ? <EmptyState title="No voucher series found" /> :
        <><DataTable columns={columns} data={items} /><Pagination page={page} total={total} limit={LIMIT} onPageChange={setPage} /></>
      }

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 w-full max-w-md space-y-3">
            <h3 className="text-lg font-semibold">{editing ? 'Edit' : 'New'} Voucher Series</h3>
            <input required placeholder="Name" value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))} className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="flex gap-2">
              <select value={form.voucherType} onChange={e => setForm(f=>({...f,voucherType:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm">
                {TYPES.map(t=><option key={t}>{t}</option>)}
              </select>
              <input required placeholder="Prefix (e.g. JV/)" value={form.prefix} onChange={e => setForm(f=>({...f,prefix:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-2">
              <input type="number" min="1" placeholder="Start Number" value={form.startNumber} onChange={e => setForm(f=>({...f,startNumber:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
              <input type="number" min="3" max="10" placeholder="Padding" value={form.padding} onChange={e => setForm(f=>({...f,padding:e.target.value}))} className="flex-1 border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm">{editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
