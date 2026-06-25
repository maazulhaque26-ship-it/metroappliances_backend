import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiBarChart2 } from 'react-icons/fi';
import StatusBadge from '../../components/shared/StatusBadge';
import DataTable   from '../../components/shared/DataTable';
import { getScenarios, createScenario, updateScenario, deleteScenario } from '../../services/planningAPI';
import { getFactories } from '../../services/manufacturingAPI';

const EMPTY = { name: '', description: '', factory: '', status: 'draft', targetOutput: 0, efficiencyFactor: 100, extraShifts: 0, maintenanceBuffer: 5, materialAvailability: 100, lateOrderRisk: 'low', assumptions: '', notes: '' };
const RISK_COLOR = { low: '#10B981', medium: '#F59E0B', high: '#EF4444' };

export default function AdminPlanningScenarios() {
  const [scenarios, setScenarios] = useState([]);
  const [factories, setFact]      = useState([]);
  const [factoryF,  setFactoryF]  = useState('');
  const [loading,   setLoad]      = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editing,   setEditing]   = useState(null);
  const [form,      setForm]      = useState(EMPTY);
  const [saving,    setSaving]    = useState(false);
  const [compare,   setCompare]   = useState([]);

  const load = useCallback(() => {
    setLoad(true);
    getScenarios({ factory: factoryF, limit: 50 })
      .then(r => setScenarios(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [factoryF]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getFactories({ limit: 100 }).then(r => setFact(r.data.data || [])).catch(() => {});
  }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit   = (s) => { setEditing(s._id); setForm({ ...s, factory: s.factory?._id || s.factory || '' }); setShowForm(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (editing) await updateScenario(editing, form);
      else         await createScenario(form);
      setShowForm(false); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this scenario?')) return;
    try { await deleteScenario(id); load(); }
    catch (err) { alert(err.response?.data?.message || 'Error'); }
  };

  const toggleCompare = (s) => {
    setCompare(c => c.find(x => x._id === s._id) ? c.filter(x => x._id !== s._id) : [...c.slice(-2), s]);
  };

  const columns = [
    { key: 'name', header: 'Scenario', render: (v,r) => <span style={{ fontWeight: 700, color: '#111827' }}>{v}</span> },
    { key: 'factory',    header: 'Factory', render: v => v?.name || '—' },
    { key: 'status',     header: 'Status',  render: v => <StatusBadge status={v} /> },
    { key: 'targetOutput',      header: 'Target',       align: 'center', render: v => (v||0).toLocaleString() },
    { key: 'efficiencyFactor',  header: 'Efficiency',   align: 'center', render: v => `${v||100}%` },
    { key: 'extraShifts',       header: 'Extra Shifts', align: 'center' },
    { key: 'maintenanceBuffer', header: 'Maint. Buffer',align: 'center', render: v => `${v||0}%` },
    { key: 'lateOrderRisk', header: 'Risk', render: v => (
      <span style={{ fontSize:11,fontWeight:700,color:RISK_COLOR[v]||'#374151',textTransform:'capitalize' }}>{v}</span>
    )},
    { key: '_id', header: 'Actions', align: 'center', width: 160, render: (id, r) => (
      <div style={{ display:'flex',gap:6,justifyContent:'center' }}>
        <button onClick={() => toggleCompare(r)} style={{ padding:'4px 8px',background: compare.find(x=>x._id===id)?'#EDE9FE':'#F3F4F6',color:compare.find(x=>x._id===id)?'#5B21B6':'#374151',border:'none',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer' }}>
          {compare.find(x=>x._id===id) ? '✓ Compare' : 'Compare'}
        </button>
        <button onClick={() => openEdit(r)} style={{ padding:'4px 8px',background:'#EFF6FF',color:'#3B82F6',border:'none',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer' }}><FiEdit2 size={11} /></button>
        <button onClick={() => handleDelete(id)} style={{ padding:'4px 8px',background:'#FEF2F2',color:'#EF4444',border:'none',borderRadius:6,fontSize:11,fontWeight:700,cursor:'pointer' }}><FiTrash2 size={11} /></button>
      </div>
    )},
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Planning Scenarios</h1>
        <button onClick={openCreate} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 18px',background:'#FF7A00',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer' }}><FiPlus size={14} /> New Scenario</button>
      </div>

      <div style={{ display:'flex',gap:12,marginBottom:20 }}>
        <select value={factoryF} onChange={e => setFactoryF(e.target.value)} style={{ padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,color:'#374151' }}>
          <option value="">All Factories</option>
          {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
      </div>

      {/* Comparison Panel */}
      {compare.length >= 2 && (
        <div style={{ background:'#F0FDF4',border:'1px solid #A7F3D0',borderRadius:12,padding:'16px 20px',marginBottom:20 }}>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12 }}>
            <h3 style={{ margin:0,fontSize:14,fontWeight:700,color:'#065F46' }}>Scenario Comparison</h3>
            <button onClick={() => setCompare([])} style={{ background:'none',border:'none',color:'#9CA3AF',cursor:'pointer',fontSize:12 }}>Clear</button>
          </div>
          <div style={{ display:'grid',gridTemplateColumns:`repeat(${compare.length},1fr)`,gap:16 }}>
            {compare.map(s => (
              <div key={s._id} style={{ background:'#fff',borderRadius:10,padding:'14px 16px',border:'1px solid #A7F3D0' }}>
                <div style={{ fontSize:14,fontWeight:700,color:'#111827',marginBottom:10 }}>{s.name}</div>
                {[['Target Output', `${(s.targetOutput||0).toLocaleString()} units`],['Efficiency','`'+`${s.efficiencyFactor||100}%`+'`'],['Risk',s.lateOrderRisk],['Extra Shifts',s.extraShifts||0],['Maint. Buffer',`${s.maintenanceBuffer||0}%`]].map(([k,v])=>(
                  <div key={k} style={{ display:'flex',justifyContent:'space-between',fontSize:12,padding:'4px 0',borderBottom:'1px solid #F3F4F6' }}>
                    <span style={{ color:'#9CA3AF',fontWeight:600 }}>{k}</span>
                    <span style={{ fontWeight:700,color:'#111827' }}>{v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable columns={columns} data={scenarios} loading={loading} emptyMessage="No planning scenarios found. Create a scenario to model what-if production outcomes." />

      {/* Create/Edit Modal */}
      {showForm && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <form onSubmit={handleSave} style={{ background:'#fff',borderRadius:16,padding:32,width:560,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 25px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin:'0 0 20px',fontSize:18,fontWeight:700,color:'#111827' }}>{editing ? 'Edit Scenario' : 'New Scenario'}</h2>
            <div style={{ display:'grid',gap:14 }}>
              {[{l:'Scenario Name *',k:'name',type:'text',required:true},{l:'Description',k:'description',type:'text'}].map(({l,k,type,required})=>(
                <div key={k}><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>{l}</label><input type={type} required={required} value={form[k]||''} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,boxSizing:'border-box'}}/></div>
              ))}
              <div>
                <label style={{ display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4 }}>Factory *</label>
                <select required value={form.factory} onChange={e=>setForm(f=>({...f,factory:e.target.value}))} style={{ width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13 }}>
                  <option value="">Select…</option>
                  {factories.map(f=><option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {[{l:'Target Output',k:'targetOutput'},{l:'Efficiency Factor %',k:'efficiencyFactor'},{l:'Extra Shifts',k:'extraShifts'},{l:'Maint. Buffer %',k:'maintenanceBuffer'}].map(({l,k})=>(
                  <div key={k}><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>{l}</label><input type="number" min={0} value={form[k]??0} onChange={e=>setForm(f=>({...f,[k]:+e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,boxSizing:'border-box'}}/></div>
                ))}
              </div>
              <div>
                <label style={{ display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4 }}>Late Order Risk</label>
                <select value={form.lateOrderRisk} onChange={e=>setForm(f=>({...f,lateOrderRisk:e.target.value}))} style={{ width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13 }}>
                  {['low','medium','high'].map(r=><option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>Assumptions</label><textarea rows={2} value={form.assumptions||''} onChange={e=>setForm(f=>({...f,assumptions:e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,resize:'vertical',boxSizing:'border-box'}}/></div>
            </div>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:20 }}>
              <button type="button" onClick={()=>setShowForm(false)} style={{padding:'9px 20px',background:'#F3F4F6',color:'#374151',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',fontSize:13}}>Cancel</button>
              <button type="submit" disabled={saving} style={{padding:'9px 20px',background:'#FF7A00',color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontSize:13,opacity:saving?0.6:1}}>{saving?'Saving…':editing?'Update':'Create'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
