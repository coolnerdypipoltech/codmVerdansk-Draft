import { useRef, useState } from 'react';
import { useOperador } from '../../OperadorContext';
import { useToast } from '../../../../shared/Toast/Toast';
import { withPin } from '../../../../api/client';
import './Importer.css';

export default function Importer({ kind, day, title, hint, chip }) {
  const { act, pin } = useOperador();
  const notify = useToast();
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);

  async function onFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const t = await f.text();
    if (t.indexOf('�') >= 0) notify('El archivo no está en UTF-8. Guárdalo como "CSV UTF-8" para conservar acentos.', 'bad');
    setText(t);
  }

  async function run(commit) {
    if (!text.trim()) { setResult({ errors: ['Pega o elige un archivo primero.'], warnings: [], count: 0 }); return; }
    const j = await act('/api/import', { kind, text, day, commit }, commit ? 'Datos cargados.' : null);
    if (!j) return;
    setResult(j);
    if (j.committed) setText('');
  }

  return (
    <div className="card importer">
      <h2>{title} <span className="chip">{chip}</span></h2>
      <p className="muted sm importer__hint">
        {hint} <a href={withPin(`/api/template?kind=${kind}`, pin)}>Descargar plantilla</a>
      </p>
      <textarea
        className="importer__textarea"
        spellCheck="false"
        placeholder="Pega aquí desde Excel o Google Sheets, o elige un archivo CSV."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="row importer__actions">
        <input ref={fileRef} type="file" accept=".csv,.tsv,.txt" aria-label="Archivo CSV" onChange={onFile} />
        <button className="btn" onClick={() => run(false)}>Revisar</button>
        <button className="btn pri" onClick={() => run(true)}>Cargar</button>
      </div>
      {result && (
        <div className="msgs">
          {result.errors.map((x, i) => <div key={'e' + i} className="e">✖ {x}</div>)}
          {result.warnings.map((x, i) => <div key={'w' + i} className="w">⚠ {x}</div>)}
          {!result.errors.length && (
            <div className="o">
              {result.committed ? '✔ Cargado: ' : '✔ Se ve bien: '}{result.count} filas
              {result.days ? ` (${Object.keys(result.days).map((d) => `Jornada ${d}: ${result.days[d]}`).join(', ')})` : ''}.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
