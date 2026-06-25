import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const STATUS_COLORS = { active: '#10B981', inactive: '#9CA3AF', transferred: '#3B82F6' };

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '440px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#111' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF' }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [agents,      setAgents]      = useState([]);
  const [dealers,     setDealers]     = useState([]);
  const [territories, setTerritories] = useState([]);
  const [pagination,  setPagination]  = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [status,      setStatus]      = useState('active');
  const [modal,       setModal]       = useState(null);
  const [form,        setForm]        = useState({ agentId: '', dealerId: '', territoryId: '', notes: '' });
  const [transferAgent, setTransferAgent] = useState('');
  const [transferNote,  setTransferNote]  = useState('');
  const [saving,      setSaving]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status) params.set('status', status);
      const { data } = await api.get(`/admin/assignments?${params}`);
      setAssignments(data.assignments || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/admin/sales-agents?limit=200&status=active').then(r => setAgents(r.data.agents || [])).catch(() => {});
    api.get('/admin/dealers?limit=200').then(r => setDealers(r.data.dealers || [])).catch(() => {});
    api.get('/admin/territories?limit=200').then(r => setTerritories(r.data.territories || [])).catch(() => {});
  }, []);

  const handleCreate = async () => {
    if (!form.agentId || !form.dealerId) return alert('Agent and dealer required');
    setSaving(true);
    try {
      await api.post('/admin/assignments', form);
      setModal(null);
      setForm({ agentId: '', dealerId: '', territoryId: '', notes: '' });
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleTransfer = async () => {
    if (!transferAgent) return alert('Select new agent');
    setSaving(true);
    try {
      await api.post(`/admin/assignments/${modal.assignment._id}/transfer`, { newAgentId: transferAgent, transferNote });
      setModal(null);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this assignment?')) return;
    try { await api.put(`/admin/assignments/${id}/deactivate`); load(); }
    catch (e) { alert(e?.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: '0 0 4px' }}>Agent Assignments</h2>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{pagination.total} assignments</div>
        </div>
        <button onClick={() => { setForm({ agentId: '', dealerId: '', territoryId: '', notes: '' }); setModal({ type: 'create' }); }}
          style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          + New Assignment
        </button>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {[['', 'All'], ['active', 'Active'], ['inactive', 'Inactive'], ['transferred', 'Transferred']].map(([v, l]) => (
          <button key={v} onClick={() => { setStatus(v); setPage(1); }}
            style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', background: status === v ? '#FF7A00' : '#F3F4F6', color: status === v ? '#fff' : '#374151' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Agent', 'Dealer', 'Territory', 'Status', 'Assigned', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
            ) : assignments.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No assignments found</td></tr>
            ) : assignments.map(a => (
              <tr key={a._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#111' }}>{a.agent?.name || '—'}</div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', fontFamily: 'monospace' }}>{a.agent?.agentCode}</div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#111' }}>{a.dealer?.businessName || '—'}</div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{a.dealer?.city}</div>
                </td>
                <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>{a.territory?.name || '—'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STATUS_COLORS[a.status] || '#9CA3AF') + '1A', color: STATUS_COLORS[a.status] || '#9CA3AF', textTransform: 'capitalize' }}>
                    {a.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>{new Date(a.assignedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    {a.status === 'active' && (
                      <>
                        <button onClick={() => { setModal({ type: 'transfer', assignment: a }); setTransferAgent(''); setTransferNote(''); }}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #BFDBFE', background: '#EFF6FF', fontSize: '10px', fontWeight: 600, color: '#1D4ED8', cursor: 'pointer' }}>Transfer</button>
                        <button onClick={() => handleDeactivate(a._id)}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', fontSize: '10px', fontWeight: 600, color: '#991B1B', cursor: 'pointer' }}>Deactivate</button>
                      </>
                    )}
                    {a.status === 'transferred' && a.transferredTo && (
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Transferred to {a.transferredTo.name}</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
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

      {/* Create modal */}
      {modal?.type === 'create' && (
        <Modal title="New Assignment" onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Agent *', key: 'agentId', options: [{ v: '', l: 'Select agent...' }, ...agents.map(a => ({ v: a._id, l: `${a.name} (${a.agentCode})` }))] },
              { label: 'Dealer *', key: 'dealerId', options: [{ v: '', l: 'Select dealer...' }, ...dealers.map(d => ({ v: d._id, l: `${d.businessName} (${d.dealerCode})` }))] },
              { label: 'Territory', key: 'territoryId', options: [{ v: '', l: 'None' }, ...territories.map(t => ({ v: t._id, l: `${t.name} (${t.code})` }))] },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>{f.label}</label>
                <select value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                  {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                </select>
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleCreate} disabled={saving}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </Modal>
      )}

      {/* Transfer modal */}
      {modal?.type === 'transfer' && (
        <Modal title="Transfer Assignment" onClose={() => setModal(null)}>
          <div style={{ marginBottom: '14px', padding: '12px', background: '#F9FAFB', borderRadius: '8px', fontSize: '13px' }}>
            <div><strong>Agent:</strong> {modal.assignment.agent?.name}</div>
            <div><strong>Dealer:</strong> {modal.assignment.dealer?.businessName}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Transfer to Agent *</label>
              <select value={transferAgent} onChange={e => setTransferAgent(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                <option value="">Select new agent...</option>
                {agents.filter(a => a._id !== modal.assignment.agent?._id).map(a => <option key={a._id} value={a._id}>{a.name} ({a.agentCode})</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Transfer Note</label>
              <textarea value={transferNote} onChange={e => setTransferNote(e.target.value)} rows={2}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleTransfer} disabled={saving}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#3B82F6', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Transferring...' : 'Transfer Assignment'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
