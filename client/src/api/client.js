const PIN_KEY = 'draft-pin';

export function loadPin() {
  try { return sessionStorage.getItem(PIN_KEY) || ''; } catch { return ''; }
}

export function savePin(pin) {
  try { sessionStorage.setItem(PIN_KEY, pin); } catch { /* almacenamiento no disponible */ }
}

export async function apiCall(path, pin, body) {
  const opt = { method: body === undefined ? 'GET' : 'POST', headers: { 'x-pin': pin } };
  if (body !== undefined) {
    opt.headers['Content-Type'] = 'application/json';
    opt.body = JSON.stringify(body);
  }
  const r = await fetch(path, opt);
  let j = {};
  try { j = await r.json(); } catch { /* respuesta sin cuerpo */ }
  if (r.status === 401) {
    const err = new Error('PIN requerido');
    err.pinRequired = true;
    throw err;
  }
  if (!r.ok) throw new Error(j.error || ('Error ' + r.status));
  return j;
}

export function withPin(url, pin) {
  if (!pin) return url;
  return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'pin=' + encodeURIComponent(pin);
}
