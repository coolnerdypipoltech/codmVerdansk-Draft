import { useSalida } from '../../SalidaContext';
import { pad } from '../../../../shared/format';
import { benchRef, isNewPick } from '../../salidaUtils';
import './SquadCard.css';

function Row({ entry, cls, bench, isNew }) {
  if (!entry) return <div className={'squadcard__row ' + cls + ' squadcard__row--empty'}><i>00</i><span>—</span></div>;
  return (
    <div className={'squadcard__row ' + cls + (bench ? ' squadcard__row--bench' : '') + (entry.sub ? ' squadcard__row--sub' : '') + (isNew ? ' squadcard__row--new' : '')}>
      <i>{pad(entry.puesto)}</i><span>{entry.nick}</span>
    </div>
  );
}

export default function SquadCard({ sq, idx, hit, className }) {
  const { S } = useSalida();
  const b = benchRef(S, sq);
  const isHit = !!(hit && hit.creator === idx);
  const showLevel = S.config.showLevel && sq.tier;

  return (
    <div className={'squadcard' + (isHit ? ' squadcard--hit' : '') + (className ? ' ' + className : '')} data-i={idx}>
      <div className="squadcard__head">
        {sq.photo && <img className="squadcard__photo" src={sq.photo} alt="" />}
        <div className="squadcard__name">{sq.name}</div>
        {showLevel && (
          <span className="squadcard__level">
            {[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= sq.tier ? 'squadcard__level-dot squadcard__level-dot--on' : 'squadcard__level-dot'} />)}
          </span>
        )}
      </div>
      <div className="squadcard__rows">
        {[0, 1].map((k) => <Row key={'d1-' + k} entry={sq.d1[k]} cls="squadcard__row--d1" bench={!!(b && b.day === 1 && b.k === k)} isNew={isNewPick(hit, sq.d1[k], 1)} />)}
        {[0, 1].map((k) => <Row key={'d2-' + k} entry={sq.d2[k]} cls="squadcard__row--d2" bench={!!(b && b.day === 2 && b.k === k)} isNew={isNewPick(hit, sq.d2[k], 2)} />)}
      </div>
    </div>
  );
}
