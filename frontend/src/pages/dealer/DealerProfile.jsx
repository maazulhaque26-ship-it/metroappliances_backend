import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDealerMe, updateDealerProfile, clearDealerAuth, dealerLogout } from '../../redux/slices/dealerAuthSlice';
import dealerAPI from '../../services/dealerAPI';
import { toast } from 'react-toastify';
import { FiSave, FiUpload, FiCheck, FiLogOut } from 'react-icons/fi';
import Logo from '../../components/ui/Logo';

const DOCS = [
  { key: 'gstCertificate',  label: 'GST Certificate',  required: true },
  { key: 'panCard',         label: 'PAN Card',          required: true },
  { key: 'shopLicense',     label: 'Shop License',      required: false },
  { key: 'visitingCard',    label: 'Visiting Card',     required: false },
  { key: 'storefrontPhoto', label: 'Storefront Photo',  required: false },
];

export default function DealerProfile() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { dealer, token, loading } = useSelector(s => s.dealerAuth);

  const [form, setForm]     = useState({});
  const [saving, setSaving] = useState(false);
  const [docLoading, setDocLoading] = useState({});

  useEffect(() => {
    if (!token) { navigate('/dealer/login', { replace: true }); return; }
    dispatch(fetchDealerMe());
  }, [token, dispatch, navigate]);

  useEffect(() => {
    if (dealer) {
      setForm({
        ownerName:      dealer.ownerName     || '',
        phone:          dealer.phone         || '',
        alternatePhone: dealer.alternatePhone|| '',
        website:        dealer.website       || '',
        yearsInBusiness:dealer.yearsInBusiness|| 0,
        addressLine1:   dealer.addressLine1  || '',
        addressLine2:   dealer.addressLine2  || '',
        city:           dealer.city          || '',
        district:       dealer.district      || '',
        pincode:        dealer.pincode       || '',
        bankDetails:    dealer.bankDetails   || {},
      });
    }
  }, [dealer]);

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));
  const setBank = (k) => (e) => setForm(f => ({ ...f, bankDetails: { ...f.bankDetails, [k]: e.target.value } }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await dispatch(updateDealerProfile(form)).unwrap();
      toast.success('Profile updated');
    } catch (err) {
      toast.error(err || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDocUpload = async (docKey, file) => {
    if (!file || !file.type.startsWith('image/')) { toast.error('Only image files allowed'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('File must be under 5MB'); return; }
    setDocLoading(l => ({ ...l, [docKey]: true }));
    try {
      const fd = new FormData();
      fd.append('file', file);
      await dealerAPI.post(`/dealer/documents/${docKey}`, fd);
      await dispatch(fetchDealerMe());
      toast.success('Document uploaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setDocLoading(l => ({ ...l, [docKey]: false }));
    }
  };

  const handleLogout = async () => {
    await dispatch(dealerLogout());
    dispatch(clearDealerAuth());
    navigate('/dealer/login');
  };

  if (!dealer || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <span className="w-8 h-8 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>
      {/* Top Bar */}
      <header className="border-b bg-white" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Logo imageClass="h-8 w-auto" />
            <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--text-4)' }}>Profile</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="/dealer/dashboard" className="text-sm font-medium hover:underline" style={{ color: 'var(--text-3)' }}>Dashboard</a>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--text-3)' }}>
              <FiLogOut size={13} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-10 space-y-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.15em] mb-1" style={{ color: 'var(--accent)' }}>{dealer.dealerCode}</p>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.03em' }}>
            {dealer.businessName}
          </h1>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {/* Personal info */}
          <section className="bg-white border p-6 space-y-4" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <h2 className="font-extrabold text-base" style={{ color: 'var(--text)' }}>Owner Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Owner Name</label>
                <input value={form.ownerName || ''} onChange={set('ownerName')} className="input" />
              </div>
              <div>
                <label className="label">Mobile Number</label>
                <input value={form.phone || ''} onChange={set('phone')} className="input" maxLength={10} />
              </div>
              <div>
                <label className="label">Alternate Phone</label>
                <input value={form.alternatePhone || ''} onChange={set('alternatePhone')} className="input" maxLength={10} />
              </div>
              <div>
                <label className="label">Website</label>
                <input value={form.website || ''} onChange={set('website')} className="input" placeholder="https://yoursite.com" />
              </div>
            </div>
          </section>

          {/* Address */}
          <section className="bg-white border p-6 space-y-4" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <h2 className="font-extrabold text-base" style={{ color: 'var(--text)' }}>Business Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Address Line 1</label>
                <input value={form.addressLine1 || ''} onChange={set('addressLine1')} className="input" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address Line 2</label>
                <input value={form.addressLine2 || ''} onChange={set('addressLine2')} className="input" />
              </div>
              <div>
                <label className="label">City</label>
                <input value={form.city || ''} onChange={set('city')} className="input" />
              </div>
              <div>
                <label className="label">District</label>
                <input value={form.district || ''} onChange={set('district')} className="input" />
              </div>
              <div>
                <label className="label">Pincode</label>
                <input value={form.pincode || ''} onChange={set('pincode')} className="input" maxLength={6} />
              </div>
            </div>
          </section>

          {/* Bank Details */}
          <section className="bg-white border p-6 space-y-4" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)' }}>
            <h2 className="font-extrabold text-base" style={{ color: 'var(--text)' }}>Bank Details <span className="font-normal text-sm" style={{ color: 'var(--text-4)' }}>(optional)</span></h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Account Holder Name</label>
                <input value={form.bankDetails?.accountHolderName || ''} onChange={setBank('accountHolderName')} className="input" />
              </div>
              <div>
                <label className="label">Account Number</label>
                <input value={form.bankDetails?.accountNumber || ''} onChange={setBank('accountNumber')} className="input" />
              </div>
              <div>
                <label className="label">Bank Name</label>
                <input value={form.bankDetails?.bankName || ''} onChange={setBank('bankName')} className="input" />
              </div>
              <div>
                <label className="label">IFSC Code</label>
                <input value={form.bankDetails?.ifscCode || ''} onChange={setBank('ifscCode')} className="input uppercase" />
              </div>
              <div>
                <label className="label">Branch</label>
                <input value={form.bankDetails?.branchName || ''} onChange={setBank('branchName')} className="input" />
              </div>
              <div>
                <label className="label">Account Type</label>
                <select value={form.bankDetails?.accountType || ''} onChange={setBank('accountType')} className="input">
                  <option value="">Select type</option>
                  <option value="savings">Savings</option>
                  <option value="current">Current</option>
                </select>
              </div>
            </div>
          </section>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2.5 px-7 py-3.5 text-white font-bold text-[12px] uppercase tracking-[0.1em]"
            style={{ background: 'var(--text)', borderRadius: 'var(--radius-sm)', opacity: saving ? 0.65 : 1 }}
          >
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiSave size={14} />}
            Save Changes
          </button>
        </form>

        {/* KYC Documents */}
        <section id="documents" className="bg-white border p-6 space-y-5" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)' }}>
          <div className="flex items-center justify-between">
            <h2 className="font-extrabold text-base" style={{ color: 'var(--text)' }}>KYC Documents</h2>
            <span
              className="text-[11px] font-bold px-2 py-1"
              style={{
                background: dealer.kycStatus === 'verified' ? 'rgba(22,163,74,0.1)' : 'rgba(217,119,6,0.1)',
                color: dealer.kycStatus === 'verified' ? '#16A34A' : '#D97706',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              KYC: {dealer.kycStatus?.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DOCS.map(doc => {
              const uploaded = dealer.documents?.[doc.key]?.url;
              return (
                <div key={doc.key}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                      {doc.label}{doc.required && <span style={{ color: 'var(--accent)' }}>*</span>}
                    </span>
                    {uploaded && (
                      <span className="text-[11px] font-semibold flex items-center gap-1" style={{ color: '#16A34A' }}>
                        <FiCheck size={11} /> Uploaded
                      </span>
                    )}
                  </div>

                  {uploaded ? (
                    <div className="relative overflow-hidden" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', height: 120 }}>
                      <img src={uploaded} alt={doc.label} className="w-full h-full object-cover" />
                      <label
                        className="absolute bottom-2 right-2 px-2.5 py-1 text-[11px] font-bold cursor-pointer"
                        style={{ background: 'rgba(0,0,0,0.6)', color: '#fff', borderRadius: 'var(--radius-sm)' }}
                      >
                        Replace
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleDocUpload(doc.key, e.target.files[0])} />
                      </label>
                    </div>
                  ) : (
                    <label
                      className="flex flex-col items-center justify-center gap-2 cursor-pointer"
                      style={{ border: '2px dashed var(--border)', borderRadius: 'var(--radius-sm)', padding: '20px', background: 'var(--bg)', minHeight: 90 }}
                    >
                      {docLoading[doc.key] ? (
                        <span className="w-5 h-5 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
                      ) : (
                        <>
                          <FiUpload size={18} style={{ color: 'var(--text-4)' }} />
                          <span className="text-[12px]" style={{ color: 'var(--text-4)' }}>Click to upload</span>
                        </>
                      )}
                      <input type="file" accept="image/*" className="hidden" onChange={e => handleDocUpload(doc.key, e.target.files[0])} disabled={docLoading[doc.key]} />
                    </label>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}
