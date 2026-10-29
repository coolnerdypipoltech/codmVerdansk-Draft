export const BOTARGA_PHOTOS = {
  'Farmacias Similares': '/assets/botargas/botarga-1.png',
  'McCormick': '/assets/botargas/botarga-2.png',
  'Stori': '/assets/botargas/botarga-3.png',
  'Wisin': '/assets/botargas/botarga-5.png',
  'Moco de Gorila': '/assets/botargas/botarga-6.png',
  "French's": '/assets/botargas/botarga-7.png',
  'Bait': '/assets/botargas/botarga-8.png',
  'Monte de Piedad': '/assets/botargas/botarga-9.png',
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
