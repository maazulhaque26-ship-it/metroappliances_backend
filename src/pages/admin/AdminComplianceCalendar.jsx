import React, { useEffect, useState, useCallback } from 'react';
import { FiPlus, FiCheck, FiClock, FiAlertCircle } from 'react-icons/fi';
import { fetchComplianceTasks, createComplianceTask, completeComplianceTask, fetchComplianceReminders } from '../../services/taxAPI';

const COMP_TYPES = ['GSTR-1','GSTR-3B','GSTR-9','GSTR-9C','TDS_return','TDS_payment','advance_tax','income_tax_return','ROC_filing','other'];
const PRIORITIES = ['low','medium','high','critical'];
const STATUSES   = ['','pending','in_progress','completed','overdue','waived'];
const EMPTY = { complianceType:'GSTR-3B', taskName:'', period:'', dueDate:'', reminderDate:'', priority:'medium', notes:'' };

const priorityColor = p => ({ low:'#27ae60', medium:'#f39c12', high:'#e67e22', critical:'#e74c3c' }[p]||'#888');
const statusColor   = s => ({ pending:'#f39c12', in_progress:'#3498db', completed:'#27ae60', overdue:'#e74c3c', waived:'#888' }[s]||'#888');

export default function AdminComplianceCalendar() {
  const [tasks, setTasks]         = useState([]);
  const [reminders, setReminders] = useState([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [filter, setFilter]       = useState({ status:'', complianceType:'', priority:'' });
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [tab, setTab]             = useState('tasks');

  const load = useCallback(async () => {
    try {
      const [t, r] = await Promise.all([
        fetchComplianceTasks({ page, limit:15, ...filter }),
        fetchComplianceReminders({ days:14 }),
      ]);
      setTasks(t.data.data || []);
      setTotal(t.data.total || 0);
      setReminders(r.data.data || []);
    } catch(e) { console.error(e); }
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const pages = Math.ceil(total/15);

  const save = async () => {
    setSaving(true);
    try { await createComplianceTask(form); await load(); setModal(null); setForm(EMPTY); }
    catch(e) { alert(e.response?.data?.message||'Error'); }
    finally { setSaving(false); }
  };

  const complete = async (id) => {
    if (!window.confirm('Mark task as completed?')) return;
    try { await completeComplianceTask(id, {}); await load(); }
    catch(e) { alert(e.response?.data?.message||'Error'); }
  };

  return (
    <div style={{ padding:'24px 32px', fontFamily:'Poppins, sans-serif' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h2 style={{ margin:0, fontSize:22, fontWeight:700, color:'#1a1a2e' }}>Compliance Calendar</h2>
        <button onClick={()=>setModal(true)} style={{ display:'flex', alignItems:'center', gap:8, background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:'10px 20px', fontWeight:600, cursor:'pointer', fontSize:14 }}><FiPlus />Add Task</button>
      </div>

      {reminders.length > 0 && (
        <div style={{ background:'#fff8e1', border:'1px solid #f39c1240', borderRadius:10, padding:'14px 18px', marginBottom:20, display:'flex', alignItems:'flex-start', gap:12 }}>
          <FiAlertCircle color="#f39c12" size={20} style={{ marginTop:2, flexShrink:0 }} />
          <div>
            <div style={{ fontWeight:600, color:'#f39c12', fontSize:14, marginBottom:4 }}>{reminders.length} task{reminders.length>1?'s':''} due in the next 14 days</div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {reminders.map(r=>(
                <span key={r._id} style={{ background:'#f39c1215', border:'1px solid #f39c1230', borderRadius:6, padding:'3px 10px', fontSize:12, color:'#b7770d' }}>{r.taskName} — {new Date(r.dueDate).toLocaleDateString('en-IN')}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:0, marginBottom:20, borderBottom:'2px solid #f0f0f0' }}>
        {[['tasks','All Tasks'],['upcoming','Upcoming'],['overdue','Overdue']].map(([k,label])=>(
          <button key={k} onClick={()=>setTab(k)} style={{ padding:'10px 22px', border:'none', background:'none', fontWeight:tab===k?700:400, color:tab===k?'var(--accent)':'#888', borderBottom:tab===k?'2px solid var(--accent)':'2px solid transparent', cursor:'pointer', fontSize:14, marginBottom:-2 }}>{label}</button>
        ))}
      </div>

      {tab==='tasks' && (
        <>
          <div style={{ display:'flex', gap:12, marginBottom:16, flexWrap:'wrap' }}>
            <select value={filter.status} onChange={e=>setFilter(p=>({...p,status:e.target.value}))} style={{ padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
              {STATUSES.map(s=><option key={s} value={s}>{s||'All Status'}</option>)}
            </select>
            <select value={filter.complianceType} onChange={e=>setFilter(p=>({...p,complianceType:e.target.value}))} style={{ padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
              <option value="">All Types</option>
              {COMP_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filter.priority} onChange={e=>setFilter(p=>({...p,priority:e.target.value}))} style={{ padding:'8px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
              <option value="">All Priority</option>
              {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <TaskTable tasks={tasks} onComplete={complete} />
          {pages>1 && (
            <div style={{ padding:'12px 0', display:'flex', gap:8 }}>
              {Array.from({length:pages},(_,i)=>i+1).map(p=>(
                <button key={p} onClick={()=>setPage(p)} style={{ padding:'5px 10px', border:'1px solid #e0e0e0', borderRadius:6, background:page===p?'var(--accent)':'#fff', color:page===p?'#fff':'#333', cursor:'pointer', fontSize:12, fontWeight:600 }}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}

      {tab==='upcoming' && <TaskTable tasks={tasks.filter(t=>['pending','in_progress'].includes(t.status) && new Date(t.dueDate) >= new Date())} onComplete={complete} />}
      {tab==='overdue' && <TaskTable tasks={tasks.filter(t=>t.status==='overdue' || (t.status==='pending' && new Date(t.dueDate) < new Date()))} onComplete={complete} />}

      {modal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:32, width:480, maxWidth:'95vw', boxShadow:'0 8px 32px rgba(0,0,0,0.18)', maxHeight:'90vh', overflowY:'auto' }}>
            <h3 style={{ margin:'0 0 24px', fontWeight:700 }}>Add Compliance Task</h3>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>Compliance Type</label>
              <select value={form.complianceType} onChange={e=>set('complianceType',e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
                {COMP_TYPES.map(t=><option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            {[['taskName','Task Name','text'],['period','Period (YYYY-MM)','text'],['dueDate','Due Date','date'],['reminderDate','Reminder Date','date'],['notes','Notes','text']].map(([k,ph,t])=>(
              <div key={k} style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>{ph}</label>
                <input type={t} value={form[k]} onChange={e=>set(k,e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13, boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, color:'#888', fontWeight:600, display:'block', marginBottom:4 }}>Priority</label>
              <select value={form.priority} onChange={e=>set('priority',e.target.value)} style={{ width:'100%', padding:'9px 12px', border:'1px solid #e0e0e0', borderRadius:8, fontSize:13 }}>
                {PRIORITIES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div style={{ display:'flex', gap:12, justifyContent:'flex-end' }}>
              <button onClick={()=>setModal(null)} style={{ padding:'9px 20px', border:'1px solid #e0e0e0', borderRadius:8, background:'#fff', cursor:'pointer', fontSize:13 }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ padding:'9px 20px', border:'none', borderRadius:8, background:'var(--accent)', color:'#fff', fontWeight:600, cursor:'pointer', fontSize:13 }}>{saving?'Saving…':'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskTable({ tasks, onComplete }) {
  const priorityColor = p => ({ low:'#27ae60', medium:'#f39c12', high:'#e67e22', critical:'#e74c3c' }[p]||'#888');
  const statusColor   = s => ({ pending:'#f39c12', in_progress:'#3498db', completed:'#27ae60', overdue:'#e74c3c', waived:'#888' }[s]||'#888');
  return (
    <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 8px rgba(0,0,0,0.07)', overflow:'hidden' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
        <thead><tr style={{ background:'#fafafa' }}>{['Task#','Type','Task Name','Period','Due Date','Priority','Status',''].map(h=><th key={h} style={{ textAlign:'left', padding:'12px 16px', color:'#888', fontWeight:600 }}>{h}</th>)}</tr></thead>
        <tbody>
          {tasks.map(r=>(
            <tr key={r._id} style={{ borderTop:'1px solid #f5f5f5' }}>
              <td style={{ padding:'11px 16px', fontSize:12, fontFamily:'monospace' }}>{r.taskNumber}</td>
              <td style={{ padding:'11px 16px' }}><span style={{ background:'#3498db20', color:'#3498db', borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600 }}>{r.complianceType}</span></td>
              <td style={{ padding:'11px 16px', fontWeight:600 }}>{r.taskName}</td>
              <td style={{ padding:'11px 16px' }}>{r.period||'—'}</td>
              <td style={{ padding:'11px 16px', color:new Date(r.dueDate)<new Date()&&r.status!=='completed'?'#e74c3c':'inherit' }}>{r.dueDate?new Date(r.dueDate).toLocaleDateString('en-IN'):'—'}</td>
              <td style={{ padding:'11px 16px' }}><span style={{ background:priorityColor(r.priority)+'20', color:priorityColor(r.priority), borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600 }}>{r.priority}</span></td>
              <td style={{ padding:'11px 16px' }}><span style={{ background:statusColor(r.status)+'20', color:statusColor(r.status), borderRadius:6, padding:'2px 8px', fontSize:11, fontWeight:600 }}>{r.status}</span></td>
              <td style={{ padding:'11px 16px' }}>
                {!['completed','waived'].includes(r.status) && (
                  <button onClick={()=>onComplete(r._id)} style={{ background:'#27ae6015', color:'#27ae60', border:'1px solid #27ae6030', borderRadius:6, padding:'4px 8px', cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontSize:12, fontWeight:600 }}><FiCheck size={12}/>Done</button>
                )}
              </td>
            </tr>
          ))}
          {tasks.length===0&&<tr><td colSpan={8} style={{ padding:32, textAlign:'center', color:'#aaa' }}>No tasks found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
