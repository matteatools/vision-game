import { openMatch, child, get, set, onValue } from '../../firebase-room-test/firebase-match.js';
import { newRoom, play, view } from './game.js';

let current;
async function match(id, token, op, fighter) {
  const entry = await openMatch('karateMatches', id, op, fighter, token);
  const { room, seat } = entry;
  const game = newRoom();
  function players(value) {
    game.players = Object.values(value || {}).map(p => ({fighter:p.fighter}));
  }
  players(entry.players);
  let own, other, unsubscribe, watchedRound, failure;
  const stopPlayers = onValue(child(room,'players'), s => players(s.val()), e => { failure = e; });
  function moveRef(i) { return child(room, 'turns/' + game.round + '/' + i); }
  async function restore() {
    while (!game.finished) {
      own = (await get(moveRef(seat))).val();
      if (!own) break;
      other = (await get(moveRef(1-seat))).val();
      if (!other) break;
      resolve();
    }
  }
  function resolve() {
    const round = game.round;
    play(game, seat, round, own);
    play(game, 1-seat, round, other);
    own = other = null;
    unsubscribe?.();
    unsubscribe = null;
  }
  function watch() {
    if (!own || watchedRound === game.round || game.finished) return;
    const round = watchedRound = game.round;
    unsubscribe = onValue(moveRef(1-seat), snapshot => {
      if (round === game.round) other = snapshot.val();
    }, e => { failure = e; });
  }
  try { await restore(); } catch(e) { stopPlayers(); throw e; }
  return {
    id, token,
    close() { unsubscribe?.(); stopPlayers(); },
    async request(op, data) {
      if (failure) throw failure;
      if (op === 'play' && !own && !game.finished && game.round === data.round) {
        play(structuredClone(game), seat, data.round, data.move);
        await set(moveRef(seat), data.move);
        own = data.move;
      }
      if (own && other) resolve();
      watch();
      const state = view(game,seat);
      state.ready[seat] = Boolean(own);
      if (game.finished) this.close();
      return state;
    }
  };
}
export async function roomRequest(id,token,op,data) {
  if (!current || current.id !== id || current.token !== token) {
    current?.close();
    current = await match(id,token,op,data?.fighter);
  }
  return current.request(op,data);
}
