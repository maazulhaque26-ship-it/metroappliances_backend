import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const STATUS_COLORS   = { pending: '#F59E0B', in_progress: '#3B82F6', completed: '#10B981', cancelled: '#9CA3AF', overdue: '#EF4444' };
const PRIORITY_COLORS = { low: '#9CA3AF', medium: '#3B82F6', high: '#F59E0B', urgent: '#EF4444' };
const TYPE_LABELS     = { daily: 'Daily', weekly: 'Weekly', one_time: 'One-time', follow_up: 'Follow-up', collection: 'Collection', other: 'Other' };

export default function AdminTasks() {
  const [tasks,      setTasks]      = useState([]);
  const [agents,     setAgents]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [status,     setStatus]     = useState('');
  const [agentId,    setAgentId]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status)  params.set('status', status);
      if (agentId) params.set('agentId', agentId);
      const { data } = await api.get(`/admin/tasks?${params}`);
      setTasks(data.tasks || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, status, agentId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/admin/sales-agents?limit=200').then(r => setAgents(r.data.agents || [])).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete task?')) return;
    try { await api.delete(`/admin/tasks/${id}`); load(); }
    catch (e) { alert(e?.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: '0 0 4px' }}>Agent Tasks</h2>
        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{pagination.total} total tasks</div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
          <option value="">All Status</option>
          {['pending','in_progress','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
        </select>
        <select value={agentId} onChange={e => { setAgentId(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
          <option value="">All Agents</option>
          {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.agentCode})</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Task #', 'Title', 'Agent', 'Type', 'Priority', 'Due Date', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
            ) : tasks.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No tasks found</td></tr>
            ) : tasks.map(t => {
              const overdue = t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date();
              return (
                <tr key={t._id} style={{ borderBottom: '1px solid #E5E7EB', background: overdue ? '#FFF5F5' : undefined }}>
                  <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#FF7A00', fontWeight: 700 }}>{t.taskNumber}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ fontWeight: 600, color: '#111' }}>{t.title}</div>
                    {t.description && <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{t.description.substring(0, 50)}{t.description.length > 50 ? '...' : ''}</div>}
                  </td>
                  <td style={{ padding: '12px 14px', color: '#374151', fontSize: '12px' }}>
                    <div>{t.agent?.name || '—'}</div>
                    <div style={{ color: '#9CA3AF', fontFamily: 'monospace', fontSize: '10px' }}>{t.agent?.agentCode}</div>
                  </td>
                  <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>{TYPE_LABELS[t.type] || t.type}</td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (PRIORITY_COLORS[t.priority] || '#9CA3AF') + '1A', color: PRIORITY_COLORS[t.priority] || '#9CA3AF', textTransform: 'capitalize' }}>
                      {t.priority}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px', color: overdue ? '#EF4444' : '#9CA3AF', fontSize: '12px', fontWeight: overdue ? 700 : 400 }}>
                    {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STATUS_COLORS[overdue ? 'overdue' : t.status] || '#9CA3AF') + '1A', color: STATUS_COLORS[overdue ? 'overdue' : t.status] || '#9CA3AF', textTransform: 'capitalize' }}>
                      {overdue ? 'Overdue' : t.status?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td style={{ padding: '12px 14px' }}>
                    <button onClick={() => handleDelete(t._id)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', fontSize: '10px', fontWeight: 600, color: '#991B1B', cursor: 'pointer' }}>Del</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {pagination.totalPages > 1 && !loading && (
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: '12px', opacity: page <= 1 ? 0.4 : 1 }}>&larr; Prev</button>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Page {page} of {pagination.totalPages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: '12px', opacity: page >= pagination.totalPages ? 0.4 : 1 }}>Next &rarr;</button>
          </div>
        )}
      </div>
    </div>
  );
}
