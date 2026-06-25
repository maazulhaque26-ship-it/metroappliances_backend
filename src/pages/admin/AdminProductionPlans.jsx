import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiCalendar, FiCopy } from 'react-icons/fi';
import DataTable   from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import SearchToolbar from '../../components/shared/SearchToolbar';
import { getPlans, createPlan, deletePlan } from '../../services/planningAPI';
import { getFactories as getMfgFactories } from '../../services/manufacturingAPI';

const EMPTY = {
  name: '', planType: 'monthly', factory: '',
  periodStart: '', periodEnd: '', targetOutput: 0, demandForecast: 0, safetyStock: 0, notes: '',
};

const TYPES = ['weekly','monthly','quarterly','annual'];

export default function AdminProductionPlans() {
  const [plans,     setPlans]    = useState([]);
  const [factories, setFact]     = useState([]);
  const [loading,   setLoad]     = useState(true);
  const [search,    setSearch]   = useState('');
  const [statusF,   setStatusF]  = useState('');
  const [typeF,     setTypeF]    = useState('');
  const [factoryF,  setFactoryF] = useState('');
  const [showForm,  setShowForm] = useState(false);
  const [form,      setForm]     = useState(EMPTY);
  const [saving,    setSaving]   = useState(false);

  const load = useCallback(() => {
    setLoad(true);
    getPlans({ search, status: statusF, planType: typeF, factory: factoryF, limit: 100 })
      .then(r => setPlans(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [search, statusF, typeF, factoryF]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getMfgFactories({ limit: 100 }).then(r => setFact(r.data.data || [])).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createPlan(form); setShowForm(false); setForm(EMPTY); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error creating plan'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this production plan?')) return;
    try { await deletePlan(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const columns = [
    { key: 'planNumber', header: 'Plan #', render: (v, r) => (
      <Link to={`/admin/manufacturing/planning/plans/${r._id}`} style={{ color: '#3B82F6', fontWeight: 700, textDecoration: 'none', fontFamily: 'monospace' }}>{v}</Link>
    )},
    { key: 'name',     header: 'Plan Name',  render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'planType', header: 'Type',       render: v => <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'capitalize', color: '#6B7280' }}>{v}</span> },
    { key: 'factory',  header: 'Factory',    render: v => v?.name || '—' },
    { key: 'periodStart', header: 'Period Start', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'periodEnd',   header: 'Period End',   render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'targetOutput',  header: 'Target',   align: 'center', render: v => (v || 0).toLocaleString() },
    { key: 'demandForecast',header: 'Forecast', align: 'center', render: v => (v || 0).toLocaleString() },
    { key: 'version', header: 'Ver.', align: 'center', render: v => `v${v}` },
    { key: 'status',  header: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: '_id', header: 'Actions', align: 'center', width: 120,
      render: (id, r) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
          <Link to={`/admin/manufacturing/planning/plans/${id}`} style={{ padding: '4px 10px', background: '#EFF6FF', color: '#3B82F6', borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>View</Link>
          {['draft','cancelled'].includes(r.status) && (
            <button onClick={() => handleDelete(id)} style={{ padding: '4px 10px', background: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Delete</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Production Plans</h1>
        <button onClick={() => { setShowForm(true); setForm(EMPTY); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <FiPlus size={15} /> New Plan
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <SearchToolbar value={search} onChange={setSearch} placeholder="Search plans…" />
        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151' }}>
          <option value="">All Statuses</option>
          {['draft','submitted','reviewed','approved','released','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={typeF} onChange={e => setTypeF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151' }}>
          <option value="">All Types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={factoryF} onChange={e => setFactoryF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151' }}>
          <option value="">All Factories</option>
          {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={plans} loading={loading} emptyMessage="No production plans found" />

      {/* Create Plan Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleCreate} style={{ background: '#fff', borderRadius: 16, padding: 32, width: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#111827' }}>New Production Plan</h2>
            <div style={{ display: 'grid', gap: 14 }}>
              {[
                { label: 'Plan Name *',  key: 'name',    type: 'text',   required: true },
                { label: 'Target Output',key: 'targetOutput', type: 'number', min: 0 },
                { label: 'Demand Forecast', key: 'demandForecast', type: 'number', min: 0 },
                { label: 'Safety Stock',    key: 'safetyStock',    type: 'number', min: 0 },
              ].map(({ label, key, type, required, min }) => (
                <div key={key}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
                  <input type={type} required={required} min={min} value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? +e.target.value : e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Plan Type *</label>
                <select required value={form.planType} onChange={e => setForm(f => ({ ...f, planType: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
                  {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Factory *</label>
                <select required value={form.factory} onChange={e => setForm(f => ({ ...f, factory: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
                  <option value="">Select factory…</option>
                  {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[{ label: 'Period Start *', key: 'periodStart' }, { label: 'Period End *', key: 'periodEnd' }].map(({ label, key }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
                    <input type="date" required value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Notes</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button type="submit" disabled={saving} style={{ padding: '9px 20px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Creating…' : 'Create Plan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
