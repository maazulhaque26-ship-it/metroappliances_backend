import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import agentAPI from '../../services/agentAPI';

const STAGE_COLORS = { prospect: '#9CA3AF', qualified: '#3B82F6', proposal: '#F59E0B', negotiation: '#8B5CF6', won: '#10B981', lost: '#EF4444' };
const OUTCOME_COLORS = { positive: '#10B981', neutral: '#9CA3AF', negative: '#EF4444', no_contact: '#6B7280' };

function StatCard({ label, value, sub, color, to }) {
  const inner = (
    <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '18px 20px', borderLeft: `4px solid ${color || '#FF7A00'}` }}>
      <div style={{ fontSize: '11px', fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 900, color: '#111' }}>{value ?? '—'}</div>
      {sub && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
  return to ? <Link to={to} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

export default function AgentDashboard() {
  const { agent } = useSelector(s => s.agentAuth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    agentAPI.get('/agent/dashboard').then(r => { setData(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF' }}>Loading dashboard...</div>;

  const s = data?.stats || {};

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#111', marginBottom: '4px' }}>
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {agent?.name?.split(' ')[0]}
        </h1>
        <div style={{ fontSize: '13px', color: '#9CA3AF' }}>{agent?.agentCode} &bull; {agent?.territory?.name || 'No territory assigned'}</div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px,1fr))', gap: '14px', marginBottom: '28px' }}>
        <StatCard label="Total Leads"     value={s.totalLeads}         color="#3B82F6" to="/agent/leads" />
        <StatCard label="Active Leads"    value={s.activeLeads}        color="#F59E0B" />
        <StatCard label="Won Leads"       value={s.wonLeads}           color="#10B981" sub={`${s.conversionRate}% conversion`} />
        <StatCard label="Leads This Month" value={s.leadsThisMonth}    color="#8B5CF6" />
        <StatCard label="Visits This Month" value={s.visitsThisMonth}  color="#FF7A00" to="/agent/visits" />
        <StatCard label="Active Dealers"  value={s.activeDealers}      color="#06B6D4" to="/agent/dealers" />
        <StatCard label="Pending Tasks"   value={s.pendingTasks}       color={s.overdueTasksCount > 0 ? '#EF4444' : '#9CA3AF'} sub={s.overdueTasksCount > 0 ? `${s.overdueTasksCount} overdue` : ''} to="/agent/tasks" />
        <StatCard label="Tasks Done (Mo)" value={s.completedTasksThisMonth} color="#10B981" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        {/* Hot Leads */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#111' }}>Hot Leads</div>
            <Link to="/agent/leads" style={{ fontSize: '11px', color: '#FF7A00', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
          </div>
          {(!data?.hotLeads || data.hotLeads.length === 0) ? (
            <div style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No hot leads</div>
          ) : data.hotLeads.map(l => (
            <Link key={l._id} to={`/agent/leads/${l._id}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #F3F4F6', textDecoration: 'none' }}>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111' }}>{l.businessName}</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>{l.city || ''} &bull; {l.leadNumber}</div>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: (STAGE_COLORS[l.stage] || '#6B7280') + '1A', color: STAGE_COLORS[l.stage] || '#6B7280', textTransform: 'capitalize' }}>
                {l.stage}
              </span>
            </Link>
          ))}
        </div>

        {/* Upcoming Tasks */}
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#111' }}>Upcoming Tasks</div>
            <Link to="/agent/tasks" style={{ fontSize: '11px', color: '#FF7A00', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
          </div>
          {(!data?.upcomingTasks || data.upcomingTasks.length === 0) ? (
            <div style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No pending tasks</div>
          ) : data.upcomingTasks.map(t => {
            const overdue = t.dueDate && new Date(t.dueDate) < new Date();
            return (
              <div key={t._id} style={{ padding: '10px 0', borderBottom: '1px solid #F3F4F6' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: overdue ? '#EF4444' : '#111' }}>{t.title}</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                  {t.dueDate ? new Date(t.dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : 'No due date'}
                  {t.dealer && ` · ${t.dealer.businessName}`}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Visits */}
      <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#111' }}>Recent Visits</div>
          <Link to="/agent/visits" style={{ fontSize: '11px', color: '#FF7A00', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
        </div>
        {(!data?.recentVisits || data.recentVisits.length === 0) ? (
          <div style={{ color: '#9CA3AF', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>No visits yet</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Dealer', 'Date', 'Purpose', 'Outcome', 'Duration'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '6px 10px', fontSize: '11px', color: '#9CA3AF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.recentVisits.map(v => (
                  <tr key={v._id} style={{ borderTop: '1px solid #F3F4F6' }}>
                    <td style={{ padding: '10px', fontWeight: 600, color: '#111' }}>{v.dealer?.businessName || '—'}</td>
                    <td style={{ padding: '10px', color: '#9CA3AF', fontSize: '12px' }}>{new Date(v.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</td>
                    <td style={{ padding: '10px', color: '#374151', fontSize: '12px', textTransform: 'capitalize' }}>{v.purpose?.replace(/_/g, ' ')}</td>
                    <td style={{ padding: '10px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '100px', background: (OUTCOME_COLORS[v.outcome] || '#9CA3AF') + '1A', color: OUTCOME_COLORS[v.outcome] || '#9CA3AF', textTransform: 'capitalize' }}>
                        {v.outcome?.replace(/_/g, ' ') || '—'}
                      </span>
                    </td>
                    <td style={{ padding: '10px', color: '#9CA3AF', fontSize: '12px' }}>{v.durationMinutes ? `${v.durationMinutes}m` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lead stage distribution */}
      {data?.stageDistribution?.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginTop: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 800, color: '#111', marginBottom: '14px' }}>Lead Pipeline</div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {data.stageDistribution.map(({ _id, count }) => (
              <div key={_id} style={{ padding: '10px 16px', borderRadius: '10px', background: (STAGE_COLORS[_id] || '#9CA3AF') + '14', border: `1px solid ${STAGE_COLORS[_id] || '#9CA3AF'}33` }}>
                <div style={{ fontSize: '18px', fontWeight: 900, color: STAGE_COLORS[_id] || '#9CA3AF' }}>{count}</div>
                <div style={{ fontSize: '11px', color: '#9CA3AF', textTransform: 'capitalize' }}>{_id}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
