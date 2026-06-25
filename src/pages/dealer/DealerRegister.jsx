import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { dealerRegister, clearDealerError } from '../../redux/slices/dealerAuthSlice';
import dealerAPI from '../../services/dealerAPI';
import {
  FiArrowRight, FiArrowLeft, FiCheck, FiBriefcase,
  FiUpload, FiFile, FiX, FiEye, FiEyeOff,
} from 'react-icons/fi';
import Logo from '../../components/ui/Logo';

// ── Constants ─────────────────────────────────────────────────────────────────

const DRAFT_KEY = 'metro_dealer_draft';

const STEPS = [
  { id: 'business',  label: 'Business',  subtitle: 'Your business details' },
  { id: 'owner',     label: 'Contact',   subtitle: 'Owner & contact info' },
  { id: 'address',   label: 'Address',   subtitle: 'Business address' },
  { id: 'legal',     label: 'Legal',     subtitle: 'Tax & legal info' },
  { id: 'account',   label: 'Account',   subtitle: 'Set your password' },
  { id: 'documents', label: 'Documents', subtitle: 'Upload KYC documents' },
];

const CATEGORIES = [
  { value: 'appliances',  label: 'Home Appliances' },
  { value: 'electronics', label: 'Consumer Electronics' },
  { value: 'furniture',   label: 'Furniture' },
  { value: 'hardware',    label: 'Hardware & Tools' },
  { value: 'home_decor',  label: 'Home Decor' },
  { value: 'kitchen',     label: 'Kitchen Accessories' },
  { value: 'lighting',    label: 'Lighting' },
  { value: 'plumbing',    label: 'Plumbing' },
  { value: 'sanitary',    label: 'Sanitary Ware' },
  { value: 'multi_brand', label: 'Multi-Brand' },
  { value: 'other',       label: 'Other' },
];

const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra',
  'Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim',
  'Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Delhi','Jammu & Kashmir','Ladakh','Chandigarh','Puducherry',
  'Andaman & Nicobar Islands','Dadra & Nagar Haveli','Daman & Diu','Lakshadweep',
];

const DOCS = [
  { key: 'gstCertificate',  label: 'GST Certificate',   required: true },
  { key: 'panCard',         label: 'PAN Card',           required: true },
  { key: 'shopLicense',     label: 'Shop License',       required: false },
  { key: 'visitingCard',    label: 'Visiting Card',      required: false },
  { key: 'storefrontPhoto', label: 'Storefront Photo',   required: false },
];

const BLANK_FORM = {
  businessName: '', businessCategory: '', dealerType: '', yearsInBusiness: '', website: '',
  ownerName: '', email: '', phone: '', alternatePhone: '',
  addressLine1: '', addressLine2: '', city: '', district: '', state: '', pincode: '',
  gstNumber: '', panNumber: '',
  password: '', confirmPassword: '',
};

// ── Input component ───────────────────────────────────────────────────────────

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="label">{label}{required && <span style={{ color: 'var(--accent)' }}>*</span>}</label>
      {children}
      {error && <p className="text-red-500 text-[11px] mt-1 font-medium">{error}</p>}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function DealerRegister() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const { loading, error, token, dealer } = useSelector(s => s.dealerAuth);

  const [step,      setStep]      = useState(0);
  const [form,      setForm]      = useState(BLANK_FORM);
  const [errors,    setErrors]    = useState({});
  const [showPwd,   setShowPwd]   = useState(false);
  const [declared,  setDeclared]  = useState(false);
  const [docUploads, setDocUploads] = useState({});
  const [docLoading, setDocLoading] = useState({});
  const [docErrors,  setDocErrors]  = useState({});

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setForm(f => ({ ...f, ...parsed }));
      }
    } catch { /* ignore */ }
  }, []);

  // Autosave draft (exclude passwords)
  useEffect(() => {
    const { password, confirmPassword, ...safe } = form;
    localStorage.setItem(DRAFT_KEY, JSON.stringify(safe));
  }, [form]);

  // After registration, move to document upload step (step 5)
  useEffect(() => {
    if (token && step < 5) {
      setStep(5);
    }
  }, [token]);

  useEffect(() => () => dispatch(clearDealerError()), [dispatch]);

  const set = useCallback((key) => (e) => {
    const val = e.target?.value ?? e;
    setForm(f => ({ ...f, [key]: val }));
    setErrors(err => ({ ...err, [key]: '' }));
  }, []);

  // ── Validation per step ────────────────────────────────────────────────────

  const validateStep = (s) => {
    const e = {};
    if (s === 0) {
      if (!form.businessName.trim())      e.businessName     = 'Business name is required';
      if (!form.businessCategory)         e.businessCategory = 'Select a business category';
      if (!form.dealerType)               e.dealerType       = 'Select dealer type';
    }
    if (s === 1) {
      if (!form.ownerName.trim())         e.ownerName = 'Owner name is required';
      if (!/\S+@\S+\.\S+/.test(form.email)) e.email  = 'Enter a valid email';
      if (!/^[6-9]\d{9}$/.test(form.phone)) e.phone  = 'Enter a valid 10-digit mobile number';
    }
    if (s === 2) {
      if (!form.addressLine1.trim())      e.addressLine1 = 'Address is required';
      if (!form.city.trim())              e.city         = 'City is required';
      if (!form.state)                    e.state        = 'Select a state';
      if (!/^\d{6}$/.test(form.pincode)) e.pincode      = 'Enter a valid 6-digit pincode';
    }
    if (s === 3) {
      if (!/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/.test(form.gstNumber.toUpperCase()))
        e.gstNumber = 'Invalid GST number (e.g. 22AAAAA0000A1Z5)';
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(form.panNumber.toUpperCase()))
        e.panNumber = 'Invalid PAN (e.g. ABCDE1234F)';
    }
    if (s === 4) {
      if (form.password.length < 8)          e.password        = 'Password must be at least 8 characters';
      if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
      if (!declared)                         e.declared        = 'You must agree to the terms';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    if (step === 4) {
      // Submit registration
      const { confirmPassword, ...payload } = form;
      dispatch(dealerRegister({
        ...payload,
        gstNumber:        payload.gstNumber.toUpperCase(),
        panNumber:        payload.panNumber.toUpperCase(),
        yearsInBusiness:  Number(payload.yearsInBusiness) || 0,
      }));
    } else {
      setStep(s => s + 1);
    }
  };

  // ── Document Upload ────────────────────────────────────────────────────────

  const handleDocUpload = async (docKey, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setDocErrors(e => ({ ...e, [docKey]: 'Only image files are allowed' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setDocErrors(e => ({ ...e, [docKey]: 'File must be under 5MB' }));
      return;
    }
    setDocErrors(e => ({ ...e, [docKey]: '' }));
    setDocLoading(l => ({ ...l, [docKey]: true }));

    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await dealerAPI.post(`/dealer/documents/${docKey}`, fd);
      setDocUploads(u => ({ ...u, [docKey]: data.document?.url || URL.createObjectURL(file) }));
    } catch (err) {
      setDocErrors(e => ({ ...e, [docKey]: err.response?.data?.message || 'Upload failed' }));
    } finally {
      setDocLoading(l => ({ ...l, [docKey]: false }));
    }
  };

  const skipDocuments = () => {
    localStorage.removeItem(DRAFT_KEY);
    navigate('/dealer/dashboard');
  };

  // ── Progress indicator ─────────────────────────────────────────────────────

  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold uppercase tracking-[0.15em]" style={{ color: 'var(--text-3)' }}>
          Step {Math.min(step + 1, STEPS.length)} of {STEPS.length}
        </span>
        <span className="text-[11px] font-bold" style={{ color: 'var(--accent)' }}>
          {STEPS[Math.min(step, STEPS.length - 1)]?.label}
        </span>
      </div>
      <div className="flex gap-1">
        {STEPS.map((s, i) => (
          <div
            key={s.id}
            className="h-1 flex-1 rounded-full transition-all duration-300"
            style={{ background: i <= step ? 'var(--accent)' : 'var(--border)' }}
          />
        ))}
      </div>
      <p className="text-[12px] mt-2" style={{ color: 'var(--text-4)' }}>
        {STEPS[Math.min(step, STEPS.length - 1)]?.subtitle}
      </p>
    </div>
  );

  // ── Step renderers ─────────────────────────────────────────────────────────

  const renderStep0 = () => (
    <div className="space-y-4">
      <Field label="Business Name" required error={errors.businessName}>
        <input value={form.businessName} onChange={set('businessName')} placeholder="Metro Electronics Pvt Ltd" className={`input ${errors.businessName ? 'input-error' : ''}`} />
      </Field>
      <Field label="Business Category" required error={errors.businessCategory}>
        <select value={form.businessCategory} onChange={set('businessCategory')} className={`input ${errors.businessCategory ? 'input-error' : ''}`}>
          <option value="">Select category</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </Field>
      <Field label="Dealer Type" required error={errors.dealerType}>
        <select value={form.dealerType} onChange={set('dealerType')} className={`input ${errors.dealerType ? 'input-error' : ''}`}>
          <option value="">Select type</option>
          <option value="retail">Retail Dealer</option>
          <option value="wholesale">Wholesale Dealer</option>
          <option value="distributor">Distributor</option>
        </select>
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Years in Business">
          <input type="number" min="0" max="100" value={form.yearsInBusiness} onChange={set('yearsInBusiness')} placeholder="5" className="input" />
        </Field>
        <Field label="Website (optional)">
          <input value={form.website} onChange={set('website')} placeholder="https://yoursite.com" className="input" />
        </Field>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-4">
      <Field label="Owner / Proprietor Name" required error={errors.ownerName}>
        <input value={form.ownerName} onChange={set('ownerName')} placeholder="Full legal name" className={`input ${errors.ownerName ? 'input-error' : ''}`} />
      </Field>
      <Field label="Email Address" required error={errors.email}>
        <input type="email" value={form.email} onChange={set('email')} placeholder="owner@business.com" className={`input ${errors.email ? 'input-error' : ''}`} />
      </Field>
      <Field label="Mobile Number" required error={errors.phone}>
        <input value={form.phone} onChange={set('phone')} placeholder="9876543210" maxLength={10} className={`input ${errors.phone ? 'input-error' : ''}`} />
      </Field>
      <Field label="Alternate Phone (optional)">
        <input value={form.alternatePhone} onChange={set('alternatePhone')} placeholder="9876543211" maxLength={10} className="input" />
      </Field>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <Field label="Address Line 1" required error={errors.addressLine1}>
        <input value={form.addressLine1} onChange={set('addressLine1')} placeholder="Shop / Building / Street" className={`input ${errors.addressLine1 ? 'input-error' : ''}`} />
      </Field>
      <Field label="Address Line 2 (optional)">
        <input value={form.addressLine2} onChange={set('addressLine2')} placeholder="Area / Landmark" className="input" />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="City" required error={errors.city}>
          <input value={form.city} onChange={set('city')} placeholder="Mumbai" className={`input ${errors.city ? 'input-error' : ''}`} />
        </Field>
        <Field label="District">
          <input value={form.district} onChange={set('district')} placeholder="Mumbai Suburban" className="input" />
        </Field>
      </div>
      <Field label="State" required error={errors.state}>
        <select value={form.state} onChange={set('state')} className={`input ${errors.state ? 'input-error' : ''}`}>
          <option value="">Select state</option>
          {STATES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Pincode" required error={errors.pincode}>
        <input value={form.pincode} onChange={set('pincode')} placeholder="400001" maxLength={6} className={`input ${errors.pincode ? 'input-error' : ''}`} />
      </Field>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div
        className="px-4 py-3 text-xs"
        style={{ background: 'rgba(255,122,0,0.06)', border: '1px solid rgba(255,122,0,0.2)', borderRadius: 'var(--radius-sm)', color: 'var(--text-3)', lineHeight: 1.6 }}
      >
        Your GST and PAN details are verified against government records. Please ensure they are accurate.
      </div>
      <Field label="GST Number" required error={errors.gstNumber}>
        <input
          value={form.gstNumber}
          onChange={e => set('gstNumber')({ target: { value: e.target.value.toUpperCase() } })}
          placeholder="22AAAAA0000A1Z5"
          maxLength={15}
          className={`input uppercase ${errors.gstNumber ? 'input-error' : ''}`}
        />
      </Field>
      <Field label="PAN Number" required error={errors.panNumber}>
        <input
          value={form.panNumber}
          onChange={e => set('panNumber')({ target: { value: e.target.value.toUpperCase() } })}
          placeholder="ABCDE1234F"
          maxLength={10}
          className={`input uppercase ${errors.panNumber ? 'input-error' : ''}`}
        />
      </Field>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-4">
      <Field label="Password" required error={errors.password}>
        <div className="relative">
          <input
            type={showPwd ? 'text' : 'password'}
            value={form.password}
            onChange={set('password')}
            placeholder="Minimum 8 characters"
            className={`input pr-11 ${errors.password ? 'input-error' : ''}`}
          />
          <button type="button" onClick={() => setShowPwd(p => !p)} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-4)' }}>
            {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
          </button>
        </div>
      </Field>
      <Field label="Confirm Password" required error={errors.confirmPassword}>
        <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" className={`input ${errors.confirmPassword ? 'input-error' : ''}`} />
      </Field>
      <div className="pt-2">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={declared}
            onChange={e => { setDeclared(e.target.checked); setErrors(err => ({ ...err, declared: '' })); }}
            className="mt-0.5 flex-shrink-0"
          />
          <span className="text-[12px] leading-relaxed" style={{ color: 'var(--text-3)' }}>
            I declare that all information provided is accurate and I agree to Metro Appliances{' '}
            <Link to="/terms" style={{ color: 'var(--accent)' }} className="font-semibold hover:underline">Terms</Link> and{' '}
            <Link to="/privacy" style={{ color: 'var(--accent)' }} className="font-semibold hover:underline">Privacy Policy</Link>.
            I understand my application will be reviewed by the admin team.
          </span>
        </label>
        {errors.declared && <p className="text-red-500 text-[11px] mt-1 font-medium">{errors.declared}</p>}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-5">
      <div
        className="px-4 py-3 text-xs"
        style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: 'var(--radius-sm)', color: '#166534', lineHeight: 1.6 }}
      >
        <strong>Account created!</strong> Upload your KYC documents to speed up approval. You can also do this later from your dashboard.
      </div>

      {DOCS.map(doc => (
        <div key={doc.key}>
          <div className="flex items-center justify-between mb-2">
            <span className="label !mb-0">
              {doc.label}{doc.required && <span style={{ color: 'var(--accent)' }}>*</span>}
            </span>
            {docUploads[doc.key] && (
              <span className="text-[11px] font-semibold" style={{ color: '#16A34A' }}>
                <FiCheck size={11} className="inline mr-1" />Uploaded
              </span>
            )}
          </div>

          {docUploads[doc.key] ? (
            <div className="relative overflow-hidden" style={{ borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', height: 100 }}>
              <img src={docUploads[doc.key]} alt={doc.label} className="w-full h-full object-cover" />
            </div>
          ) : (
            <label
              className="flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
              style={{ border: `2px dashed ${docErrors[doc.key] ? '#EF4444' : 'var(--border)'}`, borderRadius: 'var(--radius-sm)', padding: '20px', background: 'var(--bg)' }}
            >
              {docLoading[doc.key] ? (
                <span className="w-5 h-5 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
              ) : (
                <>
                  <FiUpload size={20} style={{ color: 'var(--text-4)' }} />
                  <span className="text-[12px]" style={{ color: 'var(--text-4)' }}>Click to upload (JPG/PNG/WebP, max 5MB)</span>
                </>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleDocUpload(doc.key, e.target.files[0])}
                disabled={docLoading[doc.key]}
              />
            </label>
          )}
          {docErrors[doc.key] && <p className="text-red-500 text-[11px] mt-1 font-medium">{docErrors[doc.key]}</p>}
        </div>
      ))}
    </div>
  );

  const RENDERERS = [renderStep0, renderStep1, renderStep2, renderStep3, renderStep4, renderStep5];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)', fontFamily: 'var(--font-body)' }}>

      {/* Left panel */}
      <div className="hidden lg:flex lg:w-2/5 flex-col justify-between p-14" style={{ background: 'var(--text)' }}>
        <Logo imageClass="h-10 w-auto brightness-0 invert" />
        <div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 text-[10px] font-bold uppercase tracking-[0.2em]"
            style={{ background: 'rgba(255,122,0,0.15)', color: 'var(--accent)', borderRadius: 'var(--radius-sm)' }}
          >
            <FiBriefcase size={11} /> Dealer Portal
          </div>
          <h2 className="text-white leading-tight mb-6" style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.8rem', letterSpacing: '-0.03em' }}>
            Become a<br />Metro Dealer.
          </h2>
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 mb-3">
              <div
                className="w-6 h-6 flex items-center justify-center flex-shrink-0 text-[11px] font-bold"
                style={{
                  borderRadius: '50%',
                  background: i < step ? 'var(--accent)' : i === step ? 'rgba(255,122,0,0.3)' : 'rgba(255,255,255,0.1)',
                  color: i <= step ? '#fff' : 'rgba(255,255,255,0.4)',
                }}
              >
                {i < step ? <FiCheck size={11} strokeWidth={3} /> : i + 1}
              </div>
              <span style={{ color: i === step ? '#fff' : 'rgba(255,255,255,0.4)', fontSize: '13px', fontWeight: i === step ? 600 : 400 }}>
                {s.label}
              </span>
            </div>
          ))}
        </div>
        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '11px' }}>
          © {new Date().getFullYear()} Metro Appliances. All rights reserved.
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="lg:hidden mb-8 flex justify-center">
          <Logo imageClass="h-10 w-auto" />
        </div>

        <div className="w-full max-w-md">
          <ProgressBar />

          <h1 className="text-2xl font-extrabold mb-6" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.03em' }}>
            {STEPS[Math.min(step, STEPS.length - 1)]?.subtitle}
          </h1>

          {/* API error */}
          {error && step === 4 && (
            <div className="mb-5 px-4 py-3 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 'var(--radius-sm)', color: '#DC2626' }}>
              {error}
            </div>
          )}

          {RENDERERS[step]?.()}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && step < 5 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="flex items-center gap-2 px-5 py-3.5 font-bold text-[12px] uppercase tracking-[0.08em] transition-all"
                style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text-3)', background: 'transparent' }}
              >
                <FiArrowLeft size={14} /> Back
              </button>
            )}

            {step < 5 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2.5 px-6 py-4 text-white font-bold text-[12px] uppercase tracking-[0.1em] transition-all"
                style={{ background: 'var(--text)', borderRadius: 'var(--radius-sm)', opacity: loading ? 0.65 : 1 }}
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating account…</>
                ) : step === 4 ? (
                  <>Create Account <FiArrowRight size={15} strokeWidth={2.5} /></>
                ) : (
                  <>Continue <FiArrowRight size={15} strokeWidth={2.5} /></>
                )}
              </button>
            )}

            {step === 5 && (
              <div className="flex-1 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={skipDocuments}
                  className="w-full flex items-center justify-center gap-2.5 px-6 py-4 text-white font-bold text-[12px] uppercase tracking-[0.1em]"
                  style={{ background: 'var(--text)', borderRadius: 'var(--radius-sm)' }}
                >
                  Go to Dashboard <FiArrowRight size={15} strokeWidth={2.5} />
                </button>
                <p className="text-center text-[11px]" style={{ color: 'var(--text-4)' }}>
                  You can upload documents later from your profile.
                </p>
              </div>
            )}
          </div>

          {step === 0 && (
            <p className="text-center text-[13px] mt-6" style={{ color: 'var(--text-3)' }}>
              Already registered?{' '}
              <Link to="/dealer/login" className="font-bold" style={{ color: 'var(--accent)' }}>Sign in</Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
