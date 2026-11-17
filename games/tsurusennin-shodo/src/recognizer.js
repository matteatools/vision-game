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
const pathLength=points=>points.slice(1).reduce((sum,p,i)=>sum+distance(points[i],p),0);
const signedArea=points=>points.reduce((sum,p,i)=>{const q=points[(i+1)%points.length];return sum+p[0]*q[1]-q[0]*p[1];},0)/2;
const closed=points=>pathLength(points)>15 && distance(points[0],points.at(-1))<1;
function strokeDistance(input, expected) {
  if(closed(expected)) {
    // A circle may start anywhere. Keep traversal direction; do not reverse it.
    const a=resample(input,25).slice(0,-1),b=resample(expected,25).slice(0,-1);
    return Math.min(...b.map((_,shift)=>a.reduce((sum,p,i)=>sum+distance(p,b[(i+shift)%b.length]),0)/a.length));
  }
  const a=resample(input), b=resample(expected);
  return a.reduce((sum,p,i) => sum+distance(p,b[i]),0)/a.length;
}
function validInput(strokes) {
  return Array.isArray(strokes) && strokes.length>0 && strokes.every(s=>Array.isArray(s)&&s.length>=2&&s.every(p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)));
}
// Estimate direction from the interior of the stroke to reduce endpoint jitter.
function directionMatches(input,expected) {
 if(closed(expected))return signedArea(input)*signedArea(expected)>0;
 const a=resample(input,11),b=resample(expected,11);
 const v=p=>[p[8][0]-p[2][0],p[8][1]-p[2][1]];
 const u=v(a),w=v(b),nu=Math.hypot(...u),nw=Math.hypot(...w);
 // Angle checks apply to predominantly straight strokes, not loops or hooks.
 if(distance(expected[0],expected.at(-1))/pathLength(expected)>=.75 && nw>1) {
  if(nu<Math.max(.6,nw*.2))return false;
  if((u[0]*w[0]+u[1]*w[1])/(nu*nw)<Math.cos(55*Math.PI/180))return false;
 }
 return strokeDistance([...input].reverse(),expected)+1.5>=strokeDistance(input,expected);
}
function score(strokes, entry) {
  if (strokes.length !== entry.strokeCount) return null;
  const extent=(lines,axis)=>{const values=lines.flat().map(p=>p[axis]);return Math.max(...values)-Math.min(...values);};
  const hasShape=[0,1].every(axis=>extent(entry.strokes,axis)<12 || extent(strokes,axis)>=extent(entry.strokes,axis)*.42);
  const errors = strokes.map((s,i) => strokeDistance(s,entry.strokes[i]));
  const withinDistance=hasShape && errors.every((error,i)=>error <= (entry.tolerance.perStroke?.[i]?.meanDistance ?? entry.tolerance.meanDistance));
  const geometry=withinDistance && strokes.every((s,i)=>{
    const expected=entry.strokes[i],ratio=pathLength(s)/pathLength(expected);
    if(ratio<.45||ratio>2.3)return false; // dots and repeated scribbles are not strokes
    if(closed(expected)) {
      const area=signedArea(s),expectedArea=signedArea(expected);
      return area*expectedArea>0 && Math.abs(area)>=Math.abs(expectedArea)*.3 && distance(s[0],s.at(-1))<=8;
    }
    // Preserve writing direction, including a single incorrectly reversed stroke.
    return directionMatches(s,expected);
  });
  const endpoints = strokes.map((s,i) => closed(entry.strokes[i])?0:Math.max(distance(s[0],entry.strokes[i][0]),distance(s.at(-1),entry.strokes[i].at(-1))));
  const absolute=errors.reduce((a,b)=>a+b,0)/errors.length;
  const valid=geometry && endpoints.every((error,i)=>error <= (entry.tolerance.perStroke?.[i]?.endpointDistance ?? entry.tolerance.endpointDistance));
  if(!valid)return {character:entry.character,score:absolute,rankScore:absolute,valid:false};
  // Translation is used only for ranking already-valid candidates. Absolute
  // position, size, stroke count, direction and per-stroke limits still gate acceptance.
  const offsets=strokes.flatMap((s,i)=>{const a=resample(s),b=resample(entry.strokes[i]);return a.map((p,j)=>[p[0]-b[j][0],p[1]-b[j][1]]);});
  const shift=[0,1].map(axis=>Math.max(-6,Math.min(6,offsets.reduce((sum,p)=>sum+p[axis],0)/offsets.length)));
  const aligned=strokes.reduce((sum,s,i)=>sum+strokeDistance(s.map(p=>[p[0]-shift[0],p[1]-shift[1]]),entry.strokes[i]),0)/strokes.length;
  return { character: entry.character, score:absolute, rankScore:.7*aligned+.3*absolute,
    valid };
}
// Recognize across the complete available master, never only the expected slot.
export function recognize(strokes, bank=master) {
  if (Array.isArray(strokes)&&!strokes.length) return { ok:false, reason:'empty', message:'マスに もじを かいてみよう' };
  if (!validInput(strokes)) return {ok:false,reason:'shape',message:'おてほんと くらべてみよう'};
  const ranked = Object.values(bank).map(entry=>score(strokes,entry)).filter(Boolean).sort((a,b)=>a.score-b.score);
  const valid=ranked.filter(r=>r.valid);
  if (valid.length && (!valid[1] || valid[1].score-valid[0].score > bank[valid[0].character].tolerance.ambiguityMargin)) return {ok:true,character:valid[0].character,score:valid[0].score};
  if(valid.length>1){
    const shifted=[...valid].sort((a,b)=>a.rankScore-b.rankScore),best=shifted[0];
    // Resolve a tie only when a real common translation explains the input.
    // Tiny score reshuffling must not turn an ambiguous/reversed glyph into a guess.
    if(best.score-best.rankScore>1 && shifted[1].rankScore-best.rankScore>bank[best.character].tolerance.ambiguityMargin)return {ok:true,character:best.character,score:best.score};
  }
  if (valid.length) return {ok:false,reason:'ambiguous',message:'おてほんを みて もういちど かこう'};
  // Only diagnose direction/order when the corresponding transformed sample is a close match.
  const reversed = strokes.map(s=>[...s].reverse());
  if (Object.values(bank).some(e=>score(reversed,e)?.valid)) return {ok:false,reason:'direction',message:'こっちから かいてみよう'};
  if (strokes.some((_,i)=>Object.values(bank).some(e=>score(strokes.map((s,j)=>j===i?[...s].reverse():s),e)?.valid))) return {ok:false,reason:'direction',message:'かきはじめと むきを たしかめよう'};
  if (strokes.length>1 && (Object.values(bank).some(e=>score([...strokes].reverse(),e)?.valid) || strokes.slice(1).some((_,i)=>{const swapped=[...strokes];[swapped[i],swapped[i+1]]=[swapped[i+1],swapped[i]];return Object.values(bank).some(e=>score(swapped,e)?.valid);}))) return {ok:false,reason:'order',message:'かく じゅんばんを みてみよう'};
  return {ok:false,reason:'shape',message:'おてほんと くらべてみよう'};
}
// Every returned candidate independently passes all handwriting gates.
// The expected word, slot and selected model never influence this list.
export function suggestCharacters(strokes, bank=master) {
 if(!validInput(strokes))return [];
 return Object.values(bank).map(e=>score(strokes,e)).filter(r=>r?.valid)
  .sort((a,b)=>a.rankScore-b.rankScore||a.score-b.score)
  .map(r=>({character:r.character,score:r.score}));
}
export function handwritingIssue(strokes,character,bank=master) {
 const e=bank[character];if(!e||!validInput(strokes)||strokes.length!==e.strokeCount)return null;
 if(score(strokes,e)?.valid)return null;
 // Match whole input strokes to expected strokes without discarding directions.
 // A perfect one-to-one match in a different order is a stroke-order error.
 const matches=strokes.map(line=>e.strokes.map((expected,j)=>score([line],{
  ...e,strokes:[expected],strokeCount:1,tolerance:{...e.tolerance,perStroke:[e.tolerance.perStroke?.[j]??null]}
 })?.valid));
 const memo=new Map();
 const assign=(i,used)=>{if(i===strokes.length)return true;const key=i+':'+used;if(memo.has(key))return memo.get(key);const ok=matches[i].some((yes,j)=>yes&&!(used&(1<<j))&&assign(i+1,used|(1<<j)));memo.set(key,ok);return ok;};
 if(assign(0,0))return 'order';
 if(strokes.some((s,i)=>!directionMatches(s,e.strokes[i])))return 'direction';
 return null;
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
 if(!entry || !validInput(strokes))return 0;
 const matched=Math.min(strokes.length,entry.strokeCount);
 const error=strokes.slice(0,matched).reduce((sum,s,i)=>sum+strokeDistance(s,entry.strokes[i]),0)/matched;
 const raw=Math.max(0,Math.floor(100-error*1.5-Math.abs(strokes.length-entry.strokeCount)*25+1e-8));
 // A shape that does not pass recognition can never receive a flower score.
 if(handwritingIssue(strokes,character,bank))return Math.min(49,raw);
 return score(strokes,entry)?.valid ? raw : Math.min(89,raw);
}
