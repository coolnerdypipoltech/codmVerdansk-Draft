import { useOperador } from '../../OperadorContext';
import './CreatorsTable.css';

export default function CreatorsTable() {
  const { ST } = useOperador();
  const creators = ST.state.creators;

  return (
    <div className="card">
      <h2>Creadores cargados</h2>
      <div className="tw">
        {creators.length ? (
          <table>
            <thead>
              <tr><th>Orden</th><th>Nombre</th><th>Handle</th><th>Nivel</th><th>Botarga</th></tr>
            </thead>
            <tbody>
              {creators.map((c) => (
                <tr key={c.n}>
                  <td>{c.n}</td>
                  <td>{c.name}</td>
                  <td>{c.handle}</td>
                  <td>{c.tier == null ? <span className="muted">–</span> : c.tier}</td>
                  <td>{c.botarga}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className="muted creatorstable__empty">Sin creadores.</p>}
      </div>
    </div>
  );
}
