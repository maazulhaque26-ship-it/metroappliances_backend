import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlay, FiPause, FiCheck, FiX, FiPackage } from 'react-icons/fi';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState   from '../../components/shared/ErrorState';
import StatusBadge  from '../../components/shared/StatusBadge';
import {
  getWorkOrder, releaseWorkOrder, startWorkOrder, pauseWorkOrder,
  completeWorkOrder, cancelWorkOrder,
} from '../../services/mesAPI';

export default function AdminWorkOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [acting,  setActing]  = useState(false);

  const load = () => {
    setLoading(true);
    getWorkOrder(id)
      .then(r => setData(r.data.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const act = async (fn) => {
    setActing(true);
    try { await fn(id); load(); }
    catch (e) { alert(e.response?.data?.message || e.message); }
    finally { setActing(false); }
  };

  if (loading) return <LoadingState />;
  if (error)   return <ErrorState message={error} />;
  if (!data)   return null;

  const completionPct = data.plannedQty > 0 ? Math.round((data.completedQty / data.plannedQty) * 100) : 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/mes/work-orders')} className="p-2 hover:bg-gray-100 rounded-lg"><FiArrowLeft /></button>
        <div>
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: 'Poppins, sans-serif' }}>{data.orderNumber}</h1>
          <p className="text-sm text-gray-500">{data.productName} {data.productSKU && `· ${data.productSKU}`}</p>
        </div>
        <div className="ml-auto flex gap-2">
          <StatusBadge status={data.priority} />
          <StatusBadge status={data.status} />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        {data.status === 'draft'     && <button onClick={() => act(releaseWorkOrder)}  disabled={acting} className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"><FiPackage /> Release</button>}
        {['released','paused'].includes(data.status) && <button onClick={() => act(startWorkOrder)} disabled={acting} className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700"><FiPlay /> Start</button>}
        {data.status === 'started'   && <button onClick={() => act(pauseWorkOrder)}   disabled={acting} className="flex items-center gap-1 px-3 py-1.5 bg-yellow-500 text-white rounded text-sm hover:bg-yellow-600"><FiPause /> Pause</button>}
        {['started','paused'].includes(data.status) && <button onClick={() => act(completeWorkOrder)} disabled={acting} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"><FiCheck /> Complete</button>}
        {['draft','released','paused'].includes(data.status) && <button onClick={() => act(cancelWorkOrder)} disabled={acting} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"><FiX /> Cancel</button>}
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Completion</span>
          <span className="font-semibold">{data.completedQty} / {data.plannedQty} {data.unit || 'pcs'} ({completionPct}%)</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${completionPct}%` }} />
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          ['Factory',      data.factory?.name || '—'],
          ['Work Center',  data.workCenter?.name || '—'],
          ['Shift',        data.shift?.name || '—'],
          ['Planned Start',data.plannedStartDate ? new Date(data.plannedStartDate).toLocaleDateString() : '—'],
          ['Planned End',  data.plannedEndDate   ? new Date(data.plannedEndDate).toLocaleDateString()   : '—'],
          ['Est. Duration',data.estimatedDurationMins ? `${data.estimatedDurationMins} min` : '—'],
          ['Actual Start', data.actualStartDate ? new Date(data.actualStartDate).toLocaleString() : '—'],
          ['Actual End',   data.actualEndDate   ? new Date(data.actualEndDate).toLocaleString()   : '—'],
          ['Scrap Qty',    data.scrapQty || 0],
        ].map(([label, value]) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="font-semibold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Operations */}
      {data.operations && data.operations.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100"><h2 className="font-semibold text-gray-800">Operations</h2></div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50"><tr>{['#','Operation','Type','Est. (min)','Status'].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>)}</tr></thead>
            <tbody>
              {data.operations.map(op => (
                <tr key={op._id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-2">{op.sequence}</td>
                  <td className="px-4 py-2 font-medium">{op.operationName}</td>
                  <td className="px-4 py-2">{op.operationType}</td>
                  <td className="px-4 py-2">{op.estimatedDurationMins || '—'}</td>
                  <td className="px-4 py-2"><StatusBadge status={op.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
