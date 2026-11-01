(function(root){
const courses=[['add','たしざん','くりあがり なし','＋','#5f9478'],['addCarry','たしざん','くりあがり あり','＋','#d09b45'],['sub','ひきざん','くりさがり なし','−','#5c98aa'],['subCarry','ひきざん','くりさがり あり','−','#b2809d'],['mul','かけざん','くくに チャレンジ','×','#8c88b2']].map(([id,name,sub,symbol,color])=>({id,name,sub,symbol,color}));
const cards=[];function add(course,a,b,op,answer){cards.push({id:`${course}-${a}-${b}`,course,a,b,op,answer,expression:`${a} ${op} ${b}`});}
for(let a=1;a<=9;a++)for(let b=1;b<=9;b++){add(a+b<=10?'add':'addCarry',a,b,'＋',a+b);add('mul',a,b,'×',a*b);}
for(let a=2;a<=18;a++)for(let b=1;b<=9;b++)if(a-b>=1&&(a<=10||a-b<=9))add(a<=10?'sub':'subCarry',a,b,'−',a-b);
function shuffle(xs,rng=Math.random){const a=[...xs];for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const deck=id=>cards.filter(c=>c.course===id);
function choices(card){const start=card.course==='add'?2:card.course==='addCarry'?11:1;const end=card.course==='add'?10:card.course==='addCarry'?18:card.course==='mul'?81:9;return Array.from({length:end-start+1},(_,i)=>start+i);}
function karuta(id){const all=deck(id),groups=Object.create(null);for(const card of all){if(!groups[card.answer])groups[card.answer]=[];groups[card.answer].push(card);}const targets=Object.keys(groups).filter(k=>groups[k].length>=2);const answer=Number(shuffle(targets)[0]);const yes=shuffle(groups[answer]).slice(0,Math.min(4,groups[answer].length));return {answer,cards:shuffle([...yes,...shuffle(all.filter(c=>c.answer!==answer)).slice(0,20-yes.length)]),count:yes.length};}
const reward=miss=>Math.max(10,50-miss*10);
const sorted=cs=>cs.every((c,i)=>!i||cs[i-1].answer<=c.answer);
const inside=(x,y,size=48)=>[-1,1].every(dx=>[-1,1].every(dy=>((x+dx*size/2-180)/125)**2+((y+dy*size/2-212)/148)**2<=1));
const names=['いかずち','スパーク','ひかりだま','まがたま','きらめき','こおりのかけら','ほむら','はもん','うずしお','らいもん','せんこう','ひかりのわ','あわひかり','ふたつまがたま','ゆめのひかり','そうらい','ほしひばな','オーロラだま','ひすいまがたま','ひかりのなみ','ばくれつ','つきのしずく','むらさきすいしょう','ひかりのいん','ときめき','しでん','ろっかスパーク','しんじゅだま','みつどもえ','にじのかけら'];
const stickers=names.map((name,id)=>({id,name,group:Math.floor((id%15)/3),color:['#e699a5','#e6b752','#6da8bd','#a591bd','#83a46b'][Math.floor((id%15)/3)]}));
const weights=course=>stickers.map(s=>s.group===course?6:1);
function draw(course,rng=Math.random){const w=weights(course);let n=rng()*w.reduce((a,b)=>a+b,0);return stickers[w.findIndex(v=>(n-=v)<0)]||stickers.at(-1);}
function fresh(){return {version:1,coins:[0,0,0,0,0],owned:{},placed:[],stats:courses.map(()=>({played:0,correct:0,wrong:0,auto:0,bests:{},sessions:0})),sound:true};}
function restore(raw){const d=fresh();try{const v=JSON.parse(raw);if(v?.version!==1)return d;d.coins=d.coins.map((_,i)=>Number.isSafeInteger(v.coins?.[i])&&v.coins[i]>=0?v.coins[i]:0);for(const s of stickers)if(Number.isSafeInteger(v.owned?.[s.id])&&v.owned[s.id]>0)d.owned[s.id]=v.owned[s.id];d.placed=(Array.isArray(v.placed)?v.placed:[]).filter(p=>stickers[p.id]&&d.owned[p.id]&&inside(p.x,p.y)).slice(0,100);const used={};d.placed=d.placed.filter(p=>(used[p.id]=(used[p.id]||0)+1)<=d.owned[p.id]);d.stats=d.stats.map((s,i)=>{const r=v.stats?.[i];for(const k of ['played','correct','wrong','auto','sessions'])if(Number.isSafeInteger(r?.[k])&&r[k]>=0)s[k]=r[k];for(const [k,n]of Object.entries(r?.bests||{}))if(['normal','karuta','sort','auto'].includes(k)&&Number.isFinite(n)&&n>=0)s.bests[k]=n;return s;});d.sound=v.sound!==false;}catch{}return d;}
root.GameCore={courses,cards,deck,shuffle,choices,karuta,reward,sorted,inside,stickers,weights,draw,fresh,restore};if(typeof module!=='undefined')module.exports=root.GameCore;
})(globalThis);
