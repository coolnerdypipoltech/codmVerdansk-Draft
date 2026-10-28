#!/usr/bin/env node
'use strict';
/*
 * Verifica un acta del draft: recalcula el reparto con los mismos datos y compara.
 *   node verificar.js salidas/acta_jornada2_....json
 * Si el reparto recalculado coincide pick por pick, el resultado fue el que dicta la regla.
 */
const fs = require('fs');
const E = require('./lib/engine');

const file = process.argv[2];
if (!file) { console.error('Uso: node verificar.js ruta/al/acta.json'); process.exit(2); }
const acta = JSON.parse(fs.readFileSync(file, 'utf8'));
const creators = acta.creators.map((c, i) => Object.assign({ idx: i }, c));
const N = creators.length;
let ok = true;
let prev = null;

for (const d of [1, 2]) {
  const day = acta.days && acta.days[d];
  if (!day) { console.log(`Jornada ${d}: sin datos en el acta.`); continue; }
  const plan = E.computeDayPlan({ creators, day: d, method: acta.config.method, levelStep: acta.config.levelStep, prevStrengths: prev });
  const same = plan.length === day.plan.length && plan.every((e, i) => e.p === day.plan[i].p && e.c === day.plan[i].c);
  console.log(`Jornada ${d}: ${same ? 'COINCIDE' : 'NO COINCIDE'} con el reparto recalculado (${plan.length} jugadores).`);
  if (!same) ok = false;
  const a = E.assignFromEvents(day.plan, day.plan.length, N);
  prev = a.map(l => l.map(p => E.strengthOf(p, N)));
}

const hash = E.sha256({
  regla: acta.regla, config: acta.config, creators: acta.creators, players: acta.players,
  days: Object.fromEntries(Object.entries(acta.days || {}).map(([k, v]) => [k, v.plan]))
});
const hashOk = hash === acta.hash;
console.log(`Huella del acta: ${hashOk ? 'COINCIDE' : 'NO COINCIDE'} (${hash.slice(0, 16)}…)`);
if (!hashOk) ok = false;
if (acta.subs && acta.subs.length) console.log(`Nota: hay ${acta.subs.length} sustitución(es) posteriores al reparto, registradas en el acta.`);
console.log(ok ? '\nRESULTADO: el acta es consistente con la regla.' : '\nRESULTADO: HAY DIFERENCIAS. Revisa el acta.');
process.exit(ok ? 0 : 1);
