import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiArrowLeft, FiAlertTriangle, FiCheckCircle, FiClock, FiBox } from 'react-icons/fi';
import StatusBadge  from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import { getMRPRun, getRequirementsByRun, getProjectionsByRun } from '../../services/mrpAPI';

export default function AdminMRPRunDetail() {
  const { id } = useParams();
  const [run,  setRun]  = useState(null);
  const [reqs, setReqs] = useState([]);
  const [projs,setProjs]= useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [tab, setTab] = useState('requirements');

  useEffect(() => {
    Promise.all([getMRPRun(id), getRequirementsByRun(id), getProjectionsByRun(id)])
      .then(([r1, r2, r3]) => {
        setRun(r1.data.data);
        setReqs(r2.data.data || []);
        setProjs(r3.data.data || []);
      })
      .catch(e => setError(e.response?.data?.message || 'Failed to load MRP run'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingState message="Loading MRP run…" />;
  if (error)   return <ErrorState message={error} />;
  if (!run)    return <ErrorState message="MRP run not found" />;

  const statusColor = { completed: '#D1FAE5', failed: '#FEE2E2', running: '#DBEAFE', pending: '#FEF3C7', cancelled: '#F3F4F6' };
  const statusText  = { completed: '#065F46', failed: '#991B1B', running: '#1E40AF', pending: '#92400E', cancelled: '#6B7280' };

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <Link to="/admin/mrp/runs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6B7280', fontSize: 13, textDecoration: 'none', marginBottom: 16 }}>
        <FiArrowLeft size={14} /> Back to MRP Runs
      </Link>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0, fontFamily: 'monospace' }}>{run.runNumber}</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#6B7280' }}>
            {run.runType?.replace('_', ' ')} · {run.factory?.name || 'All Factories'} · {run.planningHorizon} days horizon
          </p>
        </div>
        <StatusBadge status={run.status} />
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
        {[
          { label: 'Requirements',    value: run.totalRequirements,          icon: <FiBox size={16} />, color: '#6366F1' },
          { label: 'Shortages',       value: run.totalShortages,             icon: <FiAlertTriangle size={16} />, color: '#EF4444' },
          { label: 'Reservations',    value: run.totalReservations,          icon: <FiCheckCircle size={16} />, color: '#10B981' },
          { label: 'Purchase Sugg.',  value: run.totalPurchaseSuggestions,   icon: <FiBox size={16} />, color: '#F97316' },
          { label: 'Prod. Sugg.',     value: run.totalProductionSuggestions, icon: <FiBox size={16} />, color: '#8B5CF6' },
          { label: 'Duration',        value: run.durationMs ? `${(run.durationMs/1000).toFixed(1)}s` : '—', icon: <FiClock size={16} />, color: '#0EA5E9' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '16px 18px' }}>
            <div style={{ color, marginBottom: 6 }}>{icon}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#111827' }}>{value ?? 0}</div>
            <div style={{ fontSize: 12, color: '#6B7280' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #E5E7EB', marginBottom: 20 }}>
        {['requirements','projections'].map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '10px 20px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: tab === t ? '#FF7A00' : '#6B7280', borderBottom: `2px solid ${tab === t ? '#FF7A00' : 'transparent'}`, marginBottom: -2, textTransform: 'capitalize' }}>
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>

      {tab === 'requirements' && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ background: '#F9FAFB' }}>
              <tr>
                {['Material','BOM Level','Gross Req.','Available','Incoming PO','Net Req.','Shortage','Status'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Material' ? 'left' : 'center', fontWeight: 700, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reqs.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>No material requirements</td></tr>
              )}
              {reqs.map(r => (
                <tr key={r._id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '8px 14px', fontWeight: 600, color: '#111827' }}>{r.materialName || r.material?.name || '—'}<div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>{r.materialSKU}</div></td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', color: '#6B7280' }}>{r.bomLevel}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center' }}>{(r.grossRequirement || 0).toFixed(2)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', color: '#059669' }}>{(r.availableQty || 0).toFixed(2)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', color: '#3B82F6' }}>{(r.incomingPOQty || 0).toFixed(2)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 700 }}>{(r.netRequirement || 0).toFixed(2)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 700, color: r.shortageQty > 0 ? '#EF4444' : '#9CA3AF' }}>{(r.shortageQty || 0).toFixed(2)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center' }}><StatusBadge status={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'projections' && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead style={{ background: '#F9FAFB' }}>
              <tr>
                {['Material','Opening','Expected In','Expected Out','Projected','Safety Stock','Risk'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: h === 'Material' ? 'left' : 'center', fontWeight: 700, color: '#374151', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projs.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: '#9CA3AF' }}>No inventory projections</td></tr>
              )}
              {projs.map(p => (
                <tr key={p._id} style={{ borderBottom: '1px solid #F3F4F6', background: p.isBelowSafety ? '#FFF7ED' : undefined }}>
                  <td style={{ padding: '8px 14px', fontWeight: 600, color: '#111827' }}>{p.materialName || p.material?.name || '—'}<div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>{p.materialSKU}</div></td>
                  <td style={{ padding: '8px 14px', textAlign: 'center' }}>{(p.openingQty || 0).toFixed(2)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', color: '#059669' }}>{(p.expectedIn || 0).toFixed(2)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', color: '#EF4444' }}>{(p.expectedOut || 0).toFixed(2)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', fontWeight: 700, color: p.projectedQty < 0 ? '#DC2626' : '#111827' }}>{(p.projectedQty || 0).toFixed(2)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center', color: '#6B7280' }}>{(p.safetyStock || 0).toFixed(2)}</td>
                  <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                    {p.isBelowSafety && <span style={{ padding: '2px 6px', background: '#FEE2E2', color: '#991B1B', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>Below Safety</span>}
                    {p.isBelowReorder && !p.isBelowSafety && <span style={{ padding: '2px 6px', background: '#FEF3C7', color: '#92400E', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>Reorder</span>}
                    {!p.isBelowSafety && !p.isBelowReorder && <span style={{ color: '#10B981', fontSize: 11 }}>OK</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
