import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import SectionHeader from '../../components/shared/SectionHeader';
import StatusBadge   from '../../components/shared/StatusBadge';
import LoadingState  from '../../components/shared/LoadingState';
import ErrorState    from '../../components/shared/ErrorState';
import { fetchBill, approveBill, submitBill, postBillToGL, rejectBill } from '../../services/accountsPayableAPI';

const fmt  = v => `₹${(v||0).toLocaleString('en-IN')}`;
const fmtD = v => v ? new Date(v).toLocaleDateString() : '—';

export default function AdminVendorBillDetail() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const [bill, setBill]   = useState(null);
  const [loading, setLoad] = useState(true);
  const [error, setError]  = useState('');
  const [posting, setPost] = useState(false);
  const [glForm, setGLForm] = useState({ apAccount: '', expenseAccount: '' });
  const [showGL, setShowGL] = useState(false);

  const load = async () => {
    setLoad(true); setError('');
    try { const r = await fetchBill(id); setBill(r.data.data); }
    catch(e) { setError(e.response?.data?.message || e.message); }
    finally { setLoad(false); }
  };

  useEffect(() => { load(); }, [id]);

  const handleApprove = async () => {
    if (!window.confirm('Approve this bill?')) return;
    try { await approveBill(id); load(); } catch(e) { alert(e.response?.data?.message || e.message); }
  };

  const handleSubmit = async () => {
    try { await submitBill(id); load(); } catch(e) { alert(e.response?.data?.message || e.message); }
  };

  const handlePostGL = async e => {
    e.preventDefault(); setPost(true);
    try { await postBillToGL(id, glForm); setShowGL(false); load(); }
    catch(e) { alert(e.response?.data?.message || e.message); }
    finally { setPost(false); }
  };

  const handleReject = async () => {
    const reason = prompt('Rejection reason:');
    if (reason === null) return;
    try { await rejectBill(id, { reason }); load(); } catch(e) { alert(e.response?.data?.message || e.message); }
  };

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;
  if (!bill)   return null;

  return (
    <div className="p-6 space-y-6">
      <SectionHeader
        title={`Bill ${bill.billNumber}`}
        subtitle={`Vendor: ${bill.vendorName}`}
        action={
          <div className="flex gap-2">
            <StatusBadge status={bill.status} />
            {bill.status === 'draft' && <button onClick={handleSubmit} className="px-3 py-1 bg-blue-500 text-white rounded text-sm">Submit</button>}
            {bill.status === 'submitted' && <>
              <button onClick={handleApprove} className="px-3 py-1 bg-green-500 text-white rounded text-sm">Approve</button>
              <button onClick={handleReject}  className="px-3 py-1 bg-red-500 text-white rounded text-sm">Reject</button>
            </>}
            {bill.status === 'approved' && !bill.glPosted && <button onClick={() => setShowGL(true)} className="px-3 py-1 bg-orange-500 text-white rounded text-sm">Post to GL</button>}
            <button onClick={() => navigate('/admin/accounts-payable/bills')} className="px-3 py-1 border rounded text-sm">Back</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-gray-700 border-b pb-2">Bill Details</h3>
          {[
            ['Bill Number', bill.billNumber],
            ['Vendor Invoice No.', bill.vendorInvoiceNo || '—'],
            ['Bill Date', fmtD(bill.billDate)],
            ['Due Date', fmtD(bill.dueDate)],
            ['Payment Term', bill.paymentTerm || '—'],
            ['GL Posted', bill.glPosted ? 'Yes' : 'No'],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between text-sm">
              <span className="text-gray-500">{l}</span>
              <span className="font-medium text-gray-700">{v}</span>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 space-y-3">
          <h3 className="font-semibold text-gray-700 border-b pb-2">Amounts</h3>
          {[
            ['Subtotal',    fmt(bill.subtotal)],
            ['GST Total',   fmt(bill.gstTotal)],
            ['Total Amount',fmt(bill.totalAmount)],
            ['Paid Amount', fmt(bill.paidAmount)],
            ['Outstanding', fmt(bill.outstandingAmount)],
          ].map(([l, v]) => (
            <div key={l} className="flex justify-between text-sm">
              <span className="text-gray-500">{l}</span>
              <span className="font-semibold text-gray-800">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {bill.items && bill.items.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b"><h3 className="font-semibold text-gray-700">Line Items</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 text-gray-500">
                <th className="px-4 py-2 text-left">Description</th>
                <th className="px-4 py-2 text-right">Qty</th>
                <th className="px-4 py-2 text-right">Unit Price</th>
                <th className="px-4 py-2 text-right">Tax</th>
                <th className="px-4 py-2 text-right">Total</th>
              </tr></thead>
              <tbody>
                {bill.items.map((item, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">{item.description || '—'}</td>
                    <td className="px-4 py-2 text-right">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">{fmt(item.unitPrice)}</td>
                    <td className="px-4 py-2 text-right">{fmt(item.taxAmount)}</td>
                    <td className="px-4 py-2 text-right font-medium">{fmt(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showGL && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Post Bill to General Ledger</h3>
            <form onSubmit={handlePostGL} className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">AP Account (Liability) ID</label>
                <input required value={glForm.apAccount} onChange={e => setGLForm(f => ({...f, apAccount: e.target.value}))} placeholder="Chart of Account ID" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">Expense Account ID</label>
                <input required value={glForm.expenseAccount} onChange={e => setGLForm(f => ({...f, expenseAccount: e.target.value}))} placeholder="Chart of Account ID" className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={posting} className="flex-1 bg-orange-500 text-white py-2 rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50">Post to GL</button>
                <button type="button" onClick={() => setShowGL(false)} className="flex-1 border py-2 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
