import logoSimi from './assets/logos/simi.png';
import logoEd from './assets/logos/Ed.png';
import logoStori from './assets/logos/stori.png';
import logoChipcito from './assets/logos/chipcito.png';
import logoTito from './assets/logos/tito.png';
import logoFajito from './assets/logos/fajito.png';
import logoWisinElDog from './assets/logos/wisin_el_dog.png';
import logoMocoDeGorila from './assets/logos/moco_de_gorila.png';

export const BOTARGA_PHOTOS = {
  'Dr. Simi': '/assets/botargas/botarga-1.png',
  'Tito el Elotito': '/assets/botargas/botarga-2.png',
  'Tio Stori': '/assets/botargas/botarga-4.png',
  'Wisin El dog': '/assets/botargas/botarga-8.png',
  'Moco de Gorila': '/assets/botargas/botarga-6.png',
  'ED': '/assets/botargas/botarga-7.png',
  'Chipcito': '/assets/botargas/botarga-3.png',
  'Fajito': '/assets/botargas/botarga-5.png',
};

/* Nombre de la marca/patrocinador detrás de cada botarga, para mostrarlo junto al nombre de la botarga. */
export const BOTARGA_COMPANY = {
  'Dr. Simi': 'Farmacias Similares',
  'Tito el Elotito': 'McCormick',
  'Tio Stori': 'Stori',
  'Wisin El dog': 'Wisin',
  'Moco de Gorila': 'Moco de Gorilla',
  'ED': "French's",
  'Chipcito': 'Bait',
  'Fajito': 'Monte de Piedad',
};

/* Logo de marca de cada botarga, para la escena "4 · Un squad". */
export const BOTARGA_LOGO = {
  'Dr. Simi': logoSimi,
  'ED': logoEd,
  'Tio Stori': logoStori,
  'Chipcito': logoChipcito,
  'Tito el Elotito': logoTito,
  'Fajito': logoFajito,
  'Wisin El dog': logoWisinElDog,
  'Moco de Gorila': logoMocoDeGorila,
};

export function dayLabel(S) { return 'Jornada ' + S.day; }
export function blocks(S) { return S.day === 1 ? 'Bloques A y B' : 'Bloques C y D'; }

/* La banca es el jugador de mayor número de puesto (el más débil); empate -> Jornada 2. */
export function benchRef(S, sq) {
  if (!S.config.markBench || sq.d1.length + sq.d2.length < 4) return null;
  const all = [];
  sq.d1.forEach((e, i) => all.push({ day: 1, k: i, p: e.puesto }));
  sq.d2.forEach((e, i) => all.push({ day: 2, k: i, p: e.puesto }));
  all.sort((x, y) => y.p - x.p || y.day - x.day);
  return all[0];
}

export function isNewPick(hit, entry, day) {
  return !!(hit && entry && hit.key === day + ':' + entry.puesto);
}
