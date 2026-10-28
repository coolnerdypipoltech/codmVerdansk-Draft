import { useOperador } from '../../OperadorContext';
import useArmedAction from '../../../../shared/useArmedAction';
import { withPin } from '../../../../api/client';
import './CloseExportCard.css';

export default function CloseExportCard() {
  const { ST, act, pin } = useOperador();
  const days = ST.state.days;

  const close1 = useArmedAction(() => act('/api/draft/close', { day: 1 }, 'Jornada 1 cerrada. Archivos guardados en la carpeta salidas.'));
  const close2 = useArmedAction(() => act('/api/draft/close', { day: 2 }, 'Jornada 2 cerrada. Archivos guardados en la carpeta salidas.'));

  return (
    <div className="card">
      <h2>Cerrar y exportar</h2>
      <div className="row">
        <button className={'btn pri' + (close1.armed ? ' arm' : '')} disabled={days[1].status !== 'complete'} onClick={close1.trigger}>
          {close1.armed ? '¿Cerrar Jornada 1?' : 'Cerrar Jornada 1'}
        </button>
        <button className={'btn pri' + (close2.armed ? ' arm' : '')} disabled={days[2].status !== 'complete'} onClick={close2.trigger}>
          {close2.armed ? '¿Cerrar Jornada 2?' : 'Cerrar Jornada 2'}
        </button>
      </div>
      <p className="muted sm closeexport__note">Al cerrar se guardan en la carpeta <b>salidas</b> el CSV de squads, el acta (JSON y HTML) y se bloquea la jornada.</p>
      <div className="row closeexport__links">
        <a className="btn" href={withPin('/api/export/csv?day=1', pin)}>CSV Jornada 1</a>
        <a className="btn" href={withPin('/api/export/csv?day=2', pin)}>CSV Jornada 2</a>
        <a className="btn" href={withPin('/api/export/csv?day=final', pin)}>CSV final (las dos)</a>
        <a className="btn" href={withPin('/api/export/acta.json', pin)}>Acta JSON</a>
        <a className="btn" href={withPin('/api/export/acta.html', pin)} target="_blank" rel="noopener noreferrer">Acta imprimible</a>
      </div>
    </div>
  );
}
