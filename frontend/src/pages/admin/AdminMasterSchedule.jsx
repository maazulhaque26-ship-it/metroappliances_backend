import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiCalendar } from 'react-icons/fi';
import DataTable   from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { getPlans }    from '../../services/planningAPI';
import { getFactories } from '../../services/manufacturingAPI';

export default function AdminMasterSchedule() {
  const [plans,     setPlans]    = useState([]);
  const [factories, setFact]     = useState([]);
  const [loading,   setLoad]     = useState(true);
  const [factoryF,  setFactoryF] = useState('');
  const [statusF,   setStatusF]  = useState('released');

  const load = useCallback(() => {
    setLoad(true);
    getPlans({ status: statusF, factory: factoryF, limit: 100 })
      .then(r => setPlans(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [statusF, factoryF]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getFactories({ limit: 100 }).then(r => setFact(r.data.data || [])).catch(() => {});
  }, []);

  const columns = [
    { key: 'planNumber', header: 'Plan #', render: (v, r) => (
      <Link to={`/admin/manufacturing/planning/plans/${r._id}`} style={{ color: '#3B82F6', fontWeight: 700, textDecoration: 'none', fontFamily: 'monospace' }}>{v}</Link>
    )},
    { key: 'name',     header: 'Plan Name',   render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'planType', header: 'Type',         render: v => <span style={{ textTransform: 'capitalize', fontSize: 12, color: '#6B7280', fontWeight: 700 }}>{v}</span> },
    { key: 'factory',  header: 'Factory',      render: v => v?.name || '—' },
    { key: 'periodStart', header: 'From', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'periodEnd',   header: 'To',   render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'targetOutput',   header: 'Target',    align: 'center', render: v => (v || 0).toLocaleString() },
    { key: 'demandForecast', header: 'Demand',    align: 'center', render: v => (v || 0).toLocaleString() },
    { key: 'productionOrders', header: 'Orders', align: 'center', render: v => Array.isArray(v) ? v.length : 0 },
    { key: 'status',   header: 'Status', render: v => <StatusBadge status={v} /> },
    { key: '_id', header: '', align: 'center', width: 80,
      render: id => <Link to={`/admin/manufacturing/planning/plans/${id}`} style={{ padding: '4px 10px', background: '#EFF6FF', color: '#3B82F6', borderRadius: 6, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>Details</Link> },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Master Production Schedule</h1>
          <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>Released and approved plans linked to production orders</p>
        </div>
        <Link to="/admin/manufacturing/planning/plans" style={{ padding: '9px 18px', background: '#FF7A00', color: '#fff', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <FiPlus size={14} /> New Plan
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select value={statusF} onChange={e => setStatusF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151' }}>
          <option value="">All Statuses</option>
          {['draft','submitted','reviewed','approved','released','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={factoryF} onChange={e => setFactoryF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151' }}>
          <option value="">All Factories</option>
          {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={plans} loading={loading} emptyMessage="No plans found. Create and release production plans to see the master schedule." />

      {/* Planning Calendar Summary */}
      {plans.length > 0 && (
        <div style={{ marginTop: 28, background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: '20px 24px' }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Timeline View</h3>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ minWidth: 600 }}>
              {plans.map(p => {
                const start = new Date(p.periodStart);
                const end   = new Date(p.periodEnd);
                const now   = new Date();
                const total = end - start || 1;
                const elapsed = Math.max(0, Math.min(total, now - start));
                const pct   = Math.round((elapsed / total) * 100);
                return (
                  <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 12 }}>
                    <div style={{ width: 180, fontSize: 12, fontWeight: 600, color: '#374151', fontFamily: 'monospace', flexShrink: 0 }}>{p.planNumber}</div>
                    <div style={{ flex: 1, position: 'relative', height: 28 }}>
                      <div style={{ position: 'absolute', inset: 0, background: '#F3F4F6', borderRadius: 6 }} />
                      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: p.status === 'released' ? '#10B981' : '#3B82F6', borderRadius: 6, transition: 'width 0.4s' }} />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: 11, fontWeight: 600, color: '#fff', mixBlendMode: 'difference' }}>
                        {p.name} ({pct}%)
                      </div>
                    </div>
                    <div style={{ width: 80, fontSize: 11, color: '#9CA3AF', textAlign: 'right' }}>
                      {end.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
