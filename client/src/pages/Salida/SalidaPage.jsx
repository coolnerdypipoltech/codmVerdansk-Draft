import { useEffect, useMemo, useRef, useState } from 'react';
import useSSE from '../../api/useSSE';
import useStageFit from './useStageFit';
import { ensureSalidaFonts } from './fonts';
import SalidaContext from './SalidaContext';
import Background from './components/Background/Background';
import Footer from './components/Footer/Footer';
import TopLogo from './components/TopLogo/TopLogo';
import BoardScene from './scenes/BoardScene/BoardScene';
import PoolScene from './scenes/PoolScene/PoolScene';
import FinalScene from './scenes/FinalScene/FinalScene';
import SquadScene from './scenes/SquadScene/SquadScene';
import './SalidaPage.css';

export default function SalidaPage() {
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const urlBgMode = (query.get('bg') || 'solido').toLowerCase().replace('ó', 'o');
  const debug = !!query.get('debug');
  const transform = useStageFit();
  const { data: S, connected } = useSSE('out', '', true);
  // El botón "Fondo transparente" del panel manda a todos (anula la URL); sin tocarlo, manda ?bg= de la URL.
  const bgMode = (S && S.bgTransparent) ? 'transparente' : urlBgMode;

  const [hit, setHit] = useState(null);
  const [call, setCall] = useState({ info: null, visible: false });
  const prevRef = useRef(null);
  const hitTimerRef = useRef(null);
  const callTimerRef = useRef(null);

  useEffect(() => {
    ensureSalidaFonts();
    document.documentElement.classList.add('salida-active');
    document.body.className = `salida-active salida-bg-${bgMode}` + (debug ? ' salida-debug' : '');
    return () => {
      document.documentElement.classList.remove('salida-active');
      document.body.className = '';
    };
  }, [bgMode, debug]);

  useEffect(() => {
    if (!S) return;
    const old = prevRef.current;
    const advanced = old && old.day === S.day && S.lastPick && (!old.lastPick || old.lastPick.step < S.lastPick.step) && S.step === old.step + 1;
    if (advanced) {
      setHit({ creator: S.lastPick.creator, key: S.lastPick.day + ':' + S.lastPick.puesto });
      clearTimeout(hitTimerRef.current);
      hitTimerRef.current = setTimeout(() => setHit(null), 2650);
      if (S.scene === 'board') {
        const hold = Math.max(1400, Math.min(4200, (S.config.autoMs || 3500) - 500));
        setCall({ info: S.lastPick, visible: true });
        clearTimeout(callTimerRef.current);
        callTimerRef.current = setTimeout(() => setCall((c) => ({ ...c, visible: false })), hold);
      }
    } else if (old && (S.step < old.step || S.day !== old.day || !S.lastPick)) {
      setHit(null);
      clearTimeout(callTimerRef.current);
      setCall((c) => ({ ...c, visible: false }));
    }
    prevRef.current = S;
  }, [S]);

  const ctx = useMemo(() => (S ? { S, bgMode, hit, call } : null), [S, bgMode, hit, call]);

  return (
    <div className="salida-page">
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <filter id="rough" x="-2%" y="-5%" width="104%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.035 0.05" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div className="salida-page__viewport">
        <div className="salida-page__stage" style={{ transform }}>
          {ctx && (
            <SalidaContext.Provider value={ctx}>
              <Background />
              <BoardScene />
              <PoolScene />
              <FinalScene />
              <SquadScene />
              <Footer />
              <TopLogo />
            </SalidaContext.Provider>
          )}
          {debug && !connected && <div className="salida-page__offline">Sin conexión con el servidor</div>}
        </div>
      </div>
    </div>
  );
}
