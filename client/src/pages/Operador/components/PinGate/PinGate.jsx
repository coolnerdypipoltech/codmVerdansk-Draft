import { useEffect, useRef, useState } from 'react';
import './PinGate.css';

export default function PinGate({ open, error, onSubmit }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current && inputRef.current.focus(), 50);
  }, [open]);

  if (!open) return null;

  const submit = () => onSubmit(value);

  return (
    <div className="pingate">
      <div className="pingate__box">
        <h2>PIN del operador</h2>
        <p className="muted">Este servidor pide un PIN para operar.</p>
        <input
          ref={inputRef}
          className="pingate__input"
          type="password"
          autoComplete="off"
          aria-label="PIN"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
        />
        <button className="btn pri" onClick={submit}>Entrar</button>
        <p className="msgs">{error ? <span className="e">{error}</span> : null}</p>
      </div>
    </div>
  );
}
