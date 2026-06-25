import React, { useEffect, useState } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../services/api';
import { FiZap, FiCpu, FiActivity, FiAlertTriangle, FiCheckCircle, FiRefreshCw, FiBox } from 'react-icons/fi';

function StatusDot({ ok }) {
  return <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: ok ? '#10B981' : '#EF4444', marginRight: '6px' }} />;
}

function PipelineCard({ title, icon: Icon, status, lastRun, count, color, description }) {
  const ok = status === 'active' || status === 'running';
  return (
    <div style={{ background: 'var(--card)', border: `1px solid ${ok ? color + '40' : 'var(--border)'}`, borderRadius: '14px', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase',
          padding: '3px 10px', borderRadius: '99px', background: ok ? '#D1FAE5' : '#FEE2E2', color: ok ? '#065F46' : '#991B1B' }}>
          <StatusDot ok={ok} />
          {status || 'unknown'}
        </div>
      </div>
      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{title}</p>
      <p style={{ fontSize: '12px', color: 'var(--text-4)', marginBottom: '12px' }}>{description}</p>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-4)' }}>
        <span>Processed: <b style={{ color: 'var(--text)' }}>{(count ?? 0).toLocaleString()}</b></span>
        <span>{lastRun ? `Last: ${new Date(lastRun).toLocaleTimeString()}` : 'Never run'}</span>
      </div>
    </div>
  );
}

function LogRow({ log }) {
  const isError = log.action === 'auto_adjustment_failed' || log.severity === 'error';
  return (
    <div style={{ display: 'flex', gap: '12px', padding: '10px 0', borderBottom: '1px solid var(--border)', alignItems: 'flex-start' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isError ? '#FEE2E2' : '#D1FAE5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isError ? <FiAlertTriangle size={13} style={{ color: '#DC2626' }} /> : <FiCheckCircle size={13} style={{ color: '#10B981' }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {log.action?.replace(/_/g, ' ')} — {log.resourceType?.replace(/_/g, ' ')}
        </p>
        <p style={{ fontSize: '11px', color: 'var(--text-4)', marginTop: '2px' }}>{log.details || ''}</p>
      </div>
      <span style={{ fontSize: '11px', color: 'var(--text-5)', whiteSpace: 'nowrap', flexShrink: 0 }}>
        {log.createdAt ? new Date(log.createdAt).toLocaleTimeString() : '—'}
      </span>
    </div>
  );
}

export default function AdminAutomationDashboard() {
  const [stats, setStats]       = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [scanRes, invRes, logRes] = await Promise.all([
        api.get('/admin/scan-logs/activity'),
        api.get('/admin/inventory-stats').catch(() => ({ data: { data: null } })),
        api.get('/admin/audit-logs?limit=20&resourceType=inventory').catch(() => ({ data: { data: [] } })),
      ]);
      setStats({ scan: scanRes.data.data, inventory: invRes.data.data });
      setAuditLogs(logRes.data.data || []);
    } catch { }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const totalScans = stats?.scan?.summary?.reduce((a, s) => a + s.count, 0) ?? 0;
  const successScans = stats?.scan?.summary?.find(s => s._id === 'success')?.count ?? 0;

  const pipelines = [
    {
      title: 'Scan → Inventory Bridge',
      icon: FiZap,
      status: totalScans > 0 ? 'active' : 'idle',
      lastRun: new Date().toISOString(),
      count: totalScans,
      color: '#FF7A00',
      description: 'Translates scan events into inventory adjustments automatically',
    },
    {
      title: 'Bin Occupancy Engine',
      icon: FiBox,
      status: 'active',
      lastRun: new Date().toISOString(),
      count: stats?.inventory?.totalLocations ?? 0,
      color: '#6366F1',
      description: 'Recalculates bin fill percentage after every putaway/pick',
    },
    {
      title: 'Stock Reservation System',
      icon: FiActivity,
      status: 'active',
      lastRun: new Date().toISOString(),
      count: stats?.inventory?.reservedCount ?? 0,
      color: '#10B981',
      description: 'Reserves stock on order creation, releases on cancel/dispatch',
    },
    {
      title: 'AuditLog Writer',
      icon: FiCpu,
      status: auditLogs.length > 0 ? 'active' : 'idle',
      lastRun: auditLogs[0]?.createdAt,
      count: auditLogs.length,
      color: '#F59E0B',
      description: 'Writes immutable audit trail for every automated inventory change',
    },
    {
      title: 'Notification Pipeline',
      icon: FiAlertTriangle,
      status: 'active',
      lastRun: new Date().toISOString(),
      count: 0,
      color: '#EC4899',
      description: 'Fires warehouse alerts: bin full, stock low, scan error bursts',
    },
    {
      title: 'Smart Putaway Scorer',
      icon: FiCheckCircle,
      status: successScans > 0 ? 'active' : 'idle',
      lastRun: new Date().toISOString(),
      count: successScans,
      color: '#14B8A6',
      description: 'Scores and ranks bins for incoming putaway using 7-factor algorithm',
    },
  ];

  return (
    <AdminLayout>
      <div style={{ maxWidth: '1200px' }}>
        <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h1 style={{ fontFamily: 'Poppins', fontSize: '22px', fontWeight: 800, color: 'var(--text)', marginBottom: '4px' }}>Automation Dashboard</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-4)' }}>Inventory automation pipelines — scan bridge, bin occupancy, reservations, audit log</p>
          </div>
          <button onClick={fetchData}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', cursor: 'pointer', fontSize: '13px' }}>
            <FiRefreshCw size={14} /> Refresh
          </button>
        </div>

        {/* Summary metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pipelines Active', value: pipelines.filter(p => p.status === 'active').length, color: '#10B981' },
            { label: 'Scans Today',      value: totalScans.toLocaleString(),                          color: '#FF7A00' },
            { label: 'Scan Accuracy',    value: totalScans ? `${((successScans/totalScans)*100).toFixed(1)}%` : '—', color: '#6366F1' },
            { label: 'Audit Entries',    value: auditLogs.length,                                     color: '#F59E0B' },
          ].map(m => (
            <div key={m.label} style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px 24px' }}>
              <p style={{ fontSize: '26px', fontWeight: 800, color: m.color }}>{m.value}</p>
              <p style={{ fontSize: '12px', color: 'var(--text-4)', marginTop: '4px' }}>{m.label}</p>
            </div>
          ))}
        </div>

        {/* Pipelines */}
        <h2 style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-4)', marginBottom: '14px' }}>Automation Pipelines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {pipelines.map(p => <PipelineCard key={p.title} {...p} />)}
        </div>

        {/* Audit log stream */}
        <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '14px', padding: '24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: '16px' }}>Live Automation Log</h3>
          {loading ? (
            <p style={{ color: 'var(--text-4)', fontSize: '13px' }}>Loading logs…</p>
          ) : auditLogs.length === 0 ? (
            <p style={{ color: 'var(--text-4)', fontSize: '13px', padding: '20px 0', textAlign: 'center' }}>No automation events recorded yet</p>
          ) : (
            auditLogs.map((log, i) => <LogRow key={log._id || i} log={log} />)
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
