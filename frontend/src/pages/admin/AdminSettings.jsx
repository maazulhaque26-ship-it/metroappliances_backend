import React, { useEffect, useState, useRef } from 'react';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';
import { imgSrc } from '../../utils/imageHelper';
import {
  FiSave, FiUpload, FiGlobe, FiPhone, FiMail, FiMapPin,
  FiInstagram, FiTwitter, FiYoutube, FiShoppingBag, FiSearch,
  FiAlertTriangle, FiToggleLeft, FiToggleRight, FiSettings,
  FiPlus, FiTrash2, FiLink,
} from 'react-icons/fi';

const Section = ({ title, icon: Icon, children }) => (
  <div className="bg-white border border-[var(--border)] p-8 space-y-6">
    <div className="flex items-center gap-3 pb-4 border-b border-[var(--border)]">
      <div className="w-10 h-10 bg-[var(--bg)] flex items-center justify-center">
        <Icon size={18} className="text-[var(--text)]" />
      </div>
      <h2 className="text-xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>{title}</h2>
    </div>
    {children}
  </div>
);

function SettingField({ label, name, type = 'text', placeholder, value, onChange, hint }) {
  return (
    <div>
      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-2">{label}</label>
      <input
        type={type}
        name={name}
        placeholder={placeholder || label}
        value={value || ''}
        onChange={e => onChange(name, e.target.value)}
        className="w-full bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-sm outline-none focus:border-[#111111]"
      />
      {hint && <p className="text-[var(--text-3)] text-xs font-medium mt-2">{hint}</p>}
    </div>
  );
}

export default function AdminSettings() {
  const [form,    setForm]    = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState({});
  const [previews, setPreviews] = useState({ logo: '', transparentLogo: '', darkLogo: '', lightLogo: '', favicon: '' });
  
  const fileRefs = {
    logo: useRef(null),
    transparentLogo: useRef(null),
    darkLogo: useRef(null),
    lightLogo: useRef(null),
    favicon: useRef(null),
  };

  useEffect(() => {
    API.get('/settings')
      .then(({ data }) => {
        setForm(data.settings);
        setPreviews({
          logo: data.settings.storeLogo || '',
          transparentLogo: data.settings.transparentLogo || '',
          darkLogo: data.settings.darkLogo || '',
          lightLogo: data.settings.lightLogo || '',
          favicon: data.settings.storeFavicon || '',
        });
      })
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const handleField = (name, value) => setForm(prev => ({ ...prev, [name]: value }));

  const handleFileChange = (key) => (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFiles(p => ({ ...p, [key]: file }));
    setPreviews(p => ({ ...p, [key]: URL.createObjectURL(file) }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v === null || v === undefined) return;
        if (Array.isArray(v)) { fd.append(k, JSON.stringify(v)); }
        else { fd.append(k, v); }
      });
      Object.entries(files).forEach(([k, v]) => {
        if (v) fd.append(k, v);
      });

      const { data } = await API.put('/admin/settings', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setForm(data.settings);
      setFiles({});
      toast.success('Settings saved');
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  const handleArrayAdd = (key, blank) => setForm(p => ({ ...p, [key]: [...(p[key] || []), blank] }));
  const handleArrayRemove = (key, idx) => setForm(p => ({ ...p, [key]: (p[key] || []).filter((_, i) => i !== idx) }));
  const handleArrayField = (key, idx, field, value) => setForm(p => ({
    ...p, [key]: (p[key] || []).map((item, i) => i === idx ? { ...item, [field]: value } : item),
  }));

  if (loading || !form) {
    return (
      <AdminLayout>
        <div className="max-w-4xl mx-auto space-y-6">
          {[1,2,3,4].map(i => <div key={i} className="animate-pulse h-48 bg-white border border-[var(--border)]" />)}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>Store Settings</h1>
            <p className="text-[var(--text-3)] text-sm font-medium mt-1">Manage your store configuration</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-3 bg-[var(--text)] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-50">
            <FiSave size={16} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>

        {/* Store Branding (Logos & Favicon) */}
        <Section title="Store Branding" icon={FiShoppingBag}>
          <div className="grid sm:grid-cols-2 gap-8 mb-6">
            {[
              { key: 'logo', label: 'Primary Logo', hint: 'PNG, JPG up to 5MB' },
              { key: 'transparentLogo', label: 'Transparent Logo', hint: 'PNG with no background' },
              { key: 'darkLogo', label: 'Dark Logo', hint: 'For light backgrounds' },
              { key: 'lightLogo', label: 'Light Logo', hint: 'For dark backgrounds' },
              { key: 'favicon', label: 'Store Favicon', hint: 'Square PNG/ICO (512x512 recommended)' },
            ].map(({ key, label, hint }) => (
              <div key={key}>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-3">{label}</label>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-[var(--bg)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
                    {previews[key] ? (
                      <img src={previews[key].startsWith('blob:') ? previews[key] : imgSrc({ url: previews[key] })} alt={label} className="w-12 h-12 object-contain" />
                    ) : (
                      <div className="text-[#CCCCCC]">
                        {key === 'favicon' ? <FiGlobe size={24} /> : <FiShoppingBag size={24} />}
                      </div>
                    )}
                  </div>
                  <div>
                    <button onClick={() => fileRefs[key].current?.click()} className="flex items-center gap-2 px-4 py-2 border border-[#111111] text-[var(--text)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--text)] hover:text-white transition-colors">
                      <FiUpload size={14} /> Upload
                    </button>
                    <p className="text-[var(--text-3)] text-xs font-medium mt-2">{hint}</p>
                    <input ref={fileRefs[key]} type="file" accept="image/*" className="hidden" onChange={handleFileChange(key)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid sm:grid-cols-2 gap-6 pt-6 border-t border-[var(--border)]">
            <SettingField label="Store Name"    name="storeName"    value={form.storeName}    onChange={handleField} />
            <SettingField label="Store Tagline" name="storeTagline" value={form.storeTagline} onChange={handleField} />
          </div>
          <SettingField label="Copyright Text" name="copyrightText" value={form.copyrightText} onChange={handleField} />
        </Section>

        {/* Contact */}
        <Section title="Contact Information" icon={FiPhone}>
          <div className="grid sm:grid-cols-2 gap-6">
            <SettingField label="Support Email"  name="email"       type="email" value={form.email}       onChange={handleField} />
            <SettingField label="Phone Number"   name="phone"       type="tel"   value={form.phone}       onChange={handleField} />
          </div>
          <SettingField label="Full Address" name="fullAddress" value={form.fullAddress} onChange={handleField} placeholder="Street, City, State, PIN" />
          <SettingField label="Store Address (Short)" name="storeAddress" value={form.storeAddress} onChange={handleField} />
        </Section>

        {/* Social Media */}
        <Section title="Social Media Links" icon={FiGlobe}>
          <div className="grid sm:grid-cols-2 gap-6">
            <SettingField label="Facebook URL"   name="facebook"   value={form.facebook}   onChange={handleField} placeholder="https://facebook.com/..." />
            <SettingField label="Twitter / X URL" name="twitter"   value={form.twitter}    onChange={handleField} placeholder="https://twitter.com/..." />
            <SettingField label="Instagram URL"  name="instagram"  value={form.instagram}  onChange={handleField} placeholder="https://instagram.com/..." />
            <SettingField label="YouTube URL"    name="youtube"    value={form.youtube}    onChange={handleField} placeholder="https://youtube.com/..." />
            <SettingField label="LinkedIn URL"   name="linkedin"   value={form.linkedin}   onChange={handleField} placeholder="https://linkedin.com/company/..." />
            <SettingField label="Telegram URL"   name="telegram"   value={form.telegram}   onChange={handleField} placeholder="https://t.me/..." />
            <SettingField label="WhatsApp URL"   name="whatsapp"   value={form.whatsapp}   onChange={handleField} placeholder="https://wa.me/91..." hint="Link opens WhatsApp chat — use wa.me format" />
          </div>
        </Section>

        {/* Commerce & Shipping */}
        <Section title="Commerce & Shipping" icon={FiShoppingBag}>
          <div className="grid sm:grid-cols-2 gap-6 mb-6">
            <SettingField label="Currency Symbol" name="currency"          value={form.currency}          onChange={handleField} placeholder="₹" />
            <SettingField label="Tax Rate (%)" name="taxRate" type="number" value={form.taxRate} onChange={handleField} />
          </div>
          <div className="pt-6 border-t border-[var(--border)]">
            <div className="flex items-center justify-between p-4 bg-[var(--bg)] border border-[var(--border)] mb-6">
              <div>
                <p className="font-bold text-[var(--text)] text-sm">Free Shipping Enabled</p>
                <p className="text-xs font-medium text-[var(--text-3)] mt-1">Toggle whether customers can qualify for free shipping</p>
              </div>
              <button
                onClick={() => handleField('freeShippingEnabled', !form.freeShippingEnabled)}
                className={`transition-colors ${form.freeShippingEnabled ? 'text-green-600' : 'text-[#CCCCCC] hover:text-[var(--text)]'}`}
              >
                {form.freeShippingEnabled ? <FiToggleRight size={40} /> : <FiToggleLeft size={40} />}
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <SettingField label="Free Shipping Threshold" name="freeShippingThreshold" type="number" value={form.freeShippingThreshold} onChange={handleField} hint="Minimum order subtotal to qualify" />
              <SettingField label="Standard Shipping Charge" name="shippingCharge" type="number" value={form.shippingCharge} onChange={handleField} hint="Flat fee charged if under threshold" />
            </div>
          </div>
        </Section>

        {/* SEO */}
        <Section title="SEO Settings" icon={FiSearch}>
          <SettingField label="Meta Title"       name="metaTitle"       value={form.metaTitle}       onChange={handleField} />
          <SettingField label="Meta Description" name="metaDescription" value={form.metaDescription} onChange={handleField} />
        </Section>

        {/* Contact CMS */}
        <Section title="Contact Page CMS" icon={FiMapPin}>
          <div className="grid sm:grid-cols-2 gap-6">
            <SettingField label="WhatsApp Number / Link" name="whatsapp" value={form.whatsapp} onChange={handleField} placeholder="https://wa.me/91..." />
            <SettingField label="Google Maps Embed URL" name="mapEmbedUrl" value={form.mapEmbedUrl} onChange={handleField} placeholder="https://maps.google.com/..." />
            <SettingField label="Office Hours" name="officeHours" value={form.officeHours} onChange={handleField} placeholder="Mon–Sat, 9 AM – 6 PM IST" />
            <SettingField label="Holiday Notice" name="holidayNotice" value={form.holidayNotice} onChange={handleField} placeholder="Closed on national holidays" />
          </div>
          <div className="pt-4">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">Branch Offices</label>
              <button type="button" onClick={() => handleArrayAdd('branches', { name: '', address: '', phone: '', hours: '' })}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] hover:opacity-80">
                <FiPlus size={12} /> Add Branch
              </button>
            </div>
            {(form.branches || []).map((b, i) => (
              <div key={i} className="border border-[var(--border)] p-4 mb-3 space-y-3" style={{ borderRadius: 'var(--radius-sm)' }}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">Branch {i + 1}</span>
                  <button type="button" onClick={() => handleArrayRemove('branches', i)} className="text-red-400 hover:text-red-600"><FiTrash2 size={13} /></button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[['name','Branch Name'],['phone','Phone'],['hours','Office Hours'],['address','Address']].map(([field, lbl]) => (
                    <div key={field} className={field === 'address' ? 'col-span-2' : ''}>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)] mb-1">{lbl}</label>
                      <input value={b[field] || ''} onChange={e => handleArrayField('branches', i, field, e.target.value)}
                        className="w-full bg-[var(--bg)] border border-[var(--border)] px-3 py-2.5 text-sm outline-none" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Footer CMS */}
        <Section title="Footer CMS" icon={FiLink}>
          <SettingField label="Footer Tagline" name="footerTagline" value={form.footerTagline} onChange={handleField} placeholder="Exclusive launches, lifestyle tips and special pricing…" />
          {[
            { key: 'footerQuickLinks', label: 'Quick Links' },
            { key: 'footerSupportLinks', label: 'Support Links' },
            { key: 'footerPolicyLinks', label: 'Policy Links' },
          ].map(({ key, label }) => (
            <div key={key} className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-3)]">{label}</label>
                <button type="button" onClick={() => handleArrayAdd(key, { label: '', path: '' })}
                  className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] hover:opacity-80">
                  <FiPlus size={12} /> Add Link
                </button>
              </div>
              {(form[key] || []).map((link, i) => (
                <div key={i} className="flex gap-2 mb-2 items-center">
                  <input value={link.label || ''} onChange={e => handleArrayField(key, i, 'label', e.target.value)}
                    placeholder="Label" className="flex-1 bg-[var(--bg)] border border-[var(--border)] px-3 py-2 text-sm outline-none" />
                  <input value={link.path || ''} onChange={e => handleArrayField(key, i, 'path', e.target.value)}
                    placeholder="/path" className="flex-1 bg-[var(--bg)] border border-[var(--border)] px-3 py-2 text-sm outline-none font-mono" />
                  <button type="button" onClick={() => handleArrayRemove(key, i)} className="text-red-400 hover:text-red-600 flex-shrink-0"><FiTrash2 size={14} /></button>
                </div>
              ))}
              {(!form[key] || form[key].length === 0) && (
                <p className="text-xs text-[var(--text-4)] italic">No links added. Click + Add Link to create one.</p>
              )}
            </div>
          ))}
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone" icon={FiAlertTriangle}>
          <div className={`flex items-center justify-between p-6 border ${form.maintenanceMode ? 'bg-red-50 border-red-200' : 'bg-[var(--bg)] border-[var(--border)]'}`}>
            <div>
              <p className={`font-bold ${form.maintenanceMode ? 'text-red-700' : 'text-[var(--text)]'}`}>Maintenance Mode</p>
              <p className={`text-sm font-medium mt-1 ${form.maintenanceMode ? 'text-red-600' : 'text-[var(--text-3)]'}`}>When enabled, the store shows a maintenance page to visitors</p>
            </div>
            <button
              onClick={() => handleField('maintenanceMode', !form.maintenanceMode)}
              className={`transition-colors ${form.maintenanceMode ? 'text-red-600' : 'text-[#CCCCCC] hover:text-[var(--text)]'}`}>
              {form.maintenanceMode
                ? <FiToggleRight size={40} />
                : <FiToggleLeft  size={40} />
              }
            </button>
          </div>
          {form.maintenanceMode && (
            <div className="flex items-center gap-3 px-6 py-4 bg-red-600 text-white font-bold text-sm">
              <FiAlertTriangle size={18} />
              <p>Maintenance mode is ON — store is hidden from public visitors</p>
            </div>
          )}
        </Section>

        {/* Save button (bottom) */}
        <div className="flex justify-end pt-4">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-8 py-4 bg-[var(--text)] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#333333] transition-colors disabled:opacity-50">
            <FiSave size={18} /> {saving ? 'Saving…' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
