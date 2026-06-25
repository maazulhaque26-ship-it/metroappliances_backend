import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { FiPackage, FiShield, FiTool, FiFileText, FiArrowLeft } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import api from '../../services/api';

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, padding: '9px 0', borderBottom: '1px solid #F3F4F6', fontSize: 13 }}>
      <span style={{ color: '#6B7280' }}>{label}</span>
      <span style={{ color: '#111827', fontWeight: 600, textAlign: 'right' }}>{value || '-'}</span>
    </div>
  );
}

export default function CustomerProductRegistrationDetail() {
  const { id } = useParams();
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/product-registrations/${id}`)
      .then(r => setRegistration(r.data.data))
      .catch(() => setError('Product registration not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280', fontFamily: 'Poppins, sans-serif' }}>Loading...</div>;
  if (error) return <div style={{ padding: 40, textAlign: 'center', color: '#EF4444', fontFamily: 'Poppins, sans-serif' }}>{error}</div>;
  if (!registration) return null;

  const warranty = registration.warranty || {};

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 20px', fontFamily: 'Poppins, sans-serif' }}>
      <Link to="/my-products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#FF7A00', textDecoration: 'none', fontSize: 13, fontWeight: 700, marginBottom: 20 }}>
        <FiArrowLeft size={14} /> My Registrations
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FiPackage size={22} color="#FF7A00" />
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{registration.productName}</h1>
            <p style={{ color: '#6B7280', fontSize: 13, marginTop: 3 }}>{registration.registrationNumber}</p>
          </div>
        </div>
        <StatusBadge status={registration.status} size="lg" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        <section style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 18 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            <FiPackage size={15} /> Product
          </h3>
          <InfoRow label="Brand" value={registration.brand} />
          <InfoRow label="Model" value={registration.modelNumber} />
          <InfoRow label="Serial" value={registration.serialNumber} />
          <InfoRow label="Category" value={registration.category} />
          <InfoRow label="Barcode" value={registration.barcodeValue} />
          <InfoRow label="QR Code" value={registration.qrCode} />
        </section>

        <section style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 18 }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
            <FiFileText size={15} /> Purchase
          </h3>
          <InfoRow label="Purchase Date" value={registration.purchaseDate ? new Date(registration.purchaseDate).toLocaleDateString() : ''} />
          <InfoRow label="Amount" value={registration.purchaseAmount ? `₹${registration.purchaseAmount}` : ''} />
          <InfoRow label="Dealer" value={registration.dealerName} />
          <InfoRow label="Invoice" value={registration.invoiceNumber} />
          {registration.invoiceUrl && (
            <a href={registration.invoiceUrl} target="_blank" rel="noreferrer" style={{ display: 'inline-flex', marginTop: 12, color: '#FF7A00', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              View Uploaded Invoice
            </a>
          )}
        </section>
      </div>

      <section style={{ background: warranty.warrantyId ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${warranty.warrantyId ? '#BBF7D0' : '#FDE68A'}`, borderRadius: 12, padding: 18, marginBottom: 18 }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 700, color: warranty.warrantyId ? '#065F46' : '#92400E', marginBottom: 8 }}>
          <FiShield size={15} /> Warranty
        </h3>
        {warranty.warrantyId ? (
          <>
            <InfoRow label="Activated" value={warranty.activatedAt ? new Date(warranty.activatedAt).toLocaleDateString() : 'Active'} />
            <InfoRow label="Duration" value={warranty.duration ? `${warranty.duration} months` : ''} />
            <Link to="/my-service/warranty" style={{ display: 'inline-flex', marginTop: 12, color: '#059669', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              View Warranty Details
            </Link>
          </>
        ) : (
          <p style={{ color: '#92400E', fontSize: 13 }}>Warranty activates after admin verification.</p>
        )}
      </section>

      <div style={{ display: 'flex', gap: 12 }}>
        <Link to={`/my-installations/book?regId=${registration._id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', background: '#FF7A00', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
          <FiTool size={14} /> Book Installation
        </Link>
        <Link to="/my-products/register" style={{ padding: '10px 18px', background: '#F3F4F6', color: '#374151', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 13 }}>
          Register Another
        </Link>
      </div>
    </div>
  );
}
