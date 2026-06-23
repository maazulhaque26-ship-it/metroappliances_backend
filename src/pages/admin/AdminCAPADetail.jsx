import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import StatusBadge from '../../components/shared/StatusBadge';
import LoadingState from '../../components/shared/LoadingState';
import ErrorState from '../../components/shared/ErrorState';
import SectionHeader from '../../components/shared/SectionHeader';
import { getCAPA, updateCAPA } from '../../services/qmsAPI';

const STATUS_COLORS = { open: 'red', in_progress: 'blue', action_taken: 'yellow', verification: 'orange', closed: 'green', cancelled: 'gray' };
const SEV_COLORS    = { low: 'green', medium: 'yellow', high: 'orange', critical: 'red' };
const ACTION_STATUS_COLORS = { open: 'red', in_progress: 'blue', completed: 'green', verified: 'teal', overdue: 'red' };

const TRANSITIONS = {
  open:         ['in_progress', 'cancelled'],
  in_progress:  ['action_taken', 'cancelled'],
  action_taken: ['verification'],
  verification: ['closed', 'in_progress'],
};

export default function AdminCAPADetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState(null);

  const load = () => {
    getCAPA(id)
      .then(r => setData(r.data.data))
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleTransition = async (newStatus) => {
    await updateCAPA(id, { status: newStatus, ...(newStatus === 'closed' ? { actualCloseDate: new Date() } : {}) });
    load();
  };

  if (loading) return <LoadingState />;
  if (err) return <ErrorState message={err} />;

  const { capa, rca, correctiveActions, preventiveActions } = data;
  const nextStatuses = TRANSITIONS[capa.status] || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={() => navigate('/admin/qms/capas')} className="text-gray-500 hover:text-gray-700">← Back</button>
        <h1 className="text-2xl font-bold text-gray-800">{capa.capaNumber}</h1>
        <StatusBadge status={capa.status} color={STATUS_COLORS[capa.status]} />
        <StatusBadge status={capa.severity} color={SEV_COLORS[capa.severity]} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">CAPA Details</h2>
          <div className="text-sm space-y-1">
            <div><span className="text-gray-500">Title:</span> {capa.title}</div>
            <div><span className="text-gray-500">Type:</span> {capa.capaType}</div>
            <div><span className="text-gray-500">Source:</span> {capa.source}</div>
            <div><span className="text-gray-500">Assigned To:</span> {capa.assignedToName || '—'}</div>
            <div><span className="text-gray-500">Target Date:</span> {capa.targetCloseDate ? new Date(capa.targetCloseDate).toLocaleDateString() : '—'}</div>
            <div><span className="text-gray-500">Effectiveness:</span> {capa.effectivenessStatus}</div>
          </div>
        </div>

        <div className="bg-white rounded-lg border p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">Problem Analysis</h2>
          <div className="text-sm space-y-2">
            <div><span className="text-gray-500 block">Problem Statement:</span><p className="text-gray-800">{capa.problemStatement || '—'}</p></div>
            <div><span className="text-gray-500 block">Root Cause:</span><p className="text-gray-800">{capa.rootCause || '—'}</p></div>
            <div><span className="text-gray-500 block">Immediate Action:</span><p className="text-gray-800">{capa.immediateAction || '—'}</p></div>
          </div>
        </div>
      </div>

      {nextStatuses.length > 0 && (
        <div className="flex gap-2">
          {nextStatuses.map(s => (
            <button key={s} onClick={() => handleTransition(s)}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm capitalize">
              Move to {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      )}

      <SectionHeader title={`Corrective Actions (${correctiveActions.length})`} />
      <div className="space-y-2">
        {correctiveActions.map(ca => (
          <div key={ca._id} className="bg-white rounded-lg border p-4 flex justify-between items-start">
            <div>
              <p className="font-medium text-sm">{ca.title}</p>
              <p className="text-xs text-gray-500">{ca.actionCategory} • {ca.assignedToName || '—'} • Due: {ca.targetDate ? new Date(ca.targetDate).toLocaleDateString() : '—'}</p>
            </div>
            <StatusBadge status={ca.status} color={ACTION_STATUS_COLORS[ca.status]} />
          </div>
        ))}
        {correctiveActions.length === 0 && <p className="text-gray-500 text-sm">No corrective actions.</p>}
      </div>

      <SectionHeader title={`Preventive Actions (${preventiveActions.length})`} />
      <div className="space-y-2">
        {preventiveActions.map(pa => (
          <div key={pa._id} className="bg-white rounded-lg border p-4 flex justify-between items-start">
            <div>
              <p className="font-medium text-sm">{pa.title}</p>
              <p className="text-xs text-gray-500">{pa.riskArea} • {pa.assignedToName || '—'}</p>
            </div>
            <StatusBadge status={pa.status} color={ACTION_STATUS_COLORS[pa.status]} />
          </div>
        ))}
        {preventiveActions.length === 0 && <p className="text-gray-500 text-sm">No preventive actions.</p>}
      </div>

      {rca && (
        <>
          <SectionHeader title="Root Cause Analysis" />
          <div className="bg-white rounded-lg border p-5 space-y-3 text-sm">
            <div><span className="text-gray-500">Method:</span> {rca.method}</div>
            <div><span className="text-gray-500">Root Cause:</span> {rca.rootCause || '—'}</div>
            {rca.method === '5why' && ['why1','why2','why3','why4','why5'].map((w, i) => rca[w] && (
              <div key={w}><span className="text-gray-500">Why {i + 1}:</span> {rca[w]}</div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
