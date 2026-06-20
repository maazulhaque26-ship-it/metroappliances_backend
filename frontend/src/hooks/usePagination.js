import { useState, useCallback } from 'react';

export function usePagination(initialLimit = 10) {
  const [page,  setPage]  = useState(1);
  const [total, setTotal] = useState(0);
  const [limit, setLimit] = useState(initialLimit);

  const reset = useCallback(() => setPage(1), []);

  const setTotalAndReset = useCallback((t) => {
    setTotal(t);
    setPage(1);
  }, []);

  return { page, setPage, total, setTotal, limit, setLimit, reset, setTotalAndReset, pages: Math.ceil(total / limit) || 1 };
}
