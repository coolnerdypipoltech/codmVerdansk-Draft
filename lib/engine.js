'use strict';
/*
 * Motor del draft automático. Sin dependencias.
 *
 * Regla única: los jugadores de la jornada se reparten del mejor puesto al peor y cada uno va al
 * squad que lleva menos puntos (máximo 2 jugadores por creador en cada jornada).
 *   - Método "snake": los creadores arrancan en 0 puntos. El resultado equivale a una serpiente.
 *   - Método "hibrido": cada creador arranca con los puntos de su nivel.
 * Puntos de un squad = puntos de nivel del creador + suma de sus 3 mejores jugadores.
 * Un puesto vale (2N + 1) - puesto, con N = número de creadores (50 pts para el puesto 1 si N = 25).
 * Desempate: número de creador más bajo en la Jornada 1 y más alto en la Jornada 2.
 */
const crypto = require('crypto');

const RULES_VERSION = 'regla-1';

/* ---------- CSV ---------- */
function stripAccents(s) { return String(s == null ? '' : s).normalize('NFD').replace(/[̀-ͯ]/g, ''); }
function norm(s) { return stripAccents(s).toLowerCase().replace(/[^a-z0-9#]/g, ''); }

function parseDelimited(text) {
  text = String(text || '').replace(/^﻿/, '').replace(/\r\n?/g, '\n');
  const first = text.split('\n').find(l => l.trim() !== '') || '';
  const count = ch => first.split(ch).length - 1;
  let delim = ',';
  if (count('\t') > 0 && count('\t') >= count(';') && count('\t') >= count(',')) delim = '\t';
  else if (count(';') > count(',')) delim = ';';
  const rows = []; let row = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; }
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === delim) { row.push(cur); cur = ''; }
    else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
    else cur += ch;
  }
  row.push(cur); rows.push(row);
  return rows.map(r => r.map(c => c.trim())).filter(r => r.some(c => c !== ''));
}

const HEADERS = {
  creators: {
    n: ['orden', 'n', 'numero', 'num', 'no', '#'],
    name: ['nombre', 'creador', 'name', 'creadordecontenido'],
    handle: ['handle', 'canal', 'usuario', 'user', 'red', 'alias'],
    tier: ['nivel', 'level', 'tier'],
    botarga: ['botarga', 'marca', 'mascota'],
    photo: ['foto', 'photo', 'imagen', 'avatar'],
    discord: ['discord']
  },
  players: {
    day: ['jornada', 'dia', 'day'],
    puesto: ['puesto', 'posicion', 'rank', 'lugar', 'pos'],
    nick: ['nick', 'gamertag', 'jugador', 'username', 'tag', 'nickname'],
    name: ['nombre', 'nombrecompleto', 'name'],
    id: ['id', 'uid', 'iddejugador', 'idjugador', 'playerid'],
    block: ['bloque', 'block'],
    points: ['puntos', 'points', 'pts'],
    kills: ['bajas', 'kills', 'eliminaciones'],
    photo: ['foto', 'photo'],
    discord: ['discord'],
    reserve: ['reserva', 'suplente', 'reserve']
  }
};

function mapHeaders(headerRow, spec) {
  const idx = {};
  headerRow.forEach((h, i) => {
    const k = norm(h);
    for (const key of Object.keys(spec)) {
      if (idx[key] == null && spec[key].some(a => norm(a) === k)) idx[key] = i;
    }
  });
  return idx;
}
const cell = (r, i) => (i == null || r[i] == null) ? '' : String(r[i]).trim();
const truthy = v => ['si', 'sí', 's', '1', 'true', 'x', 'yes', 'reserva', 'r'].includes(stripAccents(v).toLowerCase());
const toInt = v => { const m = String(v).match(/-?\d+/); return m ? parseInt(m[0], 10) : NaN; };

function parseCreators(text) {
  const errors = [], warnings = [], rows = parseDelimited(text);
  if (rows.length < 2) return { rows: [], errors: ['El archivo de creadores no tiene filas.'], warnings };
  const idx = mapHeaders(rows[0], HEADERS.creators);
  if (idx.name == null) errors.push('Falta la columna "nombre" en el archivo de creadores.');
  if (errors.length) return { rows: [], errors, warnings };
  const out = rows.slice(1).map((r, i) => {
    const n = idx.n != null ? toInt(cell(r, idx.n)) : i + 1;
    const tierRaw = cell(r, idx.tier);
    return {
      n: Number.isFinite(n) ? n : i + 1,
      name: cell(r, idx.name),
      handle: cell(r, idx.handle),
      tier: tierRaw === '' ? null : toInt(tierRaw),
      botarga: cell(r, idx.botarga),
      photo: cell(r, idx.photo),
      discord: cell(r, idx.discord),
      line: i + 2
    };
  });
  out.sort((a, b) => a.n - b.n);
  const seen = new Set();
  out.forEach(c => {
    if (!c.name) errors.push(`Fila ${c.line}: creador sin nombre.`);
    if (seen.has(c.n)) errors.push(`Fila ${c.line}: el número de creador ${c.n} está repetido.`);
    seen.add(c.n);
    if (c.tier != null && !(c.tier >= 1 && c.tier <= 5)) errors.push(`Fila ${c.line}: el nivel de "${c.name}" debe ser de 1 a 5.`);
  });
  if (out.some(c => c.tier == null)) warnings.push('Hay creadores sin nivel. El método Híbrido necesita el nivel (1 a 5) de todos.');
  const names = new Set();
  out.forEach(c => { const k = c.name.toLowerCase(); if (names.has(k)) warnings.push(`Nombre repetido: "${c.name}".`); names.add(k); });
  out.forEach((c, i) => { c.idx = i; });
  return { rows: out, errors, warnings };
}

function blockToDay(b) {
  const x = stripAccents(b).toUpperCase().replace(/[^A-D]/g, '');
  if (!x) return null;
  const ch = x[x.length - 1];
  return (ch === 'A' || ch === 'B') ? 1 : 2;
}

function parsePlayers(text, defaultDay) {
  const errors = [], warnings = [], rows = parseDelimited(text);
  if (rows.length < 2) return { rows: [], errors: ['El archivo de jugadores no tiene filas.'], warnings };
  const idx = mapHeaders(rows[0], HEADERS.players);
  if (idx.nick == null) errors.push('Falta la columna "nick" (o "gamertag") en el archivo de jugadores.');
  if (idx.puesto == null && idx.points == null) errors.push('Falta la columna "puesto" o la columna "puntos".');
  if (errors.length) return { rows: [], errors, warnings };
  let out = rows.slice(1).map((r, i) => {
    let day = idx.day != null ? toInt(cell(r, idx.day)) : NaN;
    if (!(day === 1 || day === 2)) day = idx.block != null ? blockToDay(cell(r, idx.block)) : null;
    if (!(day === 1 || day === 2)) day = defaultDay || null;
    const pts = idx.points != null ? parseFloat(String(cell(r, idx.points)).replace(',', '.')) : NaN;
    const kills = idx.kills != null ? parseFloat(String(cell(r, idx.kills)).replace(',', '.')) : NaN;
    return {
      day,
      puesto: idx.puesto != null ? toInt(cell(r, idx.puesto)) : NaN,
      nick: cell(r, idx.nick),
      name: cell(r, idx.name),
      id: cell(r, idx.id),
      block: cell(r, idx.block),
      points: Number.isFinite(pts) ? pts : null,
      kills: Number.isFinite(kills) ? kills : null,
      photo: cell(r, idx.photo),
      discord: cell(r, idx.discord),
      reserve: idx.reserve != null ? truthy(cell(r, idx.reserve)) : false,
      line: i + 2
    };
  });
  // Si no hay puesto pero sí puntos, el puesto se calcula por puntos y bajas dentro de cada jornada.
  if (idx.puesto == null) {
    warnings.push('No hay columna "puesto": se calculó por puntos (y bajas como desempate). Confirma con Activision que el orden sea el oficial.');
    [1, 2].forEach(d => {
      const list = out.filter(p => p.day === d && !p.reserve);
      list.sort((a, b) => (b.points - a.points) || ((b.kills || 0) - (a.kills || 0)));
      list.forEach((p, i) => { p.puesto = i + 1; });
    });
  }
  out.forEach(p => {
    if (!p.day) errors.push(`Fila ${p.line}: no se pudo saber la jornada (usa la columna "jornada" o "bloque").`);
    if (!p.nick) errors.push(`Fila ${p.line}: jugador sin nick.`);
    if (!Number.isFinite(p.puesto)) errors.push(`Fila ${p.line}: puesto inválido para "${p.nick}".`);
  });
  return { rows: out, errors, warnings };
}

/* ---------- Validación ---------- */
function expectedPerDay(creators) { return creators.length * 2; }

function validateData(creators, players) {
  const errors = [], warnings = [], ready = { 1: false, 2: false };
  const N = creators.length;
  if (N < 2) { errors.push('Faltan creadores.'); return { errors, warnings, ready }; }
  const need = N * 2;
  [1, 2].forEach(d => {
    const list = players.filter(p => p.day === d);
    if (!list.length) return;
    const main = list.filter(p => !p.reserve && p.puesto >= 1 && p.puesto <= need);
    const extra = list.filter(p => p.reserve || p.puesto > need);
    const seenP = new Set(), seenN = new Set();
    let ok = true;
    main.forEach(p => {
      if (seenP.has(p.puesto)) { errors.push(`Jornada ${d}: el puesto ${p.puesto} está repetido.`); ok = false; }
      seenP.add(p.puesto);
      const k = p.nick.toLowerCase();
      if (seenN.has(k)) { errors.push(`Jornada ${d}: el nick "${p.nick}" está repetido.`); ok = false; }
      seenN.add(k);
    });
    for (let i = 1; i <= need; i++) if (!seenP.has(i)) { errors.push(`Jornada ${d}: falta el puesto ${i} (se necesitan los puestos 1 a ${need}).`); ok = false; if (errors.length > 40) break; }
    list.forEach(p => { if (!p.reserve && (p.puesto < 1)) { errors.push(`Jornada ${d}: puesto inválido (${p.puesto}) en "${p.nick}".`); ok = false; } });
    extra.forEach(p => { const k = p.nick.toLowerCase(); if (seenN.has(k)) { errors.push(`Jornada ${d}: la reserva "${p.nick}" también aparece como clasificado.`); ok = false; } });
    if (extra.length === 0) warnings.push(`Jornada ${d}: no hay reservas cargadas. Las necesitarás para sustituir a quien no confirme.`);
    ready[d] = ok && main.length === need;
  });
  const n1 = new Set(players.filter(p => p.day === 1 && !p.reserve).map(p => p.nick.toLowerCase()));
  players.filter(p => p.day === 2 && !p.reserve).forEach(p => { if (n1.has(p.nick.toLowerCase())) warnings.push(`El nick "${p.nick}" aparece en las dos jornadas.`); });
  const ids = new Map();
  players.filter(p => !p.reserve && p.id).forEach(p => { const k = p.id; if (ids.has(k) && ids.get(k) !== p.nick) warnings.push(`El ID ${k} aparece con dos nicks distintos.`); ids.set(k, p.nick); });
  return { errors, warnings: warnings.slice(0, 30), ready };
}

/* ---------- Algoritmo ---------- */
function top3(arr) {
  const s = arr.slice().sort((a, b) => b - a); let t = 0;
  for (let i = 0; i < 3 && i < s.length; i++) t += s[i];
  return t;
}
const strengthOf = (puesto, N) => (2 * N + 1) - puesto;

function levelPoints(creators, method, levelStep) {
  return creators.map(c => (method === 'hibrido' && c.tier != null) ? (c.tier - 1) * levelStep : 0);
}
function realLevelPoints(creators, levelStep) {
  return creators.map(c => c.tier != null ? (c.tier - 1) * levelStep : 0);
}

/* prevStrengths[c] = fortalezas de los jugadores que el creador ya tiene (Jornada 1 al calcular la 2). */
function computeDayPlan(opts) {
  const { creators, day, method, levelStep } = opts;
  const N = creators.length, prev = opts.prevStrengths || creators.map(() => []);
  const use = levelPoints(creators, method, levelStep);
  const cnt = creators.map(() => 0), have = prev.map(a => a.slice());
  const order = creators.map((_, i) => i); if (day === 2) order.reverse();
  const events = [];
  for (let p = 1; p <= 2 * N; p++) {
    let best = -1, bt = Infinity, ties = 0;
    for (const c of order) {
      if (cnt[c] >= 2) continue;
      const t = use[c] + top3(have[c]);
      if (t < bt) { bt = t; best = c; ties = 1; } else if (t === bt) ties++;
    }
    cnt[best]++; have[best].push(strengthOf(p, N));
    events.push({ p, c: best, pts: bt, tie: ties > 1 });
  }
  return events;
}

function assignFromEvents(events, step, N) {
  const a = Array.from({ length: N }, () => []);
  for (let i = 0; i < Math.min(step, events.length); i++) a[events[i].c].push(events[i].p);
  return a;
}

function totalsFor(creators, levelStep, a1, a2) {
  const N = creators.length, lv = realLevelPoints(creators, levelStep);
  return creators.map((_, c) => lv[c] + top3([...(a1[c] || []), ...(a2[c] || [])].map(p => strengthOf(p, N))));
}
// OJO: a1 y a2 son puestos; el valor de un puesto es el mismo en ambas jornadas porque ambas tienen 2N jugadores.
function gapOf(t) { return t.length ? Math.max(...t) - Math.min(...t) : 0; }

function sha256(obj) { return crypto.createHash('sha256').update(typeof obj === 'string' ? obj : JSON.stringify(obj)).digest('hex'); }

/* Datos que determinan el resultado: sirven para el acta y para verificar. */
function inputsFor(creators, players, day) {
  return {
    creators: creators.map(c => ({ n: c.n, name: c.name, tier: c.tier })),
    players: players.filter(p => p.day === day && !p.reserve && p.puesto >= 1)
      .sort((a, b) => a.puesto - b.puesto).map(p => ({ puesto: p.puesto, nick: p.nick }))
  };
}

module.exports = {
  RULES_VERSION, parseDelimited, parseCreators, parsePlayers, validateData, expectedPerDay,
  computeDayPlan, assignFromEvents, totalsFor, gapOf, strengthOf, top3, sha256, inputsFor, realLevelPoints, levelPoints
};
