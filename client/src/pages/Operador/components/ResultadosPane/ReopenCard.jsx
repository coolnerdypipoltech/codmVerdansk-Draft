import { useState } from 'react';
import { useOperador } from '../../OperadorContext';
import './ReopenCard.css';

export default function ReopenCard() {
  const { act } = useOperador();
  const [day, setDay] = useState(1);
  const [confirm, setConfirm] = useState('');

  async function go() {
    const j = await act('/api/draft/reset', { day, confirm }, 'Jornada reabierta.');
    if (j) setConfirm('');
  }

  return (
    <div className="card">
      <h2>Reabrir una jornada</h2>
      <div className="row">
        <label className="f">
          Jornada
          <select value={day} onChange={(e) => setDay(+e.target.value)}>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>
        <label className="f">
          Escribe REABRIR
          <input type="text" autoComplete="off" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        <button className="btn danger" onClick={go}>Reabrir y borrar el reparto de esa jornada</button>
      </div>
      <p className="muted sm reopencard__note">Reabrir la Jornada 1 también borra la Jornada 2.</p>
    </div>
  );
}
