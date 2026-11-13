import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js';
import { getAuth, setPersistence, browserSessionPersistence, signInAnonymously } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js';
import { getDatabase, ref, child, get, set, onValue, serverTimestamp, onDisconnect } from 'https://www.gstatic.com/firebasejs/11.6.1/firebase-database.js';
export { child, get, set, onValue, serverTimestamp, onDisconnect };

let client;
async function initialize() {
  const response = await fetch(new URL('./firebase-config.json', import.meta.url));
  if (!response.ok) throw Error('通信設定を読み込めません。');
  const app = initializeApp(await response.json());
  const auth = getAuth(app);
  await setPersistence(auth, browserSessionPersistence);
  await auth.authStateReady();
  const user = auth.currentUser || (await signInAnonymously(auth)).user;
  return { uid: user.uid, database: getDatabase(app) };
}

export async function openMatch(game, code, op, fighter = 'slime', token = '') {
  if (!/^\d{4}$/.test(code)) throw Error('4けたの部屋番号を入れてね。');
  client ??= initialize().catch(e => { client = null; throw e; });
  const { uid, database } = await client;
  const room = ref(database, game + '/' + code);
  const host = { uid, fighter, token };
  if (op === 'create' || op === 'join') {
    try {
      if (op === 'create') await set(room, { created:serverTimestamp(), players:{0:host} });
      else await set(child(room, 'players/1'), host);
    } catch (e) {
      if (!/permission/i.test(e.code)) throw e;
      const own = await get(child(room, 'players')).catch(() => null);
      const member = own?.val()?.[op === 'create' ? 0 : 1];
      if (!member || member.uid !== uid || member.token !== token)
        throw Object.assign(Error(op === 'create' ? '使用中の部屋です。' : '部屋番号を確認してね。満室または期限切れの場合もあります。'), { status:409 });
    }
  }
  const snapshot = await get(child(room, 'players'));
  const players = snapshot.val() || {};
  const seat = [0,1].find(i => players[i]?.uid === uid && players[i].token === token);
  if (seat === undefined) throw Object.assign(Error('部屋に入り直してください。'), { status:403 });
  return { room, seat, players, connection:ref(database,'.info/connected'), offset:ref(database,'.info/serverTimeOffset') };
}
