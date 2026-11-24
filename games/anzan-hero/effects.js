(function(root){
'use strict';
let layer=null,timer=null,serial=0;
const kinds=new Set(['slime','bandage','ink','volt','hydra','flame','burst','beam','dragon','void','thunder','pudding','fan','slash','ice','cat','rice','punch','rush','meteor','sword','shuriken','spear','chain','tornado','phoenix','rose','hammer','rocket','banana','donut','fish','dice','clock']);
const safeColor=(value,fallback)=>typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)?value:fallback;
function clear(){root.FinisherEffects?.clear();if(timer!==null){root.clearTimeout(timer);timer=null;}if(layer){layer.remove();layer=null;}}

function graphic(options,icon=false){
 const kind=kinds.has(options.kind)?options.kind:'burst',power=!!options.awakened;
 const color=safeColor(options.color,'#55d5e5'),accent=safeColor(options.accent,'#fff4c5');
 const id='hero-fx-'+(++serial),grad='url(#'+id+'-blade)',halo='url(#'+id+'-halo)',glow='url(#'+id+'-glow)';
 const path=(d,fill,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
 const line=(d,width=5,c=color,extra='')=>path(d,'none',`stroke="${c}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round" ${extra}`);
 const circle=(x,y,r,fill,extra='')=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
 const group=(body,extra='')=>`<g ${extra}>${body}</g>`;
 const star=(x,y,r,c=accent)=>path(`M${x} ${y-r} L${x+r*.26} ${y-r*.26} L${x+r} ${y} L${x+r*.26} ${y+r*.26} L${x} ${y+r} L${x-r*.26} ${y+r*.26} L${x-r} ${y} L${x-r*.26} ${y-r*.26}Z`,c);
 let art='',back='',front='';
 const ring=circle(200,210,122,'none',`stroke="${color}" stroke-width="2" stroke-dasharray="24 12 3 12"`)+circle(200,210,100,'none',`stroke="${accent}" stroke-width="1.5" opacity=".65"`);
 switch(kind){
 case 'slime': {
  const blob=path('M76 271 Q76 209 129 179 Q159 158 183 92 Q190 68 206 93 Q229 157 275 179 Q328 207 326 267 Q318 319 201 324 Q88 320 76 271Z',grad,'stroke="'+accent+'" stroke-width="6"')+
   path('M130 196 Q143 177 170 164 Q154 198 133 212Z','#fff','opacity=".8"')+
   circle(163,244,10,'#23344c')+circle(239,244,10,'#23344c')+line('M184 266 Q201 287 220 266',6,'#23344c')+
   path('M167 122 L155 79 L184 96 L200 59 L216 96 L246 79 L233 122Z',color,'stroke="'+accent+'" stroke-width="5"');
  back=group(circle(76,184,18,color)+circle(329,192,12,color),'class="fx-secondary"');
  art=group(blob,'class="fx-main fx-drop"');front=group(line('M66 312 Q200 350 338 311',10,color)+star(63,265,22)+star(340,263,24),'class="fx-impact"');break;
 }
 case 'bandage': {
  back=group(ring,'class="fx-charge"');
  const wrap=(d)=>line(d,30,color)+line(d,21,accent)+line(d,2,color,'stroke-dasharray="5 12"');
  art=group(wrap('M65 98 Q337 50 316 157 Q288 219 82 193 Q32 181 61 150 Q111 114 305 157 Q370 181 324 229 Q277 267 88 241 Q35 235 75 282 Q131 326 306 296')+
   path('M277 286 L343 287 L323 307 L336 330 L280 308Z',accent,'stroke="'+color+'" stroke-width="4"'),'class="fx-main fx-vortex"');
  front=group(circle(200,201,40,color,'opacity=".25"')+star(200,201,30),'class="fx-impact"');break;
 }
 case 'ink': {
  const splash=path('M202 129 C223 171 246 111 263 135 C272 154 250 180 290 179 C355 171 341 207 293 217 C254 226 322 269 298 285 C276 303 252 251 230 280 C216 312 209 342 190 321 C173 301 192 269 164 268 C135 267 111 313 95 290 C80 267 136 237 111 223 C81 208 38 210 59 185 C79 166 126 207 140 182 C158 153 111 112 140 102 C163 94 185 160 202 129Z',grad,'stroke="'+accent+'" stroke-width="5"');
  back=group(circle(74,107,16,color)+circle(325,127,10,color)+circle(331,317,18,color)+circle(71,330,8,color),'class="fx-secondary"');
  art=group(splash+circle(174,209,8,'#23344c')+circle(220,209,8,'#23344c')+path('M188 228 Q199 239 211 228 L204 244 L192 244Z','#23344c'),'class="fx-main fx-paw"');
  front=group(line('M132 168 Q143 146 161 157',7,accent),'class="fx-impact"');break;
 }
 case 'volt': {
  const fist=path('M105 235 L102 162 Q105 139 127 141 L140 143 L140 121 Q144 98 167 108 L181 115 Q193 88 215 105 L229 119 Q249 101 264 120 L281 145 L292 194 L279 255 L245 295 L157 290Z',grad,'stroke="'+accent+'" stroke-width="5"')+
   line('M139 146 L145 190 M182 120 L191 176 M230 123 L240 172 M119 224 L175 209 L209 232 L190 257 M157 290 L164 319 L249 319 L245 295',7,'#26354a');
  back=group(path('M112 52 L66 156 L108 145 L51 260 L135 181 L91 190Z M297 67 L341 160 L305 150 L355 274 L277 181 L318 196Z',color)+ring,'class="fx-charge"');
  art=group(fist,'class="fx-main fx-paw"');front=group(star(91,281,32)+star(307,276,30)+line('M141 338 L196 350 L257 337',6,color),'class="fx-impact"');break;
 }
 case 'hydra': {
  const heads=Array.from({length:8},(_,i)=>{
   const angle=(i-3.5)*23,head=path('M200 292 Q177 224 183 157 L165 135 L184 140 L177 112 L197 130 L216 111 L212 142 L236 151 L249 171 L229 190 L206 179 Q197 239 216 292Z',grad,'stroke="'+accent+'" stroke-width="3"')+
    path('M203 153 L225 157 L211 164Z','#23344c')+path('M224 177 L227 191 L216 181Z','#fff');
   return group(head,'transform="rotate('+angle+' 200 295)"');
  }).join('');
  back=group(ring,'class="fx-charge"');art=group(heads+path('M109 300 Q199 259 292 300 L270 331 Q200 357 130 331Z',grad,'stroke="'+accent+'" stroke-width="5"'),'class="fx-main fx-dragon"');
  front=group(star(200,298,28),'class="fx-impact"');break;
 }
 case 'flame': {
  const mane=path('M200 45 L226 100 L270 62 L267 127 L333 112 L305 170 L363 207 L306 230 L331 295 L266 279 L253 344 L209 306 L164 351 L148 286 L82 310 L103 243 L45 209 L104 178 L76 111 L143 130 L143 63 L178 111Z',grad,'stroke="'+accent+'" stroke-width="3"');
  const face=path('M128 151 L151 126 L173 151 L226 151 L252 126 L277 151 L269 230 L238 283 L162 283 L131 230Z',color,'stroke="'+accent+'" stroke-width="5"')+
   path('M146 178 L181 191 L158 201Z M253 178 L219 191 L242 201Z',accent)+
   path('M176 214 L225 214 L201 234Z','#23344c')+
   path('M150 224 Q200 253 252 224 L230 273 L171 273Z','#23344c')+
   path('M163 235 L182 240 L171 271Z M220 241 L239 235 L231 271Z',accent);
  back=group(mane,'class="fx-flames"');art=group(face,'class="fx-main fx-dragon"');
  front=group(star(91,90,22)+star(310,87,20),'class="fx-impact"');break;
 }

 case 'rush': {
  const fist=path('M132 250 L118 192 L127 143 Q132 128 149 135 L160 142 L163 122 Q172 108 188 121 L201 135 Q216 117 229 134 L242 150 Q259 138 270 157 L280 183 L268 243 L239 278 L166 278Z',grad,'stroke="'+accent+'" stroke-width="6"')+
   line('M153 146 L159 185 M190 129 L199 176 M235 151 L240 181 M135 217 L174 205 L205 228 L183 253',5,'#614830')+
   path('M167 279 L237 279 L245 312 L157 312Z',color,'stroke="'+accent+'" stroke-width="5"');
  back=group(line('M30 128 L100 162 M22 196 L94 207 M38 273 L100 245 M370 106 L301 152 M381 190 L307 202',9,color),'class="fx-trails"');
  art=group(group(fist,'transform="translate(-65 -63) scale(.8)"'),'class="fx-secondary fx-rush-left"')+
   group(group(fist,'transform="translate(155 -38) scale(.72)"'),'class="fx-third fx-rush-right"')+
   group(group(fist,'transform="translate(7 35)"'),'class="fx-main fx-rush-center"');
  front=group(star(200,218,27)+star(67,299,24)+star(333,270,25),'class="fx-impact"');break;
 }
 case 'punch': {
  art=group(path('M200 91 L222 157 L285 122 L259 183 L332 202 L267 226 L295 294 L230 263 L201 329 L174 264 L108 291 L139 230 L69 204 L139 179 L113 120 L176 154Z',color,`stroke="${accent}" stroke-width="9" stroke-linejoin="round"`)+path('M201 153 L220 190 L258 203 L221 220 L201 261 L184 222 L145 203 L183 188Z',accent),'class="fx-main fx-paw"');
  front=group(line('M64 120 L98 148 M302 139 L335 113 M309 278 L339 301',7,color),'class="fx-impact"');break;
 }
 case 'meteor': {
  back=group(path('M120 262 Q159 115 348 27 L300 153 L363 111 Q319 260 214 292Z',grad)+line('M188 217 L330 55 M222 243 L336 139',7,accent),'class="fx-trails"');
  art=group(circle(164,254,68,'#73364a',`stroke="${color}" stroke-width="9"`)+path('M126 218 L155 208 L185 233 L214 254 L181 282 L145 300 L118 268Z',grad)+line('M155 208 L159 248 L126 263 M159 248 L185 274',4,'#73364a'),'class="fx-main fx-rice"');
  if(power)front=group(circle(86,165,26,color)+circle(275,317,33,grad)+line('M74 147 L128 77 M263 291 L311 219',12,color),'class="fx-secondary"');break;
 }
 case 'sword': {
  const sword=path('M200 42 L226 87 L218 235 L200 253 L182 235 L174 87Z',grad,`stroke="${accent}" stroke-width="3"`)+path('M200 50 L200 242 L182 229 L179 87Z','#fff','opacity=".65"')+path('M131 233 Q200 206 269 233 L258 254 L211 244 L211 307 L222 326 L200 346 L178 326 L189 307 L189 244 L142 254Z',power?'#754bab':'#c69235',`stroke="${accent}" stroke-width="4"`)+circle(200,234,13,color);
  back=group(ring+line('M77 107 L130 157 M323 107 L270 157 M66 212 L124 212 M334 212 L276 212',4,accent),'class="fx-charge"');
  art=group(sword,'class="fx-main fx-bolt" transform="rotate(23 200 210)"');if(power)art+=group(sword,'class="fx-secondary" transform="rotate(-40 200 210) scale(.8) translate(50 45)"');break;
 }
 case 'shuriken': {
  const blade=path('M200 45 L226 169 L354 210 L231 232 L191 365 L171 238 L37 200 L168 179Z',grad,`stroke="${accent}" stroke-width="4"`)+path('M200 45 L200 208 L354 210 L216 218 L191 365 L191 218 L37 200 L184 200Z','#fff','opacity=".55"')+circle(197,207,23,'#17233a',`stroke="${accent}" stroke-width="6"`);
  art=group(blade,'class="fx-main fx-spin"');if(power)back=group(group(blade,'transform="translate(-15 -20) scale(.45)"')+group(blade,'transform="translate(220 210) scale(.45)"'),'class="fx-secondary"');else back=group(ring,'class="fx-orbit"');break;
 }
 case 'spear': {
  back=group(line('M34 275 Q100 198 153 269 Q220 337 286 255 Q334 207 366 261',18,color)+line('M44 302 Q108 247 160 301 Q233 357 342 284',4,accent),'class="fx-trails"');
  art=group(path('M191 337 L191 185 Q124 188 123 123 L108 133 L127 78 L149 132 L133 124 Q134 167 191 165 L191 101 L174 113 L200 42 L226 113 L209 101 L209 165 Q266 167 267 124 L251 132 L273 78 L292 133 L277 123 Q276 188 209 185 L209 337Z',grad,`stroke="${accent}" stroke-width="3"`)+circle(200,183,14,accent),'class="fx-main fx-bolt"');
  if(power)front=group(circle(200,210,151,'none',`stroke="${accent}" stroke-width="5"`)+star(70,133,21)+star(330,133,21),'class="fx-impact"');break;
 }
 case 'chain': {
  const links=Array.from({length:7},(_,i)=>`<ellipse cx="${77+i*40}" cy="210" rx="30" ry="${i%2?13:22}" fill="none" stroke="${i%2?accent:color}" stroke-width="9"/>`).join('');
  back=group(ring,'class="fx-charge"');art=group(links,'class="fx-main fx-slash" transform="rotate(-32 200 210)"');
  front=group(star(200,210,46,accent),'class="fx-impact"');if(power)art+=group(links,'class="fx-secondary fx-slash-reverse" transform="rotate(38 200 210)"');break;
 }
 case 'tornado': {
  const swirl=line('M65 92 Q200 15 335 92 Q230 154 94 138 M79 162 Q200 110 320 165 Q244 214 112 211 M106 236 Q199 197 285 235 Q230 277 135 276 M142 294 Q200 271 248 298 L195 351',14,color)+line('M79 90 Q200 39 315 90 M95 165 Q200 131 302 165 M124 237 Q201 217 267 237 M154 294 Q202 283 233 299',4,accent);
  art=group(swirl,'class="fx-main fx-vortex"');if(power)back=group(path('M45 70 L355 135 L65 235 L309 311 L186 367 L237 309 L91 230 L317 134Z',accent),'class="fx-secondary" opacity=".35"');break;
 }
 case 'phoenix': {
  const bird=path('M201 170 Q175 121 171 76 L199 102 L220 76 L232 121 L214 171 Q266 110 362 77 L318 143 L352 139 L288 185 L315 189 L242 218 L226 218 L270 340 L211 284 L200 371 L185 284 L130 340 L174 219 L157 218 L85 189 L112 185 L48 139 L82 143 L38 77 Q137 110 201 170Z',grad,`stroke="${accent}" stroke-width="3"`)+path('M217 115 L245 127 L219 137Z',accent)+circle(212,114,4,'#562b39')+line('M78 108 L167 185 M320 108 L235 185',5,accent);
  art=group(bird,'class="fx-main fx-phoenix"');back=group(ring,'class="fx-flames"');if(power)front=group(star(55,218,27)+star(345,218,27)+star(200,38,23),'class="fx-impact"');break;
 }
 case 'rose': {
  const petals=Array.from({length:6},(_,i)=>group(path('M200 139 Q131 75 125 156 Q102 216 184 224 Q243 212 200 139Z',grad,`stroke="${accent}" stroke-width="2"`),`transform="rotate(${i*60} 200 174)"`)).join('');
  const stem=line('M203 219 Q224 285 178 352',10,'#7ac49a')+path('M212 287 Q258 239 289 265 Q260 310 212 287 M202 312 Q146 262 122 286 Q150 332 202 312Z','#65b58b');
  art=group(stem+petals+line('M190 171 Q173 148 204 143 Q230 146 220 170 Q201 194 186 178',5,accent),'class="fx-main fx-fan"');
  if(power)back=group(Array.from({length:6},(_,i)=>group(path('M200 38 Q236 50 214 85 Q182 82 200 38Z',color),`transform="rotate(${i*60} 200 210)"`)).join(''),'class="fx-orbit"');break;
 }
 case 'hammer': {
  const hammer=path('M185 208 L217 208 L217 337 Q202 356 185 337Z',power?'#9c78ed':'#e6b76a',`stroke="${accent}" stroke-width="4"`)+path('M95 114 Q200 70 305 114 L305 211 Q200 240 95 211Z',grad,`stroke="${accent}" stroke-width="4"`)+line('M119 110 L119 216 M142 103 L142 221 M165 98 L165 226 M235 98 L235 226 M258 103 L258 221 M281 110 L281 216',7,power?'#d09e36':'#d55379')+star(200,163,27,accent);
  art=group(hammer,'class="fx-main fx-fan" transform="rotate(24 200 210)"');front=group(star(84,281,35)+star(299,268,24),'class="fx-impact"');if(power)back=group(ring,'class="fx-charge"');break;
 }
 case 'rocket': {
  back=group(path('M158 274 L128 376 L198 329 L221 388 L242 276Z',grad)+path('M177 275 L168 340 L199 314 L222 350 L225 275Z',accent),'class="fx-flames"');
  const body=power?path('M150 116 Q149 92 172 92 L228 92 Q251 92 250 116 L250 283 L150 283Z','#f9f3ec',`stroke="${accent}" stroke-width="4"`)+path('M150 173 L250 173 L250 256 L150 256Z',color)+line('M168 194 L230 194 M168 210 L218 210',5,'#fff')+circle(177,143,5,'#2b536d')+circle(222,143,5,'#2b536d'):path('M155 142 L200 42 L245 142 L245 283 L155 283Z',grad,`stroke="${accent}" stroke-width="3"`)+path('M155 142 L200 42 L245 142Z','#e5bf92')+path('M184 77 L200 42 L216 77Z','#3e4058')+line('M181 147 L181 281 M219 147 L219 281',4,'#b18539');
  art=group(body+path('M153 222 L110 285 L153 273 M247 222 L290 285 L247 273',color),'class="fx-main fx-rice" transform="rotate(22 200 210)"');break;
 }
 case 'banana': {
  const banana=path('M115 91 Q121 256 300 250 L315 224 L334 231 L324 270 Q222 366 117 274 Q65 224 86 116Z',grad,`stroke="#aa7c32" stroke-width="5"`)+path('M112 116 Q112 279 303 270 Q209 326 137 265 Q91 220 112 116Z','#fff2a0')+path('M86 116 L84 87 L106 76 L116 96Z','#96753b')+circle(180,266,5,'#6b552f')+circle(224,282,5,'#6b552f')+line('M193 283 Q202 296 212 289',3,'#6b552f');
  art=group(banana,'class="fx-main fx-fan"');if(power)back=`<ellipse class="fx-orbit" cx="200" cy="220" rx="170" ry="54" fill="none" stroke="${accent}" stroke-width="9" transform="rotate(-25 200 220)"/>`+group(star(316,100,26),'class="fx-impact"');break;
 }
 case 'donut': {
  art=group(circle(200,210,108,'#c68a4e',`stroke="#f3c18c" stroke-width="5"`)+circle(200,202,98,color)+path('M109 221 Q128 250 144 228 Q159 259 178 237 Q198 263 219 236 Q237 258 254 229 Q271 251 292 221 L289 248 Q200 328 113 248Z','#d79959')+circle(200,204,39,power?'#17122f':'#17283b',`stroke="#f1bb7d" stroke-width="9"`)+line('M140 160 L152 169 M220 125 L229 141 M267 184 L280 193 M229 270 L239 259 M128 229 L139 224',8,accent)+line('M173 128 L164 139 M258 145 L247 155 M276 229 L267 241 M178 278 L185 265',7,power?'#f4a9cf':'#9a9af2'),'class="fx-main fx-spin"');
  if(power)back=group(ring+star(55,197,30)+star(343,214,26),'class="fx-orbit"');break;
 }
 case 'fish': {
  const fish=path('M265 162 L346 125 L326 207 L346 289 L265 249 Q138 324 68 207 Q138 90 265 162Z',grad,`stroke="${accent}" stroke-width="4"`)+path('M169 148 L202 98 L232 152 M169 264 L202 311 L232 262',color)+circle(117,191,11,'#314655')+circle(114,187,3,'#fff')+line('M151 163 Q183 207 151 253',4,power?'#bd843e':'#468eab')+line('M199 170 Q231 185 199 201 Q231 218 199 234 M239 184 Q259 198 239 213',3,power?'#bd843e':'#468eab');
  art=group(fish,'class="fx-main fx-cat" transform="rotate(-16 200 210)"');back=group(circle(73,126,15,color)+circle(54,280,22,color)+circle(313,85,12,color),'class="fx-sparks"');if(power)back+=group(ring,'class="fx-orbit"');break;
 }
 case 'dice': {
  const face=path('M113 103 L282 103 Q301 103 301 122 L301 291 Q301 310 282 310 L113 310 Q94 310 94 291 L94 122 Q94 103 113 103Z',grad,`stroke="${accent}" stroke-width="6"`);
  const dots=(power?[[144,154],[252,154],[144,207],[252,207],[144,260],[252,260]]:[[144,154],[252,260],[198,207]]).map(([x,y])=>circle(x,y,15,'#284d61')).join('');
  art=group(face+dots,'class="fx-main fx-spin" transform="rotate(15 200 210)"');if(power)front=group(star(59,135,29)+star(336,272,33)+star(304,68,20),'class="fx-impact"');break;
 }
 case 'clock': {
  back=group(ring,'class="fx-orbit"');
  const ticks=Array.from({length:12},(_,i)=>group(line('M200 109 L200 124',5,accent),`transform="rotate(${i*30} 200 210)"`)).join('');
  art=group(circle(200,210,112,'#142e46',`stroke="${color}" stroke-width="10"`)+ticks+line('M200 143 L200 210 L252 241',10,accent)+circle(200,210,11,color)+path('M184 68 L184 46 L216 46 L216 68Z',accent),'class="fx-main fx-vortex"');
  front=group(star(62,196,24)+star(333,224,27),'class="fx-impact"');break;
 }

 case 'beam': {
  back=group(ring,'class="fx-charge"')+group(line('M65 95 L335 95 M65 325 L335 325',2,accent),'class="fx-rings" opacity=".55"');
  const beams=path('M192 -20 L208 -20 L222 235 L200 302 L178 235Z',grad)+path('M198 -20 L202 -20 L209 235 L200 280 L191 235Z','#fff')+line('M158 10 L182 235 M242 10 L218 235',6,color)+line('M140 30 L170 235 M260 30 L230 235',2,accent);
  art=group(beams,`class="fx-main fx-beam" filter="${glow}"`);
  front=group(`<ellipse cx="200" cy="258" rx="116" ry="28" fill="none" stroke="${accent}" stroke-width="7"/>`+star(200,244,55), 'class="fx-impact"');
  if(power)back+=group(line('M65 15 L182 237 M335 15 L218 237',18,color)+line('M65 15 L182 237 M335 15 L218 237',4,'#fff'),'class="fx-secondary" opacity=".8"');
  break;
 }
 case 'slash': {
  const blade=path('M40 332 Q78 119 355 65 Q178 164 40 332Z',grad)+path('M40 332 Q110 162 355 65 Q155 182 40 332Z','#fff')+line('M55 344 Q155 210 350 92',3,accent);
  art=group(blade,`class="fx-main fx-slash" filter="${glow}"`)+group(blade,`class="fx-secondary fx-slash-reverse" transform="rotate(83 200 200)" opacity=".88"`);
  if(power)art+=group(blade,'class="fx-third" transform="rotate(155 200 200)" opacity=".7"');
  back=group(ring,'class="fx-charge" opacity=".4"');front=group(star(204,196,44), 'class="fx-impact"');break;
 }
 case 'thunder': {
  const wings=path('M195 183 Q131 86 32 65 L76 126 L50 133 L116 170 L90 181 L166 218 L200 247 L234 218 L310 181 L284 170 L350 133 L324 126 L368 65 Q269 86 205 183Z',grad,'stroke="'+accent+'" stroke-width="3"');
  const bolts=path('M225 -5 L142 162 L192 146 L158 258 L244 126 L198 142 L264 -5Z',grad)+line('M227 0 L169 145 L209 132 L182 221',5,'#fff')+line('M166 141 L96 126 L116 181 L65 198 M219 156 L290 129 L269 182 L331 204',6,color)+line('M192 205 L134 250 L159 268 L106 310',4,accent);
  art=group(bolts,`class="fx-main fx-bolt" filter="${glow}"`);back=group(wings,'class="fx-main fx-phoenix"')+group(ring,'class="fx-charge"');
  if(power)art+=group(bolts,'class="fx-secondary" transform="translate(-62 35) scale(.9)" opacity=".7"')+group(bolts,'class="fx-third" transform="translate(120 30) scale(.7)" opacity=".7"');
  front=group(star(200,240,52)+circle(200,240,72,'none',`stroke="${accent}" stroke-width="4"`),'class="fx-impact"');break;
 }
 case 'dragon': {
  back=group(path('M85 290 Q15 195 160 85 Q118 165 178 196 Q190 105 276 50 Q219 144 298 171 Q386 213 310 323 Q332 233 247 244 Q198 344 85 290Z',grad),'class="fx-flames" opacity=".65"');
  const head=path('M95 310 Q118 249 174 224 L146 185 L189 194 L205 139 L229 176 L260 119 L257 184 L305 206 L334 244 L301 266 L284 251 L238 259 L267 282 L309 276 L290 310 L229 304 L186 266 Q132 285 118 336Z',color,`stroke="${color}" stroke-width="7" stroke-linejoin="round"`)+path('M237 221 L280 222 L258 239Z',accent)+line('M230 215 L278 211',4,color)+path('M284 253 L290 273 L277 260 M304 261 L309 275 L297 268','#fff')+path('M157 246 L125 217 L172 227 M201 167 L184 125 L219 155',grad);
  art=group(head,`class="fx-main fx-dragon" filter="${glow}"`);
  front=group(path('M303 252 Q350 211 386 268 Q339 248 388 302 Q334 291 303 252Z',accent),'class="fx-secondary"');
  if(power)back+=group(line('M172 245 L70 100 L83 207 L22 192 L105 280 M235 216 L351 95 L321 179 L386 180 L287 258',6,color),'class="fx-wings"');break;
 }
 case 'void': {
  back=group(ring,'class="fx-orbit"');
  art=group(circle(200,210,92,color,'opacity=".35"')+circle(200,210,72,'#100e24',`stroke="${accent}" stroke-width="3"`)+`<ellipse cx="200" cy="210" rx="151" ry="48" fill="none" stroke="${color}" stroke-width="13" transform="rotate(-22 200 210)"/>`+`<ellipse cx="200" cy="210" rx="155" ry="43" fill="none" stroke="${accent}" stroke-width="4" transform="rotate(-22 200 210)"/>`+path('M132 210 Q200 262 268 210 Q258 286 200 284 Q145 280 132 210Z','#100e24'),`class="fx-main fx-vortex" filter="${glow}"`);
  front=group(star(80,142,14)+star(311,276,13)+star(274,90,8),'class="fx-sparks"');
  if(power)back+=group(path('M200 25 L210 86 L200 103 L190 86Z M200 395 L210 334 L200 317 L190 334Z M15 210 L76 200 L93 210 L76 220Z M385 210 L324 200 L307 210 L324 220Z',accent),'class="fx-impact"');break;
 }
 case 'ice': {
  const shard=path('M0 -102 L26 -36 L19 40 L0 80 L-19 40 L-26 -36Z',grad,`stroke="${accent}" stroke-width="2"`)+path('M0 -102 L0 80 L-19 40Z','#fff','opacity=".55"');
  art=group(group(shard,'transform="translate(200 198)"')+group(shard,'transform="translate(121 235) rotate(-33) scale(.73)"')+group(shard,'transform="translate(279 235) rotate(33) scale(.73)"'),`class="fx-main fx-ice" filter="${glow}"`);
  back=group(Array.from({length:6},(_,i)=>group(line('M200 68 L200 340 M200 87 L182 108 M200 87 L218 108',2,color),`transform="rotate(${i*60} 200 210)"`)).join(''),'class="fx-charge" opacity=".7"');
  if(power)art+=group(Array.from({length:8},(_,i)=>group(shard,`transform="translate(200 210) rotate(${i*45}) translate(0 -105) scale(.45)"`)).join(''),'class="fx-secondary"');break;
 }
 case 'pudding': {
  const pudding=path('M134 143 Q200 124 266 143 L295 267 Q200 302 105 267Z',grad,`stroke="#714629" stroke-width="5"`)+`<ellipse cx="200" cy="145" rx="67" ry="20" fill="#91502d" stroke="#714629" stroke-width="4"/>`+path('M139 145 Q154 173 166 151 Q182 180 193 151 Q207 174 223 150 Q244 172 261 147','#a65a2e')+circle(177,218,6,'#653d27')+circle(224,218,6,'#653d27')+line('M187 239 Q201 250 215 239',4,'#653d27')+circle(200,121,17,'#ff4b65',`stroke="#b92748" stroke-width="3"`)+line('M200 103 Q201 91 212 87',3,'#57935a');
  art=group(pudding,'class="fx-main fx-drop"');
  front=group(star(83,212,18)+star(322,234,14)+star(110,107,10),'class="fx-impact"');
  if(power)back=`<ellipse class="fx-orbit" cx="200" cy="214" rx="164" ry="45" fill="none" stroke="${accent}" stroke-width="10" transform="rotate(-18 200 214)"/>`+group(star(81,79,10)+star(326,102,13),'class="fx-sparks"');break;
 }
 case 'fan': {
  const fan=path('M125 119 L166 93 L187 104 L213 81 L235 104 L265 99 L286 132 L211 264 L179 252Z',accent,`stroke="${color}" stroke-width="5" stroke-linejoin="round"`)+line('M166 100 L191 247 M188 106 L196 248 M214 91 L201 250 M238 107 L207 253 M264 105 L211 253',3,color)+path('M178 251 L214 264 L191 322 Q176 334 160 319Z','#be8a52',`stroke="#936332" stroke-width="4"`);
  back=group(line('M48 125 L103 160 M35 177 L93 190 M43 230 L96 218',5,color),'class="fx-charge"');
  art=group(fan,'class="fx-main fx-fan" transform="rotate(27 200 210)"');
  if(power)art+=group(fan,'class="fx-secondary" transform="translate(-67 29) rotate(-25 200 210) scale(.82)"')+group(fan,'class="fx-third" transform="translate(124 10) rotate(48 200 210) scale(.7)"');
  front=group(star(134,220,40)+star(290,206,22,color),'class="fx-impact"');break;
 }
 case 'cat': {
  const cat=path('M-53 -12 L-55 -62 L-21 -42 Q0 -49 21 -42 L55 -62 L53 -12 Q65 44 0 52 Q-65 44 -53 -12Z',accent,`stroke="#69565f" stroke-width="4"`)+path('M-47 -45 L-44 -20 L-28 -33 M47 -45 L44 -20 L28 -33',color)+circle(-21,0,5,'#56414e')+circle(21,0,5,'#56414e')+path('M-6 12 L6 12 L0 18Z',color)+line('M0 18 Q-5 29 -14 23 M0 18 Q5 29 14 23',3,'#69565f')+line('M-35 12 L-65 8 M-35 22 L-65 28 M35 12 L65 8 M35 22 L65 28',2,'#69565f');
  if(power){art=group(circle(200,243,59,grad)+circle(139,167,28,color)+circle(180,135,28,color)+circle(226,135,28,color)+circle(266,173,28,color),'class="fx-main fx-paw"');front=group(star(92,243,28)+star(315,248,28),'class="fx-impact"');}
  else{back=group(line('M25 305 L134 181 M133 376 L242 252 M194 110 L283 21',14,color)+line('M25 305 L134 181 M133 376 L242 252',4,accent),'class="fx-trails" opacity=".7"');art=group(group(cat,'transform="translate(137 163) rotate(-20) scale(.75)"')+group(cat,'transform="translate(242 239) rotate(-20) scale(.9)"')+group(cat,'transform="translate(284 91) rotate(-20) scale(.48)"'),'class="fx-main fx-cat"');}break;
 }
 case 'rice': {
  const rice=path('M177 119 Q200 85 223 119 L302 250 Q318 284 280 287 L120 287 Q82 284 98 250Z',power?'#e9ac5f':'#fff9e9',`stroke="${power?'#a56433':'#bdb7a8'}" stroke-width="5"`)+path('M169 230 Q200 222 231 230 L231 287 L169 287Z',color)+circle(153,216,5,'#4d4d3b')+circle(247,216,5,'#4d4d3b')+path('M193 213 Q200 224 207 213','#c0735f')+line('M167 158 L174 163 M230 175 L236 180 M140 243 L146 247',3,power?'#f9d49a':'#ded7c4');
  back=group(path('M90 355 Q105 256 200 164 Q183 261 312 333 Q226 304 210 371 Q187 303 90 355Z',grad),'class="fx-trails" opacity=".7"');
  art=group(rice,'class="fx-main fx-rice" transform="rotate(-17 200 210)"');
  if(power)back+=group(ring+star(75,168,16)+star(320,122,18),'class="fx-orbit"');break;
 }
 default:art=group(star(200,210,100,color)+star(200,210,53,accent),'class="fx-main"');
 }
 const sparks=kind==='punch'?'':Array.from({length:power?18:12},(_,i)=>{const angle=i*Math.PI*2/(power?18:12);const r=132+(i%3)*12,x=200+Math.cos(angle)*r,y=210+Math.sin(angle)*r;return i%3?circle(x,y,2+i%3,accent):star(x,y,6,color);}).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" class="${icon?'hero-skill-icon':'attack-effect-art'}" aria-hidden="true"><defs><linearGradient id="${id}-blade" x1="0" y1="0" x2=".7" y2="1"><stop stop-color="${accent}"/><stop offset=".45" stop-color="${color}"/><stop offset="1" stop-color="${accent}"/></linearGradient><radialGradient id="${id}-halo"><stop stop-color="${color}" stop-opacity=".43"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></radialGradient><filter id="${id}-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>${kind==='punch'?'':`<circle class="fx-aura" cx="200" cy="210" r="180" fill="${halo}"/>`}${back}${art}${front}<g class="fx-sparks">${sparks}</g></svg>`;
}
function play(options,target=document.getElementById('sprite')){
 clear();options=options||{};if(options.ultimate)return !!root.FinisherEffects?.play(options,target);if(document.hidden||!target)return false;
 const rect=target.getBoundingClientRect();if(rect.width<1||rect.height<1)return false;
 const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 layer=document.createElement('div');layer.className='attack-effects hero-effect'+(reduced?' attack-effects-reduced':'');layer.setAttribute('aria-hidden','true');
 Object.assign(layer.style,{left:rect.left+'px',top:rect.top+'px',width:rect.width+'px',height:rect.height+'px'});
 layer.style.setProperty('--effect-color',safeColor(options.color,'#55d5e5'));
 layer.innerHTML=graphic(options);
 const name=document.createElement('div');name.className='fx-title';name.textContent=options.name||'ヒーローパンチ';layer.appendChild(name);
 (target.closest('dialog')||document.body).appendChild(layer);timer=root.setTimeout(clear,reduced?320:760);return true;
}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&!document.querySelector('.ultimate-stage'))clear();});
root.AttackEffects=Object.freeze({play,clear,icon:options=>options?.ultimate&&root.FinisherEffects?root.FinisherEffects.icon(options):graphic(options||{},true),durationMs:760});
})(window);
