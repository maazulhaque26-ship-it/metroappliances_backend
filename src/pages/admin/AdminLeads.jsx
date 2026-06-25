import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const STAGE_COLORS    = { prospect: '#9CA3AF', qualified: '#3B82F6', proposal: '#F59E0B', negotiation: '#8B5CF6', won: '#10B981', lost: '#EF4444' };
const PRIORITY_COLORS = { low: '#9CA3AF', medium: '#3B82F6', high: '#F59E0B', urgent: '#EF4444' };
const STAGES = ['', 'prospect', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

export default function AdminLeads() {
  const [leads,      setLeads]      = useState([]);
  const [agents,     setAgents]     = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(1);
  const [search,     setSearch]     = useState('');
  const [stage,      setStage]      = useState('');
  const [agentId,    setAgentId]    = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search)  params.set('search', search);
      if (stage)   params.set('stage', stage);
      if (agentId) params.set('agentId', agentId);
      const { data } = await api.get(`/admin/leads?${params}`);
      setLeads(data.leads || []);
      setPagination(data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [page, search, stage, agentId]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api.get('/admin/sales-agents?limit=200').then(r => setAgents(r.data.agents || [])).catch(() => {});
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete lead?')) return;
    try { await api.delete(`/admin/leads/${id}`); load(); }
    catch (e) { alert(e?.response?.data?.message || 'Error'); }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#111', margin: '0 0 4px' }}>All Leads</h2>
        <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{pagination.total} total leads</div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search leads..."
          style={{ flex: 1, minWidth: '200px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }} />
        <select value={stage} onChange={e => { setStage(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
          <option value="">All Stages</option>
          {STAGES.filter(Boolean).map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>
        <select value={agentId} onChange={e => { setAgentId(e.target.value); setPage(1); }}
          style={{ padding: '8px 10px', borderRadius: '8px', border: '1px solid #E5E7EB', fontSize: '13px' }}>
          <option value="">All Agents</option>
          {agents.map(a => <option key={a._id} value={a._id}>{a.name} ({a.agentCode})</option>)}
        </select>
      </div>

      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '750px' }}>
          <thead>
            <tr style={{ background: '#F9FAFB' }}>
              {['Lead #', 'Business', 'Contact', 'Agent', 'Stage', 'Priority', 'Est. Value', 'Created', 'Actions'].map(h => (
                <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: '#9CA3AF', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
            ) : leads.length === 0 ? (
              <tr><td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>No leads found</td></tr>
            ) : leads.map(l => (
              <tr key={l._id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '11px', color: '#FF7A00', fontWeight: 700 }}>{l.leadNumber}</td>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, color: '#111' }}>{l.businessName}</div>
                  <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{l.city}{l.state ? `, ${l.state}` : ''}</div>
                </td>
                <td style={{ padding: '12px 14px', color: '#374151', fontSize: '12px' }}>
                  <div>{l.contactPerson || '—'}</div>
                  {l.phone && <div style={{ color: '#9CA3AF' }}>{l.phone}</div>}
                </td>
                <td style={{ padding: '12px 14px', color: '#374151', fontSize: '12px' }}>
                  <div>{l.assignedAgent?.name || '—'}</div>
                  <div style={{ color: '#9CA3AF', fontFamily: 'monospace', fontSize: '10px' }}>{l.assignedAgent?.agentCode}</div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STAGE_COLORS[l.stage] || '#9CA3AF') + '1A', color: STAGE_COLORS[l.stage] || '#9CA3AF', textTransform: 'capitalize' }}>
                    {l.stage}
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (PRIORITY_COLORS[l.priority] || '#9CA3AF') + '1A', color: PRIORITY_COLORS[l.priority] || '#9CA3AF', textTransform: 'capitalize' }}>
                    {l.priority}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', color: '#374151', fontSize: '12px' }}>{l.estimatedValue ? `₹${l.estimatedValue.toLocaleString('en-IN')}` : '—'}</td>
                <td style={{ padding: '12px 14px', color: '#9CA3AF', fontSize: '12px' }}>{new Date(l.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                <td style={{ padding: '12px 14px' }}>
                  <button onClick={() => handleDelete(l._id)} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', fontSize: '10px', fontWeight: 600, color: '#991B1B', cursor: 'pointer' }}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {pagination.totalPages > 1 && !loading && (
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: '12px', opacity: page <= 1 ? 0.4 : 1 }}>&larr; Prev</button>
            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Page {page} of {pagination.totalPages}</span>
            <button onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))} disabled={page >= pagination.totalPages} style={{ padding: '6px 14px', borderRadius: '6px', border: '1px solid #E5E7EB', background: '#fff', cursor: 'pointer', fontSize: '12px', opacity: page >= pagination.totalPages ? 0.4 : 1 }}>Next &rarr;</button>
          </div>
        )}
      </div>
    </div>
  );
}
