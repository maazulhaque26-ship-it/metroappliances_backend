import { useState, useCallback, useMemo } from 'react';

export function useFilters(initial = {}) {
  const [filters, setFilters] = useState(initial);

  const setFilter = useCallback((key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
  }, []);

  const clearFilter = useCallback((key) => {
    setFilters(f => { const next = { ...f }; delete next[key]; return next; });
  }, []);

  const clearAll = useCallback(() => setFilters(initial), [initial]);

  const activeCount = useMemo(() => Object.values(filters).filter(v => v != null && v !== '' && v !== 'all').length, [filters]);

  const toParams = useCallback(() => {
    const p = {};
    Object.entries(filters).forEach(([k, v]) => { if (v != null && v !== '' && v !== 'all') p[k] = v; });
    return p;
  }, [filters]);

  return { filters, setFilter, clearFilter, clearAll, activeCount, toParams };
}
