import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiPlus, FiExternalLink } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import api from '../../services/api';

const STATUS_TABS = [
  { label: 'All',               value: '' },
  { label: 'Pending',           value: 'pending' },
  { label: 'Verified',          value: 'verified' },
  { label: 'Warranty Activated',value: 'warranty_activated' },
  { label: 'Invalid',           value: 'invalid' },
];

export default function CustomerRegistrationHistory() {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTab, setActiveTab] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (activeTab) params.set('status', activeTab);
    api.get(`/product-registrations?${params}`)
      .then(r => {
        setRegistrations(r.data.data || []);
        setTotal(r.data.pagination?.total || 0);
      })
      .catch(() => setRegistrations([]))
      .finally(() => setLoading(false));
  }, [activeTab, page]);

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px 20px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiPackage size={22} color="#FF7A00" />
          <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>My Product Registrations</h1>
        </div>
        <Link to="/my-products/register" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', background: '#FF7A00', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
          <FiPlus /> Register Product
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
      ) : registrations.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#6B7280' }}>
          <FiPackage size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontSize: 15 }}>No product registrations found.</p>
          <Link to="/my-products/register" style={{ display: 'inline-block', marginTop: 16, padding: '10px 20px', background: '#FF7A00', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>Register Your First Product</Link>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {registrations.map(reg => (
              <div key={reg._id} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{reg.productName}</span>
                    <StatusBadge status={reg.status} />
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>
                    <span>{reg.brand} · {reg.modelNumber}</span>
                    <span style={{ margin: '0 8px' }}>|</span>
                    <span>S/N: {reg.serialNumber}</span>
                    <span style={{ margin: '0 8px' }}>|</span>
                    <span>{reg.registrationNumber}</span>
                  </div>
                  {reg.purchaseDate && (
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>
                      Purchased: {new Date(reg.purchaseDate).toLocaleDateString()}
                      {reg.dealerName && ` · ${reg.dealerName}`}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {reg.status === 'warranty_activated' && (
                    <Link to="/my-service/warranty" style={{ fontSize: 12, color: '#10B981', textDecoration: 'none', fontWeight: 600 }}>View Warranty →</Link>
                  )}
                  <Link to={`/my-products/${reg._id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '7px 12px', background: '#F3F4F6', color: '#374151', borderRadius: 6, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}>
                    <FiExternalLink size={12} /> Details
                  </Link>
                </div>
              </div>
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
