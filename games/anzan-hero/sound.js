// Local WAV effects; music.js shares these persisted mute/volume preferences.
const GameSound=(()=>{
 let muted=false,volume=.45;const voices={},tokens={},SAVE_KEY='monster-math-sound-v1';
 try{const saved=JSON.parse(localStorage.getItem(SAVE_KEY)||'null');if(saved&&typeof saved.muted==='boolean')muted=saved.muted;if(saved&&typeof saved.volume==='number'&&Number.isFinite(saved.volume))volume=Math.max(0,Math.min(1,saved.volume));}catch{}
 function save(){try{localStorage.setItem(SAVE_KEY,JSON.stringify({muted,volume}));}catch{}}
 function syncControls(){document.querySelectorAll('.sound-toggle').forEach(b=>{b.textContent=muted?'おと：オフ':'おと：オン';b.setAttribute('aria-pressed',String(!muted));});document.querySelectorAll('.offline-sound-controls input[type=range]').forEach(input=>input.value=String(Math.round(volume*100)));}
 const sources={attack:'sounds/hero/hero-punch.wav',shield:'sounds/shield.wav',victory:'sounds/victory.wav',gacha:'sounds/hero/gacha.wav'};
 for(const effect of GameModel.effects)sources['skill:'+effect.sound]='sounds/hero/'+effect.sound+'.wav';
 for(const [name,source] of Object.entries(sources)){const a=new Audio(source);a.preload='auto';a.volume=volume;voices[name]=a;tokens[name]=0;}
 function play(name){if(muted)return Promise.resolve(false);const a=voices[name];if(!a)return Promise.resolve(false);tokens[name]++;a.muted=false;a.currentTime=0;a.volume=volume;try{return Promise.resolve(a.play()).then(()=>true,()=>false);}catch{return Promise.resolve(false);}}
 let testToken=0;
 async function test(){const token=++testToken,status=document.getElementById('soundStatus');if(muted){status.textContent='おとが オフだよ。「おと：オフ」を おしてね。';return;}if(volume===0){status.textContent='おとの おおきさを あげてから、ためしてね。';return;}status.textContent='おとを ためしているよ…';const ok=await play('attack');if(token!==testToken)return;status.textContent=muted?'おとを オフに したよ。':ok?'おとが でたよ。きこえないときは、パソコンや タブレットの おとも みてね。':'もういちど「おとを ためす」を おしてね。';}
 // Unlock during the user's start/retry tap. A later real effect is never paused
 // by a delayed unlock promise, and unlock never clears the user's mute choice.
 function unlock(){if(muted)return;for(const [name,a] of Object.entries(voices)){const token=++tokens[name];a.muted=true;const p=a.play();if(p)p.then(()=>{if(tokens[name]!==token)return;a.pause();a.currentTime=0;a.muted=muted;}).catch(()=>{if(tokens[name]===token)a.muted=muted;});}}
 function toggle(){muted=!muted;for(const [name,a] of Object.entries(voices)){tokens[name]++;a.muted=muted;if(muted)a.pause();}syncControls();save();window.GameMusic?.sync();}
 function setVolume(v){const n=Number(v);if(!Number.isFinite(n))return;volume=Math.max(0,Math.min(1,n/100));for(const a of Object.values(voices))a.volume=volume;save();window.GameMusic?.sync();}
 function stopEffects(){for(const [name,a] of Object.entries(voices))if(name==='attack'||name.startsWith('skill:')){tokens[name]++;a.pause();a.currentTime=0;}}
 function playEffect(effect){stopEffects();return play(effect?.sound?'skill:'+effect.sound:'attack');}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stopEffects();});
 return {play,playEffect,stopEffects,unlock,toggle,setVolume,test,syncControls,settings:()=>({muted,volume})};
})();
