import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { FiTool, FiUpload, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';

const CATEGORIES = ['Air Conditioner', 'Refrigerator', 'Washing Machine', 'Dishwasher', 'Microwave', 'Water Purifier', 'Television', 'Other'];
const SLOTS      = [{ value: 'morning', label: 'Morning (9am – 1pm)' }, { value: 'afternoon', label: 'Afternoon (1pm – 5pm)' }, { value: 'evening', label: 'Evening (5pm – 8pm)' }];
const TYPES      = [{ value: 'installation', label: 'Installation' }, { value: 'demo', label: 'Demo / Training' }, { value: 'inspection', label: 'Inspection' }, { value: 'repair_followup', label: 'Repair Follow-up' }];

export default function CustomerBookInstallation() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const regId = searchParams.get('regId') || '';

  const [form, setForm] = useState({
    productName: '', category: '', serviceType: 'installation', priority: 'normal',
    serialNumber: '', registrationId: regId,
    preferredDate: '', preferredSlot: 'morning',
    specialInstructions: '',
    installationAddress: { line1: '', city: '', state: '', pincode: '', phone: '', landmark: '' },
  });
  const [photos, setPhotos]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(null);

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const updateAddr = (k, v) => setForm(p => ({ ...p, installationAddress: { ...p.installationAddress, [k]: v } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.productName || !form.category || !form.preferredDate || !form.installationAddress.city || !form.installationAddress.state || !form.installationAddress.pincode) {
      return setError('Product Name, Category, Preferred Date, City, State and Pincode are required.');
    }
    setLoading(true);
    try {
      const res = await api.post('/installation/requests', form);
      const irId = res.data.data._id;
      for (const photo of photos) {
        const fd = new FormData();
        fd.append('file', photo);
        await api.post(`/installation/requests/${irId}/location-photo`, fd).catch(() => {});
      }
      setDone(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book installation');
    } finally {
      setLoading(false);
    }
  };

  if (done) return (
    <div style={{ padding: '48px 32px', textAlign: 'center', fontFamily: 'Poppins, sans-serif' }}>
      <FiCheckCircle size={56} color="#10B981" />
      <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 16 }}>Installation Booked!</h2>
      <p style={{ color: '#6B7280', marginTop: 8 }}>Request Number: <strong>{done.requestNumber}</strong></p>
      <p style={{ color: '#6B7280' }}>Our team will assign an engineer and confirm your slot within 24 hours.</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24 }}>
        <Link to={`/my-installations/${done._id}`} style={{ padding: '10px 20px', background: '#FF7A00', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 700 }}>Track Installation</Link>
        <Link to="/my-installations" style={{ padding: '10px 20px', background: '#F3F4F6', color: '#374151', borderRadius: 8, textDecoration: 'none', fontWeight: 600 }}>All Requests</Link>
      </div>
    </div>
  );

  const inp = (label, val, onChange, type = 'text', required = false) => (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>{label}{required && <span style={{ color: '#EF4444' }}> *</span>}</label>
      <input type={type} value={val} onChange={e => onChange(e.target.value)} required={required}
        style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '32px 20px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
        <FiTool size={24} color="#FF7A00" />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>Book Installation</h1>
      </div>

      {error && <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: 8, marginBottom: 20, fontSize: 14 }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 20, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 16 }}>Product Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {inp('Product Name', form.productName, v => update('productName', v), 'text', true)}
            {inp('Serial Number (if any)', form.serialNumber, v => update('serialNumber', v))}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Category <span style={{ color: '#EF4444' }}>*</span></label>
              <select value={form.category} onChange={e => update('category', e.target.value)} required style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }}>
                <option value="">Select Category</option>
                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Service Type</label>
              <select value={form.serviceType} onChange={e => update('serviceType', e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }}>
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 20, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 16 }}>Schedule</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {inp('Preferred Date', form.preferredDate, v => update('preferredDate', v), 'date', true)}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Preferred Slot</label>
              <select value={form.preferredSlot} onChange={e => update('preferredSlot', e.target.value)} style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box' }}>
                {SLOTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 20, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 16 }}>Installation Address</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {inp('Address Line 1', form.installationAddress.line1, v => updateAddr('line1', v))}
            {inp('City', form.installationAddress.city, v => updateAddr('city', v), 'text', true)}
            {inp('State', form.installationAddress.state, v => updateAddr('state', v), 'text', true)}
            {inp('Pincode', form.installationAddress.pincode, v => updateAddr('pincode', v), 'text', true)}
            {inp('Phone at Location', form.installationAddress.phone, v => updateAddr('phone', v))}
            {inp('Landmark', form.installationAddress.landmark, v => updateAddr('landmark', v))}
          </div>
          <div style={{ marginTop: 14 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 5 }}>Special Instructions</label>
            <textarea value={form.specialInstructions} onChange={e => update('specialInstructions', e.target.value)} rows={3}
              placeholder="Any specific requirements or instructions for the engineer..."
              style={{ width: '100%', padding: '10px 12px', border: '1px solid #D1D5DB', borderRadius: 8, fontSize: 14, fontFamily: 'Poppins, sans-serif', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>
        </div>

        <div style={{ background: '#F9FAFB', borderRadius: 10, padding: 20, border: '1px solid #E5E7EB' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#374151', marginBottom: 12 }}>Location Photos (Optional)</h3>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '12px 16px', border: '2px dashed #D1D5DB', borderRadius: 8, color: '#6B7280', fontSize: 14 }}>
            <FiUpload />
            {photos.length > 0 ? `${photos.length} photo(s) selected` : 'Upload photos of installation area'}
            <input type="file" accept="image/*" multiple onChange={e => setPhotos(Array.from(e.target.files))} style={{ display: 'none' }} />
          </label>
        </div>

        <button type="submit" disabled={loading} style={{ padding: '13px 0', background: loading ? '#9CA3AF' : '#FF7A00', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'Poppins, sans-serif' }}>
          {loading ? 'Booking...' : 'Book Installation'}
        </button>
      </form>
    </div>
  );
}
