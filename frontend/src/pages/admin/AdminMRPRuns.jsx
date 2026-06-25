import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlay, FiX } from 'react-icons/fi';
import DataTable    from '../../components/shared/DataTable';
import StatusBadge  from '../../components/shared/StatusBadge';
import SearchToolbar from '../../components/shared/SearchToolbar';
import { getMRPRuns, runMRP } from '../../services/mrpAPI';
import { getFactories } from '../../services/manufacturingAPI';

const EMPTY = {
  runType: 'full', factory: '', planningHorizon: 90,
  horizonStart: '', horizonEnd: '', autoReserve: true, autoCreateSuggestions: true, notes: '',
};

export default function AdminMRPRuns() {
  const [runs,      setRuns]     = useState([]);
  const [factories, setFact]     = useState([]);
  const [loading,   setLoad]     = useState(true);
  const [statusF,   setStatusF]  = useState('');
  const [showForm,  setShowForm] = useState(false);
  const [form,      setForm]     = useState(EMPTY);
  const [running,   setRunning]  = useState(false);

  const load = useCallback(() => {
    setLoad(true);
    getMRPRuns({ status: statusF, limit: 50 })
      .then(r => setRuns(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [statusF]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { getFactories({ limit: 100 }).then(r => setFact(r.data.data || [])).catch(() => {}); }, []);

  const handleRun = async (e) => {
    e.preventDefault(); setRunning(true);
    try {
      await runMRP(form);
      setShowForm(false); setForm(EMPTY); load();
    } catch (err) { alert(err.response?.data?.message || 'MRP run failed'); }
    finally { setRunning(false); }
  };

  const columns = [
    { key: 'runNumber', header: 'Run #', render: (v, r) => (
      <Link to={`/admin/mrp/runs/${r._id}`} style={{ color: '#3B82F6', fontWeight: 700, textDecoration: 'none', fontFamily: 'monospace' }}>{v}</Link>
    )},
    { key: 'runType', header: 'Type', render: v => <span style={{ textTransform: 'capitalize', fontSize: 12, fontWeight: 600 }}>{v?.replace('_', ' ')}</span> },
    { key: 'factory', header: 'Factory', render: v => v?.name || '—' },
    { key: 'planningHorizon', header: 'Horizon (days)', align: 'center' },
    { key: 'totalRequirements',  header: 'Reqs',      align: 'center', render: v => v || 0 },
    { key: 'totalShortages',     header: 'Shortages', align: 'center', render: v => <span style={{ fontWeight: 700, color: v > 0 ? '#EF4444' : '#10B981' }}>{v || 0}</span> },
    { key: 'totalPurchaseSuggestions', header: 'POs', align: 'center', render: v => v || 0 },
    { key: 'durationMs', header: 'Duration', render: v => v ? `${(v/1000).toFixed(1)}s` : '—' },
    { key: 'status', header: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'createdAt', header: 'Run Date', render: v => v ? new Date(v).toLocaleString() : '—' },
    { key: '_id', header: '', align: 'center', width: 80,
      render: id => <Link to={`/admin/mrp/runs/${id}`} style={{ padding: '4px 10px', background: '#EFF6FF', color: '#3B82F6', borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>View</Link>
    },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>MRP Runs</h1>
        <button onClick={() => setShowForm(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <FiPlay size={14} /> Run MRP
        </button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="">All Statuses</option>
          {['pending','running','completed','failed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={runs} loading={loading} emptyMessage="No MRP runs found" />

      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form onSubmit={handleRun} style={{ background: '#fff', borderRadius: 16, padding: 32, width: 520, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#111827' }}>New MRP Run</h2>
              <button type="button" onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF' }}><FiX size={20} /></button>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Run Type</label>
                <select required value={form.runType} onChange={e => setForm(f => ({ ...f, runType: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
                  <option value="full">Full</option>
                  <option value="net_change">Net Change</option>
                  <option value="regenerative">Regenerative</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Factory (optional)</label>
                <select value={form.factory} onChange={e => setForm(f => ({ ...f, factory: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
                  <option value="">All Factories</option>
                  {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Planning Horizon (days)</label>
                <input type="number" min={1} value={form.planningHorizon} onChange={e => setForm(f => ({ ...f, planningHorizon: +e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[{ label: 'Horizon Start *', key: 'horizonStart' }, { label: 'Horizon End *', key: 'horizonEnd' }].map(({ label, key }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>{label}</label>
                    <input type="date" required value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 20 }}>
                {[{ key: 'autoReserve', label: 'Auto Reserve Materials' }, { key: 'autoCreateSuggestions', label: 'Auto Create Suggestions' }].map(({ key, label }) => (
                  <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#374151', cursor: 'pointer' }}>
                    <input type="checkbox" checked={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))} />
                    {label}
                  </label>
                ))}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 4 }}>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} style={{ width: '100%', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 24 }}>
              <button type="button" onClick={() => setShowForm(false)} style={{ padding: '9px 20px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>Cancel</button>
              <button type="submit" disabled={running} style={{ padding: '9px 20px', background: '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 700, cursor: running ? 'not-allowed' : 'pointer', fontSize: 13, opacity: running ? 0.6 : 1 }}>
                {running ? 'Running MRP…' : 'Start MRP Run'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
