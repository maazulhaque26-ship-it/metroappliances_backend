import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

function Modal({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: '#fff', borderRadius: '12px', padding: '28px', maxWidth: '520px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '16px', fontWeight: 800, color: '#111' }}>{title}</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: '#9CA3AF' }}>&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const BLANK = { name: '', description: '', states: '', cities: '', districts: '', pincodes: '' };

export default function AdminTerritories() {
  const [territories, setTerritories] = useState([]);
  const [agents,      setAgents]      = useState([]);
  const [dealers,     setDealers]     = useState([]);
  const [pagination,  setPagination]  = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [search,      setSearch]      = useState('');
  const [modal,       setModal]       = useState(null);
  const [form,        setForm]        = useState(BLANK);
  const [assignAgent, setAssignAgent] = useState('');
  const [assignDealer,setAssignDealer]= useState('');
  const [saving,      setSaving]      = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      const { data } = await api.get(`/admin/territories?${params}`);
      setTerritories(data.territories || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/admin/sales-agents?limit=200&status=active').then(r => setAgents(r.data.agents || [])).catch(() => {});
    api.get('/admin/dealers?limit=200').then(r => setDealers(r.data.dealers || [])).catch(() => {});
  }, []);

  const arrayField = (val) => (val || '').split(',').map(s => s.trim()).filter(Boolean);

  const handleSave = async () => {
    if (!form.name) return alert('Name required');
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        states:    arrayField(form.states),
        cities:    arrayField(form.cities),
        districts: arrayField(form.districts),
        pincodes:  arrayField(form.pincodes),
      };
      if (modal?.territory) {
        await api.put(`/admin/territories/${modal.territory._id}`, payload);
      } else {
        await api.post('/admin/territories', payload);
      }
      setModal(null);
      load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleAssignAgent = async (id) => {
    if (!assignAgent) return alert('Select an agent');
    setSaving(true);
    try {
      await api.post(`/admin/territories/${id}/assign-agent`, { agentId: assignAgent, isPrimary: true });
      setAssignAgent(''); load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleAssignDealer = async (id) => {
    if (!assignDealer) return alert('Select a dealer');
    setSaving(true);
    try {
      await api.post(`/admin/territories/${id}/assign-dealer`, { dealerId: assignDealer });
      setAssignDealer(''); load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete territory?')) return;
    try { await api.delete(`/admin/territories/${id}`); load(); }
    catch (e) { alert(e?.response?.data?.message || 'Error'); }
  };

  const openCreate = () => { setForm(BLANK); setModal({ type: 'form' }); };
  const openEdit   = (t) => {
    setForm({ name: t.name, description: t.description || '', states: (t.states || []).join(', '), cities: (t.cities || []).join(', '), districts: (t.districts || []).join(', '), pincodes: (t.pincodes || []).join(', ') });
    setModal({ type: 'form', territory: t });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: '0 0 4px' }}>Territories</h2>
          <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{pagination.total} territories</div>
        </div>
        <button onClick={openCreate} style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>
          + Add Territory
        </button>
      </div>

      <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search territories..."
        style={{ width: '100%', maxWidth: '320px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', marginBottom: '16px', boxSizing: 'border-box' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>Loading...</div>
        ) : territories.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF', background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px' }}>No territories found</div>
        ) : territories.map(t => (
          <div key={t._id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#111' }}>{t.name}
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#9CA3AF', marginLeft: '8px', fontWeight: 400 }}>{t.code}</span>
                </div>
                {t.description && <div style={{ fontSize: '12px', color: '#9CA3AF', marginTop: '2px' }}>{t.description}</div>}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button onClick={() => openEdit(t)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#F9FAFB', fontSize: '11px', fontWeight: 600, color: '#374151', cursor: 'pointer' }}>Edit</button>
                <button onClick={() => setModal({ type: 'assign', territory: t })} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #BFDBFE', background: '#EFF6FF', fontSize: '11px', fontWeight: 600, color: '#1D4ED8', cursor: 'pointer' }}>Assign</button>
                <button onClick={() => handleDelete(t._id)} style={{ padding: '5px 10px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', fontSize: '11px', fontWeight: 600, color: '#991B1B', cursor: 'pointer' }}>Del</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
              {t.states?.length > 0 && <span style={{ color: '#374151' }}>States: {t.states.join(', ')}</span>}
              {t.primaryAgent && <span style={{ color: '#374151' }}>Agent: <strong>{t.primaryAgent.name}</strong> ({t.primaryAgent.agentCode})</span>}
              {t.assignedDealers?.length > 0 && <span style={{ color: '#374151' }}>Dealers: {t.assignedDealers.length}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit modal */}
      {modal?.type === 'form' && (
        <Modal title={modal.territory ? `Edit — ${modal.territory.name}` : 'New Territory'} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Name *', key: 'name' },
              { label: 'Description', key: 'description' },
              { label: 'States (comma-separated)', key: 'states' },
              { label: 'Cities (comma-separated)', key: 'cities' },
              { label: 'Districts (comma-separated)', key: 'districts' },
              { label: 'Pincodes (comma-separated)', key: 'pincodes' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '5px' }}>{f.label}</label>
                <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }} />
              </div>
            ))}
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#FF7A00', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
              {saving ? 'Saving...' : modal.territory ? 'Save Changes' : 'Create Territory'}
            </button>
          </div>
        </Modal>
      )}

      {/* Assign modal */}
      {modal?.type === 'assign' && (
        <Modal title={`Assign — ${modal.territory.name}`} onClose={() => setModal(null)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Assign Agent</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={assignAgent} onChange={e => setAssignAgent(e.target.value)}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                  <option value="">Select agent...</option>
                  {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.agentCode})</option>)}
                </select>
                <button onClick={() => handleAssignAgent(modal.territory._id)} disabled={saving}
                  style={{ padding: '9px 14px', borderRadius: '8px', border: 'none', background: '#3B82F6', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Assign</button>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>Assign Dealer</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={assignDealer} onChange={e => setAssignDealer(e.target.value)}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px', boxSizing: 'border-box' }}>
                  <option value="">Select dealer...</option>
                  {dealers.map(d => <option key={d._id} value={d._id}>{d.businessName} ({d.dealerCode})</option>)}
                </select>
                <button onClick={() => handleAssignDealer(modal.territory._id)} disabled={saving}
                  style={{ padding: '9px 14px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Assign</button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
