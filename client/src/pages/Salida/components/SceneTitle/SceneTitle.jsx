import './SceneTitle.css';

/**
 * Encabezado compartido por varias escenas: el kicker y el título grande
 * comparten el mismo banner de fondo. `variant` elige el banner: "red"
 * (solo la escena de finalistas) o "gold" (las demás).
 */
export default function SceneTitle({ kicker, title, variant = 'gold', className, titleClassName }) {
  return (
    <div className={'scenetitle scenetitle--' + variant + (className ? ' ' + className : '')}>
      <div className="kicker scenetitle__kicker" style={{ color: variant === 'red' ? 'white' : 'black' }}>{kicker}</div>
      <h1 className={'title scenetitle__title' + (titleClassName ? ' ' + titleClassName : '')} style={{ color: variant === 'red' ? 'white' : 'black' }}>{title}</h1>
    </div>
  );
}
