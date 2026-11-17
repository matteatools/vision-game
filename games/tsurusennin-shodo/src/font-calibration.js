import {calibratedFontOutlines} from './calibrated-font-outlines.js';
// Full integration candidate: font geometry retained; independent review pending.
// Coordinates are in the source font's 1000-unit em. Stroke identities/order
// follow the existing teaching data; the individual contours were inspected.
import {calibratedStrokeCandidates} from './calibrated-stroke-candidates.js';
export const fontStrokeCalibration=calibratedStrokeCandidates;

export function pathData(value,frame){
 const tokens=value.match(/[MLCQ]|-?(?:\d*\.\d+|\d+)/g),result=[];let i=0,x=0,y=0;
 while(i<tokens.length){const op=tokens[i++],n={M:2,L:2,Q:4,C:6}[op],p=tokens.slice(i,i+n).map(Number);i+=n;
 if(op==='Q')result.push(['C',x+2*(p[0]-x)/3,y+2*(p[1]-y)/3,p[2]+2*(p[0]-p[2])/3,p[3]+2*(p[1]-p[3])/3,p[2],p[3]]);else result.push([op,...p]);[x,y]=p.slice(-2);}
 return result.map(([op,...p])=>[op,...p.map((v,i)=>i%2?v*frame[3]+frame[5]:v*frame[0]+frame[4])]);
}
export function sample(path){let pos;const out=[];for(const[op,...p]of path){if(op==='M'){pos=p;out.push(p);continue;}const start=pos;for(let i=1;i<=40;i++){const t=i/40,u=1-t;out.push(op==='L'?start.map((v,k)=>v+(p[k]-v)*t):[0,1].map(k=>u**3*start[k]+3*u*u*t*p[k]+3*u*t*t*p[k+2]+t**3*p[k+4]));}pos=out.at(-1);}return out;}
export function applyFontCalibration(entry){
 const source=calibratedFontOutlines[entry.character],paths=fontStrokeCalibration[entry.character];if(!source||!paths)return entry;
 const parsed=paths.map(p=>pathData(p,source.frame)),strokes=parsed.map(sample);
 return {...entry,version:'font-calibration-candidate-2',reference:'font-outline',fontOutline:source.outline,fontTransform:source.frame,fontOutlineStrokeWidth:1.9/.106,strokes,strokeCount:strokes.length,displayPaths:parsed.map(p=>p.map(([op,...v])=>op+v.join(' ')).join(' ')),directions:strokes.map(s=>({start:s[0],end:s.at(-1)})),verification:{...entry.verification,status:'full-candidate-review-pending',source:'Bundled Klee One exact contours plus individually calibrated stroke centre-lines. 150 font glyph centre-line candidates plus the unchanged vertical long vowel. Final review pending.'}};
}
