import { createContext, useContext } from 'react';

const OperadorContext = createContext(null);

export default OperadorContext;

export function useOperador() {
  const ctx = useContext(OperadorContext);
  if (!ctx) throw new Error('useOperador debe usarse dentro de OperadorPage');
  return ctx;
}
