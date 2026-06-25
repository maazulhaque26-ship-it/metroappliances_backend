import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronLeft, FiChevronRight, FiCalendar, FiInfo } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import { getPlans } from '../../services/planningAPI';
import { getFactories } from '../../services/manufacturingAPI';

const STATUS_COLORS = {
  draft:      { bg: '#F3F4F6', bar: '#9CA3AF', text: '#6B7280' },
  submitted:  { bg: '#DBEAFE', bar: '#3B82F6', text: '#1E40AF' },
  reviewed:   { bg: '#EDE9FE', bar: '#7C3AED', text: '#5B21B6' },
  approved:   { bg: '#D1FAE5', bar: '#10B981', text: '#065F46' },
  released:   { bg: '#ECFDF5', bar: '#059669', text: '#064E3B' },
  cancelled:  { bg: '#FEE2E2', bar: '#EF4444', text: '#991B1B' },
};

const PRIORITY_COLORS = { low: '#9CA3AF', normal: '#374151', high: '#F59E0B', urgent: '#EF4444' };

function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function dateKey(d) { return new Date(d).toISOString().slice(0, 10); }

function calcBar(plan, windowStart, windowEnd) {
  const planStart = new Date(plan.periodStart);
  const planEnd   = new Date(plan.periodEnd);
  const winMs     = windowEnd - windowStart;
  if (winMs <= 0 || planEnd < windowStart || planStart > windowEnd) return null;
  const left  = Math.max(0, (planStart - windowStart) / winMs) * 100;
  const right = Math.min(100, (planEnd - windowStart) / winMs) * 100;
  const width = right - left;
  if (width <= 0) return null;
  return { left, width };
}

export default function AdminSchedulingBoard() {
  const [plans,     setPlans]    = useState([]);
  const [factories, setFact]     = useState([]);
  const [factoryF,  setFactoryF] = useState('');
  const [statusF,   setStatusF]  = useState('');
  const [loading,   setLoad]     = useState(true);
  const [offset,    setOffset]   = useState(0);   // weeks offset from today
  const WEEKS = 8;

  const windowStart = addDays(new Date(new Date().toISOString().slice(0,10)), offset * 7);
  const windowEnd   = addDays(windowStart, WEEKS * 7);

  const load = useCallback(() => {
    setLoad(true);
    getPlans({ factory: factoryF, status: statusF, limit: 100 })
      .then(r => setPlans(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [factoryF, statusF]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getFactories({ limit: 100 }).then(r => setFact(r.data.data || [])).catch(() => {});
  }, []);

  // Build week header
  const weekHeaders = [];
  for (let i = 0; i < WEEKS; i++) {
    const wStart = addDays(windowStart, i * 7);
    weekHeaders.push({
      label: wStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
      date:  wStart,
    });
  }

  const today = dateKey(new Date());

  const todayLeft = (() => {
    const t = new Date(today);
    const pct = ((t - windowStart) / (windowEnd - windowStart)) * 100;
    return pct >= 0 && pct <= 100 ? pct : null;
  })();

  // Group by factory
  const grouped = {};
  for (const p of plans) {
    const k = p.factory?.name || 'Unknown Factory';
    if (!grouped[k]) grouped[k] = { factory: p.factory, plans: [] };
    grouped[k].plans.push(p);
  }

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Scheduling Board</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>
            {windowStart.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
            {' → '}
            {windowEnd.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button onClick={() => setOffset(0)} style={{ padding:'6px 12px',background:'#F3F4F6',color:'#374151',border:'none',borderRadius:8,cursor:'pointer',fontSize:12,fontWeight:700 }}>Today</button>
          <button onClick={() => setOffset(o => o - WEEKS)} style={{ padding:'6px 10px',background:'#F3F4F6',color:'#374151',border:'none',borderRadius:8,cursor:'pointer' }}><FiChevronLeft size={15} /></button>
          <button onClick={() => setOffset(o => o + WEEKS)} style={{ padding:'6px 10px',background:'#F3F4F6',color:'#374151',border:'none',borderRadius:8,cursor:'pointer' }}><FiChevronRight size={15} /></button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={factoryF} onChange={e => setFactoryF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="">All Factories</option>
          {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="">All Statuses</option>
          {['draft','submitted','reviewed','approved','released','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {/* Legend */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {Object.entries(STATUS_COLORS).filter(([k]) => k !== 'cancelled').map(([status, c]) => (
            <span key={status} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: c.text, fontWeight: 700, background: c.bg, padding: '3px 8px', borderRadius: 6 }}>{status}</span>
          ))}
        </div>
      </div>

      {loading && <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Loading schedule…</div>}

      {!loading && plans.length === 0 && (
        <div style={{ padding: 48, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>
          No production plans found. <Link to="/admin/manufacturing/planning/plans" style={{ color: '#3B82F6', fontWeight: 700 }}>Create plans</Link> to see them on the board.
        </div>
      )}

      {!loading && plans.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, overflow: 'hidden' }}>
          {/* Timeline Header */}
          <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', background: '#F9FAFB' }}>
            <div style={{ width: 220, flexShrink: 0, padding: '10px 16px', fontWeight: 700, fontSize: 12, color: '#6B7280', borderRight: '1px solid #E5E7EB' }}>PLAN</div>
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: `repeat(${WEEKS}, 1fr)` }}>
              {weekHeaders.map((w, i) => (
                <div key={i} style={{ padding: '10px 6px', textAlign: 'center', fontSize: 11, fontWeight: 600, color: '#6B7280', borderLeft: i > 0 ? '1px solid #E5E7EB' : 'none' }}>
                  {w.label}
                </div>
              ))}
            </div>
          </div>

          {/* Groups */}
          {Object.entries(grouped).map(([factoryName, group]) => (
            <div key={factoryName}>
              {/* Factory row */}
              <div style={{ display: 'flex', background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                <div style={{ width: 220, flexShrink: 0, padding: '8px 16px', fontWeight: 700, fontSize: 12, color: '#374151', borderRight: '1px solid #E5E7EB' }}>{factoryName}</div>
                <div style={{ flex: 1 }} />
              </div>

              {/* Plan rows */}
              {group.plans.map(plan => {
                const bar     = calcBar(plan, windowStart, windowEnd);
                const colors  = STATUS_COLORS[plan.status] || STATUS_COLORS.draft;
                const planPct = plan.productionOrders?.length > 0 ? Math.min(100, plan.productionOrders.length / Math.max(1, plan.targetOutput || 1) * 100) : 0;
                return (
                  <div key={plan._id} style={{ display: 'flex', borderBottom: '1px solid #F3F4F6', minHeight: 52 }}>
                    {/* Label column */}
                    <div style={{ width: 220, flexShrink: 0, padding: '8px 16px', borderRight: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                      <Link to={`/admin/manufacturing/planning/plans/${plan._id}`} style={{ fontSize: 12, fontWeight: 700, color: '#3B82F6', textDecoration: 'none', fontFamily: 'monospace' }}>{plan.planNumber}</Link>
                      <div style={{ fontSize: 11, color: '#6B7280', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{plan.name}</div>
                      <StatusBadge status={plan.status} />
                    </div>

                    {/* Gantt bar area */}
                    <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
                      {/* Today marker */}
                      {todayLeft !== null && (
                        <div style={{ position: 'absolute', left: `${todayLeft}%`, top: 0, bottom: 0, width: 2, background: '#FF7A00', opacity: 0.7, zIndex: 2 }} />
                      )}
                      {/* Week grid lines */}
                      {weekHeaders.map((_, i) => (
                        i > 0 && <div key={i} style={{ position:'absolute', left:`${(i/WEEKS)*100}%`, top:0, bottom:0, width:1, background:'#F3F4F6' }} />
                      ))}
                      {/* Plan bar */}
                      {bar && (
                        <div style={{ position: 'absolute', left: `${bar.left}%`, width: `${bar.width}%`, top: '50%', transform: 'translateY(-50%)', height: 28, background: colors.bar, borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 8, overflow: 'hidden', minWidth: 8, zIndex: 1 }}
                          title={`${plan.name}\n${new Date(plan.periodStart).toLocaleDateString()} – ${new Date(plan.periodEnd).toLocaleDateString()}\nTarget: ${(plan.targetOutput||0).toLocaleString()} units`}
                        >
                          {bar.width > 8 && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {plan.name}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Summary footer */}
      {plans.length > 0 && (
        <div style={{ display: 'flex', gap: 24, marginTop: 16, fontSize: 12, color: '#9CA3AF', flexWrap: 'wrap' }}>
          <span><strong style={{ color: '#374151' }}>{plans.length}</strong> plans shown</span>
          <span><strong style={{ color: '#10B981' }}>{plans.filter(p => p.status === 'released').length}</strong> released</span>
          <span><strong style={{ color: '#F59E0B' }}>{plans.filter(p => p.status === 'approved').length}</strong> approved</span>
          <span><strong style={{ color: '#3B82F6' }}>{plans.filter(p => ['draft','submitted','reviewed'].includes(p.status)).length}</strong> in review</span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}><FiInfo size={12} />Click a plan bar for details</span>
        </div>
      )}
    </div>
  );
}
