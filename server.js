#!/usr/bin/env node
'use strict';
/*
 * Draft Señal Verdansk. Servidor local sin dependencias (solo Node 18 o superior).
 *   node server.js [--port 8787] [--host 127.0.0.1] [--pin 1234] [--datos ./datos]
 * Panel del operador:  http://localhost:8787/operador
 * Salida para OBS/vMix: http://localhost:8787/salida   (fuente de navegador 1920x1080)
 */
if (parseInt(process.versions.node, 10) < 18) {
  console.error(`\n  Este programa necesita Node.js 18 o superior (tienes ${process.versions.node}).\n  Instala la versión LTS desde https://nodejs.org y vuelve a abrirlo.\n`);
  process.exit(1);
}
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const E = require('./lib/engine');

/* ---------- Argumentos ---------- */
const argv = process.argv.slice(2);
const arg = (name, def) => { const i = argv.indexOf('--' + name); return i >= 0 && argv[i + 1] ? argv[i + 1] : def; };
const PORT = parseInt(arg('port', process.env.PORT || '8787'), 10);
const HOST = arg('host', process.env.HOST || '127.0.0.1');
const PIN = arg('pin', process.env.PIN || '');
const ROOT = __dirname;
const DATA_DIR = path.resolve(arg('datos', process.env.DATA_DIR || path.join(ROOT, 'datos')));
const OUT_DIR = path.resolve(arg('salidas', process.env.OUT_DIR || path.join(ROOT, 'salidas')));
const PUBLIC = path.join(ROOT, 'public');
const APP_DIR = path.join(ROOT, 'client', 'build');
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(OUT_DIR, { recursive: true });
const STATE_FILE = path.join(DATA_DIR, 'estado.json');

/* ---------- Estado ---------- */
const freshDay = () => ({ status: 'empty', plan: [], step: 0, inputHash: null, startedAt: null, closedAt: null });
const freshState = () => ({
  v: 1, seq: 0,
  config: { method: 'hibrido', levelStep: 6, autoMs: 3500, showLevel: false, markBench: false, title: 'DRAFT DE SQUADS' },
  creators: [], players: [],
  days: { 1: freshDay(), 2: freshDay() },
  subs: [],
  live: { day: 1, scene: 'idle', squad: null, finalPart: 'all', auto: false, bgTransparent: false },
  log: []
});
let state = freshState();
try {
  const saved = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  state = Object.assign(freshState(), saved);
  state.config = Object.assign(freshState().config, saved.config || {});
  state.live = Object.assign(freshState().live, saved.live || {}, { auto: false });
} catch (e) { /* primer arranque */ }

let saveTimer = null;
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 50);
}
function saveNow() {
  const tmp = STATE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state));
  fs.renameSync(tmp, STATE_FILE);
}
function log(action, extra) {
  state.log.push(Object.assign({ t: new Date().toISOString(), action }, extra || {}));
  if (state.log.length > 800) state.log.splice(0, state.log.length - 800);
}
class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
const bad = msg => new HttpError(400, msg);

/* ---------- Utilidades de datos ---------- */
const N = () => state.creators.length;
const dayMain = d => state.players.filter(p => p.day === d && !p.reserve && p.puesto >= 1 && p.puesto <= 2 * N());
const dayReserves = d => state.players.filter(p => p.day === d && (p.reserve || p.puesto > 2 * N()));
const byPuesto = d => { const m = new Map(); dayMain(d).forEach(p => m.set(p.puesto, p)); return m; };
const playerAt = (d, puesto) => byPuesto(d).get(puesto) || null;

function subFor(d, puesto) {
  const s = state.subs.filter(x => x.day === d && x.outPuesto === puesto).pop();
  if (!s) return null;
  return state.players.find(p => p.day === d && p.puesto === s.inPuesto && p.nick === s.inNick) || null;
}
function entryFor(d, puesto) {
  const sub = subFor(d, puesto);
  const base = playerAt(d, puesto);
  const p = sub || base;
  if (!p) return null;
  return { puesto: p.puesto, nick: p.nick, name: p.name, id: p.id, discord: p.discord, block: p.block, sub: !!sub, replaced: sub && base ? base.nick : undefined };
}
function revealedCount(d) {
  const D = state.days[d];
  return (D.status === 'closed' || D.status === 'complete') ? D.plan.length : D.step;
}
function assignDay(d, step) {
  const D = state.days[d];
  return E.assignFromEvents(D.plan, step == null ? revealedCount(d) : step, N());
}
function hasData(d) { return state.days[d].status !== 'empty'; }

/* ---------- Proyecciones ---------- */
function assetsAvailable() {
  const dir = path.join(PUBLIC, 'assets', 'show');
  const out = {};
  try { fs.readdirSync(dir).forEach(f => { out[f] = true; }); } catch (e) { /* sin carpeta */ }
  return out;
}

function pubState() {
  const L = state.live, n = N(), d = L.day, D = state.days[d];
  const pool = dayMain(d).sort((a, b) => a.puesto - b.puesto).map(p => ({ puesto: p.puesto, nick: p.nick, block: p.block }));
  const a1 = hasData(1) ? assignDay(1) : state.creators.map(() => []);
  const a2 = hasData(2) ? assignDay(2) : state.creators.map(() => []);
  const squads = state.creators.map((c, i) => ({
    n: c.n, name: c.name, handle: c.handle, botarga: c.botarga, photo: c.photo,
    tier: state.config.showLevel ? c.tier : undefined,
    d1: a1[i].map(p => entryFor(1, p)).filter(Boolean),
    d2: a2[i].map(p => entryFor(2, p)).filter(Boolean)
  }));
  let lastPick = null;
  if (D.status !== 'empty' && D.step > 0) {
    const e = D.plan[D.step - 1];
    const pl = entryFor(d, e.p);
    lastPick = { day: d, step: D.step, puesto: e.p, nick: pl ? pl.nick : '', creator: e.c, creatorName: state.creators[e.c].name, round: D.step <= n ? 1 : 2 };
  }
  return {
    seq: state.seq, scene: L.scene, day: d, squadSel: L.squad, finalPart: L.finalPart || 'all', bgTransparent: !!L.bgTransparent, status: D.status, step: D.step, total: 2 * n, N: n,
    config: { title: state.config.title, showLevel: state.config.showLevel, markBench: state.config.markBench, autoMs: state.config.autoMs },
    dayInfo: { 1: state.days[1].status, 2: state.days[2].status },
    assets: assetsAvailable(), pool, squads, lastPick
  };
}

function totalsNow() {
  const a1 = hasData(1) ? assignDay(1) : state.creators.map(() => []);
  const a2 = hasData(2) ? assignDay(2) : state.creators.map(() => []);
  return E.totalsFor(state.creators, state.config.levelStep, a1, a2);
}

function opState() {
  const v = E.validateData(state.creators, state.players);
  const n = N();
  const d = state.live.day, D = state.days[d];
  const totals = totalsNow();
  let next = null;
  if (D.plan.length && D.step < D.plan.length) {
    const e = D.plan[D.step]; const pl = entryFor(d, e.p);
    next = { puesto: e.p, nick: pl ? pl.nick : '', creator: e.c, creatorName: state.creators[e.c].name, pts: e.pts, tie: e.tie, round: D.step + 1 <= n ? 1 : 2, step: D.step + 1 };
  }
  const fullPlan = {};
  [1, 2].forEach(day => {
    fullPlan[day] = state.days[day].plan.map(e => {
      const pl = entryFor(day, e.p);
      return { p: e.p, nick: pl ? pl.nick : '', c: e.c, pts: e.pts, tie: e.tie };
    });
  });
  return {
    pub: pubState(),
    state: {
      v: state.v, seq: state.seq, config: state.config, live: state.live,
      creators: state.creators,
      days: { 1: Object.assign({}, state.days[1], { plan: undefined, planLen: state.days[1].plan.length }), 2: Object.assign({}, state.days[2], { plan: undefined, planLen: state.days[2].plan.length }) },
      subs: state.subs, log: state.log.slice(-40)
    },
    players: { 1: state.players.filter(p => p.day === 1), 2: state.players.filter(p => p.day === 2) },
    reserves: { 1: dayReserves(1).map(p => ({ puesto: p.puesto, nick: p.nick, block: p.block })), 2: dayReserves(2).map(p => ({ puesto: p.puesto, nick: p.nick, block: p.block })) },
    validation: v, totals, gap: E.gapOf(totals), next, fullPlan,
    pinRequired: !!PIN
  };
}

/* ---------- SSE ---------- */
const clients = new Set();
function broadcast() {
  state.seq++;
  persist();
  for (const c of clients) sendTo(c);
}
function sendTo(c) {
  try {
    const payload = c.role === 'op' ? opState() : pubState();
    c.res.write('data: ' + JSON.stringify(payload) + '\n\n');
  } catch (e) { clients.delete(c); }
}
setInterval(() => { for (const c of clients) { try { c.res.write(': latido\n\n'); } catch (e) { clients.delete(c); } } }, 15000);

/* ---------- Acciones ---------- */
let autoTimer = null;
function stopAuto() { clearTimeout(autoTimer); autoTimer = null; state.live.auto = false; }
function scheduleAuto() {
  clearTimeout(autoTimer);
  if (!state.live.auto) return;
  autoTimer = setTimeout(() => {
    try { doNext(); } catch (e) { stopAuto(); }
    const D = state.days[state.live.day];
    if (state.live.auto && D.step < D.plan.length) scheduleAuto(); else { stopAuto(); }
    broadcast();
  }, Math.max(800, state.config.autoMs));
}

function requireCreatorsTier() {
  if (state.config.method === 'hibrido' && state.creators.some(c => c.tier == null))
    throw bad('El método Híbrido necesita el nivel (1 a 5) de todos los creadores. Cambia a Snake o completa los niveles.');
}

function startDay(day, force) {
  if (![1, 2].includes(day)) throw bad('Jornada inválida.');
  const v = E.validateData(state.creators, state.players);
  if (v.errors.length) throw bad('Hay errores en los datos: ' + v.errors[0]);
  if (!v.ready[day]) throw bad(`Faltan jugadores de la Jornada ${day} (se necesitan ${2 * N()} con puestos 1 a ${2 * N()}).`);
  requireCreatorsTier();
  const D = state.days[day];
  if (D.status === 'closed') throw bad('La jornada ya está cerrada. Reábrela primero.');
  if (D.step > 0 && !force) throw bad('El reparto ya empezó. Reinícialo antes de calcularlo de nuevo.');
  let prev = null;
  if (day === 2) {
    if (state.days[1].status !== 'closed') throw bad('Cierra la Jornada 1 antes de calcular la Jornada 2.');
    const a1 = E.assignFromEvents(state.days[1].plan, state.days[1].plan.length, N());
    prev = a1.map(l => l.map(p => E.strengthOf(p, N())));
  }
  const plan = E.computeDayPlan({ creators: state.creators, day, method: state.config.method, levelStep: state.config.levelStep, prevStrengths: prev });
  const inputs = E.inputsFor(state.creators, state.players, day);
  state.days[day] = Object.assign(freshDay(), {
    status: 'ready', plan, step: 0, startedAt: new Date().toISOString(),
    inputHash: E.sha256({ inputs, method: state.config.method, levelStep: state.config.levelStep, rules: E.RULES_VERSION, day })
  });
  state.live.day = day;
  stopAuto();
  log('calcular', { day, hash: state.days[day].inputHash.slice(0, 12), method: state.config.method });
}

function doNext() {
  const day = state.live.day, D = state.days[day];
  if (D.step >= D.plan.length && D.plan.length) throw bad('Ya se repartieron todos los jugadores.');
  if (!['ready', 'running'].includes(D.status)) throw bad('Primero calcula el reparto de esta jornada.');
  D.step++;
  D.status = D.step >= D.plan.length ? 'complete' : 'running';
  log('siguiente', { day, step: D.step });
}
function doPrev() {
  const day = state.live.day, D = state.days[day];
  if (!['ready', 'running', 'complete'].includes(D.status)) throw bad('No hay nada que deshacer.');
  if (D.step <= 0) throw bad('Ya estás al inicio.');
  D.step--;
  D.status = D.step === 0 ? 'ready' : 'running';
  log('deshacer', { day, step: D.step });
}

function squadRows(which) {
  const rows = [];
  const days = which === 'final' ? [1, 2] : [parseInt(which, 10)];
  state.creators.forEach((c, i) => {
    rows.push({ botarga: c.botarga, creador_n: c.n, creador: c.name, handle: c.handle, rol: 'creador', jornada: '', puesto: '', nick: c.name, nombre: '', id: '', discord: c.discord || '', bloque: '', sustituto: '' });
    days.forEach(d => {
      if (!hasData(d)) return;
      const a = assignDay(d)[i];
      a.forEach(p => {
        const e = entryFor(d, p); if (!e) return;
        rows.push({ botarga: c.botarga, creador_n: c.n, creador: c.name, handle: c.handle, rol: 'jugador', jornada: d, puesto: e.puesto, nick: e.nick, nombre: e.name || '', id: e.id || '', discord: e.discord || '', bloque: e.block || '', sustituto: e.sub ? 'si' : '' });
      });
    });
  });
  return rows;
}
function toCsv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const esc = v => { v = String(v == null ? '' : v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
  return '﻿' + [cols.join(',')].concat(rows.map(r => cols.map(c => esc(r[c])).join(','))).join('\r\n') + '\r\n';
}

function buildActa() {
  const days = {};
  [1, 2].forEach(d => {
    const D = state.days[d];
    if (!D.plan.length) return;
    days[d] = { status: D.status, startedAt: D.startedAt, closedAt: D.closedAt, inputHash: D.inputHash, step: D.step, plan: D.plan.map(e => ({ p: e.p, c: e.c, pts: e.pts, tie: e.tie })) };
  });
  const totals = totalsNow();
  const body = {
    generado: new Date().toISOString(),
    regla: E.RULES_VERSION,
    descripcion: 'Del mejor jugador al peor, cada uno va al squad que lleva menos puntos. Máximo 2 jugadores por creador en cada jornada. Puntos del squad = nivel del creador (solo en método híbrido) + 3 mejores jugadores. Desempate: número de creador más bajo en la Jornada 1 y más alto en la Jornada 2.',
    config: { method: state.config.method, levelStep: state.config.levelStep },
    creators: state.creators.map(c => ({ n: c.n, name: c.name, handle: c.handle, tier: c.tier, botarga: c.botarga })),
    players: state.players.map(p => ({ day: p.day, puesto: p.puesto, nick: p.nick, id: p.id, block: p.block, reserve: !!(p.reserve || p.puesto > 2 * N()) })),
    days, subs: state.subs,
    totales: state.creators.map((c, i) => ({ n: c.n, name: c.name, puntos: totals[i] })),
    diferencia: E.gapOf(totals)
  };
  body.hash = E.sha256({ regla: body.regla, config: body.config, creators: body.creators, players: body.players, days: Object.fromEntries(Object.entries(days).map(([k, v]) => [k, v.plan])) });
  return body;
}

function actaHtml() {
  const a = buildActa();
  const rows = squadRows('final');
  const sq = state.creators.map((c, i) => {
    const mine = rows.filter(r => r.creador_n === c.n && r.rol === 'jugador');
    return `<tr><td>${esc(c.botarga)}</td><td>${c.n}</td><td>${esc(c.name)}</td><td>${mine.filter(r => r.jornada === 1).map(r => esc(r.nick) + ' (' + r.puesto + ')').join('<br>')}</td><td>${mine.filter(r => r.jornada === 2).map(r => esc(r.nick) + ' (' + r.puesto + ')').join('<br>')}</td><td>${a.totales[i].puntos}</td></tr>`;
  }).join('');
  return `<!doctype html><html lang="es"><meta charset="utf-8"><title>Acta del draft</title><style>body{font:14px/1.4 system-ui,sans-serif;margin:32px;color:#111}table{border-collapse:collapse;width:100%}td,th{border:1px solid #bbb;padding:6px 8px;text-align:left;vertical-align:top}th{background:#eee}code{word-break:break-all}</style>
<h1>Acta del draft de squads</h1><p>Generada: ${esc(a.generado)}<br>Regla: ${esc(a.regla)} · Método: ${esc(a.config.method)} · Puntos por nivel: ${a.config.levelStep}<br>Diferencia entre el mejor y el peor squad: <b>${a.diferencia} pts</b></p>
<p>${esc(a.descripcion)}</p><p>Huella del resultado (SHA-256): <code>${a.hash}</code></p>
${[1, 2].filter(d => a.days[d]).map(d => `<p>Jornada ${d}: estado ${esc(a.days[d].status)}, cerrada ${esc(a.days[d].closedAt || 'sin cerrar')}, huella de entradas <code>${esc(a.days[d].inputHash)}</code></p>`).join('')}
<table><thead><tr><th>Botarga</th><th>#</th><th>Creador</th><th>Jornada 1 (puesto)</th><th>Jornada 2 (puesto)</th><th>Puntos</th></tr></thead><tbody>${sq}</tbody></table>
<p>Para verificar: <code>node verificar.js acta.json</code> recalcula el reparto con los mismos datos y compara.</p></html>`;
}
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

function closeDay(day) {
  const D = state.days[day];
  if (D.status !== 'complete') throw bad('Termina de repartir los jugadores antes de cerrar la jornada.');
  D.status = 'closed'; D.closedAt = new Date().toISOString();
  const stamp = D.closedAt.replace(/[:.]/g, '-');
  try {
    fs.writeFileSync(path.join(OUT_DIR, `squads_jornada${day}_${stamp}.csv`), toCsv(squadRows(String(day))));
    fs.writeFileSync(path.join(OUT_DIR, `acta_jornada${day}_${stamp}.json`), JSON.stringify(buildActa(), null, 2));
    fs.writeFileSync(path.join(OUT_DIR, `acta_jornada${day}_${stamp}.html`), actaHtml());
  } catch (e) { log('error-exportar', { msg: String(e.message) }); }
  log('cerrar', { day });
}

function resetDay(day, confirm) {
  const D = state.days[day];
  if (D.status === 'closed' && confirm !== 'REABRIR') throw bad('La jornada está cerrada. Escribe REABRIR para confirmar.');
  if (day === 1 && state.days[2].status !== 'empty') {
    if (confirm !== 'REABRIR') throw bad('Reiniciar la Jornada 1 también borra la Jornada 2. Escribe REABRIR para confirmar.');
    state.days[2] = freshDay();
    state.subs = state.subs.filter(s => s.day !== 2);
  }
  state.days[day] = freshDay();
  state.subs = state.subs.filter(s => s.day !== day);
  stopAuto();
  log('reiniciar', { day });
}

function importData(body) {
  const { kind, text, day } = body;
  const commit = !!body.commit;
  if (kind === 'creators') {
    if (Object.values(state.days).some(D => D.status !== 'empty')) throw bad('Ya hay un reparto en curso. Reinicia las jornadas antes de cambiar a los creadores.');
    const r = E.parseCreators(text);
    const result = { count: r.rows.length, errors: r.errors, warnings: r.warnings, committed: false };
    if (commit && !r.errors.length) {
      state.creators = r.rows.map(c => { const o = Object.assign({}, c); delete o.line; return o; });
      state.players = []; // los jugadores dependen del número de creadores
      state.subs = [];
      log('importar-creadores', { n: r.rows.length });
      result.committed = true;
    }
    return result;
  }
  if (kind === 'players') {
    const dflt = parseInt(day, 10);
    const r = E.parsePlayers(text, [1, 2].includes(dflt) ? dflt : null);
    const result = { count: r.rows.length, errors: r.errors.slice(0, 40), warnings: r.warnings, committed: false, days: {} };
    const daysIn = [...new Set(r.rows.map(p => p.day).filter(Boolean))];
    daysIn.forEach(d => { result.days[d] = r.rows.filter(p => p.day === d).length; });
    if (!state.creators.length) result.errors.push('Carga primero a los creadores.');
    if (!r.errors.length && state.creators.length) {
      const tmp = state.players.filter(p => !daysIn.includes(p.day)).concat(r.rows.map(p => { const o = Object.assign({}, p); delete o.line; return o; }));
      const v = E.validateData(state.creators, tmp);
      daysIn.forEach(d => { if (!v.ready[d]) result.errors.push(`Jornada ${d}: ` + (v.errors.find(e => e.startsWith('Jornada ' + d)) || 'datos incompletos.').replace(/^Jornada \d: /, '')); });
      v.errors.filter(e => !result.errors.includes(e)).slice(0, 10).forEach(e => result.errors.push(e));
      result.warnings = result.warnings.concat(v.warnings);
      if (commit && !result.errors.length) {
        daysIn.forEach(d => { if (['running', 'complete', 'closed'].includes(state.days[d].status)) throw bad(`La Jornada ${d} ya empezó. Reiníciala para cambiar a sus jugadores.`); });
        state.players = tmp;
        daysIn.forEach(d => { state.days[d] = freshDay(); });
        log('importar-jugadores', { days: daysIn, n: r.rows.length });
        result.committed = true;
      }
    }
    return result;
  }
  throw bad('Tipo de importación inválido.');
}

function loadSample() {
  const dir = path.join(ROOT, 'ejemplo');
  const c = fs.readFileSync(path.join(dir, 'creadores.csv'), 'utf8');
  state = Object.assign(freshState(), { config: Object.assign(freshState().config, state.config), live: state.live });
  stopAuto();
  importData({ kind: 'creators', text: c, commit: true });
  importData({ kind: 'players', text: fs.readFileSync(path.join(dir, 'jugadores_j1.csv'), 'utf8'), day: 1, commit: true });
  importData({ kind: 'players', text: fs.readFileSync(path.join(dir, 'jugadores_j2.csv'), 'utf8'), day: 2, commit: true });
  log('datos-de-ejemplo');
}

function substitute(body) {
  const day = parseInt(body.day, 10), outP = parseInt(body.outPuesto, 10), inP = parseInt(body.inPuesto, 10);
  const D = state.days[day];
  if (!D || !['complete', 'closed'].includes(D.status)) throw bad('Solo se puede sustituir cuando la jornada terminó de repartirse.');
  const out = playerAt(day, outP);
  if (!out) throw bad('No existe el jugador que sale.');
  const inn = dayReserves(day).find(p => p.puesto === inP);
  if (!inn) throw bad('La reserva elegida no existe.');
  if (state.subs.some(s => s.day === day && s.inPuesto === inP)) throw bad('Esa reserva ya se usó.');
  state.subs = state.subs.filter(s => !(s.day === day && s.outPuesto === outP));
  state.subs.push({ day, outPuesto: outP, outNick: out.nick, inPuesto: inn.puesto, inNick: inn.nick, at: new Date().toISOString() });
  log('sustituir', { day, out: out.nick, in: inn.nick });
}

function shuffleOrder(seedStr) {
  if (Object.values(state.days).some(D => D.status !== 'empty')) throw bad('Ya hay un reparto en curso. El orden solo se puede sortear antes de calcularlo.');
  const seed = seedStr || crypto.randomBytes(4).toString('hex');
  let a = parseInt(crypto.createHash('sha256').update(seed).digest('hex').slice(0, 8), 16) >>> 0;
  const rnd = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const idx = state.creators.map((_, i) => i);
  for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  const reordered = idx.map(i => state.creators[i]);
  reordered.forEach((c, i) => { c.n = i + 1; c.idx = i; });
  state.creators = reordered;
  log('sortear-orden', { seed });
  return seed;
}

const SCENES = ['idle', 'pool', 'board', 'final', 'squad'];

/* ---------- HTTP ---------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.csv': 'text/csv; charset=utf-8', '.mp4': 'video/mp4', '.webm': 'video/webm', '.map': 'application/json; charset=utf-8', '.txt': 'text/plain; charset=utf-8' };

function authOk(req, url) {
  if (!PIN) return true;
  const got = req.headers['x-pin'] || url.searchParams.get('pin') || '';
  const a = Buffer.from(String(got)), b = Buffer.from(PIN);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
function sendJson(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(body);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > 8e6) { reject(new HttpError(413, 'Archivo demasiado grande.')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch (e) { reject(bad('JSON inválido.')); } });
    req.on('error', reject);
  });
}

function serveStatic(res, rel, base) {
  base = base || PUBLIC;
  let file = path.normalize(path.join(base, rel));
  if (file !== base && !file.startsWith(base + path.sep)) { res.writeHead(403); return res.end('No permitido'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('No encontrado'); }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=300' });
    fs.createReadStream(file).pipe(res);
  });
}

const routes = {
  'POST /api/import': b => importData(b),
  'POST /api/load-sample': () => { loadSample(); return {}; },
  'POST /api/config': b => {
    const c = state.config;
    if (b.method != null) { if (!['snake', 'hibrido'].includes(b.method)) throw bad('Método inválido.'); if (Object.values(state.days).some(D => D.step > 0)) throw bad('No se puede cambiar el método con un reparto en curso.'); c.method = b.method; }
    if (b.levelStep != null) { const v = parseInt(b.levelStep, 10); if (!(v >= 0 && v <= 20)) throw bad('Los puntos por nivel van de 0 a 20.'); if (Object.values(state.days).some(D => D.step > 0)) throw bad('No se puede cambiar con un reparto en curso.'); c.levelStep = v; }
    if (b.autoMs != null) { const v = parseInt(b.autoMs, 10); if (!(v >= 800 && v <= 15000)) throw bad('El ritmo automático va de 800 a 15000 ms.'); c.autoMs = v; }
    if (b.showLevel != null) c.showLevel = !!b.showLevel;
    if (b.markBench != null) c.markBench = !!b.markBench;
    if (b.title != null) c.title = String(b.title).slice(0, 40).toUpperCase();
    log('config', { method: c.method, levelStep: c.levelStep, autoMs: c.autoMs });
    return {};
  },
  'POST /api/shuffle-order': b => ({ seed: shuffleOrder(b.seed) }),
  'POST /api/draft/start': b => { startDay(parseInt(b.day, 10), !!b.force); return {}; },
  'POST /api/draft/next': () => { stopAuto(); doNext(); return {}; },
  'POST /api/draft/prev': () => { stopAuto(); doPrev(); return {}; },
  'POST /api/draft/auto': b => {
    if (b.on) {
      const D = state.days[state.live.day];
      if (!['ready', 'running'].includes(D.status)) throw bad('Primero calcula el reparto de esta jornada.');
      state.live.auto = true; scheduleAuto(); log('auto-on');
    } else { stopAuto(); log('auto-off'); }
    return {};
  },
  'POST /api/draft/reset': b => { resetDay(parseInt(b.day, 10), b.confirm); return {}; },
  'POST /api/draft/close': b => { closeDay(parseInt(b.day, 10)); return {}; },
  'POST /api/day': b => { const d = parseInt(b.day, 10); if (![1, 2].includes(d)) throw bad('Jornada inválida.'); state.live.day = d; return {}; },
  'POST /api/scene': b => {
    if (!SCENES.includes(b.scene)) throw bad('Escena inválida.');
    state.live.scene = b.scene;
    if (b.squad != null) state.live.squad = parseInt(b.squad, 10);
    if (b.part != null) { if (!['all', '1', '2', 1, 2].includes(b.part)) throw bad('Parte inválida.'); state.live.finalPart = String(b.part); }
    log('escena', { scene: b.scene, squad: state.live.squad, part: state.live.finalPart });
    return {};
  },
  'POST /api/bg': b => {
    state.live.bgTransparent = !!b.transparent;
    log('fondo', { transparent: state.live.bgTransparent });
    return {};
  },
  'POST /api/substitute': b => { substitute(b); return {}; },
  'POST /api/reset-all': b => {
    if (b.confirm !== 'BORRAR') throw bad('Escribe BORRAR para confirmar.');
    stopAuto(); const keep = state.config; state = freshState(); state.config = keep; log('borrar-todo'); return {};
  }
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  try {
    if (p === '/' ) { res.writeHead(302, { Location: '/operador' }); return res.end(); }
    if (p === '/operador' || p === '/salida') return serveStatic(res, 'index.html', APP_DIR);
    if (p === '/favicon.ico' || p === '/manifest.json' || p === '/asset-manifest.json') return serveStatic(res, p.slice(1), APP_DIR);
    if (p.startsWith('/static/')) return serveStatic(res, p.slice(1), APP_DIR);
    if (p === '/events') {
      const role = url.searchParams.get('role') === 'op' ? 'op' : 'out';
      if (role === 'op' && !authOk(req, url)) { res.writeHead(401); return res.end('PIN requerido'); }
      res.writeHead(200, { 'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
      res.write('retry: 1500\n\n');
      const c = { res, role }; clients.add(c); sendTo(c);
      req.on('close', () => clients.delete(c));
      return;
    }
    if (p === '/api/ping') return sendJson(res, 200, { ok: true, pinRequired: !!PIN });
    if (p.startsWith('/api/')) {
      if (!authOk(req, url)) return sendJson(res, 401, { error: 'PIN incorrecto o faltante.' });
      if (req.method === 'GET' && p === '/api/state') return sendJson(res, 200, opState());
      if (req.method === 'GET' && p === '/api/export/csv') {
        const which = url.searchParams.get('day') || 'final';
        if (!['1', '2', 'final'].includes(which)) throw bad('Parámetro inválido.');
        res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="squads_${which === 'final' ? 'final' : 'jornada' + which}.csv"` });
        return res.end(toCsv(squadRows(which)));
      }
      if (req.method === 'GET' && p === '/api/export/acta.json') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="acta.json"' });
        return res.end(JSON.stringify(buildActa(), null, 2));
      }
      if (req.method === 'GET' && p === '/api/export/acta.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(actaHtml());
      }
      if (req.method === 'GET' && p === '/api/template') {
        const kind = url.searchParams.get('kind');
        const t = kind === 'creators' ? 'orden,nombre,handle,nivel,botarga,foto\n1,Nombre del creador,@canal,3,Botarga 1,\n'
          : 'jornada,puesto,nick,nombre,id,bloque,puntos,bajas,discord,reserva\n1,1,GamerTag,Nombre completo,123456789,A,130,64,usuario#0000,\n';
        res.writeHead(200, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="plantilla_${kind}.csv"` });
        return res.end('﻿' + t);
      }
      const handler = routes[req.method + ' ' + p];
      if (!handler) return sendJson(res, 404, { error: 'Ruta no encontrada.' });
      const body = req.method === 'POST' ? await readBody(req) : {};
      const result = handler(body) || {};
      const mutating = !(p === '/api/import' && !body.commit);
      if (mutating) broadcast();
      return sendJson(res, 200, Object.assign({ ok: true }, result));
    }
    if (p.startsWith('/assets/')) return serveStatic(res, p.slice(1));
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('No encontrado');
  } catch (e) {
    if (e instanceof HttpError) return sendJson(res, e.code, { error: e.message });
    console.error(e);
    sendJson(res, 500, { error: 'Error interno: ' + e.message });
  }
});

server.on('error', e => {
  if (e.code === 'EADDRINUSE') console.error(`\n  El puerto ${PORT} ya está en uso. Probablemente ya hay otra ventana del draft abierta.\n  Ciérrala, o arranca esta con otro puerto:  node server.js --port ${PORT + 1}\n`);
  else console.error('\n  No se pudo iniciar el servidor:', e.message, '\n');
  process.exit(1);
});
server.listen(PORT, HOST, () => {
  const lan = Object.values(require('os').networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  const shown = HOST === '0.0.0.0' ? (lan[0] || 'IP-DE-ESTA-PC') : HOST === '127.0.0.1' ? 'localhost' : HOST;
  console.log('\n  Draft Señal Verdansk listo.\n');
  console.log(`  Panel del operador : http://${shown}:${PORT}/operador`);
  console.log(`  Salida (OBS/vMix)  : http://${shown}:${PORT}/salida   (fuente de navegador 1920x1080)`);
  if (HOST === '0.0.0.0' && lan.length > 1) console.log(`  Otras direcciones de esta PC: ${lan.slice(1).join(', ')}`);
  console.log(`  Datos guardados en : ${DATA_DIR}`);
  console.log(`  Exportaciones en   : ${OUT_DIR}`);
  if (PIN) console.log('  PIN del operador activo.'); else if (HOST !== '127.0.0.1') console.log('  ATENCIÓN: sin PIN. Cualquiera en la red puede operar. Usa --pin.');
  console.log('\n  Para cerrar: Ctrl+C\n');
});
process.on('SIGINT', () => { try { saveNow(); } catch (e) { /* nada */ } process.exit(0); });
process.on('SIGTERM', () => { try { saveNow(); } catch (e) { /* nada */ } process.exit(0); });
