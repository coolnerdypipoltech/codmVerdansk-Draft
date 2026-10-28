import { useOperador } from '../../OperadorContext';
import './LogCard.css';

export default function LogCard() {
  const { ST } = useOperador();
  const entries = ST.state.log.slice(-12).reverse();

  return (
    <div className="card">
      <h2>Bitácora</h2>
      <div className="sm muted logcard__list">
        {entries.map((l, i) => (
          <div key={i}>
            {l.t.slice(11, 19)} · {l.action}{l.day ? ` J${l.day}` : ''}{l.step ? ` #${l.step}` : ''}{l.scene ? ` ${l.scene}` : ''}
          </div>
        ))}
      </div>
    </div>
  );
}
