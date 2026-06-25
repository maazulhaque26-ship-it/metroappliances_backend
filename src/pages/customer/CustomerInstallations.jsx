import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiTool, FiPlus, FiChevronRight } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import api from '../../services/api';

const STATUS_TABS = [
  { label: 'All',       value: '' },
  { label: 'Pending',   value: 'pending' },
  { label: 'Assigned',  value: 'assigned' },
  { label: 'Active',    value: 'in_progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function CustomerInstallations() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (activeTab) params.set('status', activeTab);
    api.get(`/installation/requests?${params}`)
      .then(r => { setRequests(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [activeTab, page]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiTool size={22} color="#FF7A00" />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>My Installations</h1>
        </div>
        <Link to="/my-installations/book" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#FF7A00', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
          <FiPlus /> Book Installation
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {STATUS_TABS.map(t => (
          <button key={t.value} onClick={() => { setActiveTab(t.value); setPage(1); }}
            style={{ padding: '7px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'Poppins, sans-serif', background: activeTab === t.value ? '#FF7A00' : '#F3F4F6', color: activeTab === t.value ? '#fff' : '#374151' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#6B7280' }}>Loading...</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#6B7280' }}>
          <FiTool size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 15 }}>No installation requests found.</p>
          <Link to="/my-installations/book" style={{ display: 'inline-block', marginTop: 16, padding: '10px 20px', background: '#FF7A00', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>Book Your First Installation</Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {requests.map(ir => (
              <Link key={ir._id} to={`/my-installations/${ir._id}`} style={{ textDecoration: 'none' }}>
                <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'box-shadow 0.2s' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{ir.requestNumber}</span>
                      <StatusBadge status={ir.status} />
                      {ir.priority !== 'normal' && <StatusBadge status={ir.priority} />}
                    </div>
                    <div style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{ir.productName} · {ir.category}</div>
                    <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                      {ir.preferredDate ? new Date(ir.preferredDate).toLocaleDateString() : '—'}
                      {ir.installationAddress?.city && ` · ${ir.installationAddress.city}`}
                      {ir.assignedEngineer && ` · Engineer: ${ir.assignedEngineer.name}`}
                    </div>
                  </div>
                  <FiChevronRight color="#9CA3AF" />
                </div>
              </Link>
            ))}
          </div>
          {total > limit && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', cursor: page === 1 ? 'not-allowed' : 'pointer', color: '#374151' }}>Previous</button>
              <span style={{ padding: '8px 16px', color: '#6B7280', fontSize: 13 }}>Page {page} of {Math.ceil(total / limit)}</span>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(total / limit)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #D1D5DB', background: '#fff', cursor: page >= Math.ceil(total / limit) ? 'not-allowed' : 'pointer', color: '#374151' }}>Next</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
