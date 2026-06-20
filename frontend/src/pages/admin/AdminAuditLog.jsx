import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import api from '../../services/api';
import { SectionHeader, SearchToolbar, FilterToolbar, DataTable, Pagination, StatusBadge, EmptyState, ExportButton } from '../../components/shared';
import { formatDateTime, formatRelative } from '../../services/formatters';
import { useSearch } from '../../hooks/useSearch';
import { usePagination } from '../../hooks/usePagination';
import { useExport } from '../../hooks/useExport';
import { FiShield, FiUser, FiCalendar } from 'react-icons/fi';

const METHOD_COLORS = {
  PUT:    '#F59E0B',
  POST:   '#10B981',
  DELETE: '#EF4444',
  PATCH:  '#8B5CF6',
};

function ActionBadge({ action }) {
  const method = action?.split('_')[0] || 'PUT';
  return (
    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800, fontFamily: 'monospace', background: `${METHOD_COLORS[method] || '#9CA3AF'}20`, color: METHOD_COLORS[method] || '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {action || '—'}
    </span>
  );
}

export default function AdminAuditLog() {
  const [logs,    setLogs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta,    setMeta]    = useState({ entities: [], actions: [] });
  const [entity,  setEntity]  = useState('all');
  const [action,  setAction]  = useState('all');

  const { query, setQuery, debouncedQuery }  = useSearch();
  const { page, setPage, total, setTotal, limit } = usePagination(50);
  const { exportCSV } = useExport();

  const load = useCallback(() => {
    setLoading(true);
    const params = { page, limit };
    if (entity !== 'all')         params.entity  = entity;
    if (action !== 'all')         params.action  = action;
    if (debouncedQuery.trim())    params.search  = debouncedQuery.trim();

    api.get('/admin/audit-logs', { params })
      .then(r => { setLogs(r.data.data || []); setTotal(r.data.pagination?.total || 0); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, limit, entity, action, debouncedQuery, setTotal]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get('/admin/audit-logs/meta')
      .then(r => setMeta(r.data.data || { entities: [], actions: [] }))
      .catch(() => {});
  }, []);

  const entityFilters = [{ value: 'all', label: 'All Entities' }, ...meta.entities.map(e => ({ value: e, label: e }))];
  const actionFilters = [{ value: 'all', label: 'All Actions' }, ...meta.actions.map(a => ({ value: a, label: a }))];

  const columns = [
    {
      key: 'action', header: 'Action', width: '200px',
      render: (v) => <ActionBadge action={v} />,
    },
    {
      key: 'entity', header: 'Entity',
      render: (v, row) => (
        <div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{v}</div>
          {row.entityLabel && <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{row.entityLabel}</div>}
        </div>
      ),
    },
    {
      key: 'admin', header: 'Admin',
      render: (v, row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#FF7A0015', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FiUser size={12} style={{ color: '#FF7A00' }} />
          </div>
          <div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{row.adminName || v?.name || '—'}</div>
            <StatusBadge status={row.adminRole || v?.role || 'admin'} />
          </div>
        </div>
      ),
    },
    {
      key: 'ip', header: 'IP', width: '130px',
      render: (v) => <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#9CA3AF' }}>{v || '—'}</span>,
    },
    {
      key: 'createdAt', header: 'Time', width: '150px',
      render: (v) => (
        <div>
          <div style={{ fontSize: '12px', color: '#374151' }}>{formatRelative(v)}</div>
          <div style={{ fontSize: '10px', color: '#9CA3AF' }}>{formatDateTime(v)}</div>
        </div>
      ),
    },
  ];

  const handleExport = () => {
    const rows = logs.map(l => ({
      action:      l.action,
      entity:      l.entity,
      entityLabel: l.entityLabel,
      adminName:   l.adminName,
      adminEmail:  l.adminEmail,
      adminRole:   l.adminRole,
      ip:          l.ip,
      timestamp:   formatDateTime(l.createdAt),
    }));
    exportCSV(rows, 'metro-audit-log');
  };

  return (
    <AdminLayout>
      <div style={{ fontFamily: 'var(--font-body, Poppins, sans-serif)' }}>
        <SectionHeader
          title="Audit Log"
          subtitle="Complete record of all admin actions — who changed what and when"
          actions={
            <ExportButton onExportCSV={handleExport} label="Export CSV" loading={loading || !logs.length} />
          }
        />

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '14px', marginBottom: '24px' }}>
          {[
            { label: 'Total Entries', value: total,                   icon: FiShield,   accent: '#FF7A00' },
            { label: 'Entities',      value: meta.entities.length,    icon: FiUser,     accent: '#3B82F6' },
            { label: 'Action Types',  value: meta.actions.length,     icon: FiCalendar, accent: '#10B981' },
          ].map(c => {
            const Icon = c.icon;
            return (
              <div key={c.label} style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px', borderTop: `3px solid ${c.accent}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Icon size={14} style={{ color: c.accent }} />
                  <span style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF' }}>{c.label}</span>
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: '#111' }}>{c.value.toLocaleString()}</div>
              </div>
            );
          })}
        </div>

        {/* Filters row */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center' }}>
          <SearchToolbar value={query} onChange={v => { setQuery(v); setPage(1); }} placeholder="Search admin, entity…" />

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Entity</div>
            <select value={entity} onChange={e => { setEntity(e.target.value); setPage(1); }}
              style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px', fontWeight: 600, color: '#374151', background: '#fff', cursor: 'pointer' }}>
              {entityFilters.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Action</div>
            <select value={action} onChange={e => { setAction(e.target.value); setPage(1); }}
              style={{ padding: '7px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '12px', fontWeight: 600, color: '#374151', background: '#fff', cursor: 'pointer' }}>
              {actionFilters.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={logs}
          loading={loading}
          emptyIcon={FiShield}
          emptyTitle="No audit entries yet"
          emptyMessage="Admin actions will appear here once they are performed."
        />

        <Pagination page={page} total={total} limit={limit} onPageChange={setPage} />
      </div>
    </AdminLayout>
  );
}
