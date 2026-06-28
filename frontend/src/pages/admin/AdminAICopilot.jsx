import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';
import * as api from '../../services/copilotAPI';

const QUICK_PROMPTS = [
  { label: "Today's Sales", text: "Show today's sales", color: '#3B82F6' },
  { label: 'Low Stock Alert', text: 'Which products need replenishment?', color: '#EF4444' },
  { label: 'Overdue Invoices', text: 'Show overdue invoices', color: '#F59E0B' },
  { label: 'Delayed Projects', text: 'Show delayed projects', color: '#8B5CF6' },
  { label: 'Machine Alerts', text: 'Which machines need maintenance?', color: '#EC4899' },
  { label: 'Cash Flow', text: 'Summarize cash flow', color: '#10B981' },
  { label: 'Pending Approvals', text: 'List pending approvals', color: '#6366F1' },
  { label: 'Executive Summary', text: 'Generate executive summary', color: '#F97316' },
];

export default function AdminAICopilot() {
  const [suggestions, setSuggestions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingStmt, setLoadingStmt] = useState('');
  const [convId, setConvId] = useState(null);
  const [reply, setReply] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api.listSuggestions({ limit: 5 }).then(r => setSuggestions(r.data?.data || [])).catch(() => {});
    api.getAutomationStats().then(r => setStats(r.data)).catch(() => {});
  }, []);

  async function handleQuickPrompt(text) {
    setSending(true);
    setReply(null);
    setLoadingStmt(text);
    try {
      let cid = convId;
      if (!cid) {
        const c = await api.createConversation({ title: `Quick Query — ${new Date().toLocaleDateString()}`, userType: 'admin' });
        cid = c.data._id;
        setConvId(cid);
      }
      const r = await api.sendMessage(cid, { content: text });
      const msgs = r.data?.messages || [];
      const last = msgs[msgs.length - 1];
      setReply(last);
    } catch { setReply({ content: 'Unable to connect to AI engine.' }); }
    setSending(false);
    setLoadingStmt('');
  }

  const card = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 20 };

  return (
    <AdminLayout>
      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 6px' }}>AI Copilot</h1>
        <p style={{ color: '#6B7280', marginBottom: 28 }}>Intelligent enterprise assistant — ask questions, get insights, trigger actions.</p>

        {/* Stats Row */}
        {stats && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
            {[
              { label: 'Automation Rules', value: stats.totalRules || 0, color: '#6366F1' },
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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24 }}>
          {/* Quick Prompts */}
          <div>
            <div style={card}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600 }}>Quick Ask</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 10 }}>
                {QUICK_PROMPTS.map(p => (
                  <button key={p.label} onClick={() => handleQuickPrompt(p.text)} disabled={sending}
                    style={{ padding: '12px 16px', borderRadius: 8, border: `1px solid ${p.color}33`, background: `${p.color}11`,
                      color: p.color, fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left',
                      opacity: sending ? 0.6 : 1 }}>
                    {p.label}
                  </button>
                ))}
              </div>

              {sending && (
                <div style={{ marginTop: 20, padding: '14px 18px', background: '#F9FAFB', borderRadius: 8, color: '#6B7280', fontSize: 14 }}>
                  Asking: "{loadingStmt}" ...
                </div>
              )}

              {reply && !sending && (
                <div style={{ marginTop: 20, padding: '16px 20px', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8 }}>
                  <div style={{ fontSize: 12, color: '#6B7280', marginBottom: 6 }}>AI Response</div>
                  <div style={{ fontSize: 15, color: '#111827', lineHeight: 1.6 }}>{reply.content}</div>
                  {reply.data && (
                    <div style={{ marginTop: 10, fontSize: 12, color: '#6B7280', background: '#E5E7EB', borderRadius: 6, padding: '8px 10px' }}>
                      Data: {JSON.stringify(reply.data).slice(0, 120)}…
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Suggestions */}
            <div style={card}>
              <h3 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 600 }}>AI Suggestions</h3>
              {suggestions.length === 0 ? (
                <p style={{ color: '#9CA3AF', fontSize: 14 }}>No suggestions yet. Click "Generate" to scan ERP data.</p>
              ) : suggestions.map(s => (
                <div key={s._id} style={{ padding: '12px 14px', marginBottom: 8, background: '#F9FAFB', borderRadius: 8, border: '1px solid #E5E7EB', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: '#6B7280' }}>{s.description}</div>
                  </div>
                  <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 9999, background: s.priority === 'critical' ? '#FEE2E2' : s.priority === 'high' ? '#FEF3C7' : '#DBEAFE', color: s.priority === 'critical' ? '#DC2626' : s.priority === 'high' ? '#D97706' : '#3B82F6' }}>{s.priority}</span>
                </div>
              ))}
              <button onClick={() => api.generateSuggestions().then(r => setSuggestions(r.data?.suggestions || []))} style={{ marginTop: 8, padding: '8px 16px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
                Generate Suggestions
              </button>
            </div>
          </div>

          {/* Side panel */}
          <div>
            <div style={card}>
              <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 600 }}>Navigation</h3>
              {[
                { label: 'AI Chat', path: '/admin/ai-copilot/chat', icon: '💬' },
                { label: 'Executive Briefing', path: '/admin/ai-copilot/briefing', icon: '📋' },
                { label: 'AI Insights', path: '/admin/ai-copilot/insights', icon: '💡' },
                { label: 'Recommendations', path: '/admin/ai-copilot/recommendations', icon: '🎯' },
                { label: 'Automation Center', path: '/admin/ai-copilot/automation', icon: '⚡' },
                { label: 'Automation Rules', path: '/admin/ai-copilot/rules', icon: '📐' },
                { label: 'Knowledge Base', path: '/admin/ai-copilot/knowledge', icon: '📚' },
              ].map(n => (
                <a key={n.path} href={n.path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, textDecoration: 'none', color: '#111827', fontSize: 14, marginBottom: 4, background: '#F9FAFB' }}>
                  <span>{n.icon}</span>{n.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
