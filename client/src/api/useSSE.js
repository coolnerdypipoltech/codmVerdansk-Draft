import { useEffect, useRef, useState } from 'react';

/**
 * Se conecta a /events?role=... por Server-Sent Events y mantiene el último
 * estado recibido. Se reconecta automáticamente si cambia el PIN o el rol.
 * `enabled=false` mantiene la conexión cerrada (se usa mientras se pide el PIN).
 */
export default function useSSE(role, pin, enabled) {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const esRef = useRef(null);

  useEffect(() => {
    if (!enabled) return undefined;
    const es = new EventSource('/events?role=' + role + '&pin=' + encodeURIComponent(pin || ''));
    esRef.current = es;
    es.onmessage = (e) => {
      try { setData(JSON.parse(e.data)); setConnected(true); }
      catch (err) { console.error(err); }
    };
    es.onerror = () => setConnected(false);
    return () => { es.close(); esRef.current = null; };
  }, [role, pin, enabled]);

  return { data, connected };
}
