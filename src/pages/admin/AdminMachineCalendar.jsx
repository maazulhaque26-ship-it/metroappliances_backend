import React, { useEffect, useState, useCallback } from 'react';
import { FiCheckCircle, FiXCircle, FiTool } from 'react-icons/fi';
import { getMachineCalendarBulk, setMachineAvailability } from '../../services/planningAPI';
import { getFactories }  from '../../services/manufacturingAPI';

const REASONS = ['','maintenance','breakdown','holiday','scheduled_downtime','operator_unavailable'];
const REASON_LABEL = { maintenance: 'Maint.', breakdown: 'Breakdown', holiday: 'Holiday', scheduled_downtime: 'Downtime', operator_unavailable: 'No Operator' };

function getDays(from, to) {
  const days = [];
  const cur  = new Date(from);
  while (cur <= new Date(to)) { days.push(new Date(cur)); cur.setDate(cur.getDate() + 1); }
  return days;
}

function dateKey(d) { return new Date(d).toISOString().slice(0, 10); }

export default function AdminMachineCalendar() {
  const now = new Date();
  const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
  const defaultTo   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0,10);

  const [rows,      setRows]    = useState([]);
  const [factories, setFact]    = useState([]);
  const [factoryF,  setFactF]   = useState('');
  const [from,      setFrom]    = useState(defaultFrom);
  const [to,        setTo]      = useState(defaultTo);
  const [loading,   setLoad]    = useState(false);
  const [selected,  setSelected]= useState(null);
  const [modal,     setModal]   = useState(false);
  const [saving,    setSaving]  = useState(false);
  const [form,      setForm]    = useState({ available: true, unavailableReason: '', notes: '' });

  const load = useCallback(() => {
    if (!factoryF) return;
    setLoad(true);
    getMachineCalendarBulk({ factory: factoryF, from, to })
      .then(r => setRows(r.data.data || []))
      .catch(console.error)
      .finally(() => setLoad(false));
  }, [factoryF, from, to]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    getFactories({ limit: 100 }).then(r => {
      const f = r.data.data || [];
      setFact(f);
      if (f.length && !factoryF) setFactF(f[0]._id);
    }).catch(() => {});
  }, []);

  const days = getDays(from, to);
  const COLS = Math.min(days.length, 31);

  const getCellData = (machineRow, date) => {
    const k = dateKey(date);
    return machineRow.days?.find(d => dateKey(d.date) === k) || null;
  };

  const openCell = (machine, date, existing) => {
    setSelected({ machine, date, existing });
    setForm({ available: existing?.available ?? true, unavailableReason: existing?.unavailableReason || '', notes: existing?.notes || '' });
    setModal(true);
  };

  const handleSave = async () => {
    if (!selected || !factoryF) return;
    setSaving(true);
    try {
      await setMachineAvailability({
        machine:  selected.machine._id,
        factory:  factoryF,
        date:     selected.date.toISOString(),
        available: form.available,
        unavailableReason: form.available ? '' : form.unavailableReason,
        notes:    form.notes,
      });
      setModal(false);
      load();
    } catch (err) { alert(err.response?.data?.message || 'Error'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding: '28px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Machine Calendar</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: '#9CA3AF' }}>Legend:</span>
          <span style={{ padding: '3px 8px', background: '#D1FAE5', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#065F46' }}>Available</span>
          <span style={{ padding: '3px 8px', background: '#FEE2E2', borderRadius: 4, fontSize: 11, fontWeight: 700, color: '#991B1B' }}>Unavailable</span>
          <span style={{ padding: '3px 8px', background: '#F3F4F6', borderRadius: 4, fontSize: 11, color: '#9CA3AF' }}>Not set</span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={factoryF} onChange={e => setFactF(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }}>
          <option value="">Select factory…</option>
          {factories.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
        </select>
        <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
        <span style={{ color: '#9CA3AF', fontSize: 13 }}>→</span>
        <input type="date" value={to}   onChange={e => setTo(e.target.value)}   style={{ padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 13 }} />
      </div>

      {!factoryF && (
        <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>Select a factory to view the machine calendar.</div>
      )}

      {factoryF && loading && (
        <div style={{ padding: 32, textAlign: 'center', color: '#6B7280' }}>Loading calendar…</div>
      )}

      {factoryF && !loading && rows.length === 0 && (
        <div style={{ padding: 32, textAlign: 'center', color: '#9CA3AF', fontSize: 14 }}>No machines found for this factory and date range.</div>
      )}

      {factoryF && !loading && rows.length > 0 && (
        <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #E5E7EB', borderRadius: 16 }}>
          <table style={{ borderCollapse: 'collapse', minWidth: 800, fontSize: 12 }}>
            <thead>
              <tr style={{ background: '#F9FAFB' }}>
                <th style={{ padding: '10px 16px', textAlign: 'left', fontWeight: 700, color: '#374151', borderBottom: '2px solid #E5E7EB', minWidth: 160, position: 'sticky', left: 0, background: '#F9FAFB', zIndex: 1 }}>Machine</th>
                {days.map(d => (
                  <th key={d.toISOString()} style={{ padding: '8px 6px', textAlign: 'center', fontWeight: 600, borderBottom: '2px solid #E5E7EB', minWidth: 40, borderLeft: '1px solid #F3F4F6', color: d.getDay() === 0 || d.getDay() === 6 ? '#9CA3AF' : '#374151' }}>
                    <div>{d.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 10 }}>{d.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={String(row.machine?._id || row.machine)} style={{ borderBottom: '1px solid #F3F4F6' }}>
                  <td style={{ padding: '8px 16px', fontWeight: 600, color: '#374151', position: 'sticky', left: 0, background: '#fff', zIndex: 1, borderRight: '1px solid #E5E7EB' }}>
                    {row.machine?.name || String(row.machine)}
                    {row.machine?.serialNumber && <div style={{ fontSize: 10, color: '#9CA3AF', fontFamily: 'monospace' }}>{row.machine.serialNumber}</div>}
                  </td>
                  {days.map(d => {
                    const cell = getCellData(row, d);
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    let bg = isWeekend ? '#FAFAFA' : '#fff';
                    if (cell) bg = cell.available ? '#D1FAE5' : '#FEE2E2';
                    return (
                      <td key={d.toISOString()} onClick={() => openCell(row.machine, d, cell)} style={{ padding: '4px 2px', textAlign: 'center', background: bg, cursor: 'pointer', borderLeft: '1px solid #F3F4F6', transition: 'background 0.15s' }} title={cell?.unavailableReason ? REASON_LABEL[cell.unavailableReason] || cell.unavailableReason : ''}>
                        {cell && !cell.available && cell.unavailableReason && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#991B1B', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 38 }}>{REASON_LABEL[cell.unavailableReason] || '✗'}</span>
                        )}
                        {cell && cell.available && <FiCheckCircle size={12} color="#059669" />}
                        {!cell && <span style={{ color: '#E5E7EB', fontSize: 10 }}>·</span>}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Cell Edit Modal */}
      {modal && selected && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:1000 }}>
          <div style={{ background:'#fff',borderRadius:16,padding:28,width:360,boxShadow:'0 25px 60px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin:'0 0 4px',fontSize:16,fontWeight:700,color:'#111827' }}>{selected.machine?.name}</h3>
            <p style={{ margin:'0 0 20px',fontSize:12,color:'#6B7280' }}>{selected.date.toLocaleDateString('en-IN', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
            <div style={{ display:'grid',gap:14 }}>
              <div>
                <label style={{ display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:8 }}>Availability</label>
                <div style={{ display:'flex',gap:10 }}>
                  {[{v:true,l:'Available',c:'#10B981'},{v:false,l:'Unavailable',c:'#EF4444'}].map(opt => (
                    <button key={String(opt.v)} type="button" onClick={() => setForm(f => ({...f, available: opt.v}))} style={{ flex:1, padding:'10px', border:`2px solid ${form.available === opt.v ? opt.c : '#E5E7EB'}`, borderRadius:8, background: form.available === opt.v ? `${opt.c}11` : '#fff', cursor:'pointer', fontSize:12, fontWeight:700, color: form.available === opt.v ? opt.c : '#6B7280' }}>
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>
              {!form.available && (
                <div>
                  <label style={{ display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4 }}>Reason</label>
                  <select value={form.unavailableReason} onChange={e => setForm(f=>({...f,unavailableReason:e.target.value}))} style={{ width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13 }}>
                    {REASONS.filter(r=>r).map(r => <option key={r} value={r}>{REASON_LABEL[r] || r}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label style={{ display:'block',fontSize:12,fontWeight:600,color:'#374151',marginBottom:4 }}>Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm(f=>({...f,notes:e.target.value}))} style={{ width:'100%',padding:'8px 12px',border:'1px solid #E5E7EB',borderRadius:8,fontSize:13,resize:'vertical',boxSizing:'border-box' }} />
              </div>
            </div>
            <div style={{ display:'flex',gap:10,justifyContent:'flex-end',marginTop:20 }}>
              <button onClick={() => setModal(false)} style={{ padding:'8px 18px',background:'#F3F4F6',color:'#374151',border:'none',borderRadius:8,fontWeight:600,cursor:'pointer',fontSize:13 }}>Cancel</button>
              <button onClick={handleSave} disabled={saving} style={{ padding:'8px 18px',background:'#FF7A00',color:'#fff',border:'none',borderRadius:8,fontWeight:700,cursor:saving?'not-allowed':'pointer',fontSize:13,opacity:saving?0.6:1 }}>{saving?'Saving…':'Save'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
