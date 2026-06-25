import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiAlertTriangle, FiPackage, FiShoppingCart, FiActivity, FiCheckCircle, FiClock } from 'react-icons/fi';
import MetricCard  from '../../components/shared/MetricCard';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import { getMRPDashboard } from '../../services/mrpAPI';

const SEV_COLOR = { critical: '#EF4444', high: '#F97316', medium: '#EAB308', low: '#22C55E' };

export default function AdminMRPDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    getMRPDashboard()
      .then(r => setData(r.data.data))
      .catch(e => setError(e.response?.data?.message || 'Failed to load MRP dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingState message="Loading MRP dashboard…" />;
  if (error)   return <ErrorState message={error} />;

  const { kpis = {}, recentRuns = [], shortagesBySeverity = {} } = data || {};

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>MRP Dashboard</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>Material Requirements Planning — Enterprise View</p>
        </div>
        <Link to="/admin/mrp/runs/new" style={{ padding: '9px 18px', background: '#FF7A00', color: '#fff', borderRadius: 8, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
          Run MRP
        </Link>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        <MetricCard title="Total MRP Runs"    value={kpis.totalRuns || 0}                    icon={<FiActivity size={20} />} color="#6366F1" />
        <MetricCard title="Active Shortages"  value={kpis.activeShortages || 0}              icon={<FiAlertTriangle size={20} />} color="#EF4444" />
        <MetricCard title="Critical Shortages"value={kpis.criticalShortages || 0}            icon={<FiAlertTriangle size={20} />} color="#DC2626" />
        <MetricCard title="Purchase Suggestions" value={kpis.pendingPurchaseSuggestions || 0} icon={<FiShoppingCart size={20} />} color="#F97316" />
        <MetricCard title="Production Requests"  value={kpis.pendingProductionReqs || 0}     icon={<FiPackage size={20} />} color="#8B5CF6" />
        <MetricCard title="Active Reservations"  value={kpis.totalReservations || 0}         icon={<FiCheckCircle size={20} />} color="#10B981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Shortages by severity */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Shortages by Severity</h2>
          {Object.keys(shortagesBySeverity).length === 0 && (
            <p style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: 24 }}>No open shortages</p>
          )}
          {['critical','high','medium','low'].map(sev => {
            const d = shortagesBySeverity[sev];
            if (!d) return null;
            return (
              <div key={sev} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: SEV_COLOR[sev] }} />
                  <span style={{ fontWeight: 600, textTransform: 'capitalize', fontSize: 13, color: '#374151' }}>{sev}</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: SEV_COLOR[sev], fontSize: 15 }}>{d.count}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 6 }}>items</span>
                </div>
              </div>
            );
          })}
          <div style={{ marginTop: 16 }}>
            <Link to="/admin/mrp/shortages" style={{ fontSize: 12, color: '#3B82F6', fontWeight: 700, textDecoration: 'none' }}>View all shortages →</Link>
          </div>
        </div>

        {/* Recent MRP Runs */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16, padding: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 16px' }}>Recent MRP Runs</h2>
          {recentRuns.length === 0 && (
            <p style={{ color: '#9CA3AF', fontSize: 13, textAlign: 'center', padding: 24 }}>No MRP runs yet</p>
          )}
          {recentRuns.map(run => (
            <div key={run._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
              <div>
                <Link to={`/admin/mrp/runs/${run._id}`} style={{ fontWeight: 700, color: '#111827', textDecoration: 'none', fontSize: 13, fontFamily: 'monospace' }}>{run.runNumber}</Link>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
                  <FiClock size={10} style={{ marginRight: 4 }} />
                  {new Date(run.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: run.status === 'completed' ? '#D1FAE5' : run.status === 'failed' ? '#FEE2E2' : '#FEF3C7', color: run.status === 'completed' ? '#065F46' : run.status === 'failed' ? '#991B1B' : '#92400E' }}>{run.status}</span>
                <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 4 }}>{run.totalShortages} shortages</div>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <Link to="/admin/mrp/runs" style={{ fontSize: 12, color: '#3B82F6', fontWeight: 700, textDecoration: 'none' }}>View all runs →</Link>
          </div>
        </div>
      </div>

      {/* Quick nav */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginTop: 24 }}>
        {[
          { label: 'MRP Runs',             path: '/admin/mrp/runs' },
          { label: 'Material Requirements',path: '/admin/mrp/requirements' },
          { label: 'Shortages',            path: '/admin/mrp/shortages' },
          { label: 'Purchase Suggestions', path: '/admin/mrp/purchase-suggestions' },
          { label: 'Demand Forecast',      path: '/admin/mrp/forecasts' },
          { label: 'Inventory Projection', path: '/admin/mrp/projections' },
          { label: 'Safety Stock',         path: '/admin/mrp/safety-stock' },
          { label: 'MRP Reports',          path: '/admin/mrp/reports' },
        ].map(({ label, path }) => (
          <Link key={path} to={path} style={{ padding: '14px 16px', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, textDecoration: 'none', color: '#374151', fontSize: 13, fontWeight: 600, textAlign: 'center', display: 'block', transition: 'border-color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = '#FF7A00'}
            onMouseLeave={e => e.currentTarget.style.borderColor = '#E5E7EB'}
          >{label}</Link>
        ))}
      </div>
    </div>
  );
}
