import { useSalida } from '../../SalidaContext';
import './Background.css';

export default function Background() {
  const { S, bgMode } = useSalida();
  const assets = S.assets || {};
  const file = assets['fondo.jpg'] ? 'fondo.jpg' : assets['fondo.png'] ? 'fondo.png' : assets['fondo.webp'] ? 'fondo.webp' : null;
  const useImg = file && bgMode !== 'transparente' && bgMode !== 'croma';

  return (
    <div
      className={'background' + (useImg ? ' background--img' : '')}
      style={useImg ? { backgroundImage: `url(/assets/show/${file})` } : undefined}
    />
  );
}
