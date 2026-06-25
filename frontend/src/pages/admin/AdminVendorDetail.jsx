import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiSlash, FiPlus, FiStar } from 'react-icons/fi';
import api from '../../services/api';
import StatusBadge   from '../../components/shared/StatusBadge';
import MetricCard    from '../../components/shared/MetricCard';
import SectionHeader from '../../components/shared/SectionHeader';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import ConfirmDialog from '../../components/shared/ConfirmDialog';
import { toast } from 'react-toastify';
import { useConfirm } from '../../hooks/useModal';

const fmtDate     = d => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtCurrency = v => `₹${(v || 0).toLocaleString('en-IN')}`;

const InfoRow = ({ label, value }) => (
  <div className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
    <span className="text-xs" style={{ color: 'var(--text-4)' }}>{label}</span>
    <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>{value || '—'}</span>
  </div>
);

export default function AdminVendorDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [data,     setData]    = useState(null);
  const [loading,  setLoading] = useState(true);
  const [error,    setError]   = useState('');
  const [acting,   setActing]  = useState(false);
  const [tab,      setTab]     = useState('overview');
  const { open: confirmOpen, ask, cancel, confirm: runConfirm, loading: confirming, title: confirmTitle, message: confirmMsg } = useConfirm();

  const load = useCallback(() => {
    setLoading(true);
    api.get(`/admin/vendors/${id}`)
      .then(r => setData(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load vendor'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (action) => {
    setActing(true);
    try {
      if (action === 'approve')    await api.put(`/admin/vendors/${id}/approve`);
      if (action === 'blacklist')  await api.put(`/admin/vendors/${id}/blacklist`, { reason: 'Blacklisted by admin' });
      toast.success(`Vendor ${action}d`);
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Action failed'); }
    finally { setActing(false); }
  };

  if (loading) return <LoadingState message="Loading vendor details…" />;
  if (error)   return <ErrorState message={error} onRetry={load} />;

  const { vendor, contacts, addresses, bankAccounts, documents, contracts, categories, ratings } = data || {};

  const TABS = [
    { label: 'Overview',     value: 'overview' },
    { label: 'Contacts',     value: 'contacts' },
    { label: 'Addresses',    value: 'addresses' },
    { label: 'Bank',         value: 'bank' },
    { label: 'Documents',    value: 'documents' },
    { label: 'Contracts',    value: 'contracts' },
    { label: 'Ratings',      value: 'ratings' },
  ];

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/procurement/vendors')} className="p-2 rounded-lg" style={{ background: 'var(--bg-2)' }}>
          <FiArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <h2 className="font-bold text-lg" style={{ color: 'var(--text)', fontFamily: 'Poppins' }}>{vendor?.companyName}</h2>
          <p className="text-xs" style={{ color: 'var(--text-4)' }}>{vendor?.vendorCode}</p>
        </div>
        <StatusBadge status={vendor?.status} />
        {vendor?.status === 'pending_approval' && (
          <button onClick={() => ask({ title: 'Approve Vendor', message: 'Are you sure you want to approve this vendor?', type: 'info', onConfirm: () => handleAction('approve') })}
            disabled={acting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: '#10B981' }}>
            <FiCheck size={12} /> Approve
          </button>
        )}
        {vendor?.status === 'active' && (
          <button onClick={() => ask({ title: 'Blacklist Vendor', message: 'Are you sure you want to blacklist this vendor?', type: 'danger', onConfirm: () => handleAction('blacklist') })}
            disabled={acting}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: '#EF4444' }}>
            <FiSlash size={12} /> Blacklist
          </button>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetricCard label="Total Orders" value={vendor?.totalOrders || 0}     color="#3B82F6" />
        <MetricCard label="Total Spend"  value={fmtCurrency(vendor?.totalSpend)} color="#10B981" isText />
        <MetricCard label="Rating"       value={vendor?.overallRating ? `${vendor.overallRating}/5` : '—'} color="#F59E0B" isText />
        <MetricCard label="On-Time"      value={vendor?.onTimeDeliveryRate ? `${vendor.onTimeDeliveryRate}%` : '—'} color="#8B5CF6" isText />
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold"
            style={{ background: tab === t.value ? '#FF7A00' : 'var(--bg-2)', color: tab === t.value ? '#fff' : 'var(--text-4)' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl p-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        {tab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-4)' }}>Company Info</h4>
              <InfoRow label="Type"          value={vendor?.vendorType} />
              <InfoRow label="GST Number"    value={vendor?.gstNumber} />
              <InfoRow label="PAN Number"    value={vendor?.panNumber} />
              <InfoRow label="MSME Number"   value={vendor?.msmeNumber} />
              <InfoRow label="CIN Number"    value={vendor?.cinNumber} />
              <InfoRow label="Website"       value={vendor?.website} />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--text-4)' }}>Payment</h4>
              <InfoRow label="Email"         value={vendor?.email} />
              <InfoRow label="Phone"         value={vendor?.phone} />
              <InfoRow label="Payment Terms" value={vendor?.paymentTerms} />
              <InfoRow label="Credit Days"   value={vendor?.creditDays ? `${vendor.creditDays} days` : undefined} />
              <InfoRow label="Currency"      value={vendor?.currency} />
              <InfoRow label="Approved"      value={fmtDate(vendor?.approvedAt)} />
            </div>
          </div>
        )}

        {tab === 'contacts' && (
          <div className="space-y-2">
            {contacts?.length === 0 && <p className="text-xs text-center py-6" style={{ color: 'var(--text-4)' }}>No contacts added</p>}
            {contacts?.map(c => (
              <div key={c._id} className="p-3 rounded-xl" style={{ background: 'var(--bg-2)' }}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{c.name} {c.isPrimary && <span className="text-xs ml-1" style={{ color: '#FF7A00' }}>Primary</span>}</p>
                  <span className="text-xs" style={{ color: 'var(--text-4)' }}>{c.designation}</span>
                </div>
                <p className="text-xs mt-1" style={{ color: 'var(--text-4)' }}>{c.email} · {c.mobile || c.phone}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'addresses' && (
          <div className="space-y-2">
            {addresses?.length === 0 && <p className="text-xs text-center py-6" style={{ color: 'var(--text-4)' }}>No addresses added</p>}
            {addresses?.map(a => (
              <div key={a._id} className="p-3 rounded-xl" style={{ background: 'var(--bg-2)' }}>
                <p className="font-semibold text-xs capitalize" style={{ color: '#FF7A00' }}>{a.addressType}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>{a.addressLine1}{a.addressLine2 ? `, ${a.addressLine2}` : ''}</p>
                <p className="text-xs" style={{ color: 'var(--text-4)' }}>{a.city}, {a.state} {a.pincode}, {a.country}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'bank' && (
          <div className="space-y-2">
            {bankAccounts?.length === 0 && <p className="text-xs text-center py-6" style={{ color: 'var(--text-4)' }}>No bank accounts added</p>}
            {bankAccounts?.map(b => (
              <div key={b._id} className="p-3 rounded-xl" style={{ background: 'var(--bg-2)' }}>
                <div className="flex items-center justify-between mb-1">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{b.bankName}</p>
                  {b.isPrimary && <span className="text-xs font-bold" style={{ color: '#FF7A00' }}>Primary</span>}
                </div>
                <InfoRow label="Account Name"   value={b.accountName} />
                <InfoRow label="Account Number" value={b.accountNumber} />
                <InfoRow label="IFSC"           value={b.ifscCode} />
                <InfoRow label="Type"           value={b.accountType} />
              </div>
            ))}
          </div>
        )}

        {tab === 'documents' && (
          <div className="space-y-2">
            {documents?.length === 0 && <p className="text-xs text-center py-6" style={{ color: 'var(--text-4)' }}>No documents added</p>}
            {documents?.map(d => (
              <div key={d._id} className="p-3 rounded-xl flex items-center justify-between" style={{ background: 'var(--bg-2)' }}>
                <div>
                  <p className="font-semibold text-sm capitalize" style={{ color: 'var(--text)' }}>{d.documentType.replace(/_/g, ' ')}</p>
                  <p className="text-xs" style={{ color: 'var(--text-4)' }}>{d.documentNumber} {d.expiryDate ? `· Exp: ${fmtDate(d.expiryDate)}` : ''}</p>
                </div>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        )}

        {tab === 'contracts' && (
          <div className="space-y-2">
            {contracts?.length === 0 && <p className="text-xs text-center py-6" style={{ color: 'var(--text-4)' }}>No contracts added</p>}
            {contracts?.map(c => (
              <div key={c._id} className="p-3 rounded-xl" style={{ background: 'var(--bg-2)' }}>
                <div className="flex justify-between mb-1">
                  <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{c.title}</p>
                  <StatusBadge status={c.status} />
                </div>
                <p className="text-xs" style={{ color: 'var(--text-4)' }}>{c.contractNumber} · {c.contractType} · {fmtDate(c.startDate)} – {fmtDate(c.endDate)}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'ratings' && (
          <div className="space-y-2">
            {ratings?.length === 0 && <p className="text-xs text-center py-6" style={{ color: 'var(--text-4)' }}>No ratings yet</p>}
            {ratings?.map(r => (
              <div key={r._id} className="p-3 rounded-xl" style={{ background: 'var(--bg-2)' }}>
                <div className="flex items-center gap-1 mb-1">
                  {[1,2,3,4,5].map(s => (
                    <FiStar key={s} size={14} fill={s <= r.overallRating ? '#F59E0B' : 'none'} color={s <= r.overallRating ? '#F59E0B' : 'var(--text-4)'} />
                  ))}
                  <span className="text-xs ml-2" style={{ color: 'var(--text-4)' }}>by {r.ratedByName} · {fmtDate(r.createdAt)}</span>
                </div>
                {r.comments && <p className="text-xs" style={{ color: 'var(--text)' }}>{r.comments}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMsg}
        onConfirm={runConfirm}
        onCancel={cancel}
        loading={confirming}
      />
    </div>
  );
}
