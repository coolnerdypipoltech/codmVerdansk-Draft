import { useOperador } from '../../OperadorContext';
import './FinalSquadsCard.css';

function fmt(list) {
  if (!list.length) return '–';
  return list.map((e) => e.nick + (e.sub ? ' ↻' : '')).join(', ');
}

export default function FinalSquadsCard() {
  const { ST } = useOperador();
  const totals = ST.totals;

  return (
    <div className="card">
      <h2>Squads finales</h2>
      <div className="tw">
        <table>
          <thead>
            <tr><th>Botarga</th><th>Creador</th><th>Jornada 1</th><th>Jornada 2</th><th>Puntos</th></tr>
          </thead>
          <tbody>
            {ST.state.creators.map((cr, i) => {
              const sq = ST.pub.squads[i];
              return (
                <tr key={cr.n}>
                  <td>{cr.botarga}</td>
                  <td>{cr.name}</td>
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
