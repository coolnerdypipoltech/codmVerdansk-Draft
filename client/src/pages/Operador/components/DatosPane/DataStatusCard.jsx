import { useOperador } from '../../OperadorContext';
import { useToast } from '../../../../shared/Toast/Toast';
import './DataStatusCard.css';

export default function DataStatusCard({ onSampleLoaded }) {
  const { ST, act } = useOperador();
  const notify = useToast();
  const pub = ST.pub, validation = ST.validation, N = pub.N;

  const chips = [
    { label: `${N} creadores`, kind: N >= 2 ? 'ok' : 'warn' },
    ...[1, 2].map((d) => {
      const n = ST.players[d].filter((p) => !p.reserve && p.puesto <= 2 * N).length;
      const r = ST.reserves[d].length;
      return { label: `J${d}: ${n} + ${r} reservas`, kind: validation.ready[d] ? 'ok' : (n ? 'bad' : '') };
    }),
  ];

  async function shuffle() {
    const j = await act('/api/shuffle-order', {});
    if (j) notify(`Orden sorteado (semilla ${j.seed}).`, 'ok');
  }

  async function loadSample() {
    const j = await act('/api/load-sample', {}, 'Datos de ejemplo cargados.');
    if (j && onSampleLoaded) onSampleLoaded();
  }

  return (
    <div className="card">
      <h2>
        Estado de los datos
        <span className="row datastatus__chips">
          {chips.map((c, i) => <span key={i} className={'chip ' + c.kind}>{c.label}</span>)}
        </span>
      </h2>
      <div className="msgs">
        {validation.errors.map((x, i) => <div key={'e' + i} className="e">✖ {x}</div>)}
        {validation.warnings.map((x, i) => <div key={'w' + i} className="w">⚠ {x}</div>)}
        {!validation.errors.length && !validation.warnings.length && (
          N ? <div className="o">✔ Los datos cargados son consistentes.</div>
            : <div className="muted">Carga primero a los creadores y después a los jugadores de cada jornada.</div>
        )}
      </div>
      <div className="row datastatus__actions">
        <button className="btn" onClick={loadSample}>Cargar datos de ejemplo (ensayo)</button>
        <button className="btn" onClick={shuffle}>Sortear orden de creadores</button>
        <span className="muted sm">El orden solo desempata cuando dos squads llevan los mismos puntos.</span>
      </div>
    </div>
  );
}
