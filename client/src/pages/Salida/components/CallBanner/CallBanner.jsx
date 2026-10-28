import { pad } from '../../../../shared/format';
import './CallBanner.css';
import toastArrow from '../../assets/toast-arrow.png';
export default function CallBanner({ info, visible }) {
  return (
    <div className={'callbanner' + (visible ? ' callbanner--show' : '')}>
      {info && (
        <>
          <div className="callbanner__r">Jugador<b>{pad(info.puesto)}</b></div>
          <div className="callbanner__n">{info.nick}</div>
          <div className="callbanner__a"><img className="callbanner__a" src={toastArrow} alt="arrow" /></div>
          <div className="callbanner__c">{info.creatorName}</div>
        </>
      )}
    </div>
  );
}
