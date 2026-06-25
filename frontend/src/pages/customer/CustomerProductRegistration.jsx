import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiPackage, FiUpload, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';

const CATEGORIES = ['Air Conditioner', 'Refrigerator', 'Washing Machine', 'Dishwasher', 'Microwave', 'Water Purifier', 'Television', 'Other'];

export default function CustomerProductRegistration() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    productName: '', brand: '', modelNumber: '', serialNumber: '',
    barcodeValue: '', qrCode: '', purchaseDate: '', purchaseAmount: '',
    dealerName: '', invoiceNumber: '', category: '',
  });
  const [invoiceFile, setInvoiceFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(null);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.productName || !form.modelNumber || !form.serialNumber || !form.purchaseDate) {
      return setError('Product Name, Model Number, Serial Number, and Purchase Date are required.');
    }
    setLoading(true);
    try {
      let invoiceUrl = '';
      if (invoiceFile) {
        const fd = new FormData();
        fd.append('file', invoiceFile);
        const up = await api.post('/service/file-upload', fd);
        invoiceUrl = up.data.url;
      }
      const res = await api.post('/product-registrations', { ...form, invoiceUrl });
      setDone(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register product');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div style={{ padding: '48px 32px', textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>
      <FiCheckCircle size={56} color="#10B981" />
      <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 16 }}>Registration Submitted!</h2>
      <p style={{ color: '#6B7280', marginTop: 8 }}>Registration Number: <strong>{done.registrationNumber}</strong></p>
      <p style={{ color: '#6B7280' }}>Our team will verify your product registration within 24–48 hours.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
        <Link to="/my-products" style={{ padding: '10px 20px', background: '#FF7A00', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>My Registrations</Link>
        <button onClick={() => { setDone(null); setForm({ productName: '', brand: '', modelNumber: '', serialNumber: '', barcodeValue: '', qrCode: '', purchaseDate: '', purchaseAmount: '', dealerName: '', invoiceNumber: '', category: '' }); }} style={{ padding: '10px 20px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>Register Another</button>
      </div>
    </div>
  );

  const field = (label, key, type = 'text', required = false) => (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>{label}{required && <span style={{ color: '#EF4444' }}> *</span>}</label>
      <input type={type} value={form[key]} onChange={e => update(key, e.target.value)} required={required}
        style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <FiPackage size={24} color="#FF7A00" />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Register Your Product</h1>
      </div>

      {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 20, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 16 }}>Product Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {field('Product Name', 'productName', 'text', true)}
            {field('Brand', 'brand')}
            {field('Model Number', 'modelNumber', 'text', true)}
            {field('Serial Number', 'serialNumber', 'text', true)}
            {field('Barcode Value', 'barcodeValue')}
            {field('QR Code', 'qrCode')}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Category</label>
              <select value={form.category} onChange={e => update('category', e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }}>
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 20, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 16 }}>Purchase Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {field('Purchase Date', 'purchaseDate', 'date', true)}
            {field('Purchase Amount (₹)', 'purchaseAmount', 'number')}
            {field('Dealer Name', 'dealerName')}
            {field('Invoice Number', 'invoiceNumber')}
          </div>
        </div>

        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 20, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Upload Invoice (Optional)</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 16px', border: '2px dashed #D1D5DB', borderRadius: 8, color: '#6B7280', fontSize: 14 }}>
            <FiUpload />
            {invoiceFile ? invoiceFile.name : 'Click to upload invoice (PDF or image)'}
            <input type="file" accept="image/*,.pdf" onChange={e => setInvoiceFile(e.target.files[0])} style={{ display: 'none' }} />
          </label>
        </div>

        <button type="submit" disabled={loading} style={{ padding: '13px 0', background: loading ? '#9CA3AF' : '#FF7A00', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Poppins, sans-serif' }}>
          {loading ? 'Submitting...' : 'Register Product'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 13, color: '#6B7280' }}>
          Already registered a product? <Link to="/my-products" style={{ color: '#FF7A00', textDecoration: 'none' }}>View registrations →</Link>
        </p>
      </form>
    </div>
  );
}
