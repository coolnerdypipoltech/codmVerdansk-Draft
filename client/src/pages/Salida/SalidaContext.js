import { createContext, useContext } from 'react';

const SalidaContext = createContext(null);

export default SalidaContext;

export function useSalida() {
  const ctx = useContext(SalidaContext);
  if (!ctx) throw new Error('useSalida debe usarse dentro de SalidaPage');
  return ctx;
}
