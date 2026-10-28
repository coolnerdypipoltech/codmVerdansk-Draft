import { useState } from 'react';
import { useOperador } from '../../OperadorContext';
import './DangerZone.css';

export default function DangerZone() {
  const { act } = useOperador();
  const [confirm, setConfirm] = useState('');

  async function wipe() {
    const j = await act('/api/reset-all', { confirm }, 'Todo borrado.');
    if (j) setConfirm('');
  }

  return (
    <div className="card">
      <h2>Zona de riesgo</h2>
      <div className="row">
        <label className="f">
          Escribe BORRAR para vaciar todo
          <input type="text" autoComplete="off" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        <button className="btn danger" onClick={wipe}>Borrar todos los datos</button>
      </div>
    </div>
  );
}
