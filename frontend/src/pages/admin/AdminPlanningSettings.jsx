import React, { useEffect, useState } from 'react';
import { FiPlus, FiTrash2, FiAlertTriangle, FiCheck } from 'react-icons/fi';
import DataTable   from '../../components/shared/DataTable';
import StatusBadge from '../../components/shared/StatusBadge';
import { getConstraints, createConstraint, updateConstraint, deleteConstraint, getHolidays, createHoliday, updateHoliday, deleteHoliday } from '../../services/planningAPI';
import { getFactories } from '../../services/manufacturingAPI';

const CONSTRAINT_TYPES = ['capacity','material','shift','maintenance','operator','holiday'];
const SEVERITY_COLORS  = { low: '#10B981', medium: '#F59E0B', high: '#F97316', critical: '#EF4444' };

const EMPTY_CON = { factory: '', constraintType: 'capacity', title: '', description: '', value: 0, unit: '', severity: 'medium', validFrom: '', validTo: '', isActive: true };
const EMPTY_HOL = { name: '', date: '', type: 'national', recurring: false, notes: '' };

export default function AdminPlanningSettings() {
  const [tab,       setTab]       = useState('constraints');
  const [constraints,setCon]      = useState([]);
  const [holidays,  setHol]       = useState([]);
  const [factories, setFact]      = useState([]);
  const [factoryF,  setFactoryF]  = useState('');
  const [loading,   setLoad]      = useState(true);
  const [showCon,   setShowCon]   = useState(false);
  const [showHol,   setShowHol]   = useState(false);
  const [conForm,   setConForm]   = useState(EMPTY_CON);
  const [holForm,   setHolForm]   = useState(EMPTY_HOL);
  const [saving,    setSaving]    = useState(false);

  const load = () => {
    setLoad(true);
    const p = { factory: factoryF, limit: 50 };
    Promise.all([getConstraints(p), getHolidays(p)])
      .then(([c, h]) => { setCon(c.data.data || []); setHol(h.data.data || []); })
      .catch(console.error)
      .finally(() => setLoad(false));
  };

  useEffect(() => { load(); }, [factoryF]);
  useEffect(() => {
    getFactories({ limit: 100 }).then(r => setFact(r.data.data || [])).catch(() => {});
  }, []);

  const handleSaveCon = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createConstraint(conForm); setShowCon(false); setConForm(EMPTY_CON); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelCon = async (id) => {
    if (!window.confirm('Delete this constraint?')) return;
    try { await deleteConstraint(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const toggleConActive = async (c) => {
    try { await updateConstraint(c._id, { isActive: !c.isActive }); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const handleSaveHol = async (e) => {
    e.preventDefault(); setSaving(true);
    try { await createHoliday({ ...holForm, factories: factoryF ? [factoryF] : [] }); setShowHol(false); setHolForm(EMPTY_HOL); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelHol = async (id) => {
    if (!window.confirm('Delete this holiday?')) return;
    try { await deleteHoliday(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const conColumns = [
    { key: 'title', header: 'Constraint', render: (v,r) => <><span style={{ fontWeight:700,color:'#111827' }}>{v}</span>{r.description&&<div style={{fontSize:11,color:'#9CA3AF'}}>{r.description}</div>}</> },
    { key: 'constraintType', header: 'Type', render: v => <span style={{ fontSize:11,fontWeight:700,color:'#6B7280',textTransform:'capitalize',background:'#F3F4F6',padding:'2px 8px',borderRadius:6 }}>{v}</span> },
    { key: 'severity', header: 'Severity', render: v => <span style={{ fontSize:11,fontWeight:700,color:SEVERITY_COLORS[v]||'#374151',textTransform:'capitalize' }}>{v}</span> },
    { key: 'value', header: 'Value', align: 'center', render: (v,r) => v ? `${v} ${r.unit||''}`.trim() : '—' },
    { key: 'validFrom', header: 'Valid From', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: 'validTo',   header: 'Valid To',   render: v => v ? new Date(v).toLocaleDateString() : 'Ongoing' },
    { key: 'isActive', header: 'Active', align: 'center', render: (v,r) => (
      <button onClick={() => toggleConActive(r)} style={{ padding:'3px 10px',background:v?'#D1FAE5':'#F3F4F6',color:v?'#065F46':'#9CA3AF',border:'none',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer' }}>{v?'Active':'Inactive'}</button>
    )},
    { key: '_id', header: '', align: 'center', width: 60, render: id => (
      <button onClick={() => handleDelCon(id)} style={{ padding:'4px 8px',background:'#FEF2F2',color:'#EF4444',border:'none',borderRadius:6,fontSize:11,cursor:'pointer' }}><FiTrash2 size={11} /></button>
    )},
  ];

  const holColumns = [
    { key: 'name', header: 'Holiday', render: v => <span style={{ fontWeight:700,color:'#111827' }}>{v}</span> },
    { key: 'date', header: 'Date', render: v => v ? new Date(v).toLocaleDateString('en-IN', { weekday:'short', year:'numeric', month:'long', day:'numeric' }) : '—' },
    { key: 'type', header: 'Type', render: v => <span style={{ fontSize:11,fontWeight:700,color:'#6B7280',textTransform:'capitalize',background:'#F3F4F6',padding:'2px 8px',borderRadius:6 }}>{v}</span> },
    { key: 'recurring', header: 'Recurring', align: 'center', render: v => v ? <FiCheck size={14} color="#10B981" /> : '—' },
    { key: 'notes', header: 'Notes', render: v => v || '—' },
    { key: '_id', header: '', align: 'center', width: 60, render: id => (
      <button onClick={() => handleDelHol(id)} style={{ padding:'4px 8px',background:'#FEF2F2',color:'#EF4444',border:'none',borderRadius:6,fontSize:11,cursor:'pointer' }}><FiTrash2 size={11} /></button>
    )},
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Planning Settings</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          {tab === 'constraints' && (
            <button onClick={() => { setConForm(EMPTY_CON); setShowCon(true); }} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 18px',background:'#FF7A00',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer' }}>
              <FiPlus size={14} /> Add Constraint
            </button>
          )}
          {tab === 'holidays' && (
            <button onClick={() => { setHolForm(EMPTY_HOL); setShowHol(true); }} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 18px',background:'#FF7A00',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer' }}>
              <FiPlus size={14} /> Add Holiday
            </button>
          )}
        </div>
      </div>

      {/* Factory filter */}
      <div style={{ marginBottom: 20 }}>
        <select value={factoryF} onChange={e => setFactoryF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="">All Factories</option>
          {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid #E5E7EB', marginBottom: 20, gap: 0 }}>
        {[{ key: 'constraints', label: `Planning Constraints (${constraints.length})` }, { key: 'holidays', label: `Holiday Calendar (${holidays.length})` }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ padding: '10px 20px', background: 'none', border: 'none', borderBottom: tab === t.key ? '3px solid #FF7A00' : '3px solid transparent', marginBottom: -2, fontSize: 13, fontWeight: 700, color: tab === t.key ? '#FF7A00' : '#6B7280', cursor: 'pointer' }}>{t.label}</button>
        ))}
      </div>

      {/* Critical constraints banner */}
      {tab === 'constraints' && constraints.filter(c => c.severity === 'critical' && c.isActive).length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 10, padding: '12px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FiAlertTriangle color="#EF4444" size={16} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#991B1B' }}>{constraints.filter(c => c.severity === 'critical' && c.isActive).length} critical constraint(s) active — review immediately</span>
        </div>
      )}

      {tab === 'constraints' && <DataTable columns={conColumns} data={constraints} loading={loading} emptyMessage="No planning constraints defined" />}
      {tab === 'holidays'    && <DataTable columns={holColumns}  data={holidays}    loading={loading} emptyMessage="No holidays defined. Add holidays to block production on non-working days." />}

      {/* Add Constraint Modal */}
      {showCon && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <form onSubmit={handleSaveCon} style={{ background:'#fff',borderRadius:16,padding:32,width:520,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 25px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin:'0 0 20px',fontSize:18,fontWeight:700,color:'#111827' }}>Add Planning Constraint</h2>
            <div style={{ display:'grid',gap:14 }}>
              <div>
                <label style={{ display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4 }}>Factory *</label>
                <select required value={conForm.factory} onChange={e=>setConForm(f=>({...f,factory:e.target.value}))} style={{ width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13 }}>
                  <option value="">Select…</option>
                  {factories.map(f=><option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
              </div>
              <div><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>Title *</label><input required type="text" value={conForm.title} onChange={e=>setConForm(f=>({...f,title:e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,boxSizing:'border-box'}}/></div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>Type *</label><select required value={conForm.constraintType} onChange={e=>setConForm(f=>({...f,constraintType:e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13}}>{CONSTRAINT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                <div><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>Severity</label><select value={conForm.severity} onChange={e=>setConForm(f=>({...f,severity:e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13}}>{['low','medium','high','critical'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12 }}>
                <div><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>Value</label><input type="number" min={0} value={conForm.value} onChange={e=>setConForm(f=>({...f,value:+e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,boxSizing:'border-box'}}/></div>
                <div><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>Unit</label><input type="text" value={conForm.unit} onChange={e=>setConForm(f=>({...f,unit:e.target.value}))} placeholder="hrs, units…" style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,boxSizing:'border-box'}}/></div>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {[{l:'Valid From *',k:'validFrom'},{l:'Valid To',k:'validTo'}].map(({l,k})=>(
                  <div key={k}><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>{l}</label><input type="date" required={k==='validFrom'} value={conForm[k]} onChange={e=>setConForm(f=>({...f,[k]:e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,boxSizing:'border-box'}}/></div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:20 }}>
              <button type="button" onClick={()=>setShowCon(false)} style={{padding:'9px 20px',background:'#F3F4F6',color:'#374151',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',fontSize:13}}>Cancel</button>
              <button type="submit" disabled={saving} style={{padding:'9px 20px',background:'#FF7A00',color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontSize:13,opacity:saving?0.6:1}}>{saving?'Saving…':'Save'}</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Holiday Modal */}
      {showHol && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <form onSubmit={handleSaveHol} style={{ background:'#fff',borderRadius:16,padding:32,width:440,boxShadow:'0 25px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin:'0 0 20px',fontSize:18,fontWeight:700,color:'#111827' }}>Add Holiday</h2>
            <div style={{ display:'grid',gap:14 }}>
              <div><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>Holiday Name *</label><input required type="text" value={holForm.name} onChange={e=>setHolForm(f=>({...f,name:e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,boxSizing:'border-box'}}/></div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                <div><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>Date *</label><input required type="date" value={holForm.date} onChange={e=>setHolForm(f=>({...f,date:e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,boxSizing:'border-box'}}/></div>
                <div><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>Type</label><select value={holForm.type} onChange={e=>setHolForm(f=>({...f,type:e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13}}>{['national','regional','factory','maintenance'].map(t=><option key={t} value={t}>{t}</option>)}</select></div>
              </div>
              <label style={{ display:'flex',alignItems:'center',gap:8,fontSize:13,fontWeight:600,color:'#374151',cursor:'pointer' }}><input type="checkbox" checked={holForm.recurring} onChange={e=>setHolForm(f=>({...f,recurring:e.target.checked}))} /> Recurring every year</label>
              <div><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>Notes</label><input type="text" value={holForm.notes} onChange={e=>setHolForm(f=>({...f,notes:e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,boxSizing:'border-box'}}/></div>
            </div>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:20 }}>
              <button type="button" onClick={()=>setShowHol(false)} style={{padding:'9px 20px',background:'#F3F4F6',color:'#374151',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',fontSize:13}}>Cancel</button>
              <button type="submit" disabled={saving} style={{padding:'9px 20px',background:'#FF7A00',color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontSize:13,opacity:saving?0.6:1}}>{saving?'Saving…':'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
