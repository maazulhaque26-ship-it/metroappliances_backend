import React, { useState } from 'react';
import { fetchBankBook, fetchCashBook, fetchDailyCashPosition, fetchTreasuryPositionReport, fetchInvestmentRegister, fetchFDRegister, fetchGuaranteeRegister, fetchCashFlowReport, fetchForecastVsActual, fetchBankAccounts } from '../../services/bankingAPI';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);
const inp = { padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: 8, fontSize: 13, width: '100%', boxSizing: 'border-box' };
const btn = (bg) => ({ padding: '8px 16px', border: 'none', borderRadius: 8, background: bg, color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 12 });

const REPORTS = [
  { key: 'bankbook',      label: 'Bank Book',               icon: '🏦' },
  { key: 'cashbook',      label: 'Cash Book',               icon: '💵' },
  { key: 'daily',         label: 'Daily Cash Position',     icon: '📅' },
  { key: 'treasury',      label: 'Treasury Position',       icon: '🏛️' },
  { key: 'investments',   label: 'Investment Register',     icon: '📈' },
  { key: 'fds',           label: 'FD Register',             icon: '🏧' },
  { key: 'guarantees',    label: 'Guarantee Register',      icon: '📋' },
  { key: 'cashflow',      label: 'Cash Flow Report',        icon: '💹' },
  { key: 'forecast',      label: 'Forecast vs Actual',      icon: '🎯' },
];

export default function AdminBankingReports() {
  const [activeReport, setActiveReport] = useState('bankbook');
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [params, setParams]   = useState({});

  React.useEffect(() => { fetchBankAccounts({}).then(r => setAccounts(r.data.data || [])); }, []);

  const run = async () => {
    setLoading(true);
    try {
      let res;
      switch (activeReport) {
        case 'bankbook':    res = await fetchBankBook(params); break;
        case 'cashbook':    res = await fetchCashBook(params); break;
        case 'daily':       res = await fetchDailyCashPosition(params); break;
        case 'treasury':    res = await fetchTreasuryPositionReport(params); break;
        case 'investments': res = await fetchInvestmentRegister(params); break;
        case 'fds':         res = await fetchFDRegister(params); break;
        case 'guarantees':  res = await fetchGuaranteeRegister(params); break;
        case 'cashflow':    res = await fetchCashFlowReport(params); break;
        case 'forecast':    res = await fetchForecastVsActual(params); break;
        default: res = null;
      }
      setData(res?.data?.data || res?.data || null);
    } catch (e) { setData({ error: e.response?.data?.message || 'Error' }); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'Poppins, sans-serif' }}>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 700, color: '#1a1a2e' }}>Banking & Treasury Reports</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 20 }}>
        <div style={{ background: '#fff', borderRadius: 12, padding: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', height: 'fit-content' }}>
          {REPORTS.map(r => (
            <div key={r.key} onClick={() => { setActiveReport(r.key); setData(null); setParams({}); }} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:8,cursor:'pointer',background:activeReport===r.key?'var(--accent)':'transparent',color:activeReport===r.key?'#fff':'#333',marginBottom:2,fontWeight:activeReport===r.key?700:400,fontSize:13 }}>
              <span>{r.icon}</span>{r.label}
            </div>
          ))}
        </div>

        <div>
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)', marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
              {REPORTS.find(r=>r.key===activeReport)?.icon} {REPORTS.find(r=>r.key===activeReport)?.label}
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              {(activeReport === 'bankbook') && (
                <div style={{ flex: '1 1 200px' }}>
                  <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Bank Account</label>
                  <select style={inp} value={params.bankAccount||''} onChange={e=>setParams(p=>({...p,bankAccount:e.target.value||undefined}))}>
                    <option value="">All Accounts</option>
                    {accounts.map(a=><option key={a._id} value={a._id}>{a.accountName}</option>)}
                  </select>
                </div>
              )}
              {['bankbook','cashbook','cashflow','forecast'].includes(activeReport) && (
                <>
                  <div style={{ flex: '1 1 150px' }}>
                    <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>From Date</label>
                    <input type="date" style={inp} value={params.startDate||''} onChange={e=>setParams(p=>({...p,startDate:e.target.value}))} />
                  </div>
                  <div style={{ flex: '1 1 150px' }}>
                    <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>To Date</label>
                    <input type="date" style={inp} value={params.endDate||''} onChange={e=>setParams(p=>({...p,endDate:e.target.value}))} />
                  </div>
                </>
              )}
              {activeReport === 'daily' && (
                <div style={{ flex: '1 1 150px' }}>
                  <label style={{ fontSize: 12, color: '#888', display: 'block', marginBottom: 4 }}>Date</label>
                  <input type="date" style={inp} value={params.date||''} onChange={e=>setParams(p=>({...p,date:e.target.value}))} />
                </div>
              )}
              <button style={btn('var(--accent)')} onClick={run} disabled={loading}>{loading?'Running…':'Run Report'}</button>
            </div>
          </div>

          {data && !data.error && (
            <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
              {/* Bank Book / Cash Book */}
              {(activeReport === 'bankbook' || activeReport === 'cashbook') && (
                <>
                  {data.summary && (
                    <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20 }}>
                      {[['Opening',data.summary.openingBalance,'#888'],['Total Credits',data.summary.totalCredits,'#27ae60'],['Total Debits',data.summary.totalDebits,'#e74c3c'],['Closing',data.summary.closingBalance,'#3498db']].map(([l,v,c])=>(
                        <div key={l} style={{ background:'#fafafa',borderRadius:10,padding:'12px 16px',borderLeft:`3px solid ${c}` }}>
                          <div style={{ fontSize:18,fontWeight:700,color:c }}>{fmt(v)}</div>
                          <div style={{ fontSize:11,color:'#888',marginTop:2 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <ReportTable rows={data.transactions || data} cols={['Date','Type','Party','Amount','Ref','Status']} rowFn={t=>[
                    t.transactionDate?new Date(t.transactionDate).toLocaleDateString('en-IN'):'—',
                    (t.transactionType||'').replace(/_/g,' '),
                    t.partyName||'—',
                    <span style={{ fontWeight:700,color:['receipt','transfer_in','interest_credit','cash_deposit','opening_balance'].includes(t.transactionType)?'#27ae60':'#e74c3c' }}>{fmt(t.amount)}</span>,
                    t.referenceNumber||'—',
                    t.status||'—',
                  ]} />
                </>
              )}
              {/* Daily Cash Position */}
              {activeReport === 'daily' && (
                <ReportTable rows={data} cols={['Type','Amount']} rowFn={r=>[r._id?.replace(/_/g,' '),<strong style={{ color:'var(--accent)' }}>{fmt(r.total)}</strong>]} />
              )}
              {/* Treasury Position */}
              {activeReport === 'treasury' && (
                <ReportTable rows={data} cols={['Date','Bank','Cash','Investments','FD','Net Position']} rowFn={p=>[
                  p.positionDate?new Date(p.positionDate).toLocaleDateString('en-IN'):'—',
                  fmt(p.bankBalance), fmt(p.cashBalance), fmt(p.investmentBalance), fmt(p.fdBalance),
                  <strong style={{ color:'var(--accent)' }}>{fmt(p.netPosition)}</strong>,
                ]} />
              )}
              {/* Investment Register */}
              {activeReport === 'investments' && (
                <ReportTable rows={data} cols={['Inv#','Type','Principal','Current','Return%','Status']} rowFn={i=>[
                  i.investmentNumber,
                  (i.investmentType||'').replace(/_/g,' '),
                  fmt(i.principalAmount),
                  <strong style={{ color:'#27ae60' }}>{fmt(i.currentValue)}</strong>,
                  `${i.principalAmount>0?((i.currentValue-i.principalAmount)/i.principalAmount*100).toFixed(2):0}%`,
                  i.status,
                ]} />
              )}
              {/* FD Register */}
              {activeReport === 'fds' && (
                <ReportTable rows={data} cols={['FD#','Principal','Rate%','Maturity Amt','Start','Maturity','Status']} rowFn={f=>[
                  f.fdNumber, fmt(f.principalAmount), `${f.interestRate}%`,
                  <strong style={{ color:'#3498db' }}>{fmt(f.maturityAmount)}</strong>,
                  f.startDate?new Date(f.startDate).toLocaleDateString('en-IN'):'—',
                  f.maturityDate?new Date(f.maturityDate).toLocaleDateString('en-IN'):'—',
                  f.status,
                ]} />
              )}
              {/* Guarantee Register */}
              {activeReport === 'guarantees' && (
                <ReportTable rows={data} cols={['BG#','Type','Amount','Beneficiary','Issue','Expiry','Status']} rowFn={b=>[
                  b.bgNumber, (b.guaranteeType||'').replace(/_/g,' '), fmt(b.amount), b.beneficiary,
                  b.issueDate?new Date(b.issueDate).toLocaleDateString('en-IN'):'—',
                  b.expiryDate?new Date(b.expiryDate).toLocaleDateString('en-IN'):'—',
                  b.status,
                ]} />
              )}
              {/* Cash Flow Report */}
              {activeReport === 'cashflow' && Array.isArray(data) && data.length > 0 && (
                <>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data.map(d=>({ month:`${d._id?.month}/${d._id?.year}`,Receipts:d.receipts,Payments:d.payments }))}>
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} tickFormatter={v=>`₹${(v/100000).toFixed(1)}L`} />
                      <Tooltip formatter={v=>fmt(v)} />
                      <Bar dataKey="Receipts" fill="#27ae60" radius={[4,4,0,0]} />
                      <Bar dataKey="Payments" fill="#e74c3c" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                  <ReportTable rows={data} cols={['Month','Year','Receipts','Payments','Net']} rowFn={d=>[
                    d._id?.month, d._id?.year, fmt(d.receipts), fmt(d.payments),
                    <strong style={{ color:d.receipts-d.payments>=0?'#27ae60':'#e74c3c' }}>{fmt(d.receipts-d.payments)}</strong>,
                  ]} />
                </>
              )}
              {/* Forecast vs Actual */}
              {activeReport === 'forecast' && (
                <ReportTable rows={data} cols={['Period','Expected In','Actual In','Expected Out','Actual Out','Variance','Status']} rowFn={f=>[
                  f.forecastPeriod, fmt(f.expectedReceipts), fmt(f.actualReceipts), fmt(f.expectedPayments), fmt(f.actualPayments),
                  <strong style={{ color:!f.variance||f.variance>=0?'#27ae60':'#e74c3c' }}>{fmt(f.variance)}</strong>,
                  f.status,
                ]} />
              )}
            </div>
          )}
          {data?.error && (
            <div style={{ background:'#e74c3c20',color:'#e74c3c',borderRadius:10,padding:20,fontWeight:600 }}>{data.error}</div>
          )}
          {!data && !loading && (
            <div style={{ background:'#fff',borderRadius:12,padding:60,textAlign:'center',color:'#aaa',boxShadow:'0 2px 8px rgba(0,0,0,0.07)' }}>Configure parameters above and click Run Report</div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportTable({ rows, cols, rowFn }) {
  if (!rows || !rows.length) return <div style={{ padding:30,textAlign:'center',color:'#aaa' }}>No data</div>;
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width:'100%',borderCollapse:'collapse',fontSize:13 }}>
        <thead><tr style={{ background:'#fafafa' }}>{cols.map(h=><th key={h} style={{ textAlign:'left',padding:'10px 16px',color:'#888',fontWeight:600,whiteSpace:'nowrap' }}>{h}</th>)}</tr></thead>
        <tbody>{rows.map((row,i)=>(
          <tr key={i} style={{ borderTop:'1px solid #f5f5f5' }}>
            {rowFn(row).map((cell,j)=><td key={j} style={{ padding:'9px 16px' }}>{cell}</td>)}
          </tr>
        ))}</tbody>
      </table>
    </div>
  );
}
