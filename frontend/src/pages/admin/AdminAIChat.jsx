import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from './AdminLayout';
import * as api from '../../services/copilotAPI';

export default function AdminAIChat() {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [prompts, setPrompts] = useState([]);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.listConversations({ limit: 20 }).then(r => setConversations(r.data?.data || [])).catch(() => {});
    api.listPrompts({ limit: 8 }).then(r => setPrompts(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  async function openConversation(conv) {
    setActiveConv(conv);
    const r = await api.getConversation(conv._id).catch(() => null);
    setMessages(r?.data?.messages || []);
  }

  async function startNew() {
    const r = await api.createConversation({ title: `Chat — ${new Date().toLocaleString()}`, userType: 'admin' });
    const conv = r.data;
    setConversations(p => [conv, ...p]);
    setActiveConv(conv);
    setMessages([]);
  }

  async function send() {
    if (!input.trim() || !activeConv) return;
    const text = input.trim();
    setInput('');
    setSending(true);
    setMessages(p => [...p, { role: 'user', content: text, timestamp: new Date() }]);
    try {
      const r = await api.sendMessage(activeConv._id, { content: text });
      setMessages(r.data?.messages || []);
    } catch {
      setMessages(p => [...p, { role: 'assistant', content: 'Error: could not reach AI engine.', timestamp: new Date() }]);
    }
    setSending(false);
  }

  async function usePrompt(p) {
    setInput(p.promptText);
    api.incrementPromptUse(p._id).catch(() => {});
  }

  async function deleteConv(id, e) {
    e.stopPropagation();
    await api.deleteConversation(id).catch(() => {});
    setConversations(p => p.filter(c => c._id !== id));
    if (activeConv?._id === id) { setActiveConv(null); setMessages([]); }
  }

  const sb = { width: 260, background: '#F9FAFB', borderRight: '1px solid #E5E7EB', padding: '20px 0', display: 'flex', flexDirection: 'column' };
  const bubble = (role) => ({ alignSelf: role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '72%', padding: '12px 16px', borderRadius: role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', background: role === 'user' ? '#6366F1' : '#F3F4F6', color: role === 'user' ? '#fff' : '#111827', fontSize: 14, lineHeight: 1.55, marginBottom: 12 });

  return (
    <AdminLayout>
      <div style={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
        {/* Sidebar */}
        <div style={sb}>
          <div style={{ padding: '0 16px 16px' }}>
            <button onClick={startNew} style={{ width: '100%', padding: '10px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
              + New Chat
            </button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {conversations.map(c => (
              <div key={c._id} onClick={() => openConversation(c)}
                style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #E5E7EB', background: activeConv?._id === c._id ? '#E0E7FF' : 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{c.title || 'Untitled'}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF' }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                </div>
                <button onClick={(e) => deleteConv(c._id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16 }}>×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {!activeConv ? (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#6B7280' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🤖</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>AI Enterprise Copilot</div>
              <div style={{ fontSize: 14, marginBottom: 24 }}>Select a conversation or start a new chat</div>
              <button onClick={startNew} style={{ padding: '10px 20px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
                Start Chat
              </button>
              {prompts.length > 0 && (
                <div style={{ marginTop: 32, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 480 }}>
                  {prompts.map(p => (
                    <button key={p._id} onClick={() => { startNew().then(() => setInput(p.promptText)); }}
                      style={{ padding: '6px 12px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 9999, cursor: 'pointer', fontSize: 13, color: '#374151' }}>
                      {p.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #E5E7EB', fontWeight: 600, fontSize: 15 }}>
                {activeConv.title}
              </div>
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                {messages.map((m, i) => (
                  <div key={i} style={bubble(m.role)}>
                    {m.content}
                    {m.data && m.role === 'assistant' && (
                      <div style={{ marginTop: 8, fontSize: 11, opacity: 0.7 }}>
                        {JSON.stringify(m.data).slice(0, 100)}…
                      </div>
                    )}
                  </div>
                ))}
                {sending && <div style={{ ...bubble('assistant'), opacity: 0.6 }}>Thinking…</div>}
                <div ref={bottomRef} />
              </div>
              {prompts.length > 0 && (
                <div style={{ padding: '8px 24px', display: 'flex', gap: 6, overflowX: 'auto', borderTop: '1px solid #F3F4F6' }}>
                  {prompts.slice(0, 5).map(p => (
                    <button key={p._id} onClick={() => usePrompt(p)} style={{ whiteSpace: 'nowrap', padding: '4px 10px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 9999, cursor: 'pointer', fontSize: 12, color: '#374151' }}>
                      {p.title}
                    </button>
                  ))}
                </div>
              )}
              <div style={{ padding: '16px 24px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: 12 }}>
                <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Ask anything about your ERP data…"
                  style={{ flex: 1, padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none' }} />
                <button onClick={send} disabled={sending || !input.trim()}
                  style={{ padding: '12px 20px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, opacity: (sending || !input.trim()) ? 0.6 : 1 }}>
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
