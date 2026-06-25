import React, { useEffect, useState } from 'react';
import { FiSearch, FiPackage, FiCheckCircle, FiX, FiShield } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import api from '../../services/api';

function ActionModal({ reg, onClose, onDone }) {
  const [action, setAction]   = useState('');
  const [reason, setReason]   = useState('');
  const [duration, setDuration] = useState(12);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');

  const execute = async () => {
    setSaving(true);
    try {
      if (action === 'verify')   await api.put(`/admin/product-registrations/${reg._id}/verify`, { notes: reason });
      if (action === 'invalid')  await api.put(`/admin/product-registrations/${reg._id}/invalidate`, { reason });
      if (action === 'warranty') await api.put(`/admin/product-registrations/${reg._id}/activate-warranty`, { duration });
      onDone();
    } catch (e) { setMsg(e.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 440, fontFamily: 'Poppins, sans-serif' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Manage Registration</h3>
        <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 16 }}><strong>{reg.registrationNumber}</strong> · {reg.productName} · {reg.serialNumber}</p>
        {msg && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '8px 12px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>{msg}</div>}
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[{ value: 'verify', label: 'Verify', color: '#059669' }, { value: 'warranty', label: 'Activate Warranty', color: '#3B82F6' }, { value: 'invalid', label: 'Invalidate', color: '#EF4444' }].map(a => (
            <button key={a.value} onClick={() => setAction(a.value)} style={{ flex: 1, padding: '9px 0', background: action === a.value ? a.color : '#F3F4F6', color: action === a.value ? '#fff' : '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Poppins, sans-serif' }}>{a.label}</button>
          ))}
        </div>
        {(action === 'verify' || action === 'invalid') && (
          <input value={reason} onChange={e => setReason(e.target.value)} placeholder={action === 'verify' ? 'Notes (optional)' : 'Reason for invalidation'}
            style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif', marginBottom: 14, boxSizing: 'border-box' }} />
        )}
        {action === 'warranty' && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Warranty Duration (months)</label>
            <input type="number" value={duration} min={1} max={60} onChange={e => setDuration(Number(e.target.value))}
              style={{ width: '100%', padding: '9px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 18px', background: '#F3F4F6', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: 'Poppins, sans-serif' }}>Cancel</button>
          <button onClick={execute} disabled={!action || saving} style={{ padding: '9px 18px', background: !action || saving ? '#9CA3AF' : '#FF7A00', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontFamily: 'Poppins, sans-serif', opacity: (!action || saving) ? 0.7 : 1 }}>{saving ? 'Saving...' : 'Execute'}</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminProductRegistrations() {
  const [registrations, setRegistrations] = useState([]);
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [modal, setModal]   = useState(null);
  const [page, setPage]     = useState(1);
  const [total, setTotal]   = useState(0);
  const limit = 20;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    Promise.all([
      api.get(`/admin/product-registrations?${params}`),
      api.get('/admin/product-registrations/stats'),
    ]).then(([r, s]) => {
      setRegistrations(r.data.data || []); setTotal(r.data.pagination?.total || 0);
      setStats(s.data.data);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, status]);

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      {modal && <ActionModal reg={modal} onClose={() => setModal(null)} onDone={() => { setModal(null); load(); }} />}

      <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', marginBottom: 20 }}>Product Registrations</h1>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'Total',        value: stats.total,            color: '#3B82F6' },
            { label: 'Pending',      value: stats.pending,          color: '#F59E0B' },
            { label: 'Verified',     value: stats.verified,         color: '#8B5CF6' },
            { label: 'Warranty On',  value: stats.warrantyActivated, color: '#10B981' },
            { label: 'Invalid',      value: stats.invalid,          color: '#EF4444' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ background: '#fff', borderRadius: 10, padding: 14, border: '1px solid #E5E7EB', textAlign: 'center' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color }}>{value}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 2 }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search by reg#, serial, product..."
            style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 10, paddingBottom: 10, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'Poppins, sans-serif' }} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif', cursor: 'pointer' }}>
          <option value="">All Statuses</option>
          {['pending', 'verified', 'warranty_activated', 'invalid', 'transferred'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading...</div> : (
        <>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Reg#', 'Product', 'Serial', 'Customer', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', borderBottom: '1px solid #E5E7EB', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {registrations.map(reg => (
                  <tr key={reg._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{reg.registrationNumber}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}><div>{reg.productName}</div><div style={{ fontSize: 11, color: '#9CA3AF' }}>{reg.brand} · {reg.modelNumber}</div></td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280' }}>{reg.serialNumber}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>{reg.customer?.name}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280' }}>{reg.purchaseDate ? new Date(reg.purchaseDate).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '12px 14px' }}><StatusBadge status={reg.status} /></td>
                    <td style={{ padding: '12px 14px' }}>
                      <button onClick={() => setModal(reg)} style={{ padding: '5px 10px', background: '#EFF6FF', color: '#1E40AF', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Manage</button>
                    </td>
                  </tr>
                ))}
                {registrations.length === 0 && <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>No registrations found</td></tr>}
              </tbody>
            </table>
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
