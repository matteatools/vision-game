import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, setPersistence, browserSessionPersistence, signInAnonymously } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getDatabase, ref, child, get, set, onValue, onDisconnect, serverTimestamp, runTransaction } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js';
import { MATCH_MS, COUNTDOWN_MS, makeSchedule, tally } from './match.js';

const $ = id => document.getElementById(id);
const dialog = $('harvest-room');
const note = $('harvest-note');
const storageKey = 'pyoko-harvest:online';
let client, session, entering = false;
async function initialize() {
  const response = await fetch('../firebase-room-test/firebase-config.json');
  if (!response.ok) throw Error('通信設定を読み込めません。');
  const app = initializeApp(await response.json(), 'harvest');
  const auth = getAuth(app);
  await setPersistence(auth,browserSessionPersistence);
  await auth.authStateReady();
  const user = auth.currentUser || (await signInAnonymously(auth)).user;
  return {db:getDatabase(app),uid:user.uid};
}
function showMessage(text) {
  note.textContent = text;
  window.harvestBoard.message(text);
}
function now(s) { return Date.now()+s.offset; }
function startTime(s) { return s.data?.guest?.at+COUNTDOWN_MS; }
function save(s) {
  sessionStorage.setItem(storageKey,JSON.stringify({code:s.code,token:s.token,seat:s.seat}));
}
export function open() {
  $('harvest-entry').hidden=false;
  $('harvest-number').textContent='';
  note.textContent='1台目で畑を選んで部屋を作り、2台目に番号を伝えてね。';
  if(!dialog.open)dialog.showModal();
}
function closeSession(s) {
  clearInterval(s.timer);
  s.stops.forEach(stop=>stop());
  s.disconnect?.cancel().catch(()=>{});
  set(child(s.room,'online/'+s.seat),false).catch(()=>{});
  if(session===s)session=null;
}
async function enter(create, resume) {
  if(entering||session)return;
  let code=resume?.code || $('harvest-code').value.normalize('NFKC').trim();
  if(!create&&!/^\d{4}$/.test(code)){showMessage('4けたの番号を入れてね。');return;}
  entering=true;
  $('harvest-entry').disabled=true;
  showMessage('接続しています…');
  let s;
  try {
    client ??= initialize().catch(e=>{client=null;throw e;});
    const {db,uid}=await client;
    const token=resume?.token || crypto.randomUUID();
    let room, seat=resume?.seat;
    if(resume) room=ref(db,'harvestRooms/'+code);
    else if(create) {
      const size=Number($('harvest-size').value);
      const schedule=makeSchedule(size);
      for(let attempt=0;attempt<16;attempt++){
        code=String(crypto.getRandomValues(new Uint32Array(1))[0]%10000).padStart(4,'0');
        room=ref(db,'harvestRooms/'+code);
        try {
          await set(room,{created:serverTimestamp(),size,schedule,host:{uid,token}});
          seat=0;break;
        } catch(e){if(!/permission/i.test(e.code))throw e;}
      }
      if(seat===undefined)throw Error('部屋を作れませんでした。もう一度試してね。');
    } else {
      room=ref(db,'harvestRooms/'+code);
      try{await set(child(room,'guest'),{uid,token,at:serverTimestamp()});seat=1;}
      catch(e){if(/permission/i.test(e.code))throw Error('番号を確認してね。満室・終了した部屋には入れません。');throw e;}
    }
    const data=(await get(room)).val();
    if(data?.[seat===0?'host':'guest']?.uid!==uid || data?.[seat===0?'host':'guest']?.token!==token)
      throw Error('この部屋には入り直せません。新しい部屋に入ってね。');
    s=session={room,uid,token,seat,code,data,offset:0,connected:false,stops:[],timer:null,pending:null,finished:false,shown:false,finalizing:false};
    save(s);
    $('harvest-entry').hidden=true;
    $('harvest-number').textContent='部屋番号 '+code;
    s.stops.push(onValue(ref(db,'.info/serverTimeOffset'),snap=>{s.offset=snap.val()||0;}));
    const presence=child(room,'online/'+seat);
    s.disconnect=onDisconnect(presence);
    s.stops.push(onValue(ref(db,'.info/connected'),async snap=>{
      if(session!==s)return;
      s.connected=false;
      if(!snap.val())return;
      try{
        await s.disconnect.set(false);
        if(session!==s)return;
        await set(presence,true);
        if(session===s)s.connected=true;
      }catch(e){if(session===s)showMessage('接続の確認に失敗しました。'+(e.code||''));}
    }));
    s.stops.push(onValue(room,snap=>{
      if(session!==s)return;
      s.data=snap.val();
      if(!s.data){showMessage('部屋が終了しました。入口へ戻ってね。');return;}
      render(s);
    },e=>{if(session===s){s.connected=false;showMessage('部屋を読み込めません。'+(e.code||''));}}));
    s.timer=setInterval(()=>render(s),50);
    render(s);
  }catch(e){
    if(s)closeSession(s);
    if(resume)sessionStorage.removeItem(storageKey);
    showMessage(e.message || '通信を確認してね。');
  }finally{entering=false;$('harvest-entry').disabled=false;}
}
function finish(s) {
  if(s.finalizing || !s.connected)return;
  s.finalizing=true;
  get(s.room).then(snap=>{
    if(session!==s)return;
    s.data=snap.val();
    if(!s.data)throw Error('部屋が終了しました。');
    s.finished=true;
    clearInterval(s.timer);
    sessionStorage.removeItem(storageKey);
    const scores=tally(s.data.schedule,s.data.claims);
    const winner=s.data.forfeit!=null?1-s.data.forfeit:scores[0]===scores[1]?null:scores[0]>scores[1]?0:1;
    window.harvestBoard.result(scores,s.seat,winner,s.data.forfeit!=null);
    closeSession(s);
  }).catch(()=>{if(session===s){s.finalizing=false;showMessage('結果の通信を確認しています…');}});
}
function render(s) {
  if(session!==s||s.finished||!s.data)return;
  const data=s.data;
  if(!data.guest && data.forfeit!=null){showMessage('この部屋は終了しました。');return;}
  if(!data.guest){
    note.textContent=s.connected?'相手の入室を待っています。':'接続を確認しています…';
    return;
  }
  if(!s.shown){
    dialog.close();window.harvestBoard.begin(data.size);s.shown=true;
  }
  const elapsed=now(s)-startTime(s);
  if(data.forfeit!=null||elapsed>=MATCH_MS){
    window.harvestBoard.frame({scores:tally(data.schedule,data.claims),seat:s.seat,left:0,event:null,locked:true,countdown:0,message:'結果を確認しています…'});
    finish(s);return;
  }
  const active=Object.entries(data.schedule).find(([,e])=>e.at<=elapsed&&elapsed<e.until);
  const event=active&&!data.claims?.[active[0]]?{...active[1],id:active[0]}:null;
  const message=!s.connected?'通信を確認しています…':data.online?.[1-s.seat]===false?'相手の接続を待っています。':elapsed<0?'もうすぐスタート！':'おやさいは 早い者勝ち！';
  window.harvestBoard.frame({scores:tally(data.schedule,data.claims),seat:s.seat,left:Math.ceil((MATCH_MS-Math.max(0,elapsed))/1000),event,
    locked:!s.connected||s.pending!==null||elapsed<0,countdown:elapsed<0?Math.ceil(-elapsed/1000):0,message});
}
export async function hit(index,id) {
  const s=session;
  if(!s||s.pending!==null||!s.connected)return;
  const event=s.data.schedule[id],elapsed=now(s)-startTime(s);
  if(!event||event.hole!==index||elapsed<event.at||elapsed>=event.until||elapsed>=MATCH_MS||s.data.claims?.[id])return;
  s.pending=id;
  render(s);
  try {
    const result = await runTransaction(child(s.room,'claims/'+id), current =>
      current == null ? {seat:s.seat,at:serverTimestamp()} : undefined, {applyLocally:false});
    if(session===s) {
      const message=result.committed ? (event.type==='rabbit'?'やさいうさぎ × −1':'しゅうかく！') : 'あと一歩！';
      window.harvestBoard.feedback(message,result.committed && event.type==='rabbit');
    }
  }catch(e){
    if(session===s){
      if(/permission/i.test(e.code))window.harvestBoard.feedback('あと一歩！',false);
      else showMessage('送信を確認しています…');
    }
  }finally{if(session===s){s.pending=null;render(s);}}
}
export async function leave() {
  if(entering)return;
  const s=session;
  if(s && !s.finished){
    try {
      if(!s.data.guest || now(s)<startTime(s)+MATCH_MS)await set(child(s.room,'forfeit'),s.seat);
    }catch(e){
      if(!/permission/i.test(e.code)){showMessage('退出を送っています。接続が戻ってからもう一度押してね。');return;}
    }
    closeSession(s);
  }
  sessionStorage.removeItem(storageKey);dialog.close();window.harvestBoard.home();
}
$('harvest-create').onclick=()=>enter(true);
$('harvest-join').onsubmit=e=>{e.preventDefault();enter(false);};
$('harvest-back').onclick=leave;
dialog.oncancel=e=>{e.preventDefault();leave();};
export async function resume() {
  let saved;
  try{saved=JSON.parse(sessionStorage.getItem(storageKey));}catch{}
  if(saved){open();await enter(false,saved);}
}
