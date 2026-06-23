import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { fetchTaxCodes, createTaxCode, updateTaxCode, deleteTaxCode } from '../../services/taxAPI';

const TAX_TYPES = ['GST','TDS','TCS','VAT','excise','custom'];
const EMPTY = { code: '', name: '', taxType: 'GST', description: '', isActive: true };

export default function AdminTaxCodes() {
  const [rows, setRows]     = useState([]);
  const [modal, setModal]   = useState(null);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState('');

  const load = useCallback(async () => {
    try { const r = await fetchTaxCodes(); setRows(r.data.data || []); }
    catch(e) { console.error(e); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open = (row) => { setForm(row ? { ...row } : EMPTY); setModal(row || 'new'); };
  const close = () => setModal(null);
  const set = (k,v) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'new') await createTaxCode(form);
      else await updateTaxCode(modal._id, form);
      await load(); close();
    } catch(e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete tax code?')) return;
    try { await deleteTaxCode(id); await load(); }
    catch(e) { alert(e.response?.data?.message || 'Error'); }
  };

  const filtered = rows.filter(r => !filter || r.code.includes(filter.toUpperCase()) || r.name.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1a1a2e' }}>Tax Codes</h2>
        <button onClick={() => open(null)} style={{ display:'flex', alignItems:'center', gap:8, background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:600, cursor:'pointer', fontSize:14 }}><FiPlus />Add Code</button>
      </div>

      <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0f0f0' }}>
          <input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Search code or name…" style={{ padding:'8px 14px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, width:260 }} />
        </div>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
          <thead><tr style={{ background:'#fafafa' }}>{['Code','Name','Type','Active',''].map(h=><th key={h} style={{ textAlign:'left', padding:'12px 16px', color:'#888', fontWeight:600 }}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(r => (
              <tr key={r._id} style={{ borderTop:'1px solid #f5f5f5' }}>
                <td style={{ padding:'12px 16px', fontWeight:600 }}>{r.code}</td>
                <td style={{ padding:'12px 16px' }}>{r.name}</td>
                <td style={{ padding:'12px 16px' }}><span style={{ background:'#3498db20', color:'#3498db', borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:600 }}>{r.taxType}</span></td>
                <td style={{ padding:'12px 16px' }}><span style={{ background:r.isActive?'#27ae6020':'#e74c3c20', color:r.isActive?'#27ae60':'#e74c3c', borderRadius:6, padding:'2px 8px', fontSize:12, fontWeight:600 }}>{r.isActive?'Active':'Inactive'}</span></td>
                <td style={{ padding:'12px 16px' }}>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={()=>open(r)} style={{ background:'none', border:'none', cursor:'pointer', color:'#3498db' }}><FiEdit2 /></button>
                    <button onClick={()=>remove(r._id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#e74c3c' }}><FiTrash2 /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} style={{ padding:32, textAlign:'center', color:'#aaa' }}>No tax codes found.</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:440, maxWidth:'95vw', boxShadow:'0 8px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ margin:'0 0 24px', fontWeight:700 }}>{modal==='new'?'Add Tax Code':'Edit Tax Code'}</h3>
            {[['code','Code (e.g. GST_18)','text'],['name','Name','text'],['description','Description','text']].map(([k,ph,t])=>(
              <div key={k} style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>{ph}</label>
                <input value={form[k]||''} onChange={e=>set(k,e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>Tax Type</label>
              <select value={form.taxType} onChange={e=>set('taxType',e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
                {TAX_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, marginBottom:24, cursor:'pointer' }}>
              <input type="checkbox" checked={!!form.isActive} onChange={e=>set('isActive',e.target.checked)} />Active
            </label>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={close} style={{ padding:'9px 20px', border:'1px solid #e0e0e0', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding:'9px 20px', border:'none', borderRadius:8, background:'var(--accent)', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 }}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
