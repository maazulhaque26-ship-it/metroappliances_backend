import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../../services/api';
import AdminLayout from './AdminLayout';
import { toast } from 'react-toastify';
import {
  FiArrowLeft, FiCheck, FiX, FiAlertTriangle, FiCheckCircle,
  FiExternalLink, FiEdit2, FiSave,
} from 'react-icons/fi';

const STATUS_CHIP = {
  pending:   { bg: 'rgba(217,119,6,0.1)',  color: '#D97706', label: 'Pending' },
  approved:  { bg: 'rgba(22,163,74,0.1)',  color: '#16A34A', label: 'Approved' },
  rejected:  { bg: 'rgba(220,38,38,0.1)',  color: '#DC2626', label: 'Rejected' },
  suspended: { bg: 'rgba(124,58,237,0.1)', color: '#7C3AED', label: 'Suspended' },
};

const KYC_OPTS = ['pending', 'submitted', 'verified', 'rejected'];

const DOCS = [
  { key: 'gstCertificate',  label: 'GST Certificate' },
  { key: 'panCard',         label: 'PAN Card' },
  { key: 'shopLicense',     label: 'Shop License' },
  { key: 'visitingCard',    label: 'Visiting Card' },
  { key: 'storefrontPhoto', label: 'Storefront Photo' },
];

export default function AdminDealerDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [dealer,      setDealer]      = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [actioning,   setActioning]   = useState('');
  const [editRemarks, setEditRemarks] = useState(false);
  const [remarks,     setRemarks]     = useState('');
  const [kycStatus,   setKycStatus]   = useState('');
  const [reason,      setReason]      = useState('');
  const [showReject,  setShowReject]  = useState(false);
  const [showSuspend, setShowSuspend] = useState(false);

  const fetchDealer = async () => {
    try {
      setLoading(true);
      const { data } = await API.get(`/admin/dealers/${id}`);
      setDealer(data.dealer);
      setRemarks(data.dealer.remarks || '');
      setKycStatus(data.dealer.kycStatus || 'pending');
    } catch {
      toast.error('Failed to load dealer');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDealer(); }, [id]);

  const action = async (endpoint, body = {}) => {
    try {
      setActioning(endpoint);
      const { data } = await API.put(`/admin/dealers/${id}/${endpoint}`, body);
      setDealer(data.dealer);
      toast.success(`Dealer ${endpoint}d successfully`);
      setShowReject(false);
      setShowSuspend(false);
      setReason('');
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${endpoint} dealer`);
    } finally {
      setActioning('');
    }
  };

  const saveRemarks = async () => {
    try {
      setActioning('remarks');
      const { data } = await API.put(`/admin/dealers/${id}/remarks`, { remarks, kycStatus });
      setDealer(data.dealer);
      setEditRemarks(false);
      toast.success('Remarks saved');
    } catch {
      toast.error('Failed to save remarks');
    } finally {
      setActioning('');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <span className="w-8 h-8 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!dealer) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-[var(--text-3)]">Dealer not found</p>
        </div>
      </AdminLayout>
    );
  }

  const statusCfg = STATUS_CHIP[dealer.status] || STATUS_CHIP.pending;

  const InfoRow = ({ label, value }) => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
      <span className="text-[11px] font-bold uppercase tracking-widest w-48 flex-shrink-0" style={{ color: 'var(--text-4)' }}>{label}</span>
      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{value || '—'}</span>
    </div>
  );

  return (
    <AdminLayout>
      <div className="space-y-8 max-w-5xl">
        {/* Back + Header */}
        <div>
          <button
            onClick={() => navigate('/admin/dealers')}
            className="flex items-center gap-2 text-sm font-semibold mb-4 hover:text-[var(--accent)]"
            style={{ color: 'var(--text-3)' }}
          >
            <FiArrowLeft size={14} /> All Dealers
          </button>
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.15em] mb-1" style={{ color: 'var(--accent)' }}>
                {dealer.dealerCode}
              </p>
              <h1 className="text-3xl font-extrabold text-[var(--text)]" style={{ fontFamily: 'var(--font-display)' }}>
                {dealer.businessName}
              </h1>
              <p className="text-sm text-[var(--text-3)] mt-1">{dealer.ownerName} · {dealer.email} · {dealer.phone}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-3 py-1.5 text-[12px] font-bold rounded-full" style={{ background: statusCfg.bg, color: statusCfg.color }}>
                {statusCfg.label}
              </span>
              <span className="px-3 py-1.5 text-[12px] font-bold rounded-full" style={{ background: 'rgba(59,130,246,0.08)', color: '#2563EB' }}>
                KYC: {dealer.kycStatus?.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3">
          {dealer.status !== 'approved' && dealer.status !== 'suspended' && (
            <button
              onClick={() => action('approve')}
              disabled={!!actioning}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: '#16A34A', borderRadius: 'var(--radius-sm)', opacity: actioning ? 0.65 : 1 }}
            >
              {actioning === 'approve' ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <FiCheck size={14} />}
              Approve
            </button>
          )}
          {dealer.status === 'approved' && (
            <button
              onClick={() => setShowSuspend(true)}
              disabled={!!actioning}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: '#7C3AED', borderRadius: 'var(--radius-sm)', opacity: actioning ? 0.65 : 1 }}
            >
              <FiAlertTriangle size={14} /> Suspend
            </button>
          )}
          {dealer.status === 'suspended' && (
            <button
              onClick={() => action('activate')}
              disabled={!!actioning}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white"
              style={{ background: '#16A34A', borderRadius: 'var(--radius-sm)', opacity: actioning ? 0.65 : 1 }}
            >
              <FiCheckCircle size={14} /> Re-activate
            </button>
          )}
          {dealer.status !== 'rejected' && (
            <button
              onClick={() => setShowReject(true)}
              disabled={!!actioning}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold"
              style={{ border: '1px solid #DC2626', color: '#DC2626', background: 'transparent', borderRadius: 'var(--radius-sm)', opacity: actioning ? 0.65 : 1 }}
            >
              <FiX size={14} /> Reject
            </button>
          )}
        </div>

        {/* Reject modal */}
        {showReject && (
          <div className="p-5 border" style={{ border: '1px solid rgba(220,38,38,0.3)', background: 'rgba(220,38,38,0.04)', borderRadius: 'var(--radius-sm)' }}>
            <p className="font-bold text-sm mb-3" style={{ color: '#DC2626' }}>Reason for rejection</p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="Explain why this application is being rejected…"
              className="w-full border border-[var(--border)] p-3 text-sm outline-none rounded mb-3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => action('reject', { reason })}
                className="px-4 py-2 text-sm font-bold text-white"
                style={{ background: '#DC2626', borderRadius: 'var(--radius-sm)' }}
              >
                Confirm Rejection
              </button>
              <button onClick={() => { setShowReject(false); setReason(''); }} className="px-4 py-2 text-sm font-bold" style={{ color: 'var(--text-3)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Suspend modal */}
        {showSuspend && (
          <div className="p-5 border" style={{ border: '1px solid rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.04)', borderRadius: 'var(--radius-sm)' }}>
            <p className="font-bold text-sm mb-3" style={{ color: '#7C3AED' }}>Reason for suspension</p>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder="Why is this account being suspended?"
              className="w-full border border-[var(--border)] p-3 text-sm outline-none rounded mb-3"
            />
            <div className="flex gap-3">
              <button
                onClick={() => action('suspend', { reason })}
                className="px-4 py-2 text-sm font-bold text-white"
                style={{ background: '#7C3AED', borderRadius: 'var(--radius-sm)' }}
              >
                Confirm Suspension
              </button>
              <button onClick={() => { setShowSuspend(false); setReason(''); }} className="px-4 py-2 text-sm font-bold" style={{ color: 'var(--text-3)' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Details */}
          <div className="lg:col-span-2 space-y-6">

            {/* Business Info */}
            <section className="bg-white border p-6" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <h2 className="font-extrabold text-base mb-4" style={{ color: 'var(--text)' }}>Business Information</h2>
              <InfoRow label="Business Name"  value={dealer.businessName} />
              <InfoRow label="Category"       value={dealer.businessCategory?.replace(/_/g, ' ')} />
              <InfoRow label="Dealer Type"    value={dealer.dealerType?.charAt(0).toUpperCase() + dealer.dealerType?.slice(1)} />
              <InfoRow label="Years in Biz"   value={dealer.yearsInBusiness ? `${dealer.yearsInBusiness} year(s)` : null} />
              <InfoRow label="Website"        value={dealer.website} />
              <InfoRow label="GST Number"     value={dealer.gstNumber} />
              <InfoRow label="PAN Number"     value={dealer.panNumber} />
            </section>

            {/* Owner & Contact */}
            <section className="bg-white border p-6" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <h2 className="font-extrabold text-base mb-4" style={{ color: 'var(--text)' }}>Owner & Contact</h2>
              <InfoRow label="Owner Name"     value={dealer.ownerName} />
              <InfoRow label="Email"          value={dealer.email} />
              <InfoRow label="Phone"          value={dealer.phone} />
              <InfoRow label="Alternate Phone"value={dealer.alternatePhone} />
            </section>

            {/* Address */}
            <section className="bg-white border p-6" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <h2 className="font-extrabold text-base mb-4" style={{ color: 'var(--text)' }}>Business Address</h2>
              <InfoRow label="Address"        value={[dealer.addressLine1, dealer.addressLine2].filter(Boolean).join(', ')} />
              <InfoRow label="City / District"value={[dealer.city, dealer.district].filter(Boolean).join(', ')} />
              <InfoRow label="State"          value={dealer.state} />
              <InfoRow label="Pincode"        value={dealer.pincode} />
            </section>

            {/* Documents */}
            <section className="bg-white border p-6" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <h2 className="font-extrabold text-base mb-5" style={{ color: 'var(--text)' }}>KYC Documents</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {DOCS.map(doc => {
                  const d = dealer.documents?.[doc.key];
                  return (
                    <div key={doc.key}>
                      <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--text-4)' }}>{doc.label}</p>
                      {d?.url ? (
                        <a href={d.url} target="_blank" rel="noopener noreferrer">
                          <div className="relative overflow-hidden hover:opacity-90 transition-opacity" style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', height: 90 }}>
                            <img src={d.url} alt={doc.label} className="w-full h-full object-cover" />
                            <div className="absolute top-1.5 right-1.5">
                              <FiExternalLink size={12} style={{ color: '#fff', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
                            </div>
                          </div>
                          <p className="text-[10px] mt-1" style={{ color: 'var(--text-4)' }}>
                            {d.uploadedAt ? new Date(d.uploadedAt).toLocaleDateString('en-IN') : ''}
                          </p>
                        </a>
                      ) : (
                        <div
                          className="flex items-center justify-center"
                          style={{ border: '1px dashed var(--border)', borderRadius: 'var(--radius-sm)', height: 90, background: 'var(--bg)' }}
                        >
                          <span className="text-[11px]" style={{ color: 'var(--text-4)' }}>Not uploaded</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right: Sidebar */}
          <div className="space-y-5">

            {/* Admin Remarks */}
            <section className="bg-white border p-5" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-extrabold text-sm" style={{ color: 'var(--text)' }}>Admin Notes</h3>
                {!editRemarks && (
                  <button onClick={() => setEditRemarks(true)} style={{ color: 'var(--text-4)' }}>
                    <FiEdit2 size={13} />
                  </button>
                )}
              </div>
              {editRemarks ? (
                <div className="space-y-3">
                  <textarea
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    rows={4}
                    placeholder="Internal notes about this dealer…"
                    className="w-full border border-[var(--border)] p-3 text-sm outline-none rounded resize-none"
                  />
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-widest block mb-1" style={{ color: 'var(--text-4)' }}>KYC Status</label>
                    <select value={kycStatus} onChange={e => setKycStatus(e.target.value)} className="w-full border border-[var(--border)] p-2 text-sm outline-none rounded">
                      {KYC_OPTS.map(k => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveRemarks}
                      disabled={actioning === 'remarks'}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white"
                      style={{ background: 'var(--text)', borderRadius: 'var(--radius-sm)' }}
                    >
                      {actioning === 'remarks' ? <span className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" /> : <FiSave size={11} />}
                      Save
                    </button>
                    <button onClick={() => setEditRemarks(false)} className="px-3 py-2 text-xs font-semibold" style={{ color: 'var(--text-3)' }}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm" style={{ color: remarks ? 'var(--text)' : 'var(--text-4)' }}>
                  {remarks || 'No notes added yet.'}
                </p>
              )}
            </section>

            {/* Meta */}
            <section className="bg-white border p-5 space-y-3" style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <h3 className="font-extrabold text-sm mb-3" style={{ color: 'var(--text)' }}>Meta</h3>
              {[
                { label: 'Applied On',    value: new Date(dealer.createdAt).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' }) },
                { label: 'Last Login',    value: dealer.lastLogin ? new Date(dealer.lastLogin).toLocaleDateString('en-IN') : 'Never' },
                { label: 'Approved By',   value: dealer.approvedBy?.name || '—' },
                { label: 'Approval Date', value: dealer.approvalDate ? new Date(dealer.approvalDate).toLocaleDateString('en-IN') : '—' },
              ].map(r => (
                <div key={r.label}>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>{r.label}</p>
                  <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--text)' }}>{r.value}</p>
                </div>
              ))}
            </section>

            {/* Rejection reason */}
            {dealer.rejectionReason && (
              <section className="p-4" style={{ background: 'rgba(220,38,38,0.04)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 'var(--radius-sm)' }}>
                <p className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: '#DC2626' }}>Rejection Reason</p>
                <p className="text-sm" style={{ color: 'var(--text-3)' }}>{dealer.rejectionReason}</p>
              </section>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
