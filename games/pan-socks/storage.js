(function (root) {
  'use strict';
  const prefix = 'pan-socks:v2:';
  const memory = new Map(); let available = true;
  function get(key) { if (memory.has(key)) return memory.get(key); try { return localStorage.getItem(prefix + key); } catch { available = false; return null; } }
  function set(key, value) { memory.set(key, String(value)); try { localStorage.setItem(prefix + key, String(value)); } catch { available = false; } }
  function best(id) { const raw = get('best:' + id); if (raw === null || raw.trim() === '') return null; const value = Number(raw); return Number.isFinite(value) && value > 0 ? value : null; }
  function progress() {
    const raw = get('story30:cleared');
    if (raw !== null) { const n=Number(raw); return Number.isInteger(n)&&n>=0&&n<=30?n:0; }
    const old = Number(get('story:cleared:normal')), hard = Number(get('story:cleared:hard'));
    const normal = Number.isInteger(old)&&old>=0&&old<=10?old:0;
    return normal === 10 && Number.isInteger(hard)&&hard>=0&&hard<=10 ? 10+hard : normal;
  }
  function complete(day) { const current=progress(); if(Number.isInteger(day)&&day===current+1&&day<=30)set('story30:cleared',day); }
  root.Save = { progress, complete, best, saveBest(id, time) { if (!Number.isFinite(time) || time <= 0) return false; const prev = best(id); if (prev === null || time < prev) { set('best:' + id, time); return true; } return false; }, muted: () => get('muted') === 'true', setMuted: v => set('muted', !!v), available: () => available };
})(globalThis);
