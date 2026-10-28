import { useCallback, useEffect, useMemo, useState } from 'react';
import { ToastProvider, useToast } from '../../shared/Toast/Toast';
import OperadorContext from './OperadorContext';
import useSSE from '../../api/useSSE';
import { apiCall, loadPin, savePin, withPin } from '../../api/client';
import PinGate from './components/PinGate/PinGate';
import TopBar from './components/TopBar/TopBar';
import TabsNav from './components/TabsNav/TabsNav';
import DatosPane from './components/DatosPane/DatosPane';
import DraftPane from './components/DraftPane/DraftPane';
import ResultadosPane from './components/ResultadosPane/ResultadosPane';
import './OperadorPage.css';

export default function OperadorPage() {
  return (
    <ToastProvider>
      <OperadorApp />
    </ToastProvider>
  );
}

function OperadorApp() {
  const notify = useToast();
  const [pin, setPin] = useState(() => loadPin());
  const [sseEnabled, setSseEnabled] = useState(false);
  const [pinGate, setPinGate] = useState({ open: false, error: '' });
  const [tab, setTab] = useState('datos');
  const [autoTabDone, setAutoTabDone] = useState(false);

  const { data: ST, connected } = useSSE('op', pin, sseEnabled);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const p = await (await fetch('/api/ping')).json();
        if (p.pinRequired) {
          const r = await fetch('/api/state', { headers: { 'x-pin': pin } });
          if (r.status === 401) { if (!cancelled) setPinGate({ open: true, error: '' }); return; }
        }
      } catch { /* servidor sin responder aún */ }
      if (!cancelled) setSseEnabled(true);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (ST && !autoTabDone) {
      setAutoTabDone(true);
      if (ST.validation.ready[1] || ST.validation.ready[2]) setTab('draft');
    }
  }, [ST, autoTabDone]);

  const call = useCallback(async (path, body) => {
    try {
      return await apiCall(path, pin, body);
    } catch (e) {
      if (e.pinRequired) setPinGate({ open: true, error: 'PIN incorrecto.' });
      throw e;
    }
  }, [pin]);

  const act = useCallback(async (path, body, okMsg) => {
    try {
      const j = await call(path, body || {});
      if (okMsg) notify(okMsg, 'ok');
      return j;
    } catch (e) {
      notify(e.message, 'bad');
      return null;
    }
  }, [call, notify]);

  async function submitPin(value) {
    try {
      const r = await fetch('/api/state', { headers: { 'x-pin': value } });
      if (r.status === 401) { setPinGate({ open: true, error: 'PIN incorrecto.' }); return; }
    } catch { /* si el servidor no responde todavía, se intenta de todas formas */ }
    savePin(value);
    setPin(value);
    setPinGate({ open: false, error: '' });
    setSseEnabled(true);
  }

  useEffect(() => {
    function onKeyDown(e) {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.ctrlKey || e.metaKey || e.altKey) return;
      if (!ST) return;
      const day = ST.pub.day, D = ST.state.days[day];
      if (e.key === ' ' || e.key === 'ArrowRight') {
        e.preventDefault();
        if (D.status === 'ready' || D.status === 'running') act('/api/draft/next');
      } else if (e.key === 'Backspace' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (D.step > 0 && D.status !== 'closed') act('/api/draft/prev');
      } else if (e.key === 'a' || e.key === 'A') {
        if (D.status === 'ready' || D.status === 'running') act('/api/draft/auto', { on: !ST.state.live.auto });
      } else if (['0', '1', '2', '3', '4'].indexOf(e.key) >= 0) {
        act('/api/scene', { scene: ['idle', 'pool', 'board', 'final', 'squad'][+e.key] });
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [ST, act]);

  const ctx = useMemo(() => ({
    ST, connected, pin, act, call,
    download: (url) => withPin(url, pin),
  }), [ST, connected, pin, act, call]);

  return (
    <div className="operador-page">
      <PinGate open={pinGate.open} error={pinGate.error} onSubmit={submitPin} />
      {ST ? (
        <OperadorContext.Provider value={ctx}>
          <div className="operador-page__wrap">
            <TopBar />
            <TabsNav active={tab} onChange={setTab} />
            {tab === 'datos' && <DatosPane onSampleLoaded={() => setTab('draft')} />}
            {tab === 'draft' && <DraftPane />}
            {tab === 'result' && <ResultadosPane />}
          </div>
        </OperadorContext.Provider>
      ) : (
        !pinGate.open && <div className="operador-page__loading muted">Conectando con el servidor…</div>
      )}
    </div>
  );
}
