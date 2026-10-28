import { useSalida } from '../../SalidaContext';
import { pad } from '../../../../shared/format';
import { benchRef, BOTARGA_PHOTOS } from '../../salidaUtils';
import './SquadScene.css';

function PrBox({ entry, day, bench }) {
  if (!entry) {
    return (
      <div className={`squadscene__pr squadscene__pr--d${day} squadscene__pr--empty`}>
        <i>00</i><span>Por definir</span><small>Jornada {day}</small>
      </div>
    );
  }
  return (
    <div className={`squadscene__pr squadscene__pr--d${day}` + (bench ? ' squadscene__pr--bench' : '')}>
      <i>{pad(entry.puesto)}</i><span>{entry.nick}</span><small>{bench ? 'Banca' : `Jornada ${day}`}</small>
    </div>
  );
}

export default function SquadScene() {
  const { S } = useSalida();
  const idx = (S.squadSel != null && S.squads[S.squadSel]) ? S.squadSel : 0;
  const sq = S.squads[idx];

  return (
    <section className={'layer squadscene' + (S.scene === 'squad' ? ' layer--on' : '')}>
      {sq && <SquadDetail sq={sq} />}
    </section>
  );
}

function SquadDetail({ sq }) {
  const { S } = useSalida();
  const b = benchRef(S, sq);
  const botImg = sq.botarga && BOTARGA_PHOTOS[sq.botarga];

  return (
    <div className="squadscene__grid">
      <div className="squadscene__left">
        {(sq.photo || botImg) && (
          <div className="squadscene__pics">
            {botImg && <img className="squadscene__botimg" src={botImg} alt="" />}
            {sq.photo && <img className="squadscene__photo" src={sq.photo} alt="" />}
            
          </div>
        )}
        <div className="squadscene__k">Squad</div>
        <div className="squadscene__name">{sq.name}</div>
        {sq.botarga && <span className="squadscene__badge">{sq.botarga}</span>}
      </div>
      <div className="squadscene__right">
        {[0, 1].map((k) => <PrBox key={'d1-' + k} entry={sq.d1[k]} day={1} bench={!!(b && b.day === 1 && b.k === k)} />)}
        {[0, 1].map((k) => <PrBox key={'d2-' + k} entry={sq.d2[k]} day={2} bench={!!(b && b.day === 2 && b.k === k)} />)}
      </div>
    </div>
  );
}
