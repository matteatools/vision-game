import {initializeApp} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import {getAuth,setPersistence,browserSessionPersistence,signInAnonymously} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import {getDatabase,ref,child,get,set,onValue,onDisconnect,serverTimestamp,runTransaction} from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js';
import {DURATIONS,makeQuestions,initialState,transition} from './model.js';

export function createDuel(adapter) {
  const game=adapter.game,duration=DURATIONS[game],key='puzzle-duel:'+game;
  let client,session,entering=false;
  const style=document.createElement('style');style.textContent=`
  .duel-dialog{border:3px solid #8c2942;border-radius:22px;padding:24px;background:#fff9ef;color:#352c35;max-width:520px;width:calc(100% - 30px);font:700 18px/1.6 sans-serif;box-sizing:border-box;max-height:90dvh;overflow:auto}
  .duel-dialog::backdrop{background:#211829a8}.duel-dialog h2{font-size:26px;margin:0 0 14px}.duel-dialog p{margin:10px 0}.duel-dialog button,.duel-dialog input,.duel-dialog select{font:inherit;border:2px solid #997b78;border-radius:12px;padding:10px;margin:5px 0;max-width:100%;box-sizing:border-box}.duel-dialog button{cursor:pointer;background:#a9304e;color:white}.duel-dialog button:disabled{opacity:.5}.duel-dialog input{width:150px;background:white;color:#222}.duel-dialog select{background:white;color:#222}.duel-dialog fieldset{border:0;padding:0;margin:0}.duel-dialog legend{font-size:16px}.duel-dialog .duel-code{font:800 40px monospace;letter-spacing:8px;color:#842539}.duel-hud{position:fixed;z-index:10000;top:0;left:0;right:0;padding:7px 12px;background:#302336;color:white;display:flex;align-items:center;justify-content:space-evenly;gap:10px;font:700 clamp(13px,2.4vw,20px)/1.4 sans-serif;min-height:45px;box-sizing:border-box}.duel-hud[hidden]{display:none}.duel-hud button{background:#fff;color:#342538;border-radius:8px;padding:5px 10px;font-size:14px}.duel-mine{color:#ffe486}.duel-status{position:fixed;z-index:10000;bottom:5px;left:50%;transform:translateX(-50%);background:#302336ee;color:white;border-radius:14px;padding:5px 15px;font:700 16px/1.5 sans-serif;max-width:90vw;text-align:center;pointer-events:none}.duel-status[hidden]{display:none}.duel-gems{position:fixed;inset:48px 0 0;z-index:100;background:#291b35}.duel-gems .workshop-screen{height:100%!important;min-height:0!important;padding:8px}.duel-gems .game-board-shell{min-height:0}.duel-gems .game-instruction{text-align:center;color:#ffedb9}.duel-gems [disabled]{pointer-events:none}
  body.duel-post #game-screen{padding-top:58px}body.duel-post #pause-button{display:none}body.duel-post #anger-marks{visibility:hidden}
  `;document.head.append(style);
  const lobby=document.createElement('dialog');lobby.className='duel-dialog';lobby.id='duel-room';
  lobby.innerHTML=`<h2>オンラインで たいせん</h2><p>${duration/60000}ふん しょうぶ！ 正解は早い者勝ちで＋1。まちがいは−1（0より下にはならないよ）。</p><fieldset id="duel-entry"><legend>1台目で部屋を作り、2台目に番号を伝えてね。</legend><label>むずかしさ <select id="duel-level"></select></label><br><button id="duel-create">部屋をつくる</button><form id="duel-join"><label>部屋番号 <input id="duel-code" inputmode="numeric" maxlength="4" placeholder="4けた" autocomplete="off"></label> <button>部屋に入る</button></form></fieldset><p id="duel-number" class="duel-code"></p><p id="duel-note" role="status"></p><button id="duel-back">タイトルへもどる</button>`;
  document.body.append(lobby);
  const $=id=>document.getElementById(id);
  adapter.levels.forEach(([value,label])=>$('duel-level').add(new Option(label,value)));
  const hud=document.createElement('div');hud.className='duel-hud';hud.hidden=true;
  hud.innerHTML='<span id="duel-score0"></span><strong id="duel-clock"></strong><span id="duel-score1"></span><button id="duel-leave">退出</button>';document.body.append(hud);
  const status=document.createElement('div');status.className='duel-status';status.hidden=true;status.setAttribute('role','status');document.body.append(status);
  const result=document.createElement('dialog');result.className='duel-dialog';result.id='duel-result';result.innerHTML='<h2 id="duel-result-title"></h2><p id="duel-result-score"></p><p>もう一度あそぶときは、新しい部屋を作ってね。</p><button id="duel-again">部屋をつくりなおす</button> <button id="duel-home">タイトルへもどる</button>';document.body.append(result);
  const message=t=>{$('duel-note').textContent=t;status.textContent=t;};
  async function initialize(){const response=await fetch('../firebase-room-test/firebase-config.json');if(!response.ok)throw Error('通信設定を読み込めません。');const app=initializeApp(await response.json(),'duel-'+game),auth=getAuth(app);await setPersistence(auth,browserSessionPersistence);await auth.authStateReady();const user=auth.currentUser||(await signInAnonymously(auth)).user;return {db:getDatabase(app),uid:user.uid};}
  function open(){if(session)return;$('duel-entry').hidden=false;$('duel-number').textContent='';message('同じゲームで、同じ4けたの番号を入れてね。');lobby.showModal();}
  function close(s){clearInterval(s.timer);s.stops.forEach(f=>f());s.disconnect?.cancel().catch(()=>{});set(child(s.room,'online/'+s.seat),false).catch(()=>{});if(session===s)session=null;}
  const now=s=>Date.now()+s.offset;
  const start=s=>s.data.guest.at+3000;
  async function enter(create,resume){
    if(entering||session)return;
    let code=resume?.code||$('duel-code').value.normalize('NFKC').trim();
    if(!create&&!/^\d{4}$/.test(code)){message('4けたの番号を入れてね。');return;}
    entering=true;$('duel-entry').disabled=true;message('接続しています…');let s;
    try{
      client??=initialize().catch(e=>{client=null;throw e;});const {db,uid}=await client;
      const token=resume?.token||crypto.randomUUID();let room,seat=resume?.seat;
      const path='puzzleRooms/'+game+'/';
      if(resume)room=ref(db,path+code);
      else if(create){
        const level=Number($('duel-level').value),questions=makeQuestions(game,level,adapter.ids);
        for(let i=0;i<16;i++){
          code=String(crypto.getRandomValues(new Uint32Array(1))[0]%10000).padStart(4,'0');room=ref(db,path+code);
          try{await set(room,{created:serverTimestamp(),level,questions,host:{uid,token},state:initialState()});seat=0;break;}catch(e){if(!/permission/i.test(e.code))throw e;}
        }
        if(seat===undefined)throw Error('部屋を作れませんでした。もう一度試してね。');
      }else{room=ref(db,path+code);try{await set(child(room,'guest'),{uid,token,at:serverTimestamp()});seat=1;}catch(e){if(/permission/i.test(e.code))throw Error('番号を確認してね。満室・終了した部屋には入れません。');throw e;}}
      const data=(await get(room)).val();if(data?.[seat===0?'host':'guest']?.uid!==uid||data?.[seat===0?'host':'guest']?.token!==token)throw Error('入り直せません。新しい部屋を作ってね。');
      s=session={room,code,seat,token,data,offset:0,connected:false,stops:[],pending:false,shown:false,finished:false,finalizing:false,painted:-1,feedbackUntil:0};
      sessionStorage.setItem(key,JSON.stringify({code,seat,token}));$('duel-entry').hidden=true;$('duel-number').textContent=code;
      s.stops.push(onValue(ref(db,'.info/serverTimeOffset'),snap=>s.offset=snap.val()||0));
      const presence=child(room,'online/'+seat);s.disconnect=onDisconnect(presence);
      s.stops.push(onValue(ref(db,'.info/connected'),async snap=>{s.connected=false;if(!snap.val()||session!==s)return;try{await s.disconnect.set(false);if(session!==s)return;await set(presence,true);if(session===s)s.connected=true;}catch{message('接続を確認しています…');}}));
      s.stops.push(onValue(room,snap=>{if(session!==s)return;const previous=s.data.state;s.data=snap.val();if(!s.data){message('部屋が終了しました。');return;}const state=s.data.state;if(s.shown&&state.action==='claim'&&state.round!==previous.round){adapter.feedback?.(state.by===s.seat,previous.round);s.feedbackUntil=now(s)+650;message(state.by===s.seat?'せいかい！ ＋1':'あいてが せいかい！');}render(s);},()=>{s.connected=false;message('部屋の通信を確認しています…');}));
      s.timer=setInterval(()=>render(s),80);render(s);
    }catch(e){if(s)close(s);if(resume)sessionStorage.removeItem(key);message(e.message||'通信を確認してね。');}
    finally{entering=false;$('duel-entry').disabled=false;}
  }
  function render(s){
    if(session!==s||s.finished||!s.data)return;
    if(!s.data.guest){message(s.data.forfeit!=null?'部屋は終了しました。':s.connected?'相手の入室を待っています。':'接続を確認しています…');return;}
    if(!s.shown){s.shown=true;lobby.close();hud.hidden=false;status.hidden=false;adapter.begin();}
    const time=now(s),elapsed=time-start(s),state=s.data.state;adapter.score?.(state['score'+s.seat]);
    for(let seat=0;seat<2;seat++){const node=$('duel-score'+seat);node.textContent=(seat===s.seat?'あなた':'あいて')+' '+state['score'+seat]+'点';node.className=seat===s.seat?'duel-mine':'';}
    $('duel-clock').textContent=elapsed<0?'あと '+Math.ceil(-elapsed/1000):'あと '+Math.max(0,Math.ceil((duration-elapsed)/1000))+'秒';
    if(elapsed>=duration||s.data.forfeit!=null){adapter.lock(true);finish(s);return;}
    const ready=elapsed>=0&&time>=state.since+(game==='post'?500:650);
    const question=s.data.questions[state.round];
    if(ready&&question&&s.painted!==state.round){s.painted=state.round;adapter.question(JSON.parse(question.board),state.round);}
    const locked=!ready||!s.connected||s.pending||time<state['last'+s.seat]+700;
    adapter.lock(locked);
    adapter.clock?.(Math.ceil((duration-Math.max(0,elapsed))/1000),Math.max(0,Math.ceil((Math.max(start(s),state.since)+s.data.level-time)/1000)));
    if(time>=s.feedbackUntil)message(!s.connected?'通信を確認しています…':s.data.online?.[1-s.seat]===false?'相手の接続を待っています。':elapsed<0?'もうすぐスタート！':adapter.instruction);
    if(game==='post'&&ready&&s.connected&&!s.pending&&time>=Math.max(start(s),state.since)+s.data.level)answer('',true);
  }
  async function answer(value,tick=false){
    const s=session;if(!s||s.pending||!s.connected||!s.data.guest)return;
    const time=now(s),state=s.data.state,round=state.round,q=s.data.questions[round];
    if(time<start(s)||time>=start(s)+duration||time<state.since+(game==='post'?500:650)||(!tick&&time<state['last'+s.seat]+700)||!q)return;
    s.pending=true;adapter.lock(true);
    try{
      const reply=await runTransaction(child(s.room,'state'),old=>{
        if(old?.round!==round)return;
        // Server timestamps are resolved by Firebase before security rules run.
        return transition(old,round,s.seat,value,serverTimestamp(),q,tick);
      },{applyLocally:false});
      if(session!==s)return;
      if(reply.committed&&!tick&&value!==q.answer){s.feedbackUntil=now(s)+700;message('ちがった！ −1');adapter.wrong?.();}
      else if(!reply.committed&&!tick){s.feedbackUntil=now(s)+600;message('あと一歩！');}
    }catch(e){if(session===s&&!tick){s.feedbackUntil=now(s)+700;message(/permission/i.test(e.code)?'あと一歩！ つぎの問題をみてね。':'送信できませんでした。通信を確認してね。');}}
    finally{if(session===s){s.pending=false;render(s);}}
  }
  async function finish(s){if(s.finalizing||!s.connected)return;s.finalizing=true;message('結果を確認しています…');try{const data=(await get(s.room)).val();if(session!==s)return;if(!data)throw Error();s.data=data;s.finished=true;const a=data.state.score0,b=data.state.score1,winner=data.forfeit!=null?1-data.forfeit:a===b?null:a>b?0:1;sessionStorage.removeItem(key);close(s);adapter.end?.();hud.hidden=true;status.hidden=true;$('duel-result-title').textContent=winner===null?'ひきわけ！':winner===s.seat?'あなたの かち！':'あいての かち！';$('duel-result-score').textContent=`あなた ${s.seat===0?a:b}点 ／ あいて ${s.seat===0?b:a}点`+(data.forfeit!=null?'（途中で退出しました）':'');result.showModal();}catch{if(session===s){s.finalizing=false;message('結果の通信を確認しています…');}}}
  async function leave(){if(entering)return;const s=session;if(s){try{if(!s.data.guest||now(s)<start(s)+duration)await set(child(s.room,'forfeit'),s.seat);}catch(e){if(!/permission/i.test(e.code)){message('通信が戻ってから、もう一度退出を押してね。');return;}}close(s);}sessionStorage.removeItem(key);lobby.close();result.close();hud.hidden=true;status.hidden=true;adapter.home();}
  $('duel-create').onclick=()=>enter(true);$('duel-join').onsubmit=e=>{e.preventDefault();enter(false);};$('duel-back').onclick=leave;$('duel-leave').onclick=leave;$('duel-home').onclick=leave;$('duel-again').onclick=async()=>{await leave();open();};lobby.oncancel=result.oncancel=e=>{e.preventDefault();leave();};
  adapter.bind(answer,leave);
  async function resume(){let saved;try{saved=JSON.parse(sessionStorage.getItem(key));}catch{}if(saved){open();await enter(false,saved);}}
  return {open,resume,answer,leave};
}
