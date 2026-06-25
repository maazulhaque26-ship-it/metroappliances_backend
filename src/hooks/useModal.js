import { useState, useCallback } from 'react';

export function useModal(initial = false) {
  const [open, setOpen] = useState(initial);

  const show = useCallback(() => setOpen(true),  []);
  const hide = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen(o => !o), []);

  return { open, show, hide, toggle, setOpen };
}

export function useConfirm() {
  const [state, setState] = useState({ open: false, title: '', message: '', onConfirm: null, type: 'danger', loading: false });

  const ask = useCallback(({ title, message, onConfirm, type = 'danger' }) => {
    setState({ open: true, title, message, onConfirm, type, loading: false });
  }, []);

  const cancel = useCallback(() => setState(s => ({ ...s, open: false, loading: false })), []);

  const confirm = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));
    try { await state.onConfirm?.(); }
    finally { setState(s => ({ ...s, open: false, loading: false })); }
  }, [state]);

  return { ...state, ask, cancel, confirm };
}
