import React, { useEffect, useState } from 'react';
import { FiPlus, FiSearch, FiEdit, FiTrash2, FiStar } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import api from '../../services/api';

const SKILLS = ['Air Conditioner', 'Refrigerator', 'Washing Machine', 'Dishwasher', 'Microwave', 'Water Purifier', 'Television', 'Other'];

function EngineerModal({ eng, onClose, onSave }) {
  const blank = { name: '', email: '', phone: '', password: '', employeeId: '', skills: [], status: 'active', maxWorkload: 6, territory: { cities: '', pincodes: '' } };
  const [form, setForm] = useState(eng ? { ...eng, territory: { cities: eng.territory?.cities?.join(', ') || '', pincodes: eng.territory?.pincodes?.join(', ') || '' } } : blank);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, territory: { cities: form.territory.cities.split(',').map(s => s.trim()).filter(Boolean), pincodes: form.territory.pincodes.split(',').map(s => s.trim()).filter(Boolean) } };
      if (!payload.password) delete payload.password;
      if (eng) await api.put(`/admin/installation-engineers/${eng._id}`, payload);
      else     await api.post('/admin/installation-engineers', payload);
      onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 560, maxHeight: '85vh', overflow: 'auto', fontFamily: 'Poppins, sans-serif' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>{eng ? 'Edit' : 'Add'} Engineer</h3>
        {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {[['Name', 'name', 'text', true], ['Email', 'email', 'email', !eng], ['Phone', 'phone', 'text', true], ['Employee ID', 'employeeId', 'text', false], ['Password', 'password', 'password', !eng], ['Max Workload', 'maxWorkload', 'number', false]].map(([label, key, type, req]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}{req && <span style={{ color: '#EF4444' }}> *</span>}</label>
                <input type={type} value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} required={req}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Skills</label>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {SKILLS.map(s => (
                <label key={s} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, cursor: 'pointer', padding: '4px 10px', borderRadius: 16, background: form.skills?.includes(s) ? '#D1FAE5' : '#F3F4F6', color: form.skills?.includes(s) ? '#065F46' : '#374151', fontWeight: 600 }}>
                  <input type="checkbox" checked={form.skills?.includes(s)} onChange={e => setForm(p => ({ ...p, skills: e.target.checked ? [...(p.skills || []), s] : (p.skills || []).filter(x => x !== s) }))} style={{ display: 'none' }} />
                  {s}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
            {[['Cities (comma-separated)', 'cities'], ['Pincodes (comma-separated)', 'pincodes']].map(([label, key]) => (
              <div key={key}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}</label>
                <input value={form.territory?.[key] || ''} onChange={e => setForm(p => ({ ...p, territory: { ...p.territory, [key]: e.target.value } }))}
                  style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
            <button type="button" onClick={onClose} style={{ padding: '10px 18px', background: '#F3F4F6', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>Cancel</button>
            <button type="submit" disabled={saving} style={{ padding: '10px 18px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontFamily: 'Poppins, sans-serif', opacity: saving ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Save Engineer'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminInstallationEngineers() {
  const [engineers, setEngineers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [modal, setModal]       = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    api.get(`/admin/installation-engineers?${params}`)
      .then(r => { setEngineers(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(() => setEngineers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page]);

  const deleteEng = async (id, name) => {
    if (!window.confirm(`Delete engineer "${name}"?`)) return;
    try { await api.delete(`/admin/installation-engineers/${id}`); load(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      {modal !== undefined && <EngineerModal eng={modal} onClose={() => setModal(undefined)} onSave={() => { setModal(undefined); load(); }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Installation Engineers</h1>
        <button onClick={() => setModal(null)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#059669', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'Poppins, sans-serif' }}>
          <FiPlus /> Add Engineer
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search by name, email, ID..."
            style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 10, paddingBottom: 10, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'Poppins, sans-serif' }} />
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading...</div> : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {engineers.map(eng => (
              <div key={eng._id} style={{ background: '#fff', borderRadius: 12, padding: 18, border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{eng.name}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{eng.employeeId || eng.email}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <StatusBadge status={eng.status} />
                    {eng.isAvailable && <StatusBadge status="available" />}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#374151', marginBottom: 8 }}>
                  {eng.currentWorkload}/{eng.maxWorkload} jobs · {eng.totalInstallations} total
                  {eng.rating?.count > 0 && <span style={{ marginLeft: 6 }}><FiStar size={10} color="#F59E0B" /> {eng.rating.average}</span>}
                </div>
                {eng.skills?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                    {eng.skills.slice(0, 3).map(s => <span key={s} style={{ padding: '2px 8px', background: '#D1FAE5', color: '#065F46', borderRadius: 10, fontSize: 10, fontWeight: 600 }}>{s}</span>)}
                    {eng.skills.length > 3 && <span style={{ padding: '2px 8px', background: '#F3F4F6', color: '#6B7280', borderRadius: 10, fontSize: 10 }}>+{eng.skills.length - 3}</span>}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setModal(eng)} style={{ flex: 1, padding: '7px 0', background: '#EFF6FF', color: '#1E40AF', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <FiEdit size={12} /> Edit
                  </button>
                  <button onClick={() => deleteEng(eng._id, eng.name)} style={{ flex: 1, padding: '7px 0', background: '#FEE2E2', color: '#991B1B', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    <FiTrash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
            {engineers.length === 0 && <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40, color: '#6B7280' }}>No engineers found</div>}
          </div>
          {total > limit && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', color: '#374151' }}>Previous</button>
              <span style={{ padding: '8px 16px', color: '#6B7280', fontSize: 13 }}>Page {page} of {Math.ceil(total / limit)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', cursor: 'pointer', color: '#374151' }}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
