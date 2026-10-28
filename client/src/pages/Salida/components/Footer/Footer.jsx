import { useSalida } from '../../SalidaContext';
import './Footer.css';

export default function Footer() {
  const { S } = useSalida();
  const assets = S.assets || {};

  return (
    <div className="footer" style={{ opacity: S.scene === 'idle' ? 0 : 1 }}>
      <div className="footer__side">
        {assets['logo-izq.png']
          ? <img src="/assets/show/logo-izq.png" alt="" />
          : <span className="footer__txt">Cool Nerdy People × Call of Duty Mobile</span>}
      </div>
      <div className="footer__side">
        {assets['logo-der.png']
          ? <img src="/assets/show/logo-der.png" alt="" />
          : (
            <div className="footer__mark" style={{ color: S.scene === "final" ? "#fff" : "" }}>
              Señal Verdansk
              <small style={{ color: S.scene === "final" ? "#fff" : "" }}>En vivo desde LATAM</small>
            </div>
          )}
      </div>
    </div>
  );
}
