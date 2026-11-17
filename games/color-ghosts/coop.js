import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, signInAnonymously, browserSessionPersistence, setPersistence } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getDatabase, ref, child, set, get, onValue, runTransaction, serverTimestamp, onDisconnect } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js';

const $ = id => document.getElementById(id);
const panel = $('coop-room');
const note = $('coop-note');
let login, session, busy = false;
async function account() {
  const response = await fetch('../firebase-room-test/firebase-config.json');
  if (!response.ok) throw Error('通信設定を読み込めません。');
  const app = initializeApp(await response.json());
  const auth = getAuth(app);
  await setPersistence(auth,browserSessionPersistence);
  await auth.authStateReady();
  const user = auth.currentUser || (await signInAnonymously(auth)).user;
  return { db:getDatabase(app), uid:user.uid };
}
function level(stage, count) {
  const raw = count * 2 + stage - 1;
  return { ghosts:Math.min(raw,12), seconds:Math.max(1,10-Math.max(0,raw-11)), colors:4 };
}
function nextNight(stage, count, misses, score, turn) {
  const difficulty = level(stage,count);
  return { stage,count,misses,score,turn,revision:0,phase:'night',since:serverTimestamp(),
    target:window.ghostBoard.pattern(difficulty).join(''),answer:'000000000000' };
}
function fail(e) {
  const msg = '通信を確認してね。' + (e.message || e.code || '');
  note.textContent = msg;
  if (!panel.open) $('hud-message').textContent = msg;
}
async function enter(create) {
  if (busy || session) return;
  let code = $('coop-code').value.normalize('NFKC').trim();
  if (!create && !/^\d{4}$/.test(code)) { note.textContent='4けたの番号を入れてね。'; return; }
  busy = true;
  $('coop-entry').disabled = true;
  note.textContent='接続しています…';
  try {
    login ??= account().catch(e=>{login=null;throw e;});
    const {db,uid} = await login;
    let room, seat;
    if (create) {
      for(let i=0;i<16;i++){
        code=String(crypto.getRandomValues(new Uint32Array(1))[0]%10000).padStart(4,'0');
        room=ref(db,'ghostRooms/'+code);
        try { await set(room,{created:serverTimestamp(),players:{0:uid}}); seat=0; break; }
        catch(e){if(!/permission/i.test(e.code))throw e;}
      }
    } else {
      room=ref(db,'ghostRooms/'+code);
      for(let i=1;i<5;i++){
        try { await set(child(room,'players/'+i),uid); seat=i; break; }
        catch(e){if(!/permission/i.test(e.code))throw e;}
      }
    }
    if(seat===undefined)throw Error(create?'部屋を作れませんでした。':'部屋番号を確認してね。満室・開始後の部屋には入れません。');
    const s=session={room,seat,uid,code,stops:[],offset:0,data:null,timer:0,connected:false};
    s.presence=child(room,'players/'+seat);
    s.disconnect=onDisconnect(s.presence);
    $('coop-entry').hidden=true;
    $('coop-number').textContent='部屋番号 '+code;
    s.stops.push(onValue(ref(db,'.info/serverTimeOffset'),snap=>{s.offset=snap.val()||0;}));
    s.stops.push(onValue(ref(db,'.info/connected'),async snap=>{
      if(session!==s)return;
      s.connected=snap.val()===true;
      if(s.connected) { try {await s.disconnect.remove();} catch(e){if(session===s)fail(e);} }
      else note.textContent='接続を確認しています…';
    }));
    s.stops.push(onValue(room,snap=>{if(session===s){s.data=snap.val();render(s);}},e=>{
      if(session===s)leave('部屋との接続が終了しました。');
    }));
  } catch(e){fail(e);}
  finally {busy=false;$('coop-entry').disabled=false;}
}
function leave(message='') {
  const s=session;
  session=null;
  if(s){
    clearTimeout(s.timer);
    s.stops.forEach(stop=>stop());
    set(s.presence,null).then(()=>s.disconnect.cancel()).catch(()=>{});
  }
  panel.close(); window.ghostBoard.home();
  if(message){open();note.textContent=message;}
}
function open(){
  $('coop-entry').hidden=false;$('coop-start').hidden=true;$('coop-number').textContent='';
  note.textContent='同じ部屋に入ってから、みんなでスタートしてね。';
  if(!panel.open)panel.showModal();
}
function change(s,update) {
  if(!s.connected)return;
  return runTransaction(child(s.room,'game'),update,{applyLocally:false}).catch(e=>{if(session===s)fail(e);});
}
function later(s,at,callback) {
  s.timer=setTimeout(()=>{if(session===s)callback();},Math.max(0,at-Date.now()-s.offset)+20);
}
function render(s) {
  clearTimeout(s.timer);
  const data=s.data;
  if(data?.players?.[s.seat]!==s.uid){leave('部屋との接続が終了しました。');return;}
  const count=Object.values(data.players).length;
  const g=data.game;
  if(!g){
    note.textContent=count+'人が参加中（最大5人）';
    $('coop-start').hidden=false;return;
  }
  panel.close();
  if(g.phase==='over'){window.ghostBoard.result(g);return;}
  if(count!==g.count){leave('仲間が退出したため協力プレイを終了しました。');return;}
  const difficulty=level(g.stage,g.count);
  const end=g.since+difficulty.seconds*1000;
  const phase=g.phase==='night' && Date.now()+s.offset>=end?'answer':g.phase;
  window.ghostBoard.draw(g,difficulty,phase,Math.max(0,end-Date.now()-s.offset),s.seat);
  if(phase==='night')later(s,end,()=>render(s));
  if(phase==='success'||phase==='review')later(s,g.since+3000,()=>change(s,current=>{
    if(!current||current.turn!==g.turn||current.phase!==phase)return;
    if(current.misses>3)return {...current,phase:'over'};
    return nextNight(current.stage+Number(phase==='success'),current.count,current.misses,current.score,current.turn+1);
  }));
}
function edit(index,color,source) {
  const s=session,g=s?.data?.game;
  if(!g)return;
  const expected=g.answer[index];
  change(s,current=>{
    if(!current||current.turn!==g.turn||current.phase!=='night'||current.answer[index]!==expected)return;
    const a=current.answer.split(''),value=String(color);
    if(source!=null){
      if(source===index||a[source]!==value||a[index]===value)return;
      a[source]=a[index];
    }else if(a[index]===value || (color && a.filter(x=>x===value).length>=current.target.split('').filter(x=>x===value).length))return;
    a[index]=value;
    return {...current,answer:a.join(''),revision:current.revision+1,votes:null};
  });
}
function vote(){
  const s=session,g=s?.data?.game;
  if(!g)return;
  change(s,current=>{
    if(!current||current.turn!==g.turn||current.phase!=='night'||current.revision!==g.revision||
        current.votes?.[s.seat]||current.answer.replaceAll('0','').length!==level(g.stage,g.count).ghosts)return;
    const votes={...current.votes,[s.seat]:true};
    if(Object.keys(votes).length<current.count)return {...current,votes};
    const correct=current.answer===current.target;
    return {...current,votes,phase:correct?'success':'review',since:serverTimestamp(),
      score:current.score+(correct?level(g.stage,g.count).ghosts:0),misses:current.misses+Number(!correct)};
  });
}
$('coop-create').onclick=()=>enter(true);
$('coop-join').onclick=()=>enter(false);
$('coop-start').onclick=()=>{
  const s=session;if(!s?.data)return;
  const count=Object.values(s.data.players).length;
  change(s,g=>g?undefined:nextNight(1,count,0,0,1));
};
$('coop-back').onclick=()=>{if(!busy)leave();};
panel.oncancel=e=>{e.preventDefault();if(!busy)leave();};
export {open,leave,edit,vote};
