import { useEffect, useState } from 'react';
import { useOperador } from '../../OperadorContext';
import './SettingsCard.css';

export default function SettingsCard() {
  const { ST, act } = useOperador();
  const cfg = ST.state.config;
  const started = ST.state.days[1].step > 0 || ST.state.days[2].step > 0;

  const [editing, setEditing] = useState(null);
  const [method, setMethod] = useState(cfg.method);
  const [levelStep, setLevelStep] = useState(cfg.levelStep);
  const [autoMs, setAutoMs] = useState(cfg.autoMs);
  const [title, setTitle] = useState(cfg.title);
  const [showLevel, setShowLevel] = useState(cfg.showLevel);
  const [markBench, setMarkBench] = useState(cfg.markBench);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (editing !== 'method') setMethod(cfg.method);
    if (editing !== 'step') setLevelStep(cfg.levelStep);
    if (editing !== 'auto') setAutoMs(cfg.autoMs);
    if (editing !== 'title') setTitle(cfg.title);
    if (editing !== 'showlv') setShowLevel(cfg.showLevel);
    if (editing !== 'bench') setMarkBench(cfg.markBench);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg]);

  async function send(overrides) {
    const body = { method, levelStep, autoMs, showLevel, markBench, title, ...overrides };
    const j = await act('/api/config', body);
    setMsg(j ? 'Guardado.' : '');
  }

  return (
    <div className="card">
      <h2>Ajustes</h2>
      <div className="row">
        <label className="f">
          Método
          <select
            value={method} disabled={started}
            onFocus={() => setEditing('method')}
            onChange={(e) => { const v = e.target.value; setMethod(v); setEditing(null); send({ method: v }); }}
          >
            <option value="hibrido">Híbrido (con nivel de creadores)</option>
            <option value="snake">Snake (sin nivel)</option>
          </select>
        </label>
        <label className="f">
          Puntos por nivel
          <input
            type="number" min="0" max="20" className="settingscard__num" value={levelStep} disabled={started}
            onFocus={() => setEditing('step')}
            onChange={(e) => setLevelStep(e.target.value)}
            onBlur={() => { setEditing(null); send({ levelStep }); }}
          />
        </label>
        <label className="f">
          Ritmo automático (ms)
          <input
            type="number" min="800" max="15000" step="100" className="settingscard__num-lg" value={autoMs}
            onFocus={() => setEditing('auto')}
            onChange={(e) => setAutoMs(e.target.value)}
            onBlur={() => { setEditing(null); send({ autoMs }); }}
          />
        </label>
      </div>
      <div className="row settingscard__row2">
        <label className="f">
          Título en pantalla
          <input
            type="text" maxLength={40} className="settingscard__title" value={title}
            onFocus={() => setEditing('title')}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => { setEditing(null); send({ title }); }}
          />
        </label>
        <label className="row sm">
          <input
            type="checkbox" checked={showLevel}
            onChange={(e) => { const v = e.target.checked; setShowLevel(v); send({ showLevel: v }); }}
          /> Mostrar nivel de creador en pantalla
        </label>
        <label className="row sm">
          <input
            type="checkbox" checked={markBench}
            onChange={(e) => { const v = e.target.checked; setMarkBench(v); send({ markBench: v }); }}
          /> Marcar banca
        </label>
      </div>
      <div className="msgs">{msg && <span className="o">{msg}</span>}</div>
    </div>
  );
}
