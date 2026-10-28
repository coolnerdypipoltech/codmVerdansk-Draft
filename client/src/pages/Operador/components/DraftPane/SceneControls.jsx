import { useEffect, useState } from 'react';
import { useOperador } from '../../OperadorContext';
import './SceneControls.css';

const SCENES = [
  { id: 'idle', label: '0 · Nada' },
  { id: 'pool', label: '1 · Los finalistas' },
  { id: 'board', label: '2 · Tablero del draft' },
  { id: 'final', label: '3 · Resultado' },
  { id: 'squad', label: '4 · Un squad' },
];

export default function SceneControls() {
  const { ST, act } = useOperador();
  const live = ST.state.live;
  const creators = ST.state.creators;

  const [squadSel, setSquadSel] = useState(live.squad ?? 0);
  const [partSel, setPartSel] = useState(live.finalPart);

  useEffect(() => { if (live.squad != null) setSquadSel(live.squad); }, [live.squad]);
  useEffect(() => { setPartSel(live.finalPart); }, [live.finalPart]);

  function setScene(scene) {
    const body = { scene, part: partSel };
    if (scene === 'squad') body.squad = squadSel;
    act('/api/scene', body);
  }

  function onSquadChange(e) {
    const v = +e.target.value;
    setSquadSel(v);
    if (live.scene === 'squad') act('/api/scene', { scene: 'squad', squad: v, part: partSel });
  }

  function onPartChange(e) {
    const v = e.target.value;
    setPartSel(v);
    if (live.scene === 'final') act('/api/scene', { scene: 'final', part: v, squad: squadSel });
  }

  return (
    <div className="card">
      <h2>Escena en pantalla</h2>
      <div className="scenecontrols">
        {SCENES.map((s) => (
          <button key={s.id} className="btn" aria-pressed={live.scene === s.id} onClick={() => setScene(s.id)}>{s.label}</button>
        ))}
        <select aria-label="Squad a mostrar" value={squadSel} onChange={onSquadChange}>
          {creators.map((c, i) => <option key={c.n} value={i}>{c.name}</option>)}
        </select>
        <select aria-label="Partes del resultado" value={partSel} onChange={onPartChange}>
          <option value="all">Resultado: 1 pantalla</option>
          <option value="1">Resultado: parte 1 de 2</option>
          <option value="2">Resultado: parte 2 de 2</option>
        </select>
      </div>
    </div>
  );
}
