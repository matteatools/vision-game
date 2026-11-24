// One local music player for every screen: no overlapping tracks or network services.
window.GameMusic=(()=>{
 'use strict';
 const tracks={base:'sounds/bgm/base.mp3',battle:'sounds/bgm/battle.mp3',skills:'sounds/bgm/skills.mp3'};
 const mix={base:.32,battle:.30,skills:.34};
 const player=new Audio();player.preload='none';player.loop=true;player.volume=0;
 player.dataset.bgm='true';
 let activated=false,current=null,pending=false,token=0,fade=0,level=0,pageHidden=false;
 const el=id=>document.getElementById(id);
 function scene(){
  if(el('effectDialog')?.open)return 'skills';
  const screen=document.body.dataset.screen;
  if(screen==='play')return 'battle';
  return screen==='home'?'base':null;
 }
 function pause(){
  token++;pending=false;cancelAnimationFrame(fade);fade=0;
  player.pause();player.volume=0;
 }
 function fadeIn(){
  cancelAnimationFrame(fade);const started=performance.now();
  const step=now=>{
   const amount=Math.max(0,Math.min(1,(now-started)/350));player.volume=level*amount;
   fade=amount<1?requestAnimationFrame(step):0;
  };
  fade=requestAnimationFrame(step);
 }
 function sync(){
  const next=scene(),{muted,volume}=GameSound.settings();
  if(next!==current){pause();player.currentTime=0;current=next;}
  const battlePaused=document.body.dataset.screen==='play'&&el('play')?.classList.contains('manual-paused');
  const suspended=document.hidden||pageHidden||el('flashTrainingDialog')?.open||battlePaused;
  if(!activated||!current||muted||volume===0||suspended){pause();return;}
  level=volume*mix[current];
  if(player.getAttribute('src')!==tracks[current]){
   player.src=tracks[current];player.preload='auto';
  }
  if(!player.paused||pending){if(!fade&&!pending)player.volume=level;return;}
  const attempt=++token;pending=true;player.volume=0;
  try{
   Promise.resolve(player.play()).then(()=>{
    if(attempt!==token)return;
    pending=false;fadeIn();
   },()=>{if(attempt===token)pending=false;});
  }catch{if(attempt===token)pending=false;}
 }
 function unlock(){activated=true;sync();}
 // Keep retries inside real gestures if the browser initially rejects playback.
 for(const event of ['pointerdown','keydown'])document.addEventListener(event,e=>{if(e.isTrusted)unlock();},{capture:true});
 document.addEventListener('visibilitychange',sync);
 window.addEventListener('pagehide',()=>{pageHidden=true;pause();});
 window.addEventListener('pageshow',()=>{pageHidden=false;sync();});
 return {sync,unlock};
})();
