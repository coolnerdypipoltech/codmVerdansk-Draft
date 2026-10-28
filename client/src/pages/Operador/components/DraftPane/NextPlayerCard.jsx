import { useState } from 'react';
import { useOperador } from '../../OperadorContext';
import { pad } from '../../../../shared/format';
import './NextPlayerCard.css';

export default function NextPlayerCard() {
  const { ST } = useOperador();
  const [peek, setPeek] = useState(false);
  const n = ST.next;
  const dayStatus = ST.state.days[ST.pub.day].status;

  return (
    <div className="card">
      <h2>Siguiente jugador</h2>
      <div className="next">
        {!n ? (
          <>
            <span className="next__k">Estado</span>
            <span>{dayStatus === 'empty' ? 'Calcula el reparto para empezar.' : 'Ya no quedan jugadores por repartir.'}</span>
          </>
        ) : (
          <>
            <span className="next__k">Jugador</span>
            <span className="big">{pad(n.puesto)} · {n.nick}</span>
            <span className="next__k">Ronda</span>
            <span>{n.round} de 2 · jugador {n.step}</span>
            <span className="next__k">Va con</span>
            <span className={peek ? '' : 'blur'}>
              <b>{n.creatorName}</b> <span className="muted">(llevaba {n.pts} pts{n.tie ? ', hubo empate' : ''})</span>
            </span>
          </>
        )}
      </div>
      {n && (
        <div className="row nextplayercard__peek-row">
          <button className="btn" onClick={() => setPeek((v) => !v)}>{peek ? 'Ocultar destino' : 'Ver destino (solo operador)'}</button>
        </div>
      )}
    </div>
  );
}
