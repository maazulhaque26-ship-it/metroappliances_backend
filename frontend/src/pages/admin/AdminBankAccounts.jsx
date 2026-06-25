import React, { useEffect, useState } from 'react';
import { fetchBankAccounts, createBankAccount, updateBankAccount, fetchBanks } from '../../services/bankingAPI';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '9px 20px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 });

const ACCT_TYPES = ['current', 'savings', 'overdraft', 'cash_credit', 'fixed_deposit', 'nre', 'nro'];

export default function AdminBankAccounts() {
  const [accounts, setAccounts] = useState([]);
  const [banks, setBanks]       = useState([]);
  const [modal, setModal]       = useState(null);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [filterBank, setFilter] = useState('');

  const load = () => Promise.all([
    fetchBankAccounts({ bank: filterBank || undefined }).then(r => setAccounts(r.data.data || [])),
    fetchBanks({}).then(r => setBanks(r.data.data || [])),
  ]);
  useEffect(() => { load(); }, [filterBank]);

  const save = async () => {
    setSaving(true);
    try {
      if (form._id) await updateBankAccount(form._id, form);
      else          await createBankAccount(form);
      setModal(null); setForm({}); load();
    } catch (e) { alert(e.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Bank Accounts</h2>
        <button style={btn('var(--accent)')} onClick={() => { setForm({}); setModal('form'); }}>+ Add Account</button>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
        <select style={{ ...inp, maxWidth: 220 }} value={filterBank} onChange={e => setFilter(e.target.value)}>
          <option value="">All Banks</option>
          {banks.map(b => <option key={b._id} value={b._id}>{b.bankName}</option>)}
        </select>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
        {accounts.map(a => (
          <div key={a._id} style={{ background: '#fff', borderRadius: 12, padding: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', borderLeft: `4px solid ${a.isActive ? '#27ae60' : '#e74c3c'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{a.accountName}</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{a.accountNumber} · {a.accountType}</div>
                <div style={{ fontSize: 12, color: '#888' }}>{a.bank?.bankName || a.bankName || '—'}</div>
              </div>
              <button onClick={() => { setForm({...a, bank: a.bank?._id||a.bank}); setModal('form'); }} style={{ ...btn('#3498db'), padding: '6px 14px', fontSize: 12 }}>Edit</button>
            </div>
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #f5f5f5' }}>
              <div style={{ fontSize: 12, color: '#888' }}>Current Balance</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: (a.currentBalance || 0) >= 0 ? '#27ae60' : '#e74c3c' }}>{fmt(a.currentBalance)}</div>
            </div>
            <div style={{ marginTop: 8, display: 'flex', gap: 16 }}>
              <div><div style={{ fontSize: 11, color: '#aaa' }}>Currency</div><div style={{ fontSize: 13, fontWeight: 600 }}>{a.currency}</div></div>
              <div><div style={{ fontSize: 11, color: '#aaa' }}>OD Limit</div><div style={{ fontSize: 13, fontWeight: 600 }}>{fmt(a.overdraftLimit)}</div></div>
              {a.isPrimary && <span style={{ background: '#3498db20', color: '#3498db', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, alignSelf: 'center' }}>Primary</span>}
            </div>
          </div>
        ))}
        {!accounts.length && <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#aaa', padding: 60 }}>No bank accounts found</div>}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 32, width: 500, maxHeight: '85vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>{form._id ? 'Edit' : 'Add'} Bank Account</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['accountNumber','Account Number *'],['accountName','Account Name *'],['bankName','Bank Name'],['ifscCode','IFSC Code']].map(([k,l])=>(
                <div key={k}>
                  <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                  <input style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
                </div>
              ))}
              <div>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Bank</label>
                <select style={inp} value={form.bank||''} onChange={e=>setForm(f=>({...f,bank:e.target.value}))}>
                  <option value="">Select Bank</option>
                  {banks.map(b=><option key={b._id} value={b._id}>{b.bankName}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Account Type</label>
                <select style={inp} value={form.accountType||'current'} onChange={e=>setForm(f=>({...f,accountType:e.target.value}))}>
                  {ACCT_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>Currency</label>
                <input style={inp} value={form.currency||'INR'} onChange={e=>setForm(f=>({...f,currency:e.target.value}))} />
              </div>
              {[['openingBalance','Opening Balance'],['currentBalance','Current Balance'],['overdraftLimit','OD Limit']].map(([k,l])=>(
                <div key={k}>
                  <label style={{ fontSize:12,color:'#888',display:'block',marginBottom:4 }}>{l}</label>
                  <input type="number" style={inp} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button style={btn('#888')} onClick={() => { setModal(null); setForm({}); }}>Cancel</button>
              <button style={btn('var(--accent)')} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
