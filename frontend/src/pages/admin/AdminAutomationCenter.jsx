import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import * as api from '../../services/copilotAPI';

export default function AdminAutomationCenter() {
  const [stats, setStats] = useState(null);
  const [executions, setExecutions] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getAutomationStats(),
      api.listExecutions({ limit: 10 }),
      api.listHistory({ limit: 10 }),
    ]).then(([s, e, h]) => {
      setStats(s.data);
      setExecutions(e.data?.data || []);
      setHistory(h.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const card = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 20 };
  const statusColor = { completed: '#10B981', failed: '#EF4444', running: '#3B82F6', pending: '#F59E0B', skipped: '#9CA3AF', cancelled: '#6B7280' };

  if (loading) return <AdminLayout><div style={{ padding: 40 }}>Loading…</div></AdminLayout>;

  return (
    <AdminLayout>
      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>Automation Center</h1>
            <p style={{ color: '#6B7280', margin: 0 }}>Monitor rules, executions and automation history.</p>
          </div>
          <a href="/admin/ai-copilot/rules" style={{ padding: '10px 20px', background: '#6366F1', color: '#fff', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
            Manage Rules
          </a>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Total Rules', value: stats.totalRules || 0, color: '#6366F1' },
              { label: 'Active Rules', value: stats.activeRules || 0, color: '#10B981' },
              { label: 'Total Executions', value: stats.totalExecutions || 0, color: '#3B82F6' },
              { label: 'This Week', value: stats.recentExecutions || 0, color: '#F59E0B' },
            ].map(s => (
              <div key={s.label} style={{ ...card, marginBottom: 0, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Recent Executions */}
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Recent Executions</h3>
            {executions.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: 14 }}>No executions yet.</p>
            ) : executions.map(e => (
              <div key={e._id} style={{ padding: '10px 12px', marginBottom: 8, background: '#F9FAFB', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{e.ruleId?.name || 'Rule'}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(e.createdAt).toLocaleString()} · {e.trigger}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: `${statusColor[e.status] || '#9CA3AF'}22`, color: statusColor[e.status] || '#9CA3AF', fontWeight: 600 }}>{e.status}</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}>{e.actionsCompleted || 0} done</span>
                </div>
              </div>
            ))}
          </div>

          {/* Automation History */}
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Rule History</h3>
            {history.length === 0 ? (
              <p style={{ color: '#9CA3AF', fontSize: 14 }}>No history yet.</p>
            ) : history.map(h => (
              <div key={h._id} style={{ padding: '10px 12px', marginBottom: 8, background: '#F9FAFB', borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, textTransform: 'replace-all' }}>{h.event?.replace(/_/g, ' ')}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(h.timestamp || h.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Category */}
        {stats?.byCategory?.length > 0 && (
          <div style={card}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Rules by Category</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {stats.byCategory.map(c => (
                <div key={c._id} style={{ padding: '10px 16px', background: '#F3F4F6', borderRadius: 8, minWidth: 120, textAlign: 'center' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#6366F1' }}>{c.count}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{c._id}</div>
                  <div style={{ fontSize: 11, color: '#10B981' }}>{c.activeCount} active</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
