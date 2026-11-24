import {createDuel} from '../puzzle-duels/duel.js';
const bridge=window.magicGemsOnline;
const root=document.getElementById('root');
const host=document.createElement('div');host.className='duel-gems';host.hidden=true;document.body.append(host);
let answer,question,locked=true;
let audio;
function sound(kind){try{audio??=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});const osc=audio.createOscillator(),gain=audio.createGain();osc.connect(gain);gain.connect(audio.destination);osc.frequency.value=kind==='wrong'?150:kind==='win'?880:587;gain.gain.setValueAtTime(.12,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.25);osc.start();osc.stop(audio.currentTime+.26);osc.onended=()=>{osc.disconnect();gain.disconnect();};}catch{}}
const paint=()=>{if(question)bridge.mount(host,question,value=>answer(value),locked);};
const duel=createDuel({game:'gems',levels:[[3,'みならい（3こ）'],[4,'かけだし（4こ）'],[6,'うできき（6こ）'],[8,'でんせつ（8こ）']],ids:bridge.gems.map(g=>g.id),instruction:'おなじ まほうせきを みつけよう！ 早い者勝ち！',
 bind(fn){answer=fn;},begin(){root.hidden=true;host.hidden=false;question=null;},question(value){question=value;paint();},lock(value){if(locked!==value){locked=value;paint();}},
 feedback(){sound('correct');},wrong(){sound('wrong');},end(){locked=true;paint();sound('win');},home(){host.hidden=true;root.hidden=false;bridge.clear();question=null;}
});
// React replaces the title when returning from solo games. Install one entry
// button each time without changing React's existing children.
function entry(){const menu=root.querySelector('.title-layout');if(!menu||menu.querySelector('#gems-online'))return;const button=document.createElement('button');button.id='gems-online';button.textContent='オンラインでたいせん';button.className='magic-music-toggle';button.style.cssText='position:relative;z-index:10;background:#a9304e;color:white;border:2px solid #ffe4a3;border-radius:16px;padding:12px 24px;font-size:20px;font-weight:bold;margin:12px';button.onclick=duel.open;(menu.querySelector('.title-vessel-actions')||menu.lastElementChild).after(button);}
new MutationObserver(entry).observe(root,{childList:true,subtree:true});entry();duel.resume();
