export const fighters = ['kotaro', 'leon', 'cheetah', 'jaguar', 'white-tiger'];

export class RoomError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export function newRoom() {
  return { players: [], round: 1, ki: [0, 0], score: [0, 0], moves: [null, null], last: null, finished: false };
}

export function view(room, seat) {
  const { round, score, ki, finished, last } = room;
  return { seat, round, score, ki, finished, last, fighters: room.players.map(p => p.fighter), ready: room.moves.map(Boolean) };
}

export function enter(room, token, fighter) {
  const seat = room.players.findIndex(p => p.token === token);
  if (seat >= 0) return seat;
  if (room.players.length === 2) throw new RoomError(409, 'この部屋は満員です。');
  if (!fighters.includes(fighter)) throw new RoomError(400, '選手を選んでください。');
  return room.players.push({ token, fighter }) - 1;
}

function outcome([a, b], [x, y]) {
  if (a === 'attack' && b === 'attack') return Math.sign(x - y);
  if (a === 'attack' && (b === 'charge' || x === 5)) return 1;
  if (b === 'attack' && (a === 'charge' || y === 5)) return -1;
  return 0;
}

export function play(room, seat, round, move) {
  if (room.players.length !== 2 || room.finished || room.round !== round || room.moves[seat])
    throw new RoomError(409, 'この手の受付は終わりました。');
  const power = room.ki[seat];
  if (!['attack', 'guard', 'charge'].includes(move) || (move === 'attack' ? power === 0 : power === 5))
    throw new RoomError(400, 'いまはその技を使えません。');
  room.moves[seat] = move;
  if (room.moves.includes(null)) return;
  const result = outcome(room.moves, room.ki);
  const winner = result === 0 ? null : result > 0 ? 0 : 1;
  room.last = { round, moves: room.moves, powers: room.ki, winner };
  room.ki = room.moves.map((m, i) => m === 'attack' ? 0 : room.ki[i] + Number(m === 'charge'));
  if (winner !== null) {
    room.score[winner]++;
    room.finished = room.score[winner] === 3;
    if (!room.finished) room.ki = [room.score[1], room.score[0]];
  }
  room.moves = [null, null];
  if (!room.finished) room.round++;
}
