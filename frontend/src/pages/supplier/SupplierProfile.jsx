import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import supplierAPI from '../../services/supplierAPI';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState  from '../../components/shared/LoadingState';
import { toast } from 'react-toastify';

export default function SupplierProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({ name: '', phone: '' });

  useEffect(() => {
    supplierAPI.get('/supplier/profile')
      .then(r => {
        setProfile(r.data.data);
        setForm({ name: r.data.data.name || '', phone: r.data.data.phone || '' });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await supplierAPI.put('/supplier/profile', form);
      toast.success('Profile updated');
    } catch (err) { toast.error(err.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingState message="Loading profile…" />;

  return (
    <div className="p-6 space-y-5 max-w-xl">
      <SectionHeader title="My Profile" subtitle="Update contact details" />

      <div className="rounded-2xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        <div className="mb-4 pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--text-4)' }}>Email (cannot change)</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>{profile?.email}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-4)' }}>Name</label>
            <input
              type="text" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-4)' }}>Phone</label>
            <input
              type="tel" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border text-sm outline-none"
              style={{ borderColor: 'var(--border)', background: 'var(--bg-2)', color: 'var(--text)' }}
            />
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: '#FF7A00' }}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
