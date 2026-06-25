import { useState, useEffect, useCallback } from 'react';
import { FiPackage, FiCheck, FiX, FiRefreshCw, FiPlus } from 'react-icons/fi';
import api from '../../services/api';

const PRIORITY_COLOR = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#3b82f6' };
const STATUS_COLOR = { pending: '#f59e0b', approved: '#3b82f6', ordered: '#8b5cf6', received: '#22c55e', cancelled: '#6b7280' };

function TaskRow({ task, onApprove, onCancel }) {
  const pc = PRIORITY_COLOR[task.priority] || '#999';
  const sc = STATUS_COLOR[task.status] || '#999';
  return (
    <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{task.productName || task.sku}</div>
        <div style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>{task.sku}</div>
      </td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11,
          background: `${pc}18`, color: pc, fontWeight: 600 }}>{task.priority}</span>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13 }}>
        <span style={{ color: task.currentStock === 0 ? '#ef4444' : task.currentStock < task.safetyStock ? '#f97316' : '#333', fontWeight: 600 }}>
          {task.currentStock}
        </span>
        <span style={{ color: '#999', fontSize: 11 }}> / min {task.minLevel}</span>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#FF7A00' }}>{task.recommendedQty}</td>
      <td style={{ padding: '12px 16px' }}>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11,
          background: `${sc}18`, color: sc, fontWeight: 600 }}>{task.status}</span>
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: '#999' }}>
        {task.triggerType?.replace(/_/g, ' ')}
      </td>
      <td style={{ padding: '12px 16px', fontSize: 12, color: '#999' }}>
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—'}
      </td>
      <td style={{ padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {task.status === 'pending' && (
            <button onClick={() => onApprove(task._id)} title="Approve"
              style={{ padding: '4px 10px', borderRadius: 6, border: 'none', background: '#22c55e', color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>
              <FiCheck size={12} />
            </button>
          )}
          {(task.status === 'pending' || task.status === 'approved') && (
            <button onClick={() => onCancel(task._id)} title="Cancel"
              style={{ padding: '4px 10px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', color: '#ef4444', cursor: 'pointer', fontSize: 12 }}>
              <FiX size={12} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function AdminReplenishmentDashboard() {
  const [tasks, setTasks]           = useState([]);
  const [stats, setStats]           = useState(null);
  const [recommendations, setRecs] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState('tasks');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage]             = useState(1);
  const [total, setTotal]           = useState(0);
  const [generating, setGenerating] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWH, setSelectedWH] = useState('');

  useEffect(() => {
    api.get('/admin/warehouses').then(r => {
      const whs = r.data.data || [];
      setWarehouses(whs);
      if (whs.length > 0) setSelectedWH(whs[0]._id);
    });
  }, []);

  const fetchAll = useCallback(async () => {
    if (!selectedWH) return;
    setLoading(true);
    const q = `warehouseId=${selectedWH}&page=${page}&limit=50${statusFilter ? `&status=${statusFilter}` : ''}${priorityFilter ? `&priority=${priorityFilter}` : ''}`;
    const [t, s, r] = await Promise.allSettled([
      api.get(`/admin/replenishment/tasks?${q}`),
      api.get(`/admin/replenishment/stats?warehouseId=${selectedWH}`),
      api.get(`/admin/replenishment/recommendations?warehouseId=${selectedWH}`),
    ]);
    if (t.status === 'fulfilled') { setTasks(t.value.data.data || []); setTotal(t.value.data.total || 0); }
    if (s.status === 'fulfilled') setStats(s.value.data.data);
    if (r.status === 'fulfilled') setRecs(r.value.data.data?.recommendations || []);
    setLoading(false);
  }, [selectedWH, page, statusFilter, priorityFilter]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const generateTasks = async () => {
    setGenerating(true);
    try {
      const r = await api.post('/admin/replenishment/generate', { warehouseId: selectedWH });
      alert(`${r.data.data?.created ?? 0} task(s) generated`);
      fetchAll();
    } finally { setGenerating(false); }
  };

  const doAction = async (id, action) => {
    await api.put(`/admin/replenishment/tasks/${id}/${action}`);
    fetchAll();
  };

  return (
    <div style={{ padding: '28px 32px', background: '#f8f9fc', minHeight: '100vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a2e', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiPackage color="#FF7A00" /> Replenishment Dashboard
        </h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={selectedWH} onChange={e => setSelectedWH(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 13 }}>
            {warehouses.map(w => <option key={w._id} value={w._id}>{w.name}</option>)}
          </select>
          <button onClick={fetchAll} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>
            <FiRefreshCw size={14} />
          </button>
          <button onClick={generateTasks} disabled={generating}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
              background: '#FF7A00', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13, opacity: generating ? 0.6 : 1 }}>
            <FiPlus size={14} /> {generating ? 'Generating…' : 'Auto-Generate Tasks'}
          </button>
        </div>
      </div>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: 12, marginBottom: 24 }}>
          {[
            { label: 'Pending', value: stats.pending, color: '#f59e0b' },
            { label: 'Approved', value: stats.approved, color: '#3b82f6' },
            { label: 'Ordered', value: stats.ordered, color: '#8b5cf6' },
            { label: 'Critical', value: stats.critical, color: '#ef4444' },
            { label: 'High', value: stats.high, color: '#f97316' },
            { label: 'Total', value: stats.total, color: '#1a1a2e' },
          ].map(s => (
            <div key={s.label} style={{ background: '#fff', borderRadius: 10, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.07)' }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value ?? '—'}</div>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '2px solid #e5e7eb' }}>
        {[['tasks', `Tasks (${total})`], ['recommendations', `Smart Recommendations (${recommendations.length})`]].map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '10px 24px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 14, fontWeight: tab === t ? 600 : 400, color: tab === t ? '#FF7A00' : '#666',
              borderBottom: tab === t ? '2px solid #FF7A00' : '2px solid transparent', marginBottom: -2 }}>
            {label}
          </button>
        ))}
        {tab === 'tasks' && (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 8, alignItems: 'center', paddingBottom: 4 }}>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 12 }}>
              <option value="">All Statuses</option>
              {['pending','approved','ordered','received','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={priorityFilter} onChange={e => { setPriorityFilter(e.target.value); setPage(1); }}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #e0e0e0', fontSize: 12 }}>
              <option value="">All Priorities</option>
              {['critical','high','medium','low'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        )}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 80, color: '#999' }}>Loading…</div> : (
        tab === 'tasks' ? (
          <>
            <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb' }}>
                    {['Product', 'Priority', 'Stock / Min', 'Recommended Qty', 'Status', 'Trigger', 'Due', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0.4 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#999' }}>No tasks found</td></tr>
                  ) : tasks.map(t => (
                    <TaskRow key={t._id} task={t}
                      onApprove={id => doAction(id, 'approve')}
                      onCancel={id => doAction(id, 'cancel')} />
                  ))}
                </tbody>
              </table>
            </div>
            {total > 50 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>Prev</button>
                <span style={{ padding: '6px 12px', fontSize: 13, color: '#666' }}>Page {page}</span>
                <button disabled={tasks.length < 50} onClick={() => setPage(p => p + 1)}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer' }}>Next</button>
              </div>
            )}
          </>
        ) : (
          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f9fafb' }}>
                  {['Product/SKU', 'Current Stock', 'Reorder Point', 'Safety Stock', 'Urgency', 'PO Pending'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#666', textTransform: 'uppercase', letterSpacing: 0.4 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recommendations.length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: 40, textAlign: 'center', color: '#22c55e', fontWeight: 600 }}>All stock levels are healthy!</td></tr>
                ) : recommendations.map((r, i) => {
                  const uc = r.urgency === 'critical' ? '#ef4444' : r.urgency === 'high' ? '#f97316' : '#f59e0b';
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '11px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{r.productName || r.sku}</div>
                        <div style={{ fontSize: 11, color: '#999', fontFamily: 'monospace' }}>{r.sku}</div>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 13, fontWeight: 700, color: r.currentStock === 0 ? '#ef4444' : '#333' }}>{r.currentStock}</td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: '#666' }}>{r.reorderPoint}</td>
                      <td style={{ padding: '11px 16px', fontSize: 13, color: '#666' }}>{r.safetyStock}</td>
                      <td style={{ padding: '11px 16px' }}>
                        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: 11, background: `${uc}18`, color: uc, fontWeight: 600 }}>{r.urgency}</span>
                      </td>
                      <td style={{ padding: '11px 16px', fontSize: 12 }}>
                        {r.hasPendingPO ? <span style={{ color: '#22c55e', fontWeight: 600 }}>Yes</span> : <span style={{ color: '#6b7280' }}>No</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
