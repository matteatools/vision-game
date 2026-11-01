// Shared geometry: visible model, animation and grading use these same curves.
function parsePath(value){
 const tokens=value.match(/[MLCQ]|-?(?:\d*\.\d+|\d+)/g);let i=0,x=0,y=0;const result=[];
 while(i<tokens.length){const op=tokens[i++],size={M:2,L:2,C:6,Q:4}[op];if(!size)throw Error('Unexpected teaching-path command');const p=tokens.slice(i,i+size).map(Number);i+=size;if(p.length!==size||p.some(n=>!Number.isFinite(n)))throw Error('Invalid teaching path');
 if(op==='Q'){result.push(['C',x+2*(p[0]-x)/3,y+2*(p[1]-y)/3,p[2]+2*(p[0]-p[2])/3,p[3]+2*(p[1]-p[3])/3,p[2],p[3]]);}else result.push([op,...p]);[x,y]=p.slice(-2);
 }return result;
}
function transform(source,sx,sy,dx,dy){return source.map(s=>({...s,path:s.path.map(([op,...p])=>[op,...p.map((v,i)=>v*(i%2?sy:sx)+(i%2?dy:dx))])}));}
function sample(path){let point;const result=[];for(const [op,...p] of path){if(op==='M'){point=p;result.push(p);continue;}const start=point;for(let i=1;i<=40;i++){const t=i/40,u=1-t;result.push(op==='L'?start.map((v,k)=>v+(p[k]-v)*t):[0,1].map(k=>u**3*start[k]+3*u*u*t*p[k]+3*u*t*t*p[k+2]+t**3*p[k+4]));}point=result.at(-1);}return result;}
// Use distance along the pen path for tapering, rather than the number of
// control points, so a long curve and a short line have the same pen finish.
function outline(points,taper,scale=1){const lengths=[0];for(let i=1;i<points.length;i++)lengths.push(lengths.at(-1)+Math.hypot(points[i][0]-points[i-1][0],points[i][1]-points[i-1][1]));const total=lengths.at(-1)||1,sides=[[],[]];points.forEach((p,i)=>{const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)],dx=after[0]-before[0],dy=after[1]-before[1],length=Math.hypot(dx,dy)||1,t=lengths[i]/total;let half=(1.55+.22*Math.sin(Math.PI*t))*scale;half*=Math.min(1,.72+t*8);if(taper&&t>.78)half*=Math.max(.035,(1-t)/.22);for(let side=0;side<2;side++){const sign=side?1:-1;sides[side].push([p[0]-sign*dy/length*half,p[1]+sign*dx/length*half]);}});return [...sides[0],...sides[1].reverse()].map((p,i)=>`${i?'L':'M'}${p.map(v=>v.toFixed(3)).join(' ')}`).join(' ')+'Z';}
export function buildTeachingMaster(source,script){
 const hira=script==='hiragana',raw=Object.fromEntries(Object.entries(source).map(([c,ss])=>[c,ss.map(s=>({...s,path:parsePath(s.path)}))]));
 const smallPairs=hira?[['っ','つ'],['ゃ','や'],['ゅ','ゆ'],['ょ','よ']]:[['ッ','ツ'],['ャ','ヤ'],['ュ','ユ'],['ョ','ヨ']];
 for(const [little,big] of smallPairs)raw[little]=transform(raw[big],.43,.43,52,4).map(s=>({...s,scale:.43}));
 const voicedBases={};const pairs=hira?[['かきくけこさしすせそたちつてとはひふへほ','がぎぐげござじずぜぞだぢづでどばびぶべぼ'],['はひふへほ','ぱぴぷぺぽ']]:[['カキクケコサシスセソタチツテトハヒフヘホ','ガギグゲゴザジズゼゾダヂヅデドバビブベボ'],['ハヒフヘホ','パピプペポ']];
 pairs.forEach(([bases,marks],group)=>{[...marks].forEach((c,i)=>{voicedBases[c]=bases[i];const body=transform(raw[bases[i]],.85,.92,1,5);const marksData=group===1?['M88 12 C96 12 96 24 88 24 C80 24 80 12 88 12']:['M79 12 Q83 15 86 20','M89 10 Q93 13 96 18'];raw[c]=[...body,...marksData.map(path=>({path:parsePath(path),role:'mark',taper:group===0}))];});});
 if(!hira)raw['ー']=[{path:parsePath('M50 16 L50 84')}];
 const smallChars=smallPairs.map(x=>x[0]);return Object.fromEntries(Object.entries(raw).map(([character,definitions])=>{const strokes=definitions.map(s=>sample(s.path)),small=smallChars.includes(character);return [character,{
 id:`${script}-${character.codePointAt(0).toString(16)}`,character,version:'0.4.0',type:small?'small':character==='ー'?'long':voicedBases[character]?'voiced':'normal',strokes,strokeCount:strokes.length,
 displayPaths:definitions.map(s=>s.path.map(([op,...p])=>op+p.join(' ')).join(' ')),outlinePaths:definitions.map((s,i)=>outline(strokes[i],s.taper,s.scale)),directions:strokes.map(s=>({start:s[0],end:s.at(-1)})),region:small?[52,4,95,47]:[10,10,90,90],
 tolerance:{meanDistance:small?7.5:12,endpointDistance:small?13:21,ambiguityMargin:2.2,perStroke:definitions.map(s=>s.role==='mark'?{meanDistance:4,endpointDistance:6}:null)},
 verification:{status:'prototype-unreviewed',source:'独自作成の教科書体に近い運筆曲線（src/teaching-paths.js）',license:null,history:['2026-10-31 全基本文字を再作図。とめ・はらい、字形の比率、分離する画を統一。教育専門家の監修は未実施。']}
 }];}));
}
