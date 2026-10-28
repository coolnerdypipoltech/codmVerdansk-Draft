import { useOperador } from '../../OperadorContext';
import useArmedAction from '../../../../shared/useArmedAction';
import './LiveDayCard.css';

export default function LiveDayCard() {
  const { ST, act } = useOperador();
  const pub = ST.pub, state = ST.state, validation = ST.validation;
  const day = pub.day, D = state.days[day];

  const reset = useArmedAction(() => act('/api/draft/reset', { day, confirm: D.status === 'closed' ? 'REABRIR' : '' }, 'Jornada reiniciada.'));

  let msg = null;
  if (!validation.ready[day]) msg = <div className="e">Faltan los jugadores de la Jornada {day} (pestaña Datos).</div>;
  else if (D.status === 'empty') msg = <div className="muted">Todo listo. Calcula el reparto para empezar.</div>;
  else msg = <div className="o">Reparto calculado ({(D.inputHash || '').slice(0, 12)}). Método: {state.config.method === 'hibrido' ? 'Híbrido' : 'Snake'}.</div>;
  const needsCloseDay1 = day === 2 && state.days[1].status !== 'closed';

  return (
    <div className="card">
      <h2>Jornada en vivo</h2>
      <div className="row">
        <button className={'btn' + (day === 1 ? ' pri' : '')} onClick={() => act('/api/day', { day: 1 })}>Jornada 1</button>
        <button className={'btn' + (day === 2 ? ' pri' : '')} onClick={() => act('/api/day', { day: 2 })}>Jornada 2</button>
        <button
          className="btn pri"
          disabled={!validation.ready[day] || D.status === 'closed' || D.step > 0}
          onClick={() => act('/api/draft/start', { day, force: D.step > 0 }, 'Reparto calculado.')}
        >
          {D.status === 'empty' ? 'Calcular reparto' : 'Recalcular reparto'}
        </button>
        <button className={'btn' + (reset.armed ? ' arm' : '')} disabled={D.status === 'empty' && D.step === 0} onClick={reset.trigger}>
          {reset.armed ? '¿Seguro? Se pierde el avance' : 'Reiniciar jornada'}
        </button>
      </div>
      <div className="msgs">
        {msg}
        {needsCloseDay1 && <div className="w">Cierra la Jornada 1 (pestaña Resultados) antes de calcular la 2.</div>}
      </div>
      <div className="row livedaycard__auto-row">
        <button
          className={'btn' + (state.live.auto ? ' pri' : '')}
          disabled={!(D.status === 'ready' || D.status === 'running')}
          onClick={() => act('/api/draft/auto', { on: !state.live.auto })}
        >
          {state.live.auto ? '⏸ Pausar auto' : '⏵ Auto'}
        </button>
        <span className="muted sm">
          Atajos: <span className="kbd">Espacio</span> siguiente · <span className="kbd">Retroceso</span> deshacer · <span className="kbd">A</span> auto · <span className="kbd">0</span>-<span className="kbd">4</span> escenas
        </span>
      </div>
    </div>
  );
}
