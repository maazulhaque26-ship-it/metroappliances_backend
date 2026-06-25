import React, { useState, useEffect, useCallback } from 'react';
import agentAPI from '../../services/agentAPI';

const STATUS_COLORS   = { pending: '#F59E0B', in_progress: '#3B82F6', completed: '#10B981', cancelled: '#9CA3AF', overdue: '#EF4444' };
const PRIORITY_COLORS = { low: '#9CA3AF', medium: '#3B82F6', high: '#F59E0B', urgent: '#EF4444' };
const TYPE_LABELS     = { daily: 'Daily', weekly: 'Weekly', one_time: 'One-time', follow_up: 'Follow-up', collection: 'Collection', other: 'Other' };

export default function AgentTasks() {
  const [tasks,      setTasks]      = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [showCreate, setShowCreate] = useState(false);
  const [completeModal, setCompleteModal] = useState(null);
  const [form,       setForm]       = useState({ title: '', description: '', type: 'daily', priority: 'medium', dueDate: '' });
  const [completeNote, setCompleteNote] = useState('');
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.set('status', statusFilter);
      const { data } = await agentAPI.get(`/agent/tasks?${params}`);
      setTasks(data.tasks || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!form.title) return alert('Title required');
    setSaving(true);
    try {
      await agentAPI.post('/agent/tasks', form);
      setShowCreate(false);
      setForm({ title: '', description: '', type: 'daily', priority: 'medium', dueDate: '' });
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      await agentAPI.post(`/agent/tasks/${completeModal._id}/complete`, { completionNote: completeNote });
      setCompleteModal(null);
      setCompleteNote('');
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await agentAPI.delete(`/agent/tasks/${id}`);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#111', margin: '0 0 4px' }}>Tasks</h2>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{pagination.total} total tasks</div>
        </div>
        <button onClick={() => setShowCreate(true)} style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          + Add Task
        </button>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[['', 'All'], ['pending', 'Pending'], ['in_progress', 'In Progress'], ['completed', 'Completed'], ['overdue', 'Overdue']].map(([v, l]) => (
          <button key={v} onClick={() => { setStatusFilter(v); setPage(1); }}
            style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: statusFilter === v ? '#FF7A00' : '#F3F4F6', color: statusFilter === v ? '#fff' : '#374151' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Task cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>Loading...</div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px' }}>No tasks found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {tasks.map(t => {
            const overdue = t.status !== 'completed' && t.dueDate && new Date(t.dueDate) < new Date();
            const statusColor = STATUS_COLORS[overdue ? 'overdue' : t.status] || '#9CA3AF';
            return (
              <div key={t._id} style={{ background: overdue ? '#FFF5F5' : '#fff', border: `1px solid ${overdue ? '#FECACA' : '#E5E7EB'}`, borderRadius: '10px', padding: '16px 18px', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: statusColor, flexShrink: 0, marginTop: '4px' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#111' }}>{t.title}</span>
                    <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '100px', background: (PRIORITY_COLORS[t.priority] || '#9CA3AF') + '1A', color: PRIORITY_COLORS[t.priority] || '#9CA3AF', textTransform: 'capitalize' }}>{t.priority}</span>
                    <span style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'capitalize' }}>{TYPE_LABELS[t.type] || t.type}</span>
                  </div>
                  {t.description && <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '4px' }}>{t.description}</div>}
                  <div style={{ fontSize: '11px', color: overdue ? '#EF4444' : '#9CA3AF' }}>
                    {t.dueDate ? `Due: ${new Date(t.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}` : 'No due date'}
                    {t.dealer && ` · ${t.dealer.businessName}`}
                    {t.lead && ` · Lead: ${t.lead.businessName}`}
                  </div>
                  {t.status === 'completed' && t.completionNote && (
                    <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>Done: {t.completionNote}</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  {t.status !== 'completed' && t.status !== 'cancelled' && (
                    <button onClick={() => { setCompleteModal(t); setCompleteNote(''); }}
                      style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #BBF7D0', background: '#F0FDF4', fontSize: '11px', fontWeight: 600, color: '#166534', cursor: 'pointer' }}>Done</button>
                  )}
                  <button onClick={() => handleDelete(t._id)}
                    style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', fontSize: '11px', fontWeight: 600, color: '#991B1B', cursor: 'pointer' }}>Del</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagination.totalPages > 1 && !loading && (
        <div style={{ padding: '16px 0', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: '12px', opacity: page <= 1 ? 0.4 : 1 }}>&larr; Prev</button>
          <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Page {page} of {pagination.totalPages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: '12px', opacity: page >= pagination.totalPages ? 0.4 : 1 }}>Next &rarr;</button>
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#111' }}>New Task</div>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF' }}>&times;</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Title *</label>
                <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Type</label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                    {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Priority</label>
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                    {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Due Date</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
              <button onClick={handleCreate} disabled={saving}
                style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                {saving ? 'Adding...' : 'Add Task'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Complete modal */}
      {completeModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '380px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#111' }}>Mark as Done</div>
              <button onClick={() => setCompleteModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF' }}>&times;</button>
            </div>
            <div style={{ fontSize: '13px', color: '#374151', marginBottom: '14px' }}>{completeModal.title}</div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Completion Note</label>
            <textarea value={completeNote} onChange={e => setCompleteNote(e.target.value)} rows={2} placeholder="Optional note..."
              style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box', marginBottom: '14px' }} />
            <button onClick={handleComplete} disabled={saving}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', width: '100%', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : 'Mark as Done'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
