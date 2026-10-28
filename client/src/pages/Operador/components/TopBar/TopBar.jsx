import { useOperador } from '../../OperadorContext';
import './TopBar.css';

const STATUS = { empty: 'Sin calcular', ready: 'Listo para empezar', running: 'En curso', complete: 'Reparto completo', closed: 'Cerrada' };

export default function TopBar() {
  const { ST, connected, act } = useOperador();
  const pub = ST?.pub, state = ST?.state;
  const day = pub?.day;
  const D = state?.days?.[day];

  return (
    <div className="topbar">
      <div className="topbar__preview">
        <span className="topbar__preview-lbl">En pantalla</span>
        <iframe className="topbar__preview-frame" title="Vista previa de la salida" src="/salida?preview=1" />
      </div>
      <div className="topbar__status">
        <h1 className="topbar__title">Draft Señal Verdansk</h1>
        <div className="topbar__line">
          <span><i className={'dot' + (connected ? ' ok' : '')} />{connected ? 'Conectado' : 'Conectando…'}</span>
          {pub && <span>Jornada {day}</span>}
          {D && <span>{STATUS[D.status]}{state.live.auto ? ' · AUTO' : ''}</span>}
        </div>
        {pub && (
          <div className="row topbar__step-row">
            <span className="big">{pub.step} / {pub.total}</span>
            <span className="muted">
              {ST.next ? `Siguiente: puesto ${String(ST.next.puesto).padStart(2, '0')} · ${ST.next.nick}` : (D && (D.status === 'complete' || D.status === 'closed') ? 'Reparto completo' : '')}
            </span>
          </div>
        )}
      </div>
      <div className="row">
        <a className="btn" href="/salida" target="_blank" rel="noopener noreferrer" title="Abre la salida de stream en una pestaña nueva">Abrir salida ↗</a>
        {state && (
          <button
            className="btn"
            aria-pressed={state.live.bgTransparent}
            title="Quita el fondo de la salida para ponerla encima del video en OBS/vMix"
            onClick={() => act('/api/bg', { transparent: !state.live.bgTransparent })}
          >
            {state.live.bgTransparent ? '◱ Fondo transparente' : '◱ Fondo sólido'}
          </button>
        )}
        <button className="btn xl" title="Deshacer (Retroceso)" disabled={!D || !(D.step > 0 && D.status !== 'closed')} onClick={() => act('/api/draft/prev')}>◀ Deshacer</button>
        <button className="btn xl go" title="Siguiente (Espacio)" disabled={!D || !(D.status === 'ready' || D.status === 'running')} onClick={() => act('/api/draft/next')}>Siguiente ▶</button>
      </div>
    </div>
  );
}
