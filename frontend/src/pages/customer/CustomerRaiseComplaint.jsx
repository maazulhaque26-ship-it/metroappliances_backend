import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTool, FiUpload, FiX, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';

const CATEGORIES = [
  'Air Conditioner', 'Washing Machine', 'Refrigerator', 'Microwave Oven',
  'Dishwasher', 'Oven / Cooking Range', 'Water Purifier', 'Television',
  'Small Appliance', 'Installation', 'Annual Maintenance', 'Other',
];

const LABEL = { fontWeight: 600, fontSize: 13, color: 'var(--text)', marginBottom: 6, display: 'block' };
const INPUT = {
  width: '100%', padding: '10px 14px', borderRadius: 8, fontSize: 14,
  border: '1px solid var(--border)', background: 'var(--card)', color: 'var(--text)',
  outline: 'none', boxSizing: 'border-box',
};

export default function CustomerRaiseComplaint() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    productName: '', serialNumber: '', invoiceNumber: '', category: '',
    description: '', priority: 'medium',
    serviceAddress: { line1: '', city: '', state: '', pincode: '', phone: '' },
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));
  const setAddr = (key, val) => setForm(f => ({ ...f, serviceAddress: { ...f.serviceAddress, [key]: val } }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.category) { setError('Please select a category.'); return; }
    if (!form.description.trim()) { setError('Please describe the issue.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/service/requests', {
        productName: form.productName,
        serialNumber: form.serialNumber,
        invoiceNumber: form.invoiceNumber,
        category: form.category,
        description: form.description,
        priority: form.priority,
        serviceAddress: form.serviceAddress,
      });
      const srId = data.data?.serviceRequest?._id || data.data?._id;

      // Upload each file as attachment
      for (const file of files) {
        const fd = new FormData();
        fd.append('file', file);
        await api.post(`/service/requests/${srId}/attachment`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        }).catch(() => {});
      }

      navigate(`/my-service/track/${srId}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to raise complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4" style={{ background: 'var(--bg)' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Raise a Complaint</h1>
          <p style={{ fontSize: 14, color: 'var(--text-4)' }}>Submit a service request and our team will be in touch shortly.</p>
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
            <FiAlertCircle size={16} style={{ color: '#EF4444', flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: '#B91C1C' }}>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Product Info */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Product Details</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={LABEL}>Product Name</label>
                <input style={INPUT} placeholder="e.g. Samsung 1.5 Ton Split AC" value={form.productName} onChange={e => set('productName', e.target.value)} />
              </div>
              <div>
                <label style={LABEL}>Serial Number</label>
                <input style={INPUT} placeholder="Found on product label" value={form.serialNumber} onChange={e => set('serialNumber', e.target.value)} />
              </div>
              <div>
                <label style={LABEL}>Invoice Number</label>
                <input style={INPUT} placeholder="From your purchase invoice" value={form.invoiceNumber} onChange={e => set('invoiceNumber', e.target.value)} />
              </div>
              <div>
                <label style={LABEL}>Category <span style={{ color: '#EF4444' }}>*</span></label>
                <select style={INPUT} value={form.category} onChange={e => set('category', e.target.value)}>
                  <option value="">Select category</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Issue Description */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Issue Details</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={LABEL}>Description <span style={{ color: '#EF4444' }}>*</span></label>
              <textarea
                style={{ ...INPUT, height: 100, resize: 'vertical' }}
                placeholder="Describe the problem in detail..."
                value={form.description}
                onChange={e => set('description', e.target.value)}
                required
              />
            </div>
            <div>
              <label style={LABEL}>Priority</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {['low', 'medium', 'high', 'urgent'].map(p => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, cursor: 'pointer', fontWeight: form.priority === p ? 700 : 400 }}>
                    <input type="radio" name="priority" value={p} checked={form.priority === p} onChange={() => set('priority', p)} />
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Service Address */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Service Address</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={LABEL}>Address Line 1</label>
                <input style={INPUT} placeholder="House/Flat number, Street" value={form.serviceAddress.line1} onChange={e => setAddr('line1', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                <div>
                  <label style={LABEL}>City</label>
                  <input style={INPUT} placeholder="City" value={form.serviceAddress.city} onChange={e => setAddr('city', e.target.value)} />
                </div>
                <div>
                  <label style={LABEL}>State</label>
                  <input style={INPUT} placeholder="State" value={form.serviceAddress.state} onChange={e => setAddr('state', e.target.value)} />
                </div>
                <div>
                  <label style={LABEL}>Pincode</label>
                  <input style={INPUT} placeholder="Pincode" maxLength={6} value={form.serviceAddress.pincode} onChange={e => setAddr('pincode', e.target.value)} />
                </div>
              </div>
              <div>
                <label style={LABEL}>Contact Phone</label>
                <input style={INPUT} placeholder="Phone number for technician" value={form.serviceAddress.phone} onChange={e => setAddr('phone', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Attachments <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--text-4)' }}>optional</span></h3>
            <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 16 }}>Upload photos or the invoice PDF (max 20 MB each)</p>
            <label style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '28px 24px', border: '2px dashed var(--border)', borderRadius: 10, cursor: 'pointer',
              background: '#F9FAFB', gap: 8,
            }}>
              <FiUpload size={22} style={{ color: 'var(--text-4)' }} />
              <span style={{ fontSize: 13, color: 'var(--text-4)' }}>Click to upload images or PDF</span>
              <input type="file" multiple accept="image/*,application/pdf" hidden onChange={e => setFiles(Array.from(e.target.files))} />
            </label>
            {files.length > 0 && (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {files.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F3F4F6', borderRadius: 20, padding: '4px 12px', fontSize: 12 }}>
                    <span>{f.name}</span>
                    <button type="button" onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      <FiX size={12} style={{ color: '#6B7280' }} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button type="submit" disabled={submitting} style={{
            padding: '14px 28px', background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <FiTool size={15} />
            {submitting ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </form>
      </div>
    </div>
  );
}
