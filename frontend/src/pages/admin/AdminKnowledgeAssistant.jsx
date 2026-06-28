import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from './AdminLayout';
import * as api from '../../services/copilotAPI';

const CATEGORIES = ['faq','process','policy','metric','formula','troubleshoot','how_to','general'];

export default function AdminKnowledgeAssistant() {
  const [items, setItems]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [query, setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState({ category: '', isVerified: '' });
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]     = useState({ category: 'faq', question: '', answer: '', keywords: '', module: '', isVerified: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg]       = useState('');

  const load = useCallback(() => {
    const p = {};
    if (filter.category)   p.category   = filter.category;
    if (filter.isVerified) p.isVerified = filter.isVerified;
    api.listKnowledge(p).then(r => { setItems(r.data?.data || []); setTotal(r.data?.total || 0); }).catch(() => {});
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function search() {
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    const r = await api.searchKnowledge(query).catch(() => null);
    setResults(r?.data || []);
    setSearching(false);
  }

  async function seed() {
    await api.seedKnowledge().catch(() => {});
    setMsg('Built-in knowledge seeded');
    load();
    setTimeout(() => setMsg(''), 3000);
  }

  async function save() {
    if (!form.question || !form.answer) return;
    setSaving(true);
    try {
      const data = { ...form, keywords: form.keywords.split(',').map(k => k.trim()).filter(Boolean) };
      await api.createKnowledge(data);
      setMsg('Knowledge entry created');
      setShowForm(false);
      setForm({ category: 'faq', question: '', answer: '', keywords: '', module: '', isVerified: false });
      load();
    } catch { setMsg('Error saving entry'); }
    setSaving(false);
    setTimeout(() => setMsg(''), 3000);
  }

  async function remove(id, e) {
    e.stopPropagation();
    await api.deleteKnowledge(id).catch(() => {});
    load();
    if (selected?._id === id) setSelected(null);
  }

  async function view(k) {
    await api.incrementKnowledgeUse(k._id).catch(() => {});
    setSelected(k);
  }

  const displayItems = results.length > 0 ? results : items;
  const card = { background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12, padding: '20px 24px', marginBottom: 20 };
  const inp  = { padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 14, width: '100%', boxSizing: 'border-box' };

  return (
    <AdminLayout>
      <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 4px' }}>Knowledge Assistant</h1>
            <p style={{ color: '#6B7280', margin: 0 }}>{total} entries · ERP knowledge base</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={seed} style={{ padding: '10px 18px', background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>Seed Knowledge</button>
            <button onClick={() => setShowForm(p => !p)} style={{ padding: '10px 18px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>+ Add Entry</button>
          </div>
        </div>

        {msg && <div style={{ padding: '10px 16px', background: '#D1FAE5', borderRadius: 8, marginBottom: 16, fontSize: 14, color: '#065F46' }}>{msg}</div>}

        {/* Search Bar */}
        <div style={{ ...card }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && search()}
              placeholder="Search the knowledge base… (press Enter)"
              style={{ flex: 1, padding: '12px 16px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 14, outline: 'none' }} />
            <button onClick={search} disabled={searching} style={{ padding: '12px 20px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600 }}>
              {searching ? '…' : 'Search'}
            </button>
            {results.length > 0 && <button onClick={() => { setResults([]); setQuery(''); }} style={{ padding: '12px 16px', background: '#F3F4F6', border: 'none', borderRadius: 8, cursor: 'pointer' }}>Clear</button>}
          </div>
          {results.length > 0 && <div style={{ marginTop: 10, fontSize: 13, color: '#6B7280' }}>{results.length} result(s) for "{query}"</div>}
        </div>

        {/* Create Form */}
        {showForm && (
          <div style={{ ...card, background: '#F0F0FF' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 600 }}>New Knowledge Entry</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div><label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>Category</label>
                <select style={inp} value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>Module</label><input style={inp} value={form.module} onChange={e => setForm(p => ({ ...p, module: e.target.value }))} placeholder="e.g. procurement, hr, finance" /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>Question *</label><input style={inp} value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} placeholder="What is the question?" /></div>
              <div style={{ gridColumn: '1/-1' }}><label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>Answer *</label><textarea style={{ ...inp, minHeight: 80, resize: 'vertical' }} value={form.answer} onChange={e => setForm(p => ({ ...p, answer: e.target.value }))} placeholder="Provide the answer…" /></div>
              <div><label style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, display: 'block' }}>Keywords (comma-separated)</label><input style={inp} value={form.keywords} onChange={e => setForm(p => ({ ...p, keywords: e.target.value }))} placeholder="purchase order, PO, procurement" /></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" id="verified" checked={form.isVerified} onChange={e => setForm(p => ({ ...p, isVerified: e.target.checked }))} />
                <label htmlFor="verified" style={{ fontSize: 14 }}>Mark as Verified</label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={save} disabled={saving || !form.question || !form.answer} style={{ padding: '8px 18px', background: '#6366F1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontWeight: 600, opacity: (saving || !form.question || !form.answer) ? 0.6 : 1 }}>Save</button>
              <button onClick={() => setShowForm(false)} style={{ padding: '8px 18px', background: '#F3F4F6', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <select value={filter.category} onChange={e => setFilter(p => ({ ...p, category: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }}>
            <option value="">All Categories</option>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filter.isVerified} onChange={e => setFilter(p => ({ ...p, isVerified: e.target.value }))} style={{ padding: '8px 12px', border: '1px solid #D1D5DB', borderRadius: 6, fontSize: 13 }}>
            <option value="">All</option><option value="true">Verified Only</option><option value="false">Unverified</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 420px' : '1fr', gap: 24 }}>
          {/* List */}
          <div style={card}>
            {displayItems.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: '#9CA3AF' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📚</div>
                <div>No entries found. Seed built-in knowledge or add your own.</div>
              </div>
            ) : displayItems.map(k => (
              <div key={k._id} onClick={() => view(k)}
                style={{ padding: '12px 14px', marginBottom: 8, borderRadius: 8, border: `1px solid ${selected?._id === k._id ? '#6366F1' : '#E5E7EB'}`, cursor: 'pointer', background: selected?._id === k._id ? '#F5F3FF' : '#F9FAFB', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: '#EDE9FE', color: '#7C3AED', fontWeight: 600 }}>{k.category}</span>
                    {k.isVerified && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: '#D1FAE5', color: '#059669', fontWeight: 600 }}>✓ Verified</span>}
                    {k.module && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 9999, background: '#F3F4F6', color: '#6B7280' }}>{k.module}</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{k.question}</div>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{k.answer?.slice(0, 80)}…</div>
                </div>
                <button onClick={(e) => remove(k._id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9CA3AF', fontSize: 16, padding: '0 4px' }}>×</button>
              </div>
            ))}
          </div>

          {/* Detail */}
          {selected && (
            <div style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 9999, background: '#EDE9FE', color: '#7C3AED', fontWeight: 600 }}>{selected.category}</span>
                  {selected.isVerified && <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 9999, background: '#D1FAE5', color: '#059669', fontWeight: 600 }}>✓ Verified</span>}
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: '#9CA3AF' }}>×</button>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px' }}>{selected.question}</h3>
              <div style={{ fontSize: 14, lineHeight: 1.7, color: '#374151', padding: '16px', background: '#F9FAFB', borderRadius: 8, marginBottom: 14 }}>
                {selected.answer}
              </div>
              {selected.keywords?.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 6 }}>Keywords</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {selected.keywords.map((k, i) => <span key={i} style={{ fontSize: 12, padding: '3px 8px', background: '#F3F4F6', borderRadius: 9999, color: '#374151' }}>{k}</span>)}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 14, fontSize: 12, color: '#9CA3AF' }}>Used {selected.useCount || 0} times · {selected.module || 'No module'}</div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
