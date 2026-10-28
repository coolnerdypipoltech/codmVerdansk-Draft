import { useSalida } from '../../SalidaContext';
import './TopLogo.css';

export default function TopLogo() {
  const { S } = useSalida();
  const assets = S.assets || {};
  if (!assets['logo.png']) return null;
  return (
    <img
      className="top-logo"
      style={{ opacity: S.scene === 'idle' ? 0 : 1, top: S.scene === "board" ? '42px' : '', height: S.scene === "board" ? '94px' : '' }}
      src="/assets/show/logo.png"
      alt=""
    />
  );
}
