import { useMemo } from 'react';
import { useSalida } from '../../SalidaContext';
import { dayLabel, blocks } from '../../salidaUtils';
import SquadCard from '../../components/SquadCard/SquadCard';
import SceneTitle from '../../components/SceneTitle/SceneTitle';
import './FinalScene.css';

function groupSquads(squads) {
  const groups = [];
  const names = {};
  squads.forEach((sq, i) => {
    const k = sq.botarga || '';
    if (!(k in names)) { names[k] = groups.length; groups.push({ name: k, list: [] }); }
    groups[names[k]].list.push(i);
  });
  if (groups.length < 2 || groups.length > 10 || groups.some((g) => !g.name)) {
    const byFive = [];
    const per = 5;
    for (let i = 0; i < squads.length; i += per) {
      byFive.push({ name: '', list: squads.slice(i, i + per).map((_, j) => i + j) });
    }
    return byFive;
  }
  return groups;
}

export default function FinalScene() {
  const { S, hit } = useSalida();
  const allDone = S.dayInfo[1] !== 'empty' && S.dayInfo[2] !== 'empty' && S.dayInfo[2] !== 'ready' && S.dayInfo[2] !== 'running';
  const part = S.finalPart, split = part === '1' || part === '2';

  const groups = useMemo(() => {
    let g = groupSquads(S.squads);
    if (split) {
      const half = Math.ceil(g.length / 2);
      g = part === '1' ? g.slice(0, half) : g.slice(half);
    }
    return g;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [S.squads, part, split]);

  let kick = allDone ? 'Señal Verdansk · Gran final' : `${dayLabel(S)} · ${blocks(S)}`;
  if (split) kick += ` · Parte ${part} de 2`;
  const title = allDone ? `Los ${S.N} squads` : `Resultado de la jornada ${S.day}`;

  return (
    <section className={'layer finalscene' + (S.scene === 'final' ? ' layer--on' : '')}>
      <SceneTitle
        className="finalscene__hd"
        kicker={kick}
        title={title}
        titleClassName="finalscene__title"
        variant="red"
      />
      <div className="finalscene__grid" style={{ gridTemplateColumns: `repeat(${groups.length},minmax(0,1fr))` }}>
        {groups.map((gr, gi) => (
          <div key={gi} className="finalscene__col">
            {gr.name
              ? <div className="finalscene__col-h">{gr.name}</div>
              : <div className="finalscene__col-h finalscene__col-h--hidden">·</div>}
            {gr.list.map((i) => <SquadCard key={i} sq={S.squads[i]} idx={i} hit={hit} className="squadcard" />)}
          </div>
        ))}
      </div>
    </section>
  );
}
