import { useSalida } from '../../SalidaContext';
import { pad } from '../../../../shared/format';
import { dayLabel, blocks } from '../../salidaUtils';
import SquadCard from '../../components/SquadCard/SquadCard';
import CallBanner from '../../components/CallBanner/CallBanner';
import SceneTitle from '../../components/SceneTitle/SceneTitle';
import './BoardScene.css';

export default function BoardScene() {
  const { S, hit, call } = useSalida();
  const n = S.N, cols = n > 25 ? 6 : 5, w = cols === 5 ? 240 : 199;
  const half = Math.ceil(S.pool.length / 2);
  const cur = (S.lastPick && hit) ? S.lastPick.puesto : null;

  function col(list) {
    return (
      <div className="boardscene__pool-col" style={{ '--rows': half }}>
        {list.map((p) => {
          let cls = p.puesto <= S.step ? 'boardscene__pool-item--done' : '';
          if (cur === p.puesto) cls = 'boardscene__pool-item--cur';
          return (
            <div key={p.puesto} className={'boardscene__pool-item ' + cls}>
              <i>{pad(p.puesto)}</i><span>{p.nick}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <section className={'layer boardscene' + (S.scene === 'board' ? ' layer--on' : '')}>
      <SceneTitle
        className="boardscene__hd"
        kicker={`${dayLabel(S)} · ${blocks(S)}`}
        title={S.config.title || 'DRAFT DE SQUADS'}
        variant="gold"
      />
      {/* <div className={'boardscene__tag' + (call.visible ? ' boardscene__tag--off' : '')}>
        <div className="boardscene__pill">Ronda<b>{S.step === 0 ? 1 : round} / 2</b></div>
        <div className="boardscene__pill">Jugador<b>{pad(Math.min(S.step, S.total))} / {S.total}</b></div>
      </div> */}
      <CallBanner info={call.info} visible={call.visible} />
      <div className="boardscene__pool">
        <h3 className="boardscene__pool-h">Clasificados · {dayLabel(S)}</h3>
        <div className="boardscene__pool-cols">{col(S.pool.slice(0, half))}{col(S.pool.slice(half))}</div>
      </div>
      <div className="boardscene__grid" style={{ gridTemplateColumns: `repeat(${cols},${w}px)`, gap: (cols === 5 ? 14 : 12) + 'px' }}>
        {S.squads.map((sq, i) => <SquadCard key={i} sq={sq} idx={i} hit={hit} className="squadcard--final" />)}
      </div>
    </section>
  );
}
