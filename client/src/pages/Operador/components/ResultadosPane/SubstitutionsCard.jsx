import { useMemo, useState } from 'react';
import { useOperador } from '../../OperadorContext';
import { pad } from '../../../../shared/format';
import './SubstitutionsCard.css';

export default function SubstitutionsCard() {
  const { ST, act } = useOperador();
  const [day, setDay] = useState(1);
  const [outPuesto, setOutPuesto] = useState('');
  const [inPuesto, setInPuesto] = useState('');

  const outs = useMemo(() => {
    const list = [];
    ST.pub.squads.forEach((sq) => {
      (day === 1 ? sq.d1 : sq.d2).forEach((e) => {
        list.push({ value: e.puesto, label: `${sq.name} · ${pad(e.puesto)} ${e.nick}${e.sub ? ' (ya sustituido)' : ''}` });
      });
    });
    return list;
  }, [ST.pub.squads, day]);

  const ins = useMemo(() => {
    const used = ST.state.subs.filter((s) => s.day === day).map((s) => s.inPuesto);
    return ST.reserves[day].filter((r) => !used.includes(r.puesto))
      .map((r) => ({ value: r.puesto, label: `${pad(r.puesto)} ${r.nick}${r.block ? ' · bloque ' + r.block : ''}` }));
  }, [ST.state.subs, ST.reserves, day]);

  const can = ST.state.days[day].status === 'complete' || ST.state.days[day].status === 'closed';
  const subs = ST.state.subs;

  async function go() {
    const j = await act('/api/substitute', { day, outPuesto, inPuesto }, 'Sustitución aplicada.');
    if (j) { setOutPuesto(''); setInPuesto(''); }
  }

  return (
    <div className="card">
      <h2>Sustituciones</h2>
      <p className="muted sm">Cuando alguien no confirma o no es elegible, entra una reserva en su mismo lugar. Solo disponible cuando la jornada terminó de repartirse.</p>
      <div className="row substitutions__row">
        <label className="f">
          Jornada
          <select value={day} onChange={(e) => { setDay(+e.target.value); setOutPuesto(''); setInPuesto(''); }}>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>
        <label className="f">
          Sale
          <select className="substitutions__select-out" value={outPuesto} onChange={(e) => setOutPuesto(e.target.value)}>
            <option value="">–</option>
            {outs.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="f">
          Entra (reserva)
          <select className="substitutions__select-in" value={inPuesto} onChange={(e) => setInPuesto(e.target.value)}>
            {ins.length === 0 && <option value="">Sin reservas</option>}
            {ins.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <button className="btn pri" disabled={!can || !ins.length || !outPuesto || !inPuesto} onClick={go}>Sustituir</button>
      </div>
      <div className="msgs">{!can && <span className="w">La jornada {day} aún no termina de repartirse.</span>}</div>
      <div className="sm muted substitutions__list">
        {subs.length > 0 && 'Sustituciones: ' + subs.map((s) => `J${s.day}: ${s.outNick} → ${s.inNick}`).join(' · ')}
      </div>
    </div>
  );
}
