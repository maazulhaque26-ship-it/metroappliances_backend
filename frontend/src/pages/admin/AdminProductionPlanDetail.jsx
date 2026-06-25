import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiX, FiSend, FiEye, FiUnlock, FiCopy } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import {
  getPlan, submitPlan, reviewPlan, approvePlan, releasePlan, cancelPlan, clonePlan,
} from '../../services/planningAPI';

const FIELD = (label, val) => (
  <div style={{ padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
    <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600, marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 13, color: '#111827', fontWeight: 600 }}>{val || '—'}</div>
  </div>
);

export default function AdminProductionPlanDetail() {
  const { id } = useParams();
  const [plan,    setPlan]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [action,  setAction]  = useState('');
  const [note,    setNote]    = useState('');
  const [showNote,setShowNote]= useState(false);
  const [pending, setPending] = useState(null);

  const load = () => {
    setLoading(true);
    getPlan(id).then(r => setPlan(r.data.data)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const runAction = async (actionFn, confirmMsg) => {
    if (!window.confirm(confirmMsg)) return;
    setAction('loading');
    try { await actionFn(id, { note }); load(); setNote(''); setShowNote(false); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setAction(''); }
  };

  const handleClone = async () => {
    if (!window.confirm('Clone this plan?')) return;
    try {
      const r = await clonePlan(id);
      alert(`Cloned as ${r.data.data.planNumber}`);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6B7280' }}>Loading plan…</div>;
  if (!plan)   return <div style={{ padding: 40, textAlign: 'center', color: '#EF4444'  }}>Plan not found.</div>;

  const canSubmit = plan.status === 'draft';
  const canReview = plan.status === 'submitted';
  const canApprove= plan.status === 'reviewed';
  const canRelease= plan.status === 'approved';
  const canCancel = !['released','cancelled'].includes(plan.status);

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <Link to="/admin/manufacturing/planning/plans" style={{ color: '#6B7280', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}><FiArrowLeft size={14} /> Plans</Link>
        <span style={{ color: '#D1D5DB' }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827', fontFamily: 'monospace' }}>{plan.planNumber}</span>
        <StatusBadge status={plan.status} />
      </div>

      {/* Header Card */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '24px 28px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>{plan.name}</h2>
            <div style={{ fontSize: 13, color: '#6B7280' }}>v{plan.version} · <span style={{ textTransform: 'capitalize' }}>{plan.planType}</span> plan · {plan.factory?.name || '—'}</div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={handleClone} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 14px', background: '#F3F4F6', color: '#374151', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><FiCopy size={13} />Clone</button>
            {canSubmit  && <button onClick={() => runAction(submitPlan,  'Submit this plan for review?')}   style={{ display:'flex',alignItems:'center',gap:5,padding:'8px 14px',background:'#3B82F6',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer' }}><FiSend  size={13} />Submit</button>}
            {canReview  && <button onClick={() => runAction(reviewPlan,  'Mark as reviewed?')}              style={{ display:'flex',alignItems:'center',gap:5,padding:'8px 14px',background:'#8B5CF6',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer' }}><FiEye   size={13} />Review</button>}
            {canApprove && <button onClick={() => runAction(approvePlan, 'Approve this plan?')}             style={{ display:'flex',alignItems:'center',gap:5,padding:'8px 14px',background:'#10B981',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer' }}><FiCheck  size={13} />Approve</button>}
            {canRelease && <button onClick={() => runAction(releasePlan, 'Release this plan to production?')} style={{ display:'flex',alignItems:'center',gap:5,padding:'8px 14px',background:'#FF7A00',color:'#fff',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer' }}><FiUnlock size={13} />Release</button>}
            {canCancel  && <button onClick={() => runAction(cancelPlan,  'Cancel this plan?')}              style={{ display:'flex',alignItems:'center',gap:5,padding:'8px 14px',background:'#FEF2F2',color:'#EF4444',border:'none',borderRadius:8,fontSize:12,fontWeight:700,cursor:'pointer' }}><FiX     size={13} />Cancel</button>}
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0 40px' }}>
          {FIELD('Period Start',     plan.periodStart ? new Date(plan.periodStart).toLocaleDateString() : '—')}
          {FIELD('Period End',       plan.periodEnd   ? new Date(plan.periodEnd).toLocaleDateString()   : '—')}
          {FIELD('Plan Type',        plan.planType)}
          {FIELD('Target Output',    (plan.targetOutput || 0).toLocaleString() + ' units')}
          {FIELD('Demand Forecast',  (plan.demandForecast || 0).toLocaleString() + ' units')}
          {FIELD('Safety Stock',     (plan.safetyStock || 0).toLocaleString() + ' units')}
          {FIELD('Forecast Source',  plan.forecastSource)}
          {FIELD('Production Orders',plan.productionOrders?.length || 0)}
          {FIELD('Notes',            plan.notes)}
        </div>
      </div>

      {/* Approval Trail */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '20px 24px', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Approval Trail</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Submitted',  by: plan.submittedBy,  at: plan.submittedAt  },
            { label: 'Reviewed',   by: plan.reviewedBy,   at: plan.reviewedAt   },
            { label: 'Approved',   by: plan.approvedBy,   at: plan.approvedAt   },
            { label: 'Released',   by: plan.releasedBy,   at: plan.releasedAt   },
          ].map(t => (
            <div key={t.label} style={{ padding: 14, background: '#F9FAFB', borderRadius: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginBottom: 4 }}>{t.label}</div>
              {t.at
                ? <><div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{t.by?.name || 'Admin'}</div><div style={{ fontSize: 11, color: '#6B7280' }}>{new Date(t.at).toLocaleString()}</div></>
                : <div style={{ fontSize: 12, color: '#D1D5DB' }}>Pending</div>}
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      {plan.history?.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '20px 24px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Change History</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[...plan.history].reverse().map((h, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '10px 14px', background: '#F9FAFB', borderRadius: 8 }}>
                <StatusBadge status={h.status} />
                <div style={{ flex: 1 }}>
                  {h.note && <div style={{ fontSize: 12, color: '#374151' }}>{h.note}</div>}
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{h.changedByName || 'Admin'} · {h.changedAt ? new Date(h.changedAt).toLocaleString() : ''}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
