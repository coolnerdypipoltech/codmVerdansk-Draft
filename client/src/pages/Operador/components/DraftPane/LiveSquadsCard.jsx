import { useOperador } from '../../OperadorContext';
import './LiveSquadsCard.css';

function fmt(list) {
  if (!list.length) return <span className="muted">–</span>;
  return list.map((e, i) => (
    <span key={e.puesto}>{i > 0 && ', '}{e.nick} <span className="muted">({e.puesto})</span></span>
  ));
}

export default function LiveSquadsCard() {
  const { ST } = useOperador();
  const pub = ST.pub, state = ST.state, totals = ST.totals, gap = ST.gap;
  const mx = Math.max(...totals), mn = Math.min(...totals);
  const highlight = (pub.step > 0 || state.days[pub.day].status === 'closed' || state.days[1].step > 0) && mx !== mn;

  return (
    <div className="card">
      <h2>Squads en vivo <span className="chip">Diferencia mejor y peor: {gap} pts</span></h2>
      <div className="tw">
        <table>
          <thead>
            <tr><th>#</th><th>Creador</th><th>Nivel</th><th>Jornada 1</th><th>Jornada 2</th><th>Puntos</th></tr>
          </thead>
          <tbody>
            {state.creators.map((cr, i) => {
              const sq = pub.squads[i];
              const cls = highlight ? (totals[i] === mx ? 'hi' : (totals[i] === mn ? 'lo' : '')) : '';
              return (
                <tr key={cr.n} className={cls}>
                  <td>{cr.n}</td>
                  <td>{cr.name}</td>
                  <td>{cr.tier == null ? '–' : cr.tier}</td>
                  <td>{fmt(sq.d1)}</td>
                  <td>{fmt(sq.d2)}</td>
                  <td><b>{totals[i]}</b></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
