import { createContext, useCallback, useContext, useRef, useState } from 'react';
import './Toast.css';

const ToastContext = createContext(() => {});

export function ToastProvider({ children }) {
  const [state, setState] = useState({ msg: '', kind: '', on: false });
  const timerRef = useRef(null);

  const notify = useCallback((msg, kind) => {
    clearTimeout(timerRef.current);
    setState({ msg, kind: kind || '', on: true });
    timerRef.current = setTimeout(() => setState((s) => ({ ...s, on: false })), kind === 'bad' ? 6000 : 2500);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div
        className={'toast' + (state.on ? ' toast--on' : '') + (state.kind ? ' toast--' + state.kind : '')}
        role="status"
      >
        {state.msg}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
