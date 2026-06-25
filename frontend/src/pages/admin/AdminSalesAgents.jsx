import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const STATUS_COLORS = { active: '#10B981', inactive: '#9CA3AF', suspended: '#EF4444' };

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#111' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF' }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const BLANK = { name: '', email: '', phone: '', password: '', city: '', state: '', territory: '' };

export default function AdminSalesAgents() {
  const [agents,     setAgents]     = useState([]);
  const [territories,setTerritories]= useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [status,     setStatus]     = useState('');
  const [modal,      setModal]      = useState(null);
  const [form,       setForm]       = useState(BLANK);
  const [pwModal,    setPwModal]    = useState(null);
  const [newPw,      setNewPw]      = useState('');
  const [saving,     setSaving]     = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      if (status) params.set('status', status);
      const { data } = await api.get(`/admin/sales-agents?${params}`);
      setAgents(data.agents || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, search, status]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/admin/territories?limit=200&isActive=true').then(r => setTerritories(r.data.territories || [])).catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.email) return alert('Name and email required');
    setSaving(true);
    try {
      if (modal?.agent) {
        await api.put(`/admin/sales-agents/${modal.agent._id}`, form);
      } else {
        if (!form.password) return alert('Password required');
        await api.post('/admin/sales-agents', form);
      }
      setModal(null);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleToggle = async (id) => {
    try { await api.put(`/admin/sales-agents/${id}/toggle`); load(); }
    catch (e) { alert(e?.response?.data?.message || 'Error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this agent? This cannot be undone.')) return;
    try { await api.delete(`/admin/sales-agents/${id}`); load(); }
    catch (e) { alert(e?.response?.data?.message || 'Error'); }
  };

  const handleResetPw = async () => {
    if (!newPw || newPw.length < 6) return alert('Password must be at least 6 characters');
    setSaving(true);
    try {
      await api.put(`/admin/sales-agents/${pwModal._id}/password`, { newPassword: newPw });
      setPwModal(null); setNewPw('');
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const openCreate = () => { setForm(BLANK); setModal({ type: 'create' }); };
  const openEdit   = (agent) => { setForm({ name: agent.name, email: agent.email, phone: agent.phone, password: '', city: agent.city || '', state: agent.state || '', territory: agent.territory?._id || '' }); setModal({ type: 'edit', agent }); };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: '0 0 4px' }}>Sales Agents</h2>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{pagination.total} total agents</div>
        </div>
        <button onClick={openCreate} style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          + Add Agent
        </button>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search agents..."
          style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }} />
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '700px' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Code', 'Name', 'Email', 'Phone', 'Territory', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
            ) : agents.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No agents found</td></tr>
            ) : agents.map(a => (
              <tr key={a._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#FF7A00', fontWeight: 700 }}>{a.agentCode}</td>
                <td style={{ padding: '12px 14px', fontWeight: 600, color: '#111' }}>{a.name}</td>
                <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>{a.email}</td>
                <td style={{ padding: '12px 14px', color: '#374151', fontSize: '12px' }}>{a.phone || '—'}</td>
                <td style={{ padding: '12px 14px', color: '#374151', fontSize: '12px' }}>{a.territory?.name || '—'}</td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STATUS_COLORS[a.status] || '#9CA3AF') + '1A', color: STATUS_COLORS[a.status] || '#9CA3AF', textTransform: 'capitalize' }}>
                    {a.status}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                    <button onClick={() => openEdit(a)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '10px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleToggle(a._id)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '10px', fontWeight: 600, color: a.status === 'active' ? '#EF4444' : '#10B981', cursor: 'pointer' }}>
                      {a.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button onClick={() => { setPwModal(a); setNewPw(''); }} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #BFDBFE', background: '#EFF6FF', fontSize: '10px', fontWeight: 600, color: '#1D4ED8', cursor: 'pointer' }}>Reset PW</button>
                    <button onClick={() => handleDelete(a._id)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', fontSize: '10px', fontWeight: 600, color: '#991B1B', cursor: 'pointer' }}>Del</button>
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

      {modal && (
        <Modal title={modal.type === 'create' ? 'Add Agent' : `Edit — ${modal.agent?.name}`} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Name *', key: 'name', type: 'text' },
              { label: 'Email *', key: 'email', type: 'email' },
              { label: 'Phone', key: 'phone', type: 'tel' },
              ...(modal.type === 'create' ? [{ label: 'Password *', key: 'password', type: 'password' }] : []),
              { label: 'City', key: 'city', type: 'text' },
              { label: 'State', key: 'state', type: 'text' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>{f.label}</label>
                <input type={f.type} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>Territory</label>
              <select value={form.territory} onChange={e => setForm(f => ({ ...f, territory: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                <option value="">None</option>
                {territories.map(t => <option key={t._id} value={t._id}>{t.name} ({t.code})</option>)}
              </select>
            </div>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : modal.type === 'create' ? 'Create Agent' : 'Save Changes'}
            </button>
          </div>
        </Modal>
      )}

      {pwModal && (
        <Modal title={`Reset Password — ${pwModal.name}`} onClose={() => setPwModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>New Password</label>
              <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Min 6 characters"
                style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
            </div>
            <button onClick={handleResetPw} disabled={saving}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
