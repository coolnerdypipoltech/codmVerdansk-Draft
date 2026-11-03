import { useSalida } from '../../SalidaContext';
import './Footer.css';
import codLogo from './../../assets/Call_of_Duty_Mobile.svg';

export default function Footer() {
  const { S } = useSalida();

  return (
    <div className="footer" style={{ opacity: S.scene === 'idle' ? 0 : 1 }}>

      <img src={codLogo} alt="Call of Duty Mobile" className="footer__logo" />
    </div>
  );
}
