import React, { memo, useMemo } from 'react';
import { FiCheck, FiX } from 'react-icons/fi';
import { STAGES, getStageProgress, buildTimeline } from '../../utils/orderTracking';

function formatDateTime(d) {
  return {
    date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}

function OrderTracking({ order }) {
  const { currentIndex, cancelled } = useMemo(() => getStageProgress(order), [order]);
  const timeline = useMemo(() => buildTimeline(order), [order]);

  if (cancelled) {
    return (
      <div className="p-6" style={{ background: 'var(--card)', border: '1px solid #FECACA', borderRadius: 'var(--radius-md)' }}>
        <div className="flex items-center gap-3" style={{ color: '#DC2626' }}>
          <FiX size={20} />
          <p className="font-bold">This order was cancelled.</p>
        </div>
      </div>
    );
  }

  const currentLabel = STAGES[Math.max(currentIndex, 0)]?.label;
  const progressPct = Math.round((currentIndex / (STAGES.length - 1)) * 100);

  return (
    <div className="p-6" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}>

      {/* Compact summary — mobile only, never requires horizontal scroll */}
      <div className="sm:hidden mb-8">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--text-4)' }}>
            Step {currentIndex + 1} of {STAGES.length}
          </span>
          <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{currentLabel}</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-2)' }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%`, background: 'var(--accent)' }}
          />
        </div>
      </div>

      {/* Full stepper — sm and up, sized to always fit without scrolling */}
      <div className="hidden sm:flex items-start mb-10" role="list" aria-label="Order progress">
        {STAGES.map((stage, i) => {
          const done = i < currentIndex;
          const isCurrent = i === currentIndex;
          const active = done || isCurrent;
          return (
            <div
              key={stage.key}
              role="listitem"
              aria-current={isCurrent ? 'step' : undefined}
              className="flex-1 flex flex-col items-center text-center relative px-1"
            >
              {i > 0 && (
                <div
                  className="absolute top-[15px] right-1/2 h-[2px] w-full -z-10"
                  style={{ background: i <= currentIndex ? 'var(--accent)' : 'var(--border)' }}
                  aria-hidden="true"
                />
              )}
              <div
                className={`w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors flex-shrink-0`}
                style={{
                  background: active ? (isCurrent ? 'var(--accent)' : 'var(--text)') : 'var(--card)',
                  borderColor: active ? (isCurrent ? 'var(--accent)' : 'var(--text)') : 'var(--border)',
                  color: active ? '#fff' : 'var(--text-4)',
                }}
              >
                {done ? <FiCheck size={14} /> : i + 1}
              </div>
              <span
                className="mt-2 text-[9.5px] font-bold uppercase tracking-wider leading-tight"
                style={{ color: isCurrent ? 'var(--accent)' : active ? 'var(--text)' : 'var(--text-4)' }}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Timeline */}
      <div>
        <h3 className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: 'var(--text-4)' }} id="tracking-history-heading">Tracking History</h3>
        <ol className="space-y-0 list-none p-0 m-0" aria-labelledby="tracking-history-heading">
          {timeline.map((event, i) => {
            const { date, time } = formatDateTime(event.date);
            const isLast = i === timeline.length - 1;
            return (
              <li key={i} className="flex gap-4">
                <div className="flex flex-col items-center" aria-hidden="true">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1.5"
                    style={{ background: event.real ? 'var(--accent)' : 'var(--border-strong)' }}
                  />
                  {!isLast && <div className="w-px flex-1 my-1" style={{ background: 'var(--border)' }} />}
                </div>
                <div className={isLast ? 'pb-0' : 'pb-6'}>
                  <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{event.title}</p>
                  {event.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-3)' }}>{event.description}</p>}
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: 'var(--text-4)' }}>
                    <time dateTime={event.date.toISOString()}>{date} · {time}</time>
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export default memo(OrderTracking);
