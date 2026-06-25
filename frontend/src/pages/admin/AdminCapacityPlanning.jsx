import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiAlertTriangle, FiTrendingUp } from 'react-icons/fi';
import MetricCard  from '../../components/shared/MetricCard';
import ChartCard   from '../../components/shared/ChartCard';
import DataTable   from '../../components/shared/DataTable';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from 'recharts';
import {
  getCapacityAnalysis, getCapacityPlans, createCapacityPlan, getBottlenecks,
} from '../../services/planningAPI';
import { getFactories } from '../../services/manufacturingAPI';

const EMPTY = { factory: '', workCenter: '', machine: '', planType: 'weekly', periodStart: '', periodEnd: '', totalCapacity: 0, availableCapacity: 0, allocatedCapacity: 0, operatorCount: 0, operatorHours: 0, notes: '' };

export default function AdminCapacityPlanning() {
  const [analysis,    setAnalysis]   = useState(null);
  const [plans,       setPlans]      = useState([]);
  const [bottlenecks, setBottlenecks]= useState([]);
  const [factories,   setFact]       = useState([]);
  const [factoryF,    setFactoryF]   = useState('');
  const [loading,     setLoad]       = useState(true);
  const [showForm,    setShowForm]   = useState(false);
  const [form,        setForm]       = useState(EMPTY);
  const [saving,      setSaving]     = useState(false);

  const load = useCallback(() => {
    setLoad(true);
    const p = factoryF ? { factory: factoryF } : {};
    Promise.all([getCapacityAnalysis(p), getCapacityPlans({ ...p, limit: 50 }), getBottlenecks(p)])
      .then(([a, pl, b]) => {
        setAnalysis(a.data.data || {});
        setPlans(pl.data.data   || []);
        setBottlenecks(b.data.data || []);
      })
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [factoryF]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getFactories({ limit: 100 }).then(r => setFact(r.data.data || [])).catch(() => {});
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    const util = form.availableCapacity > 0 ? Math.min(100, (form.allocatedCapacity / form.availableCapacity) * 100) : 0;
    try {
      await createCapacityPlan({ ...form, utilizationPct: util });
      setShowForm(false); setForm(EMPTY); load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const s = analysis?.summary || {};
  const topPlans = plans.slice(0, 8).map(p => ({
    name: p.workCenter?.name || p.machine?.name || p.factory?.name || 'Resource',
    utilization: p.utilizationPct || 0,
    available:   p.availableCapacity || 0,
    allocated:   p.allocatedCapacity || 0,
  }));

  const columns = [
    { key: 'factory',    header: 'Factory',     render: v => v?.name || '—' },
    { key: 'workCenter', header: 'Work Center',  render: v => v?.name || '—' },
    { key: 'machine',    header: 'Machine',      render: v => v?.name || '—' },
    { key: 'planType',   header: 'Type',         render: v => <span style={{ textTransform: 'capitalize', fontSize: 12, color: '#6B7280', fontWeight: 700 }}>{v}</span> },
    { key: 'periodStart',header: 'Period',        render: (v, r) => v ? `${new Date(v).toLocaleDateString()} – ${r.periodEnd ? new Date(r.periodEnd).toLocaleDateString() : ''}` : '—' },
    { key: 'totalCapacity',     header: 'Total (hrs)',     align: 'center' },
    { key: 'availableCapacity', header: 'Available (hrs)', align: 'center' },
    { key: 'allocatedCapacity', header: 'Allocated (hrs)', align: 'center' },
    { key: 'utilizationPct', header: 'Utilization', align: 'center', render: v => (
      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        <div style={{ width:60, height:6, background:'#E5E7EB', borderRadius:3 }}>
          <div style={{ width:`${v||0}%`, height:'100%', background: v>=80 ? '#EF4444' : v>=60 ? '#F59E0B' : '#10B981', borderRadius:3 }} />
        </div>
        <span style={{ fontSize:12, fontWeight:700, color: v>=80?'#EF4444':v>=60?'#D97706':'#059669' }}>{(v||0).toFixed(0)}%</span>
      </div>
    )},
    { key: 'isBottleneck', header: 'Bottleneck', align: 'center', render: v => v ? <span style={{ fontSize:11, fontWeight:700, color:'#EF4444', background:'#FEE2E2', padding:'2px 8px', borderRadius:6 }}>⚠ YES</span> : '—' },
  ];

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Capacity Planning</h1>
        <button onClick={() => setShowForm(true)} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 18px',background:'#FF7A00',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer' }}>
          <FiPlus size={14} /> Add Capacity Plan
        </button>
      </div>

      {/* Factory filter */}
      <div style={{ marginBottom: 20 }}>
        <select value={factoryF} onChange={e => setFactoryF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13, color: '#374151' }}>
          <option value="">All Factories</option>
          {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16 }}>
        <MetricCard title="Total Capacity"     value={(s.totalCapacity     || 0).toLocaleString()} icon={FiTrendingUp}   accent="#3B82F6" suffix=" hrs" />
        <MetricCard title="Available Capacity" value={(s.availableCapacity || 0).toLocaleString()} icon={FiTrendingUp}   accent="#10B981" suffix=" hrs" />
        <MetricCard title="Avg Utilization"    value={(s.avgUtilization    || 0).toFixed(1)}        icon={FiTrendingUp}   accent="#F59E0B" suffix="%" />
        <MetricCard title="Bottlenecks"        value={s.bottleneckCount || 0}                        icon={FiAlertTriangle}accent="#EF4444" />
      </div>

      {/* Bottleneck Alerts */}
      {bottlenecks.length > 0 && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#991B1B', marginBottom: 8 }}>⚠ Active Bottlenecks ({bottlenecks.length})</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {bottlenecks.map(b => (
              <div key={b._id} style={{ background: '#fff', border: '1px solid #FECACA', borderRadius: 8, padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#991B1B' }}>
                {b.workCenter?.name || b.machine?.name || 'Resource'} — {(b.utilizationPct || 0).toFixed(0)}% utilized
                {b.bottleneckReason && <span style={{ fontWeight: 400, color: '#6B7280' }}> ({b.bottleneckReason})</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Utilization Chart */}
      {topPlans.length > 0 && (
        <ChartCard title="Capacity Utilization by Resource" subtitle="Allocated vs Available hours">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topPlans}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="available"  name="Available hrs"  fill="#BFDBFE" radius={[4,4,0,0]} />
              <Bar dataKey="allocated"  name="Allocated hrs"  fill="#3B82F6" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      <div style={{ marginTop: 24 }}>
        <DataTable columns={columns} data={plans} loading={loading} emptyMessage="No capacity plans found" />
      </div>

      {/* Create Modal */}
      {showForm && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <form onSubmit={handleCreate} style={{ background:'#fff',borderRadius:16,padding:32,width:560,maxHeight:'90vh',overflowY:'auto',boxShadow:'0 25px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ margin:'0 0 20px',fontSize:18,fontWeight:700,color:'#111827' }}>Add Capacity Plan</h2>
            <div style={{ display:'grid',gap:12 }}>
              <div>
                <label style={{ display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4 }}>Factory *</label>
                <select required value={form.factory} onChange={e => setForm(f => ({...f,factory:e.target.value}))} style={{ width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13 }}>
                  <option value="">Select…</option>
                  {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4 }}>Plan Type</label>
                <select value={form.planType} onChange={e => setForm(f => ({...f,planType:e.target.value}))} style={{ width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13 }}>
                  {['weekly','monthly','quarterly'].map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {[{l:'Period Start',k:'periodStart'},{l:'Period End',k:'periodEnd'}].map(({l,k})=>(
                  <div key={k}><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>{l} *</label><input type="date" required value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,boxSizing:'border-box'}}/></div>
                ))}
              </div>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12 }}>
                {[{l:'Total (hrs)',k:'totalCapacity'},{l:'Available (hrs)',k:'availableCapacity'},{l:'Allocated (hrs)',k:'allocatedCapacity'}].map(({l,k})=>(
                  <div key={k}><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>{l}</label><input type="number" min={0} value={form[k]} onChange={e=>setForm(f=>({...f,[k]:+e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,boxSizing:'border-box'}}/></div>
                ))}
              </div>
            </div>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:20 }}>
              <button type="button" onClick={()=>setShowForm(false)} style={{padding:'9px 20px',background:'#F3F4F6',color:'#374151',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',fontSize:13}}>Cancel</button>
              <button type="submit" disabled={saving} style={{padding:'9px 20px',background:'#FF7A00',color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontSize:13,opacity:saving?0.6:1}}>{saving?'Saving…':'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
