import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import SectionHeader from '../../components/shared/SectionHeader';
import { getInspectionLot, updateInspectionLot } from '../../services/qmsAPI';

const STATUS_COLORS = { pending: 'yellow', in_progress: 'blue', passed: 'green', failed: 'red', conditional: 'orange', cancelled: 'gray' };

export default function AdminInspectionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]     = useState(null);

  useEffect(() => {
    getInspectionLot(id)
      .then(r => setData(r.data.data))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatus = async (newStatus) => {
    await updateInspectionLot(id, { status: newStatus });
    const r = await getInspectionLot(id);
    setData(r.data.data);
  };

  if (loading) return <LoadingState />;
  if (err) return <ErrorState message={err} />;

  const { lot, results } = data;
  const passCount = results.filter(r => r.result === 'pass').length;
  const failCount = results.filter(r => r.result === 'fail').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/qms/inspection-lots')} className="text-gray-500 hover:text-gray-700">← Back</button>
        <h1 className="text-2xl font-bold text-gray-800">{lot.lotNumber}</h1>
        <StatusBadge status={lot.status} color={STATUS_COLORS[lot.status]} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Product', value: lot.productName || '—' },
          { label: 'Lot Size', value: lot.lotSize },
          { label: 'Sample Size', value: lot.sampleSize || '—' },
          { label: 'Disposition', value: lot.disposition },
          { label: 'Source', value: lot.source },
          { label: 'Type', value: lot.inspectionType },
          { label: 'Results Pass', value: passCount },
          { label: 'Results Fail', value: failCount },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-lg border p-4">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-lg font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {lot.status === 'pending' && <button onClick={() => handleStatus('in_progress')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">Start Inspection</button>}
        {lot.status === 'in_progress' && <>
          <button onClick={() => handleStatus('passed')} className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm">Mark Passed</button>
          <button onClick={() => handleStatus('failed')} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm">Mark Failed</button>
          <button onClick={() => handleStatus('conditional')} className="px-4 py-2 bg-yellow-500 text-white rounded-lg text-sm">Conditional</button>
        </>}
      </div>

      <SectionHeader title={`Inspection Results (${results.length})`} />
      {results.length === 0 ? (
        <p className="text-gray-500 text-sm">No results recorded yet.</p>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>{['#', 'Characteristic', 'Measured', 'Lower', 'Upper', 'In Tolerance', 'Result'].map(h => (
                <th key={h} className="text-left px-4 py-2 text-gray-600 font-medium">{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{r.sampleNumber}</td>
                  <td className="px-4 py-2">{r.characteristicName || '—'}</td>
                  <td className="px-4 py-2">{r.measuredValue ?? r.textValue ?? '—'}</td>
                  <td className="px-4 py-2">{r.lowerLimit ?? '—'}</td>
                  <td className="px-4 py-2">{r.upperLimit ?? '—'}</td>
                  <td className="px-4 py-2">{r.isWithinTolerance === true ? 'Yes' : r.isWithinTolerance === false ? 'No' : '—'}</td>
                  <td className="px-4 py-2">
                    <StatusBadge status={r.result} color={{ pass: 'green', fail: 'red', conditional: 'yellow', pending: 'gray' }[r.result]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
