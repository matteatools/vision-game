import { openMatch, child, onValue, set, serverTimestamp, onDisconnect } from '../firebase-room-test/firebase-match.js';

export async function connectSlimes(s, op) {
  const { room, seat, players, connection, offset } = await openMatch('slimeMatches',s.code,op,'slime',s.token);
  const opponent = 1-seat;
  const at = path => child(room,path);
  const stops = [];
  let ready = Boolean(players[1]), connected = false, ended = false, error;
  let inbox, peerAck = 0, sent = 0, ack = 0, winner, peerOffline, skew = 0;
  const presence = at('offline/' + seat);
  const disconnect = onDisconnect(presence);
  function listen(ref, callback) {
    stops.push(onValue(ref, snap => callback(snap.val()), e => { error = e; }));
  }
  function close() {
    ended = true;
    stops.splice(0).forEach(stop => stop());
    disconnect.cancel().catch(() => {});
  }
  listen(at('players'), value => { ready = Boolean(value?.[1]); });
  listen(at('packet/'+opponent), value => { inbox = value; });
  listen(at('ack/'+opponent), value => { peerAck = value || 0; });
  listen(at('winner'), value => { winner = value; });
  listen(at('offline/'+opponent), value => { peerOffline = value; });
  listen(offset, value => { skew = value || 0; });
  listen(connection, async value => {
    connected = false;
    if (!value || ended) return;
    try {
      await disconnect.set(serverTimestamp());
      if (!ended) { await set(presence,null); connected = true; }
    } catch(e) { error = e; }
  });
  return { close, async poll(data) {
    if (error) throw error;
    if (!connected && winner == null) throw Error('通信を確認しています…');
    if (ready && winner == null) {
      const timeout = peerOffline && Date.now()+skew-peerOffline > 60000;
      if (data.lost || timeout) {
        try { await set(at('winner'), data.lost ? opponent : seat); }
        catch(e) { if (!/permission/i.test(e.code)) throw e; }
      } else {
        if (data.ack > ack) {
          await set(at('ack/'+seat), data.ack);
          ack = data.ack;
        }
        if (data.id === sent+1 && peerAck >= sent) {
          await set(at('packet/'+seat), { id:data.id, digits:data.values.join('') });
          sent = data.id;
        }
      }
    }
    if (winner != null) close();
    return { ready, seat, sent, winner:winner ?? null,
      inbox:inbox && inbox.id > ack ? [{id:inbox.id,values:Array.from(inbox.digits,Number)}] : [] };
  }};
}
