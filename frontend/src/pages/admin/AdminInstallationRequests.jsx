import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSearch, FiFilter } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import api from '../../services/api';

const STATUS_OPTS = ['', 'pending', 'confirmed', 'assigned', 'travelling', 'arrived', 'in_progress', 'demo_in_progress', 'completed', 'cancelled', 'rescheduled'];

export default function AdminInstallationRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]  = useState(true);
  const [search, setSearch]    = useState('');
  const [status, setStatus]    = useState('');
  const [priority, setPriority] = useState('');
  const [page, setPage]        = useState(1);
  const [total, setTotal]      = useState(0);
  const limit = 20;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (search)   params.set('search', search);
    if (status)   params.set('status', status);
    if (priority) params.set('priority', priority);
    api.get(`/admin/installation/requests?${params}`)
      .then(r => { setRequests(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [page, status, priority]);

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>Installation Requests</h1>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search by request#, product, city..."
            style={{ width: '100%', paddingLeft: 38, paddingRight: 12, paddingTop: 10, paddingBottom: 10, border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, boxSizing: 'border-box', fontFamily: 'Poppins, sans-serif' }} />
        </div>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif', cursor: 'pointer' }}>
          <option value="">All Statuses</option>
          {STATUS_OPTS.filter(Boolean).map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
        </select>
        <select value={priority} onChange={e => { setPriority(e.target.value); setPage(1); }} style={{ padding: '10px 14px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, fontFamily: 'Poppins, sans-serif', cursor: 'pointer' }}>
          <option value="">All Priorities</option>
          <option value="normal">Normal</option>
          <option value="urgent">Urgent</option>
          <option value="vip">VIP</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading...</div>
      ) : (
        <>
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #E5E7EB', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Request#', 'Product', 'Customer', 'City', 'Date', 'Status', 'Priority', 'Engineer', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#6B7280', borderBottom: '1px solid #E5E7EB', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map(ir => (
                  <tr key={ir._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 600, color: '#111827' }}>{ir.requestNumber}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>{ir.productName}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#374151' }}>{ir.customer?.name}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: '#6B7280' }}>{ir.installationAddress?.city}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280' }}>{ir.preferredDate ? new Date(ir.preferredDate).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '12px 14px' }}><StatusBadge status={ir.status} /></td>
                    <td style={{ padding: '12px 14px' }}><StatusBadge status={ir.priority} /></td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: '#6B7280' }}>{ir.assignedEngineer?.name || '—'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <Link to={`/admin/installation/requests/${ir._id}`} style={{ padding: '5px 10px', background: '#EFF6FF', color: '#1E40AF', borderRadius: 6, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>View</Link>
                    </td>
                  </tr>
                ))}
                {requests.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontSize: 14 }}>No requests found</td></tr>
                )}
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
