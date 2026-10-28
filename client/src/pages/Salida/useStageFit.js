import { useEffect, useState } from 'react';

const STAGE_W = 1920, STAGE_H = 1080;

/** Escala el escenario fijo de 1920x1080 para que llene la ventana manteniendo la proporción. */
export default function useStageFit() {
  const [transform, setTransform] = useState('');

  useEffect(() => {
    function fit() {
      const s = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
      const x = (window.innerWidth - STAGE_W * s) / 2;
      const y = (window.innerHeight - STAGE_H * s) / 2;
      setTransform(`translate(${x}px,${y}px) scale(${s})`);
    }
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return transform;
}
