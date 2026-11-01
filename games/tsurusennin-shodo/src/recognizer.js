import { master } from './master.js';
const distance = (a,b) => Math.hypot(a[0]-b[0], a[1]-b[1]);
export function resample(points, count = 24) {
  if (!points.length) return [];
  const lengths = [0];
  for (let i=1; i<points.length; i++) lengths.push(lengths.at(-1) + distance(points[i-1],points[i]));
  const total = lengths.at(-1);
  if (!total) return Array.from({length:count}, () => [...points[0]]);
  let segment=1;
  return Array.from({length:count}, (_,i) => {
    const target = total*i/(count-1);
    while (segment < lengths.length-1 && lengths[segment] < target) segment++;
    const ratio = (target-lengths[segment-1])/(lengths[segment]-lengths[segment-1] || 1);
    return points[segment-1].map((v,k) => v+(points[segment][k]-v)*ratio);
  });
}
function strokeDistance(input, expected) {
  const a=resample(input), b=resample(expected);
  return a.reduce((sum,p,i) => sum+distance(p,b[i]),0)/a.length;
}
function score(strokes, entry) {
  if (strokes.length !== entry.strokeCount) return null;
  // Reject a collapsed shape (e.g. a horizontal line mistaken for ヘ), even
  // when the average distance is small. Preserve natural size variation.
  const extent=(lines,axis)=>{const values=lines.flat().map(p=>p[axis]);return Math.max(...values)-Math.min(...values);};
  const hasShape=[0,1].every(axis=>extent(entry.strokes,axis)<12 || extent(strokes,axis)>=extent(entry.strokes,axis)*.5);
  const errors = strokes.map((s,i) => strokeDistance(s,entry.strokes[i]));
  const endpoints = strokes.map((s,i) => Math.max(distance(s[0],entry.strokes[i][0]),distance(s.at(-1),entry.strokes[i].at(-1))));
  return { character: entry.character, score: errors.reduce((a,b)=>a+b,0)/errors.length,
    valid: hasShape && errors.every((error,i)=>error <= (entry.tolerance.perStroke?.[i]?.meanDistance ?? entry.tolerance.meanDistance)) && endpoints.every((error,i)=>error <= (entry.tolerance.perStroke?.[i]?.endpointDistance ?? entry.tolerance.endpointDistance)) };
}
// Recognize across the complete available master, never only the expected slot.
export function recognize(strokes, bank=master) {
  if (!strokes.length) return { ok:false, reason:'empty', message:'マスに もじを かいてみよう' };
  if (strokes.some(s => s.length < 2 || !s.every(p => p.length === 2 && p.every(Number.isFinite)))) return {ok:false,reason:'shape',message:'おてほんと くらべてみよう'};
  const ranked = Object.values(bank).map(entry=>score(strokes,entry)).filter(Boolean).sort((a,b)=>a.score-b.score);
  const valid=ranked.filter(r=>r.valid);
  if (valid.length && (!valid[1] || valid[1].score-valid[0].score > bank[valid[0].character].tolerance.ambiguityMargin)) return {ok:true,character:valid[0].character,score:valid[0].score};
  if (valid.length) return {ok:false,reason:'ambiguous',message:'おてほんを みて もういちど かこう'};
  // Only diagnose direction/order when the corresponding transformed sample is a close match.
  const reversed = strokes.map(s=>[...s].reverse());
  if (Object.values(bank).some(e=>score(reversed,e)?.valid)) return {ok:false,reason:'direction',message:'こっちから かいてみよう'};
  if (strokes.length>1 && Object.values(bank).some(e=>score([...strokes].reverse(),e)?.valid)) return {ok:false,reason:'order',message:'かく じゅんばんを みてみよう'};
  return {ok:false,reason:'shape',message:'おてほんと くらべてみよう'};
}
// Confirm only a single identity that passes the handwriting criteria.
// Never use the expected word, slot index or selected model as a hint.
export function suggestCharacters(strokes, bank=master) {
  const result=recognize(strokes,bank);
  return result.ok ? [{character:result.character,score:result.score}] : [];
}
export function evaluateWord(slots, word) {
  if (slots.some(s=>!s) || slots.length!==[...word].length) return 'incomplete';
  const text=slots.map(s=>s.character).join('');
  if (text===word) return 'complete';
  return [...text].sort().join('') === [...word].sort().join('') ? 'reorder' : 'replace';
}

// Absolute geometry score; an app-specific similarity, not pixel overlap.
export function gradeHandwriting(strokes, character, bank=master) {
 const entry=bank[character];
 if(!entry || !strokes.length || strokes.some(s=>s.length<2 || s.some(p=>p.length!==2 || p.some(v=>!Number.isFinite(v)))))return 0;
 const matched=Math.min(strokes.length,entry.strokeCount);
 const error=strokes.slice(0,matched).reduce((sum,s,i)=>sum+strokeDistance(s,entry.strokes[i]),0)/matched;
 const raw=Math.max(0,Math.floor(100-error*1.5-Math.abs(strokes.length-entry.strokeCount)*25+1e-8));
 return score(strokes,entry)?.valid ? raw : Math.min(94,raw);
}
