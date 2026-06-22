import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiCheckCircle } from 'react-icons/fi';
import DataTable    from '../../components/shared/DataTable';
import Pagination   from '../../components/shared/Pagination';
import SearchToolbar from '../../components/shared/SearchToolbar';
import { getForecasts, createForecast, approveForecast, deleteForecast } from '../../services/mrpAPI';

const EMPTY = { product: '', productName: '', productSKU: '', forecastPeriod: 'monthly', periodStart: '', periodEnd: '', forecastQty: 0, method: 'manual', confidenceLevel: 80, unit: 'pcs', source: 'manual', notes: '' };

export default function AdminDemandForecast() {
  const [data,    setData]   = useState([]);
  const [loading, setLoad]   = useState(true);
  const [page,    setPage]   = useState(1);
  const [total,   setTotal]  = useState(0);
  const [showForm,setShowForm] = useState(false);
  const [form,    setForm]   = useState(EMPTY);
  const [saving,  setSaving] = useState(false);
  const [approvedF,setApprF] = useState('');
  const LIMIT = 20;

  const load = useCallback(() => {
    setLoad(true);
    const params = { page, limit: LIMIT };
    if (approvedF !== '') params.isApproved = approvedF;
    getForecasts(params)
      .then(r => { setData(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [page, approvedF]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createForecast(form); setShowForm(false); setForm(EMPTY); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleApprove = async (id) => {
    try { await approveForecast(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this forecast?')) return;
    try { await deleteForecast(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const columns = [
    { key: 'productName',   header: 'Product',  render: (v, r) => <div><span style={{ fontWeight: 600 }}>{v || r.product?.name}</span><div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>{r.productSKU}</div></div> },
    { key: 'forecastPeriod',header: 'Period',    render: v => <span style={{ textTransform: 'capitalize', fontSize: 12, fontWeight: 600 }}>{v}</span> },
    { key: 'periodStart',   header: 'From',      render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'periodEnd',     header: 'To',        render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'forecastQty',   header: 'Forecast',  align: 'center', render: v => (v || 0).toLocaleString() },
    { key: 'actualQty',     header: 'Actual',    align: 'center', render: v => (v || 0).toLocaleString() },
    { key: 'accuracy',      header: 'Accuracy',  align: 'center', render: v => v ? `${v.toFixed(1)}%` : '—' },
    { key: 'method',        header: 'Method',    render: v => <span style={{ textTransform: 'capitalize', fontSize: 11, color: '#6B7280' }}>{v?.replace('_', ' ')}</span> },
    { key: 'isApproved',    header: 'Approved',  align: 'center', render: v => v ? <FiCheckCircle color="#10B981" size={16} /> : <span style={{ color: '#D1D5DB' }}>—</span> },
    { key: '_id', header: 'Actions', align: 'center', width: 140,
      render: (id, r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          {!r.isApproved && <button onClick={() => handleApprove(id)} style={{ padding: '4px 8px', background: '#D1FAE5', color: '#065F46', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Approve</button>}
          {!r.isApproved && <button onClick={() => handleDelete(id)} style={{ padding: '4px 8px', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button>}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Demand Forecast</h1>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <FiPlus size={14} /> Add Forecast
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select value={approvedF} onChange={e => { setApprF(e.target.value); setPage(1); }} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="">All</option>
          <option value="true">Approved</option>
          <option value="false">Pending</option>
        </select>
      </div>

      <DataTable columns={columns} data={data} loading={loading} emptyMessage="No demand forecasts found" />
      <Pagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreate} style={{ background: '#fff', borderRadius: 16, padding: 32, width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>New Demand Forecast</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              {[
                { label: 'Product Name *', key: 'productName', type: 'text', required: true },
                { label: 'Product SKU',    key: 'productSKU',  type: 'text' },
                { label: 'Forecast Qty *', key: 'forecastQty', type: 'number', min: 0, required: true },
                { label: 'Confidence (%)', key: 'confidenceLevel', type: 'number', min: 0, max: 100 },
              ].map(({ label, key, type, required, min, max }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
                  <input type={type} required={required} min={min} max={max} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? +e.target.value : e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              ))}
              {[{ label: 'Forecast Period', key: 'forecastPeriod', opts: ['weekly','monthly','quarterly'] }, { label: 'Method', key: 'method', opts: ['manual','moving_average','exponential_smoothing','historical'] }, { label: 'Source', key: 'source', opts: ['sales_history','production_plan','market_analysis','manual'] }].map(({ label, key, opts }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
                  <select value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
                    {opts.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
                  </select>
                </div>
              ))}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[{ label: 'Period Start *', key: 'periodStart' }, { label: 'Period End *', key: 'periodEnd' }].map(({ label, key }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
                    <input type="date" required value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ padding: '9px 20px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Saving…' : 'Create Forecast'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
