import { useRef, useState } from 'react';

/**
 * Botones que necesitan una segunda pulsación para confirmar (reiniciar,
 * cerrar jornada, etc). El primer click "arma" el botón por 3.5s; el
 * segundo click, dentro de ese tiempo, ejecuta la acción.
 */
export default function useArmedAction(action) {
  const [armed, setArmed] = useState(false);
  const timerRef = useRef(null);

  function trigger() {
    if (!armed) {
      setArmed(true);
      timerRef.current = setTimeout(() => setArmed(false), 3500);
      return;
    }
    clearTimeout(timerRef.current);
    setArmed(false);
    action();
  }

  return { armed, trigger };
}
