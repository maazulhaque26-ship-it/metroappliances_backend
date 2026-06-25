import React, { useEffect, useState, useCallback } from 'react';
import { FiCheckCircle, FiXCircle, FiRefreshCw, FiPlus } from 'react-icons/fi';
import { getProductionCalendar, setProductionDay, generateCalendar } from '../../services/planningAPI';
import { getFactories, getShifts } from '../../services/manufacturingAPI';

const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const STATUS_COLOR = { true: { bg: '#D1FAE5', color: '#065F46' }, false: { bg: '#FEE2E2', color: '#991B1B' } };

function buildCalendar(year, month, days) {
  const first = new Date(year, month, 1);
  const last  = new Date(year, month + 1, 0);
  const cells = [];
  for (let i = 0; i < first.getDay(); i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function dateKey(d) { return d instanceof Date ? d.toISOString().slice(0,10) : String(d).slice(0,10); }

export default function AdminProductionCalendar() {
  const now = new Date();
  const [year,      setYear]      = useState(now.getFullYear());
  const [month,     setMonth]     = useState(now.getMonth());
  const [calData,   setCalData]   = useState({});
  const [factories, setFact]      = useState([]);
  const [shifts,    setShifts]    = useState([]);
  const [factoryF,  setFactF]     = useState('');
  const [loading,   setLoad]      = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [modal,     setModal]     = useState(false);
  const [form,      setForm]      = useState({ isWorkingDay: true, notes: '' });
  const [saving,    setSaving]    = useState(false);
  const [genModal,  setGenModal]  = useState(false);
  const [genForm,   setGenForm]   = useState({ from: '', to: '', workDays: [1,2,3,4,5] });

  const load = useCallback(() => {
    if (!factoryF) return;
    setLoad(true);
    const from = new Date(year, month, 1).toISOString().slice(0,10);
    const to   = new Date(year, month + 1, 0).toISOString().slice(0,10);
    getProductionCalendar({ factory: factoryF, from, to })
      .then(r => {
        const m = {};
        (r.data.data || []).forEach(d => { m[dateKey(d.date)] = d; });
        setCalData(m);
      })
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [factoryF, year, month]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getFactories({ limit: 100 }).then(r => {
      const f = r.data.data || [];
      setFact(f);
      if (f.length && !factoryF) setFactF(f[0]._id);
    }).catch(() => {});
    getShifts({ limit: 50 }).then(r => setShifts(r.data.data || [])).catch(() => {});
  }, []);

  const openDay = (date) => {
    const k = dateKey(date);
    const existing = calData[k];
    setSelected({ date, existing });
    setForm({ isWorkingDay: existing?.isWorkingDay ?? (date.getDay() !== 0 && date.getDay() !== 6), notes: existing?.notes || '' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!selected || !factoryF) return;
    setSaving(true);
    try {
      await setProductionDay({ factory: factoryF, date: selected.date.toISOString(), isWorkingDay: form.isWorkingDay, notes: form.notes });
      setModal(false);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const handleGenerate = async () => {
    if (!factoryF || !genForm.from || !genForm.to) return;
    setSaving(true);
    try {
      const r = await generateCalendar({ factory: factoryF, from: genForm.from, to: genForm.to, workDays: genForm.workDays });
      alert(`Calendar generated: ${r.data.data.upserted} days created`);
      setGenModal(false);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  const cells  = buildCalendar(year, month, calData);
  const monthName = new Date(year, month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Production Calendar</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setGenModal(true)} style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 16px',background:'#111827',color:'#fff',border:'none',borderRadius:8,fontSize:13,fontWeight:700,cursor:'pointer' }}><FiRefreshCw size={13} />Generate</button>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display:'flex',gap:12,marginBottom:20,alignItems:'center',flexWrap:'wrap' }}>
        <select value={factoryF} onChange={e => setFactF(e.target.value)} style={{ padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13 }}>
          <option value="">Select factory…</option>
          {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <div style={{ display:'flex',alignItems:'center',gap:8 }}>
          <button onClick={() => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); }} style={{ padding:'6px 14px',background:'#F3F4F6',color:'#374151',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700 }}>‹</button>
          <span style={{ fontSize:15,fontWeight:700,color:'#111827',minWidth:160,textAlign:'center' }}>{monthName}</span>
          <button onClick={() => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); }} style={{ padding:'6px 14px',background:'#F3F4F6',color:'#374151',border:'none',borderRadius:8,cursor:'pointer',fontWeight:700 }}>›</button>
        </div>
        <span style={{ fontSize:12,color:'#9CA3AF' }}>Legend:</span>
        <span style={{ padding:'3px 8px',background:'#D1FAE5',borderRadius:4,fontSize:11,fontWeight:700,color:'#065F46' }}>Working</span>
        <span style={{ padding:'3px 8px',background:'#FEE2E2',borderRadius:4,fontSize:11,fontWeight:700,color:'#991B1B' }}>Holiday</span>
      </div>

      {!factoryF && <div style={{ padding:32,textAlign:'center',color:'#9CA3AF',fontSize:14 }}>Select a factory to view the production calendar.</div>}

      {factoryF && (
        <div style={{ background:'#fff',border:'1px solid #E5E7EB',borderRadius:16,overflow:'hidden' }}>
          {/* Day headers */}
          <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)',background:'#F9FAFB',borderBottom:'2px solid #E5E7EB' }}>
            {DOW.map(d => <div key={d} style={{ padding:'10px',textAlign:'center',fontSize:12,fontWeight:700,color:'#6B7280' }}>{d}</div>)}
          </div>
          {/* Calendar grid */}
          {loading
            ? <div style={{ padding:40,textAlign:'center',color:'#6B7280' }}>Loading…</div>
            : (
              <div style={{ display:'grid',gridTemplateColumns:'repeat(7,1fr)' }}>
                {cells.map((date, i) => {
                  if (!date) return <div key={i} style={{ minHeight:80,background:'#FAFAFA',borderRight:'1px solid #F3F4F6',borderBottom:'1px solid #F3F4F6' }} />;
                  const k = dateKey(date);
                  const entry = calData[k];
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                  const isToday   = k === dateKey(new Date());
                  const isWorking = entry?.isWorkingDay ?? !isWeekend;
                  return (
                    <div key={k} onClick={() => factoryF && openDay(date)} style={{ minHeight:80,padding:'8px 10px',cursor:'pointer',background: isWorking ? '#fff' : '#FFF5F5',borderRight:'1px solid #F3F4F6',borderBottom:'1px solid #F3F4F6',position:'relative',transition:'background 0.15s' }}>
                      <div style={{ fontSize:13,fontWeight: isToday ? 800 : 600,color: isToday ? '#FF7A00' : isWeekend ? '#9CA3AF' : '#111827',width:26,height:26,borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',background: isToday ? '#FFF7ED' : 'transparent' }}>{date.getDate()}</div>
                      {entry && (
                        <div style={{ marginTop:4,fontSize:10,fontWeight:700,color: isWorking ? '#065F46' : '#991B1B' }}>
                          {isWorking ? '✓ Working' : '✗ Holiday'}
                        </div>
                      )}
                      {entry?.notes && <div style={{ fontSize:9,color:'#9CA3AF',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{entry.notes}</div>}
                    </div>
                  );
                })}
              </div>
            )
          }
        </div>
      )}

      {/* Day Edit Modal */}
      {modal && selected && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:28,width:360,boxShadow:'0 25px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin:'0 0 4px',fontSize:16,fontWeight:700,color:'#111827' }}>{selected.date.toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}</h3>
            <p style={{ margin:'0 0 20px',fontSize:12,color:'#6B7280' }}>Click to toggle working day status</p>
            <div style={{ display:'grid',gap:14 }}>
              <div>
                <label style={{ display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:8 }}>Day Type</label>
                <div style={{ display:'flex',gap:10 }}>
                  {[{v:true,l:'Working Day',c:'#10B981'},{v:false,l:'Holiday/Off',c:'#EF4444'}].map(opt=>(
                    <button key={String(opt.v)} type="button" onClick={() => setForm(f=>({...f,isWorkingDay:opt.v}))} style={{ flex:1,padding:10,border:`2px solid ${form.isWorkingDay===opt.v?opt.c:'#E5E7EB'}`,borderRadius:8,background:form.isWorkingDay===opt.v?`${opt.c}11`:'#fff',cursor:'pointer',fontSize:12,fontWeight:700,color:form.isWorkingDay===opt.v?opt.c:'#6B7280' }}>{opt.l}</button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4 }}>Notes</label>
                <input type="text" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Optional note…" style={{ width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,boxSizing:'border-box' }} />
              </div>
            </div>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:20 }}>
              <button onClick={()=>setModal(false)} style={{ padding:'8px 18px',background:'#F3F4F6',color:'#374151',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',fontSize:13 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding:'8px 18px',background:'#FF7A00',color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontSize:13,opacity:saving?0.6:1 }}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Calendar Modal */}
      {genModal && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:28,width:400,boxShadow:'0 25px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin:'0 0 4px',fontSize:16,fontWeight:700,color:'#111827' }}>Generate Calendar</h3>
            <p style={{ margin:'0 0 20px',fontSize:12,color:'#6B7280' }}>Auto-create calendar entries for a date range. Existing entries are not overwritten.</p>
            <div style={{ display:'grid',gap:14 }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12 }}>
                {[{l:'From *',k:'from'},{l:'To *',k:'to'}].map(({l,k})=>(
                  <div key={k}><label style={{display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4}}>{l}</label><input type="date" required value={genForm[k]} onChange={e=>setGenForm(f=>({...f,[k]:e.target.value}))} style={{width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,boxSizing:'border-box'}}/></div>
                ))}
              </div>
              <div>
                <label style={{ display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:6 }}>Working Days</label>
                <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
                  {DOW.map((d,i)=>(
                    <label key={i} style={{ display:'flex',alignItems:'center',gap:4,cursor:'pointer',fontSize:12,fontWeight:600,color:genForm.workDays.includes(i)?'#3B82F6':'#6B7280' }}>
                      <input type="checkbox" checked={genForm.workDays.includes(i)} onChange={e=>setGenForm(f=>({...f,workDays:e.target.checked?[...f.workDays,i]:f.workDays.filter(x=>x!==i)}))} />
                      {d}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:20 }}>
              <button onClick={()=>setGenModal(false)} style={{ padding:'8px 18px',background:'#F3F4F6',color:'#374151',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',fontSize:13 }}>Cancel</button>
              <button onClick={handleGenerate} disabled={saving||!genForm.from||!genForm.to} style={{ padding:'8px 18px',background:'#FF7A00',color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:(saving||!genForm.from||!genForm.to)?'not-allowed':'pointer',fontSize:13,opacity:(saving||!genForm.from||!genForm.to)?0.6:1 }}>{saving?'Generating…':'Generate'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
