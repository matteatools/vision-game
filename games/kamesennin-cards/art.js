const Art={
serial:0,
sticker(id){
const palettes=[['#fff79a','#ffbc2e','#f06b18'],['#c8ffff','#25dbed','#3155db'],['#fff5ff','#cf93ff','#6a39cb'],['#ddffd5','#5fdbb6','#197e8e'],['#fff6cd','#fb8db9','#a449a5'],['#e8ffff','#86b9ff','#5752b8'],['#fff5d0','#ff9454','#cf355e'],['#dbffff','#62e3e1','#248ca9'],['#f5eaff','#b39aff','#6542c0'],['#fffacf','#f3ce5f','#b8792a']];
const [light,mid,dark]=(id===18?['#edffbf','#7add9e','#218579']:id===29?['#fff0a4','#f3a4d8','#7778df']:palettes[id%10]),u=`st${++this.serial}`,g=`url(#${u}g)`,r=`url(#${u}r)`;
const p=(d,fill=g,extra='')=>`<path d="${d}" fill="${fill}" ${extra}/>`;
const c=(x,y,radius,fill=r)=>`<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}"/>`;
const line=(d,color=light,w=2)=>p(d,'none',`stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`);
const shine=(x,y,s=1)=>`<path d="M${x} ${y-5*s}Q${x} ${y} ${x+4*s} ${y}Q${x} ${y} ${x} ${y+5*s}Q${x} ${y} ${x-4*s} ${y}Q${x} ${y} ${x} ${y-5*s}" fill="#fff"/>`;
const magatama=(fill=g)=>p('M47 9C22-1 4 21 12 40C19 57 46 59 54 37C43 47 27 38 35 29C44 33 56 20 47 9Z',fill)+c(40,17,4,'#effff6');
const shapes=[
()=>p('M36 5L12 35H29L23 59L53 24H36L43 5Z')+line('M33 13L21 29H34L30 42'),
()=>p('M32 5L37 24L53 12L43 28L59 32L42 37L52 53L36 43L32 59L27 41L11 52L22 36L5 31L23 27L13 11L28 23Z')+c(32,32,7)+shine(32,32),
()=>c(32,33,23)+c(25,24,10,'#ffffff55')+shine(22,21,1.5)+line('M22 49Q41 57 50 38','#d5b8ff',3)+c(47,12,3,light),
()=>magatama()+line('M22 17Q12 31 23 42','#c4ffe4',3)+shine(43,42,.8),
()=>p('M32 4Q35 26 58 32Q35 37 32 60Q27 37 5 32Q28 26 32 4')+p('M32 14L35 30L48 32L34 35L32 49L29 34L16 32L29 29Z',light)+shine(51,12),
()=>p('M32 5L51 21L47 45L32 59L14 43L12 20Z')+p('M32 5L23 25L32 59L41 25Z',light)+line('M12 20L23 25L41 25L51 21M14 43L23 25M47 45L41 25',mid),
()=>p('M39 4C43 24 59 29 52 46C45 64 17 62 11 44C7 30 22 26 20 15C29 18 29 27 30 30C39 22 32 13 39 4Z')+p('M34 28C36 39 46 41 40 50C31 60 20 48 25 40C25 47 33 44 34 28Z',light),
()=>`<ellipse cx="32" cy="33" rx="25" ry="18" fill="${g}"/>`+`<ellipse cx="32" cy="33" rx="17" ry="10" fill="#efffff"/>`+`<ellipse cx="32" cy="33" rx="11" ry="6" fill="${r}"/>`+line('M12 27Q28 12 49 25',light,3)+shine(49,15),
()=>p('M31 6C2 6 1 46 28 48C49 50 50 21 32 20C21 19 20 34 30 35C23 23 43 26 37 38C25 55 3 31 19 17C35 3 64 27 49 48C43 57 30 59 21 55C55 72 78 15 40 7Z')+shine(17,18),
()=>p('M32 5L55 18V45L32 59L9 45V18Z')+p('M32 12L48 22V41L32 51L16 41V22Z',dark)+p('M34 17L22 34H32L28 47L43 28H33Z',light),
()=>p('M8 48L37 10L32 31L57 17L38 43L16 56Z')+c(21,43,11)+shine(20,41)+line('M15 28L27 13M39 52L53 39',mid,3),
()=>c(32,32,16)+`<ellipse cx="32" cy="32" rx="29" ry="9" transform="rotate(-30 32 32)" fill="none" stroke="${mid}" stroke-width="5"/>`+shine(25,24)+c(51,15,4,light),
()=>c(24,35,18)+c(42,25,14)+c(43,48,7)+shine(19,28)+shine(39,20,.8)+c(17,10,3,mid),
()=>`<g transform="translate(-1 0) scale(.82)">${magatama()}</g><g transform="translate(65 64) rotate(180) scale(.7)">${magatama(r)}</g>`,
()=>p('M32 7C20 0 13 17 17 23C-1 20-2 45 17 45C13 61 36 66 39 49C53 59 66 39 50 31C64 15 43 1 36 18Z')+c(31,32,11)+shine(28,28)+c(52,51,3,light),
()=>p('M23 5L8 31H22L16 52L38 25H25L33 5Z')+p('M47 13L30 39H42L35 59L58 31H46L55 13Z',r)+shine(44,18),
()=>p('M32 4L39 24L59 21L43 35L53 54L33 44L15 59L20 38L4 25L25 24Z')+p('M32 18L35 29L47 29L37 36L41 46L31 39L22 46L25 35L16 29L28 29Z',light)+c(53,10,3,mid),
()=>c(32,32,24)+p('M10 30Q23 44 37 17Q43 9 53 26Q43 20 37 40Q22 58 10 30',mid)+shine(21,19)+line('M20 48Q38 58 49 41',light,2),
()=>magatama()+p('M20 29L27 32L24 39L17 36Z',light)+line('M25 46Q39 53 48 42',light,2)+shine(22,15),
()=>p('M8 27Q17 14 29 25Q38 39 56 18L51 37Q40 51 27 38Q18 28 7 43Z')+line('M12 27Q22 21 31 31Q41 41 52 28',light,3)+shine(18,13)+shine(47,48),
()=>p('M32 4L38 22L56 14L45 31L60 39L40 42L35 60L27 43L9 53L17 35L3 25L24 23Z')+p('M32 18L37 30L46 34L35 38L31 48L27 36L17 30L28 28Z',light),
()=>p('M30 8Q53 14 52 37Q40 60 14 52Q31 48 30 32Q28 21 13 22Q18 10 30 8Z')+p('M32 18Q44 26 40 39Q31 51 20 49Q41 47 35 31Z',light)+shine(48,10),
()=>p('M15 20L28 7L38 21L34 48L22 57L10 43Z')+p('M37 27L49 15L57 29L49 52L34 57Z',r)+line('M28 7L24 26L22 57M15 20L24 26L38 21M49 15L43 34L49 52',light,2),
()=>c(32,32,23)+c(32,32,17,dark)+p('M32 11L37 27L53 32L37 37L32 53L27 37L11 32L27 27Z')+c(32,32,5,light)+shine(13,12),
()=>p('M11 18C15 3 34 6 33 20C39 5 60 12 56 28C52 42 35 42 32 58C29 42 8 36 11 18Z')+p('M18 17Q24 10 28 19Q28 27 23 32Q16 25 18 17Z',light)+shine(45,22),
()=>p('M8 47L45 8L38 30L57 22L25 56L31 36Z')+line('M17 44L34 26',light,3)+c(12,16,4,mid)+shine(48,49),
()=>p('M32 5L38 24L56 17L43 32L57 46L38 40L32 59L26 40L7 46L21 32L8 17L26 24Z')+c(32,32,10)+shine(32,32,1.5),
()=>c(32,32,22)+p('M14 31Q32 4 50 31Q31 17 14 31',light)+p('M13 36Q32 60 51 34Q36 43 13 36',mid)+c(30,32,8,'#ffffffcc')+shine(27,27)+c(53,10,3,mid),
()=>`<g transform="translate(32 32)">${[0,120,240].map(a=>`<g transform="rotate(${a})">${p('M0-4C-26-4-24-29-7-26C5-25 8-12 0-4Z')+c(-10,-18,3,light)}</g>`).join('')}</g>`+c(32,32,4,light),
()=>p('M9 21L20 10L32 17L44 10L55 21L49 43L32 58L15 43Z')+p('M20 10L25 29L32 58L39 29L44 10L32 17Z',light)+line('M9 21L25 29L39 29L55 21M15 43L25 29M49 43L39 29',mid,2)+shine(50,9)
];
if(!shapes[id])return '';
return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="${u}g" x1=".15" y1="0" x2=".8" y2="1"><stop stop-color="${light}"/><stop offset=".43" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></linearGradient><radialGradient id="${u}r" cx=".32" cy=".25" r=".8"><stop stop-color="#fff"/><stop offset=".22" stop-color="${light}"/><stop offset=".6" stop-color="${mid}"/><stop offset="1" stop-color="${dark}"/></radialGradient><filter id="${u}o" x="-25%" y="-25%" width="150%" height="150%"><feMorphology in="SourceAlpha" operator="dilate" radius="1.6" result="edge"/><feFlood flood-color="#fff"/><feComposite in2="edge" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><g filter="url(#${u}o)">${shapes[id]()}</g></svg>`;
},
turtle(){return '<img class="turtle-shell-art" src="assets/turtle-shell-back.png" alt="りったいてきな こうらの かめせんにん" draggable="false" width="360" height="410">';}
};
