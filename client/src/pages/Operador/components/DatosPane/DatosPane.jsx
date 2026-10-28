import { useOperador } from '../../OperadorContext';
import DataStatusCard from './DataStatusCard';
import Importer from './Importer';
import CreatorsTable from './CreatorsTable';
import DangerZone from './DangerZone';
import './DatosPane.css';

export default function DatosPane({ onSampleLoaded }) {
  const { ST } = useOperador();
  const validation = ST.validation;

  return (
    <section className="pane">
      <DataStatusCard onSampleLoaded={onSampleLoaded} />
      <div className="cols">
        <Importer kind="creators" day={null} title="Creadores" chip={`${ST.pub.N} cargados`}
          hint="Columnas: orden, nombre, handle, nivel (1 a 5), botarga, foto." />
        <Importer kind="players" day={1} title="Jugadores · Jornada 1" chip={validation.ready[1] ? 'listos' : 'pendiente'}
          hint="Columnas: puesto, nick, nombre, id, bloque, puntos, bajas, discord, reserva. Los puestos 1 a 50 son los clasificados; el resto, reservas." />
        <Importer kind="players" day={2} title="Jugadores · Jornada 2" chip={validation.ready[2] ? 'listos' : 'pendiente'}
          hint="Mismo formato. Se carga al terminar el clasificatorio de la Jornada 2." />
      </div>
      <CreatorsTable />
      <DangerZone />
    </section>
  );
}
