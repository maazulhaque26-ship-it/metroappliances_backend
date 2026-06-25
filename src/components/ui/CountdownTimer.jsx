import React, { useState, useEffect } from 'react';

function pad(n) { return String(n).padStart(2, '0'); }

export default function CountdownTimer({ targetDate, className = '' }) {
  const [timeLeft, setTimeLeft] = useState(calcTime(targetDate));

  function calcTime(target) {
    const diff = Math.max(0, new Date(target) - Date.now());
    return {
      hours:   Math.floor(diff / 3_600_000),
      minutes: Math.floor((diff % 3_600_000) / 60_000),
      seconds: Math.floor((diff % 60_000) / 1000),
      done:    diff === 0,
    };
  }

  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTime(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (timeLeft.done) return <span className="text-red-400 font-semibold text-sm">Deal Ended</span>;

  const units = [
    { label: 'Hours',   value: pad(timeLeft.hours) },
    { label: 'Minutes', value: pad(timeLeft.minutes) },
    { label: 'Seconds', value: pad(timeLeft.seconds) },
  ];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {units.map(({ label, value }, i) => (
        <React.Fragment key={label}>
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-black/60 border border-amber-500/30 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-black text-white tabular-nums">{value}</span>
            </div>
            <span className="text-[9px] text-gray-500 uppercase tracking-widest mt-1 font-semibold">{label}</span>
          </div>
          {i < 2 && <span className="text-amber-500 font-black text-xl mb-4 select-none">:</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

export function CountdownBadge({ targetDate }) {
  const [timeLeft, setTimeLeft] = useState(calcTime(targetDate));
  function calcTime(target) {
    const diff = Math.max(0, new Date(target) - Date.now());
    return {
      h: Math.floor(diff / 3_600_000),
      m: Math.floor((diff % 3_600_000) / 60_000),
      s: Math.floor((diff % 60_000) / 1000),
    };
  }
  useEffect(() => {
    const id = setInterval(() => setTimeLeft(calcTime(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return (
    <span className="text-xs font-mono font-bold text-amber-400">
      {pad(timeLeft.h)}:{pad(timeLeft.m)}:{pad(timeLeft.s)}
    </span>
  );
}
