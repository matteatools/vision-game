const el = id => document.getElementById(id);
const status = message => { el('status').textContent = message; };
let room, seat, stop, api, connected = false, paired = false, sending = false;
function refreshButton() {
  el('send').disabled = !(connected && paired) || sending;
}
async function connect() {
  if (api) return api;
  status('Firebaseの設定を確認中…');
  const response = await fetch('./firebase-config.json', { cache: 'no-store' });
  if (!response.ok) throw new Error('Firebaseの設定ファイルを読み込めません。');
  const config = await response.json();
  status('Firebaseの通信ライブラリを読み込み中…');
  const base = 'https://www.gstatic.com/firebasejs/11.6.1/';
  const [app, auth, db] = await Promise.all(['app','auth','database'].map(name => import(base + 'firebase-' + name + '.js')));
  const instance = app.getApps()[0] || app.initializeApp(config);
  status('Firebaseで匿名ログイン中…');
  const login = auth.getAuth(instance);
  await auth.setPersistence(login, auth.browserSessionPersistence);
  const { user } = await auth.signInAnonymously(login);
  const database = db.getDatabase(instance);
  api = { ...db, database, uid:user.uid };
  db.onValue(db.ref(database, '.info/connected'), snapshot => {
    connected = snapshot.val() === true;
    if (room) status(connected ? '' : 'データベースの接続を待っています…');
    refreshButton();
  });
  return api;
}
async function enter(create) {
  const controls = document.querySelectorAll('#lobby button, #lobby input');
  controls.forEach(control => control.disabled = true);
  try {
    const db = await connect();
    status('データベースに接続して部屋を確認中…');
    let code = el('number').value;
    for (let attempt = 0; ; attempt++) {
      if (create) code = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
      const ref = db.ref(db.database, 'testRooms/' + code);
      try {
        if (create) await db.set(ref, { host:db.uid, created:db.serverTimestamp(), hostCount:0, guestCount:0 });
        else await db.set(db.child(ref, 'guest'), db.uid);
      } catch (e) {
        if (!String(e.code).toLowerCase().includes('permission')) throw e;
        if (create && attempt < 7) continue;
        throw new Error(create ? '部屋を作れません。時間をおいて試してね。' : '番号を確認してね。満室・期限切れ・同じ端末からの入室もできません。');
      }
      room = ref;
      seat = create ? 'host' : 'guest';
      break;
    }
    el('code').textContent = code;
    el('lobby').hidden = true;
    el('room').hidden = false;
    status('');
    stop = db.onValue(room, snapshot => {
      const data = snapshot.val();
      paired = Boolean(data?.guest);
      el('ready').textContent = paired ? '2台がそろいました。交代で合図を送ってね。' : '相手の入室を待っています。';
      el('mine').textContent = data?.[seat + 'Count'] ?? 0;
      el('theirs').textContent = data?.[seat === 'host' ? 'guestCount' : 'hostCount'] ?? 0;
      refreshButton();
    }, e => { paired = false; refreshButton(); status('部屋の受信が終了しました。' + e.code); });
  } catch (e) { status(el('status').textContent + '　' + (e.code || e.message)); }
  finally { controls.forEach(control => control.disabled = false); }
}
el('create').onclick = () => enter(true);
el('join').onsubmit = event => { event.preventDefault(); enter(false); };
el('send').onclick = async () => {
  sending = true;
  refreshButton();
  try { await api.set(api.child(room, seat + 'Count'), api.increment(1)); }
  catch (e) { status('合図を送れませんでした。' + (e.code || e.message)); }
  finally { sending = false; refreshButton(); }
};
el('back').onclick = () => { stop?.(); location.reload(); };
