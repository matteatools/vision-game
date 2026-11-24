export const MATCH_MS = 30000;
export const COUNTDOWN_MS = 3000;
export const TYPES = ['carrot', 'pumpkin', 'sweetpotato', 'rabbit'];

export function makeSchedule(size) {
  const schedule = {};
  const base = {4:1100,9:900,16:760}[size];
  if (!base) throw Error('畑を選んでください。');
  let previousHole = -1;
  let previousRabbit = false;
  let index = 0;
  for (let at = 0; at < MATCH_MS;) {
    const chance = at < 10000 ? 0 : at < 20000 ? 0.15 : 0.25;
    const rabbit = !previousRabbit && Math.random() < chance;
    const type = rabbit ? 'rabbit' : TYPES[Math.floor(Math.random()*3)];
    let hole = Math.floor(Math.random()*(size-1));
    if (hole >= previousHole && previousHole >= 0) hole++;
    const duration = Math.min(at >= 20000 ? Math.round(base*0.8) : base, MATCH_MS-at);
    schedule[index++] = { at, until:at+duration, hole, type };
    at += duration + (rabbit ? 260 : 120);
    previousHole = hole;
    previousRabbit = rabbit;
  }
  return schedule;
}

export function tally(schedule, claims = {}) {
  const scores = [0,0];
  for (const key of Object.keys(schedule).sort((a,b)=>Number(a)-Number(b))) {
    const claim = claims[key];
    if (!claim || ![0,1].includes(claim.seat)) continue;
    scores[claim.seat] = Math.max(0,scores[claim.seat]+(schedule[key].type==='rabbit'?-1:1));
  }
  return scores;
}
