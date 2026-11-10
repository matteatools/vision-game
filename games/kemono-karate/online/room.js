import {roomRequest} from './room-api.js';
const $ = id => document.getElementById(id);
const names = { kotaro:'コタロウ', leon:'レオン', cheetah:'チースケ', jaguar:'ジャック', 'white-tiger':'びゃっこ' };
let id = new URL(location.href).searchParams.get('room');
let token, timer;
for (const [key, name] of Object.entries(names)) $('fighter').add(new Option(name, key));
const invited = id;
if (invited) {
  $('enter').textContent = 'この部屋に入る';
  $('joinForm').hidden = true;
}
async function request(op, data) {
  const result = await roomRequest(id, token, op, data);
  $('error').textContent = '';
  return result;
}
function render(s) {
  clearTimeout(timer);
  if (s.fighters.length === 2) {
    location.replace('./dojo.html?room=' + encodeURIComponent(id));
    return;
  }
  $('arena').hidden = $('home').hidden = false;
  $('lobby').hidden = true;
  $('numberLabel').hidden = !/^[0-9]{4}$/.test(id);
  $('number').textContent = id;
  timer = setTimeout(refresh, 1000);
}
async function refresh() {
  try { render(await request('state')); }
  catch(e) {
    $('error').textContent = e.status ? e.message : '通信を再試行しています。';
    if (!e.status || e.status >= 500) timer = setTimeout(refresh, 3000);
    else $('home').hidden = false;
  }
}
async function enterRoom(create, selectedId) {
  $('enter').disabled = $('join').disabled = true;
  try {
    for (let attempt = 0; attempt < 24; attempt++) {
      if (create) {
        const pending = JSON.parse(sessionStorage.getItem('kemono-karate:pending-room') || 'null');
        id = pending?.id ?? String(crypto.getRandomValues(new Uint32Array(1))[0] % 10000).padStart(4, '0');
        token = pending?.token ?? crypto.randomUUID();
        sessionStorage.setItem('kemono-karate:pending-room', JSON.stringify({id, token}));
      } else {
        id = selectedId;
        token = sessionStorage.getItem('kemono-karate:' + id) || crypto.randomUUID();
        sessionStorage.setItem('kemono-karate:' + id, token);
      }
      let joined;
      try {
        joined = await request(create ? 'create' : 'join', {fighter:$('fighter').value});
      } catch (e) {
        if (!create || e.status !== 409) throw e;
        sessionStorage.removeItem('kemono-karate:pending-room');
        continue;
      }
      sessionStorage.setItem('kemono-karate:' + id, token);
      if (create) sessionStorage.removeItem('kemono-karate:pending-room');
      history.replaceState(null, '', '?room=' + encodeURIComponent(id));
      render(joined);
      return;
    }
    throw new Error('番号を取得できませんでした。もう一度お試しください。');
  } catch(e) { $('error').textContent = e.message; $('home').hidden = false; }
  finally { $('enter').disabled = $('join').disabled = false; }
}
$('enter').onclick = () => enterRoom(!invited, invited);
$('joinForm').onsubmit = event => {
  event.preventDefault();
  enterRoom(false, $('code').value.normalize('NFKC'));
};
$('copy').onclick = async () => {
  try { await navigator.clipboard.writeText(location.href); $('copy').textContent = 'コピーしました'; }
  catch { $('error').textContent = 'アドレス欄から招待リンクをコピーしてください。'; }
};
if (id && (token = sessionStorage.getItem('kemono-karate:' + id))) refresh();
