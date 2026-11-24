(function(root){
'use strict';
const DURATION=2000;let serial=0,current=null,raf=0;
const color=(c,f)=>/^#[0-9a-f]{6}$/i.test(c||'')?c:f;
function artwork(effect,icon=false){
 const c=color(effect.color,'#ffcd65'),a=color(effect.accent,'#fff5d7'),id='ultimate-'+(++serial),g='url(#'+id+'-g)';
 const path=(d,fill,attr='')=>'<path d="'+d+'" fill="'+fill+'" '+attr+'/>';
 const line=(d,w=4,stroke=c,attr='')=>path(d,'none','stroke="'+stroke+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round" '+attr);
 const circle=(x,y,r,fill,attr='')=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'" '+attr+'/>';
 const group=(s,attr='')=>'<g '+attr+'>'+s+'</g>';
 const star=(x,y,r,fill=a)=>path('M'+x+' '+(y-r)+' L'+(x+r*.25)+' '+(y-r*.25)+' L'+(x+r)+' '+y+' L'+(x+r*.25)+' '+(y+r*.25)+' L'+x+' '+(y+r)+' L'+(x-r*.25)+' '+(y+r*.25)+' L'+(x-r)+' '+y+' L'+(x-r*.25)+' '+(y-r*.25)+'Z',fill);
 const ring=circle(200,200,145,'none','stroke="'+c+'" stroke-width="3" stroke-dasharray="18 9 3 9"')+circle(200,200,122,'none','stroke="'+a+'" stroke-width="1.5"');
 const blade=path('M200 24 L224 66 L213 242 L200 264 L187 242 L176 66Z',g,'stroke="'+a+'" stroke-width="3"')+line('M200 34 L200 253',3,'#fff')+path('M145 236 L255 236 L246 258 L211 252 L211 313 L226 333 L200 350 L174 333 L189 313 L189 252 L154 258Z',c,'stroke="'+a+'" stroke-width="4"')+circle(200,247,10,a);
 const shard=path('M0 -118 L24 -48 L16 40 L0 66 L-16 40 L-24 -48Z',g,'stroke="'+a+'" stroke-width="2"')+path('M0 -118 L0 66 L-16 40Z','#fff','opacity=".6"');
 let back='',main='',front='';
 switch(effect.ultimateKind){
 case 'hero': {
  back=Array.from({length:12},(_,i)=>group(path('M193 32 L207 32 L218 138 L200 160 L182 138Z',i%3?c:a), 'transform="rotate('+i*30+' 200 200)"')).join('');
  const crest=path('M200 71 L312 114 L291 238 Q271 311 200 343 Q129 311 109 238 L88 114Z',g,'stroke="'+a+'" stroke-width="7"')+path('M200 92 L291 127 L273 233 Q254 291 200 319 Q146 291 127 233 L109 127Z','#142644')+
   path('M141 216 L135 171 Q137 153 153 157 L161 162 L161 144 Q165 129 181 138 L190 144 Q202 125 215 141 L223 153 Q238 140 250 158 L261 185 L255 228 L226 256 L167 251Z',g,'stroke="'+a+'" stroke-width="4"')+
   line('M162 164 L169 191 M191 147 L199 184 M224 157 L232 185 M146 215 L179 204 L203 222 L187 240',4,'#263650');
  main=crest;front=star(200,348,21)+star(74,197,21)+star(326,197,21);break;
 }
 case 'cannon': {
  back=ring+Array.from({length:4},(_,i)=>'<ellipse cx="200" cy="'+(115+i*55)+'" rx="'+(110-i*12)+'" ry="24" fill="none" stroke="'+(i%2?c:a)+'" stroke-width="5"/>').join('');
  main=path('M175 -20 L225 -20 L245 270 L200 369 L155 270Z',g)+path('M192 -20 L208 -20 L217 275 L200 343 L183 275Z','#fff')+
   line('M80 5 L153 254 M320 5 L247 254',14,c)+line('M55 40 L132 260 M345 40 L268 260',4,a);
  front=star(200,280,82)+circle(200,280,100,'none','stroke="'+c+'" stroke-width="7"');break;
 }
 case 'galaxy': {
  back=Array.from({length:3},(_,i)=>group('<ellipse cx="200" cy="200" rx="174" ry="'+(40+i*18)+'" fill="none" stroke="'+(i%2?a:c)+'" stroke-width="'+(8-i*2)+'"/>','transform="rotate('+(i*52-30)+' 200 200)"')).join('');
  main=circle(200,200,74,g)+circle(200,200,51,'#0c1236')+star(200,200,51)+circle(82,135,20,g)+circle(321,249,29,g)+circle(270,64,12,a);
  front=Array.from({length:12},(_,i)=>{const angle=i*Math.PI/6;return star(200+Math.cos(angle)*155,200+Math.sin(angle)*155,8+i%3*3);}).join('');break;
 }
 case 'phoenix': {
  back=path('M200 388 Q73 329 40 162 Q100 217 132 171 Q86 113 106 32 Q159 114 200 102 Q240 112 294 32 Q313 113 268 171 Q300 217 360 162 Q327 329 200 388Z',g,'opacity=".45"');
  main=path('M198 157 L176 93 L200 109 L219 75 L232 120 L215 163 Q276 79 379 50 L329 118 L365 115 L306 164 L334 170 L259 217 L229 226 L275 338 L224 302 L200 384 L175 302 L125 338 L171 226 L141 217 L66 170 L94 164 L35 115 L71 118 L21 50 Q124 79 198 157Z',g,'stroke="'+a+'" stroke-width="3"')+
   line('M67 87 L157 183 M333 87 L243 183 M200 229 L200 328',5,a)+path('M219 117 L245 128 L220 137Z',a)+circle(213,118,5,'#28334c');
  front=star(200,198,23)+star(59,274,18)+star(341,274,18);break;
 }
 case 'eclipse': {
  back=Array.from({length:16},(_,i)=>group(path('M193 14 L207 14 L215 89 L200 112 L185 89Z',g),'transform="rotate('+i*22.5+' 200 200)"')).join('');
  main=circle(200,200,111,g)+circle(200,200,92,'#0b1028')+path('M260 109 Q173 104 129 178 Q110 242 165 286 Q84 264 91 190 Q96 102 186 88Z','#fff')+
   '<ellipse cx="200" cy="200" rx="180" ry="37" fill="none" stroke="'+a+'" stroke-width="5" transform="rotate(-30 200 200)"/>';
  front=star(114,140,29)+star(300,256,19);break;
 }
 case 'sword': {
  back=ring+path('M200 0 L218 102 L200 173 L182 102Z M0 200 L102 182 L173 200 L102 218Z M400 200 L298 182 L227 200 L298 218Z M200 400 L182 298 L200 227 L218 298Z',c,'opacity=".5"');
  main=group(blade,'transform="rotate(18 200 200)"');
  front=star(113,93,25)+star(297,304,31)+line('M64 339 Q152 142 345 63',5,a);break;
 }
 case 'blades': {
  back=ring+circle(200,200,170,'none','stroke="'+a+'" stroke-width="3"');
  main=Array.from({length:8},(_,i)=>group(blade,'transform="translate(200 200) rotate('+i*45+') scale(.52) translate(-200 -390)"')).join('')+star(200,200,67,c)+star(200,200,35,a);
  front=circle(200,200,87,'none','stroke="'+a+'" stroke-width="4" stroke-dasharray="9 8"');break;
 }
 case 'freeze': {
  back=Array.from({length:6},(_,i)=>group(line('M200 24 L200 376 M200 62 L169 91 M200 62 L231 91 M200 111 L153 148 M200 111 L247 148',3,c),'transform="rotate('+i*60+' 200 200)"')).join('');
  main=Array.from({length:8},(_,i)=>group(shard,'transform="translate(200 214) rotate('+i*45+') translate(0 -65) scale(.85)"')).join('')+group(shard,'transform="translate(200 210) scale(1.4)"');
  front=star(200,221,35)+circle(200,210,155,'none','stroke="'+a+'" stroke-width="2"');break;
 }
 case 'sea': {
  back=line('M32 269 Q93 194 164 277 Q230 354 364 232 M29 307 Q96 240 171 318 Q264 381 371 276',14,c)+line('M49 281 Q115 233 173 294 Q262 354 348 279',4,a);
  const body=path('M88 294 Q34 199 160 117 Q252 64 302 128 Q336 166 291 205 Q253 232 202 206 Q279 207 284 161 Q278 123 237 133 Q162 149 128 222 Q111 256 146 291Z',g,'stroke="'+a+'" stroke-width="4"')+
   path('M114 258 L102 215 L144 223 L153 184 L182 217 L226 231 L233 256 L210 275 L188 259 L155 277 L166 300 L133 309Z',c,'stroke="'+a+'" stroke-width="4"')+
   path('M163 236 L193 241 L174 252Z',a)+path('M203 261 L205 280 L194 267Z','#fff');
  main=body;front=Array.from({length:7},(_,i)=>circle(54+i*49,74+(i%3)*32,6+i%3*4,a,'opacity=".7"')).join('');break;
 }
 case 'dragon': {
  back=path('M179 159 L31 50 L69 145 L17 174 L105 201 L144 259 M221 159 L369 50 L331 145 L383 174 L295 201 L256 259',g,'stroke="'+a+'" stroke-width="4"');
  main=path('M99 328 Q101 260 167 221 L140 172 L180 183 L176 103 L213 145 L253 93 L252 170 L302 191 L337 231 L297 258 L277 241 L236 253 L266 279 L309 273 L283 319 L229 310 L188 270 Q142 285 120 350Z',g,'stroke="'+a+'" stroke-width="4"')+
   path('M231 211 L275 212 L251 230Z','#182340')+path('M283 246 L288 268 L274 255 M303 252 L308 269 L294 257Z','#fff')+
   line('M175 185 L133 108 L151 189 M221 162 L226 61 L247 146',5,a);
  front=path('M303 243 Q348 186 392 255 Q342 227 389 305 Q342 277 303 243Z',a);break;
 }
 case 'archer': {
  back=ring+Array.from({length:9},(_,i)=>{const t=i*Math.PI*2/9;return star(200+Math.cos(t)*169,200+Math.sin(t)*169,11+i%3*3);}).join('')+
   line('M19 318 L122 215 M54 366 L167 253 M189 141 L295 35',3,a);
  const bow=path('M160 42 Q285 137 264 263 Q137 285 42 160 L108 175 L86 132 L145 162 L169 152 L176 126 L148 84 L184 101Z',g,'stroke="'+a+'" stroke-width="4"')+
   line('M163 48 L178 211 L48 163',2,a)+line('M112 234 L306 40',8,c)+line('M112 234 L306 40',3,'#fff')+
   path('M334 12 L315 90 L297 49 L256 31Z',g,'stroke="'+a+'" stroke-width="3"')+
   path('M99 220 L89 273 L144 261 L129 244 L144 218 L117 234Z',c,'stroke="'+a+'" stroke-width="3"');
  main=group(bow,'transform="translate(14 12)"');
  front=star(193,202,32)+line('M88 300 Q153 334 266 305 Q328 271 332 208',4,a)+star(81,311,17);break;
 }
 case 'titan': {
  back=ring+path('M38 87 L127 112 L101 196 L28 165Z M362 87 L273 112 L299 196 L372 165Z',g,'stroke="'+a+'" stroke-width="4"')+
   line('M46 226 L21 270 M354 226 L379 270 M97 300 L71 344 M303 300 L329 344',7,c);
  const armor=path('M152 147 L248 147 L278 199 L250 273 L150 273 L122 199Z',g,'stroke="'+a+'" stroke-width="4"')+
   path('M139 183 L200 210 L261 183 L240 234 L200 253 L160 234Z','#233650','stroke="'+a+'" stroke-width="3"')+
   path('M162 188 L200 208 L238 188 L200 238Z',c)+star(200,215,19,a)+
   path('M149 274 L190 274 L185 329 L143 352 L118 335Z M251 274 L210 274 L215 329 L257 352 L282 335Z',g,'stroke="'+a+'" stroke-width="4"')+
   path('M150 87 L172 57 L228 57 L250 87 L241 136 L219 156 L181 156 L159 136Z',g,'stroke="'+a+'" stroke-width="4"')+
   path('M156 94 L200 110 L244 94 L234 124 L200 140 L166 124Z','#14263e')+
   line('M159 93 L200 109 L241 93',5,a)+path('M154 42 L200 77 L246 42 L225 91 L200 102 L175 91Z',c,'stroke="'+a+'" stroke-width="3"');
  const fist=path('M49 151 L75 126 L121 137 L139 163 L128 224 L104 245 L56 232 L31 202Z',g,'stroke="'+a+'" stroke-width="5"')+
   line('M55 160 L89 168 L121 151 M62 185 L100 194 L122 178 M82 139 L72 164 M104 143 L96 165',4,'#577592');
  main=armor+fist+group(fist,'transform="translate(400 0) scale(-1 1)"');
  front=star(30,148,16)+star(370,148,16)+line('M79 288 L200 311 L321 288',5,a);break;
 }
 case 'judgment': {
  back=ring+Array.from({length:8},(_,i)=>group(path('M195 7 L179 72 L201 61 L184 112 L222 45 L199 57 L215 7Z',c),'transform="rotate('+i*45+' 200 200)"')).join('');
  main=path('M222 0 L140 171 L188 153 L147 296 L257 130 L205 146 L275 0Z',g)+path('M222 0 L169 153 L207 141 L177 243 L237 151 L195 164Z','#fff')+
   path('M108 260 L138 286 L159 243 L200 287 L241 243 L262 286 L292 260 L275 332 L125 332Z',g,'stroke="'+a+'" stroke-width="4"');
  front=star(200,285,38)+line('M70 344 L330 344',7,a);break;
 }
 }
 const orbit=group(back,'class="uf-orbit"'),core=group(main,'class="uf-core"'),spark=group(front,'class="uf-front"');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" class="'+(icon?'hero-skill-icon':'uf-emblem')+'" aria-hidden="true"><defs><linearGradient id="'+id+'-g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+a+'"/><stop offset=".5" stop-color="'+c+'"/><stop offset="1" stop-color="'+a+'"/></linearGradient></defs>'+orbit+core+spark+'</svg>';
}
function clear(){
 if(raf)cancelAnimationFrame(raf);raf=0;
 if(current){current.target.classList.remove('finisher-anchor');current.node.remove();current=null;if(typeof GameSound!=='undefined')GameSound.stopEffects();}
}
function setPaused(paused){
 if(!current)return;current.paused=!!paused;current.last=performance.now();
 current.node.classList.toggle('uf-paused',current.paused||document.hidden);
}
function place(){
 if(!current)return;
 const {node,target,preview}=current,rect=target.getBoundingClientRect();
 if(preview){node.style.setProperty('--uf-size',Math.min(rect.width,rect.height)*1.45+'px');return;}
 const img=target.querySelector('img'),box=img?.getBoundingClientRect()||rect;
 const ratio=img?.naturalWidth?Math.min(box.width/img.naturalWidth,box.height/img.naturalHeight):1;
 const imageSize=img?.naturalWidth?Math.max(img.naturalWidth,img.naturalHeight)*ratio:Math.min(box.width,box.height);
 const size=Math.min(imageSize*1.5,innerWidth*.94,innerHeight*.88),x=box.left+box.width/2,y=box.top+box.height/2,captionWidth=Math.min(size*1.2,innerWidth-24);
 node.style.setProperty('--uf-x',x+'px');node.style.setProperty('--uf-y',y+'px');node.style.setProperty('--uf-size',size+'px');
 node.style.setProperty('--uf-caption-width',captionWidth+'px');node.style.setProperty('--uf-caption-x',Math.max(captionWidth/2+12,Math.min(innerWidth-captionWidth/2-12,x))+'px');
 const captionHeight=node.querySelector('.uf-banner')?.offsetHeight||80,panel=document.querySelector('#play .panel')?.getBoundingClientRect();
 let captionBottom=innerHeight-12;
 if(panel&&panel.top>y&&x>=panel.left&&x<=panel.right)captionBottom=Math.min(captionBottom,panel.top-8);
 node.style.setProperty('--uf-caption-y',Math.max(8,Math.min(captionBottom-captionHeight,y+size*.34))+'px');
}
function play(effect,target=document.getElementById('sprite')){
 clear();
 if(document.hidden||!target||target.getBoundingClientRect().width<1)return false;
 const preview=!!target.closest('dialog'),node=document.createElement('div');
 node.className='ultimate-stage uf-'+effect.ultimateKind+(preview?' ultimate-preview':'');
 node.style.setProperty('--uf-color',color(effect.color,'#ffcd65'));node.style.setProperty('--uf-accent',color(effect.accent,'#fff5d7'));
 node.dataset.effect=effect.id;node.setAttribute('aria-hidden','true');
 const rays=Array.from({length:14},(_,i)=>'<i style="--ray:'+i+'"></i>').join('');
 const particles=Array.from({length:24},(_,i)=>'<i style="--particle:'+i+';--px:'+((i*43)%100)+'%;--py:'+((i*29)%100)+'%;--size:'+(3+i%4*2)+'px"></i>').join('');
 node.innerHTML='<div class="uf-rays">'+rays+'</div><div class="uf-ring uf-ring-one"></div><div class="uf-ring uf-ring-two"></div><div class="uf-particles">'+particles+'</div><div class="uf-art">'+artwork(effect)+'</div><div class="uf-impact"></div>'+(preview?'':'<div class="uf-banner"><small>10コンボ！ パーフェクト！</small><strong>'+effect.name+'</strong></div>');
 if(preview)target.classList.add('finisher-anchor');
 (preview?target:document.body).appendChild(node);
 current={node,target,preview,elapsed:0,last:performance.now(),paused:false};place();
 function frame(now){
  if(!current)return;
  const dt=Math.min(100,Math.max(0,now-current.last));current.last=now;place();
  current.node.classList.toggle('uf-paused',current.paused||document.hidden);
  if(!current.paused&&!document.hidden)current.elapsed+=dt;
  if(current.elapsed>=DURATION){clear();return;}raf=requestAnimationFrame(frame);
 }
 raf=requestAnimationFrame(frame);return true;
}
document.addEventListener('visibilitychange',()=>{if(current){current.last=performance.now();current.node.classList.toggle('uf-paused',current.paused||document.hidden);}});
root.FinisherEffects=Object.freeze({icon:effect=>artwork(effect,true),play,clear,setPaused,durationMs:DURATION});
})(window);
