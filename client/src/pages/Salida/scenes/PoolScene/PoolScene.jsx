import { useSalida } from '../../SalidaContext';
import { pad } from '../../../../shared/format';
import { dayLabel, blocks } from '../../salidaUtils';
import SceneTitle from '../../components/SceneTitle/SceneTitle';
import './PoolScene.css';

export default function PoolScene() {
  const { S } = useSalida();
  const rows = 10, cols = Math.max(5, Math.ceil(S.pool.length / rows));
  const dense = cols > 5;

  return (
    <section className={'layer poolscene' + (S.scene === 'pool' ? ' layer--on' : '')}>
      <SceneTitle
        className="poolscene__hd"
        kicker={`${dayLabel(S)} · ${blocks(S)}`}
        title={`Los ${S.total} finalistas del día`}
        titleClassName="poolscene__title"
        variant="red"
      />
      <div
        className={'poolscene__grid' + (dense ? ' poolscene__grid--dense' : '')}
        style={{ gridTemplateColumns: `repeat(${cols},minmax(0,1fr))`, gridAutoFlow: 'column', gridTemplateRows: `repeat(${rows},62px)` }}
      >
        {S.pool.map((p) => (
          <div key={p.puesto} className="poolscene__item"><i>{pad(p.puesto)}</i><span>{p.nick}</span></div>
        ))}
      </div>
    </section>
  );
}
