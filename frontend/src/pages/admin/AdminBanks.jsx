import React, { useEffect, useState } from 'react';
import { fetchBanks, createBank, updateBank, deleteBank, fetchBranches, createBranch } from '../../services/bankingAPI';

const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '9px 20px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 });

export default function AdminBanks() {
  const [banks, setBanks]         = useState([]);
  const [branches, setBranches]   = useState([]);
  const [tab, setTab]             = useState('banks');
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState({});
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');

  const load = () => Promise.all([
    fetchBanks({ search }).then(r => setBanks(r.data.data || [])),
    fetchBranches().then(r => setBranches(r.data.data || [])),
  ]);
  useEffect(() => { load(); }, [search]);

  const save = async () => {
    setSaving(true);
    try {
      if (modal === 'editBank') await updateBank(form._id, form);
      else if (modal === 'newBank') await createBank(form);
      else if (modal === 'newBranch') await createBranch(form);
      setModal(null); setForm({});
      load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this bank?')) return;
    await deleteBank(id); load();
  };

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Banks & Branches</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('newBank'); }}>+ Add Bank</button>
          <button style={btn('#3498db')} onClick={() => { setForm({}); setModal('newBranch'); }}>+ Add Branch</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #f0f0f0', marginBottom: 20 }}>
        {[['banks','Banks'],['branches','Branches']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{ padding: '9px 22px', border: 'none', background: 'none', fontWeight: tab===k?700:400, color: tab===k?'var(--accent)':'#888', borderBottom: tab===k?'2px solid var(--accent)':'2px solid transparent', cursor: 'pointer', fontSize: 14, marginBottom: -2 }}>{l}</button>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <input placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} style={{ ...inp, maxWidth: 280 }} />
      </div>

      {tab === 'banks' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#fafafa' }}>{['Code','Name','Swift','Country','Currency','Status','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {banks.map(b => (
                <tr key={b._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                  <td style={{ padding:'9px 16px',fontFamily:'monospace',fontWeight:600 }}>{b.bankCode}</td>
                  <td style={{ padding:'9px 16px' }}>{b.bankName}</td>
                  <td style={{ padding:'9px 16px',fontSize:11,color:'#888' }}>{b.swiftCode||'—'}</td>
                  <td style={{ padding:'9px 16px' }}>{b.country}</td>
                  <td style={{ padding:'9px 16px' }}>{b.currency}</td>
                  <td style={{ padding:'9px 16px' }}><span style={{ background:b.isActive?'#27ae6020':'#e74c3c20',color:b.isActive?'#27ae60':'#e74c3c',borderRadius:6,padding:'2px 8px',fontSize:11,fontWeight:600 }}>{b.isActive?'Active':'Inactive'}</span></td>
                  <td style={{ padding:'9px 16px',display:'flex',gap:8 }}>
                    <button onClick={()=>{setForm({...b});setModal('editBank');}} style={btn('#3498db')}>Edit</button>
                    <button onClick={()=>del(b._id)} style={btn('#e74c3c')}>Del</button>
                  </td>
                </tr>
              ))}
              {!banks.length && <tr><td colSpan={7} style={{padding:40,textAlign:'center',color:'#aaa'}}>No banks found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'branches' && (
        <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead><tr style={{ background: '#fafafa' }}>{['Bank','Branch','IFSC','City','State','Actions'].map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600 }}>{h}</th>)}</tr></thead>
            <tbody>
              {branches.map(b => (
                <tr key={b._id} style={{ borderTop: '1px solid #f5f5f5' }}>
                  <td style={{ padding:'9px 16px' }}>{b.bank?.bankName||'—'}</td>
                  <td style={{ padding:'9px 16px',fontWeight:600 }}>{b.branchName}</td>
                  <td style={{ padding:'9px 16px',fontFamily:'monospace',fontSize:11 }}>{b.ifscCode||'—'}</td>
                  <td style={{ padding:'9px 16px' }}>{b.city||'—'}</td>
                  <td style={{ padding:'9px 16px' }}>{b.state||'—'}</td>
                  <td style={{ padding:'9px 16px' }}><button onClick={()=>{setForm({...b,bank:b.bank?._id||b.bank});setModal('editBranch');}} style={btn('#3498db')}>Edit</button></td>
                </tr>
              ))}
              {!branches.length && <tr><td colSpan={6} style={{padding:40,textAlign:'center',color:'#aaa'}}>No branches</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:32,width:480,maxHeight:'80vh',overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 20px',fontSize:16,fontWeight:700 }}>{modal==='newBank'?'Add Bank':modal==='editBank'?'Edit Bank':'Add Branch'}</h3>
            {(modal==='newBank'||modal==='editBank') && <>
              {[['bankCode','Bank Code *'],['bankName','Bank Name *'],['shortName','Short Name'],['swiftCode','SWIFT Code'],['country','Country'],['currency','Currency'],['contactPhone','Phone'],['contactEmail','Email'],['website','Website']].map(([k,l])=>(
                <div key={k} style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                  <input style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
                </div>
              ))}
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Active</label>
                <select style={inp} value={form.isActive!==false?'true':'false'} onChange={e=>setForm(f=>({...f,isActive:e.target.value==='true'}))}>
                  <option value="true">Active</option><option value="false">Inactive</option>
                </select>
              </div>
            </>}
            {modal==='newBranch' && <>
              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Bank *</label>
                <select style={inp} value={form.bank||''} onChange={e=>setForm(f=>({...f,bank:e.target.value}))}>
                  <option value="">Select bank</option>
                  {banks.map(b=><option key={b._id} value={b._id}>{b.bankName}</option>)}
                </select>
              </div>
              {[['branchName','Branch Name *'],['ifscCode','IFSC Code'],['micrCode','MICR Code'],['city','City'],['state','State'],['pinCode','Pin Code'],['phone','Phone'],['email','Email']].map(([k,l])=>(
                <div key={k} style={{ marginBottom:14 }}>
                  <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                  <input style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
                </div>
              ))}
            </>}
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:20 }}>
              <button style={btn('#888')} onClick={()=>{setModal(null);setForm({});}}>Cancel</button>
              <button style={btn('var(--accent)')} onClick={save} disabled={saving}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
