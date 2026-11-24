/* Deterministic rules and game-time clock; no DOM, audio or wall-clock timers. */
(function (root) {
  'use strict';
  const COLORS = [
    ['red', '#cf5545', 'あか'], ['blue', '#397da3', 'あお'],
    ['green', '#50836b', 'みどり'], ['yellow', '#d6a533', 'きいろ'],
    ['purple', '#8770a5', 'むらさき'], ['orange', '#d97d39', 'オレンジ'],
    ['pink', '#cf7e96', 'ピンク'], ['cyan', '#45a8b4', 'みずいろ'],
    ['lime', '#91a94a', 'きみどり'], ['slate', '#667384', 'はいいろ']
  ];
  const PATTERNS = [['solid', 'むじ'], ['stripe', 'しましま'], ['dot', 'みずたま']];
  const MODES = [
    { id: 1, name: 'いつものひ', colors: 5, cat: false, baby: false, detail: '15くみ・おじゃま なし', tip: 'ひとくみずつ、ていねいに。1ぷんで そろえよう。' },
    { id: 2, name: 'ねこと おかたづけ', colors: 5, cat: true, baby: false, detail: '15くみ・ねこが ちらかすよ', tip: 'ねこが かけぬけるよ。それでも、こつこつ。' },
    { id: 3, name: 'あかちゃんのひ', colors: 5, cat: false, baby: true, recordId: 'baby-solo', detail: '15くみ・そろえた くつしたを もどすよ', tip: 'あかちゃんは そろえた くつしたを もどすよ。' },
    { id: 6, name: 'ゆうれいのひ', colors: 5, incident: 'ghost', detail: '15くみ・くつしたが ふわり あちこち', tip: 'きまぐれに とんでいく。つかまえて そろえよう。' },
    { id: 7, name: 'ブラックホールのひ', colors: 5, incident: 'hole', detail: '15くみ・まんなかに すいよせるよ', tip: 'まんなかに あつまっても、ひっぱって さがそう。' },
    { id: 8, name: 'まほうつかいのひ', colors: 5, incident: 'wizard', detail: '15くみ・かたちだけ かわるよ', tip: 'かたちが ちがっても、いろ と もようは おなじ。' },
    { id: 9, name: 'あくまのひ', colors: 5, incident: 'devil', detail: '15くみ・いろが くろっぽくなるよ', tip: 'くらい いろにも、すこしずつ ちがいが あるね。' },
    { id: 10, name: 'ようせいのひ', colors: 5, incident: 'fairy', detail: '15くみ・まるの なかだけ みえるよ', tip: 'ゆびや マウスを うごかして、まるの なかを さがそう。' },
    { id: 11, name: 'ドラゴンのひ', colors: 5, incident: 'dragon', detail: '15くみ・くしゃみで あちこち とぶよ', tip: 'うえ、した、みぎ、ひだり。とばされても、こつこつ。' },
    { id: 12, name: 'くつしたを すくうひ', colors: 5, rescue: true, detail: '15くみ・かたほうずつ まっしろに', tip: '2びょうごとに ひとやすみ。1びょうだけ りょうほうの もようが みえるよ。' }
  ];
  const STORIES = ['きょうはいつものひ。','ねこがいえにやってきた。','あかちゃんがおてつだいにきた。','ゆうれいがくつしたとあそんでいる。','へやにブラックホールができた。','まほうつかいがかたちをかえた。','あくまがいろをうばっていった。','ようせいがせかいをかくした。','ドラゴンのくしゃみがとまらない。','くつしたがこのよからなくなるらしい。'];
  MODES.forEach((m,i) => { m.day = i + 1; m.story = STORIES[i]; });
  const firstTen = MODES.slice();
  for (let i = 0; i < 10; i++) MODES.push({ ...firstTen[i], id: 111 + i, day: 11 + i, colors: 10, story: i === 0 ? 'かぞくにむかでがふえた。' : i === 9 ? 'また、くつしたがこのよからなくなるらしい。' : STORIES[i], detail: firstTen[i].detail.replace('15くみ', '20くみ') });
  const combinations = [
    ['ねこと あかちゃん', ['cat','baby'], 'ねことあかちゃんがなかよくなった。'],
    ['まほうと ブラックホール', ['wizard','hole'], 'まほうつかいがへやにあなをあけた。'],
    ['ゆうれいと あくま', ['ghost','devil'], 'ゆうれいがあくまをつれてきた。'],
    ['ねこと ようせい', ['cat','fairy'], 'みえないところでねこがはしっている。'],
    ['あかちゃんと ドラゴン', ['baby','dragon'], 'あかちゃんがドラゴンをくすぐった。'],
    ['まほうつかいと あくま', ['wizard','devil'], 'かたちもいろもあやしくなってきた。'],
    ['ゆうれいと ようせい', ['ghost','fairy'], 'かくれたくつしたがひとりでとんでいく。'],
    ['ねこと あかちゃんと まほう', ['cat','baby','wizard'], 'おてつだいがさんにんにふえた。'],
    ['ドラゴンと まほうと ようせい', ['dragon','wizard','fairy'], 'へやじゅうがたいへんなことになった。'],
    ['くつしたを すくうひ', ['rescue','ghost','wizard'], 'さいごに、くつしたがこのよからなくなるらしい。']
  ];
  const names = {cat:'ねこ',baby:'あかちゃん',ghost:'ゆうれい',hole:'ブラックホール',wizard:'まほうつかい',devil:'あくま',fairy:'ようせい',dragon:'ドラゴン',rescue:'しろくなる くつした'};
  combinations.forEach(([name, hazards, story], i) => {
    const incidents = hazards.filter(h => !['cat','baby','rescue'].includes(h));
    MODES.push({ id: 121+i, day: 21+i, name, colors: 10, story, cat: hazards.includes('cat'), baby: hazards.includes('baby'), rescue: hazards.includes('rescue'), incidents, incident: incidents[0], detail: '20くみ・' + hazards.map(h=>names[h]).join('と '), tip: hazards.map(h=>names[h]).join('と ') + '。ひとくみずつ、そろえよう。' });
  });
  MODES.forEach(m => { m.pairs = m.day <= 10 ? 15 : 20; m.limit = 60000; m.incidents = m.incidents || (m.incident ? [m.incident] : []); m.hazards = [...(m.cat?['cat']:[]), ...(m.baby?['baby']:[]), ...m.incidents, ...(m.rescue?['rescue']:[])]; });
  MODES[10].tip = 'かぞくのぶんも、ひとくみずつ。';
  MODES[19].name = 'またくつしたをすくうひ';
  MODES[29].name = 'またまたくつしたをすくうひ';
  const INCIDENTS = {
    ghost: { name: 'ゆうれい', duration: 18000, message: 'あの くつした、こんどは どこへ いくのかな。' },
    hole: { name: 'ブラックホール', duration: 20000, message: 'あれ、まんなかに あつまっていく。' },
    wizard: { name: 'まほうつかい', duration: 20000, message: 'かたちが かわった。でも、もようは そのまま。' },
    devil: { name: 'あくま', duration: 18000, message: 'くろっぽくなったね。よく みれば、ちがう いろ。' },
    fairy: { name: 'ようせい', duration: 20000, message: 'ようせいの いたずら。ゆびや マウスで あかりを うごかそう。' },
    dragon: { name: 'ドラゴン', duration: 18000, message: 'ドラゴンの はなが むずむず。くしゃみが でそう。' }
  };
  function random(seed) { let n = seed >>> 0; return () => { n += 0x6D2B79F5; let t = n; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function shuffle(a, rng) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function makeCards(mode, rng, stage = -1) {
    let types = COLORS.slice(0, mode.colors).flatMap(c => PATTERNS.map(p => ({ key: c[0] + '-' + p[0], color: c[1], colorName: c[2], pattern: p[0], patternName: p[1] })));
    // Keep all ten colors and all three patterns, with two patterns per color.
    if (stage < 0 && mode.pairs === 20) types = types.filter((_, i) => i % 3 !== Math.floor(i / 3) % 3);
    if (stage === 0) types = [types[0], types[1]];
    if (stage === 1) types = [types[1], types[4], types[2]];
    if (stage === 2) types = [types[0], types[4], types[8]];
    return shuffle(types.flatMap(t => [{ ...t, side: 0 }, { ...t, side: 1 }]), rng).map((c, i) => ({ ...c, id: i, matched: false, x: .15 + rng() * .7, y: .15 + rng() * .7, rotation: Math.round(rng() * 100 - 50), z: i + 1 }));
  }
  class Game {
    constructor(modeId = 1, seed = Date.now(), stage = -1) {
      this.mode = { ...(MODES.find(m => m.id === modeId) || MODES[0]) };
      this.limit = stage < 0 ? this.mode.limit : Infinity;
      this.stage = stage; this.practice = stage >= 0; this.rng = random(seed);
      this.cards = makeCards(this.mode, this.rng, stage);
      this.state = this.practice ? 'practice' : 'playing'; this.time = 0; this.obstacleTime = 0;
      this.selected = []; this.pending = null; this.matched = 0; this.attempts = 0;
      this.combo = 0; this.lastMatch = -Infinity; this.dragged = false; this.dragging = null;
      this.nextCat = 15000; this.nextBaby = 20000;
      this.catRun = null; this.babyShown = false;
      this.effect = null; this.nextIncident = 14000;
      this.events = []; this.maxZ = 100; this.restored = 0;
      this.rescueActive = !!this.mode.rescue && !this.practice; this.rescueStart = 0; this.rescuePhase = 0;
    }
    startRescue() { if (this.mode.rescue && this.active) { this.rescueActive = true; this.rescueStart = this.time; this.rescuePhase = 0; this.emit('rescueSwap'); } }
    isWhite(c) { return this.rescueActive && !c.matched && this.rescuePhase % 3 < 2 && c.side === Math.floor(this.rescuePhase / 3) % 2; }
    get active() { return this.state === 'playing' || this.state === 'practice'; }
    hasEffect(type) { return !!this.effect?.types.includes(type); }
    emit(type, data = {}) { this.events.push({ type, ...data }); }
    drain() { return this.events.splice(0); }
    select(id) {
      const c = this.cards[id]; if (!this.active || this.pending || this.dragging !== null || !c || c.matched) return false;
      if (this.selected.includes(id)) { this.selected = []; this.emit('cancel'); return true; }
      this.pin(c); this.selected.push(id); c.z = ++this.maxZ; this.emit('select');
      if (this.selected.length === 2) {
        this.attempts++;
        this.pending = { ids: this.selected.slice(), at: this.time + 240, match: this.cards[this.selected[0]].key === c.key };
      }
      return true;
    }
    beginDrag(id) { if (!this.active || this.pending || !this.cards[id] || this.cards[id].matched || this.dragging !== null) return false; this.pin(this.cards[id]); this.dragging = id; this.cards[id].z = ++this.maxZ; return true; }
    endDrag(id, x, y, moved) {
      if (this.dragging !== id) return; this.cards[id].pinnedAt = this.time; this.dragging = null;
      if (!this.active) return;
      if (moved) { Object.assign(this.cards[id], { x, y }); this.dragged = true; this.emit('drag'); this.checkEnd(); }
      else this.select(id);
    }
    pause() { if (!this.active) return; this.previousState = this.state; this.state = 'paused'; this.dragging = null; this.emit('pause'); }
    resume() { if (this.state === 'paused') { this.state = this.previousState; this.emit('resume'); } }
    stop() { this.catRun = null; this.effect = null; this.state = 'title'; this.pending = null; this.selected = []; this.dragging = null; this.events = []; }
    tick(dt) {
      if (!this.active || !Number.isFinite(dt) || dt <= 0) return;
      const elapsed = Math.min(dt, this.limit - this.time); this.time += elapsed; this.obstacleTime += elapsed;
      // A pair chosen before the bell still counts; the visual delay is not a penalty.
      if (this.pending && (this.time >= this.pending.at || this.time >= this.limit)) this.resolve();
      if (!this.active) return;
      if (this.time >= this.limit) { this.state = 'timeout'; this.catRun = null; this.effect = null; this.dragging = null; this.selected = []; this.emit('timeout'); return; }
      if (this.rescueActive) { const phase = Math.floor((this.time - this.rescueStart) / 1000); if (phase !== this.rescuePhase) { this.rescuePhase = phase; this.emit('rescueSwap'); } }
      this.advanceCat();
      this.advanceEffect();
      if (this.practice || this.pending || this.dragging !== null || this.selected.length) return;
      if (this.mode.cat && this.obstacleTime >= this.nextCat) { this.scatter(); this.nextCat = this.obstacleTime + 15000; }
      if (this.mode.baby && this.obstacleTime >= this.nextBaby) { this.restore(); this.nextBaby = this.obstacleTime + 20000; }
      if (this.mode.incident && !this.effect && this.time >= this.nextIncident) this.startIncident();
    }
    resolve() {
      const p = this.pending; this.pending = null; this.selected = [];
      if (p.match) {
        p.ids.forEach(i => this.cards[i].matched = true); this.matched++;
        this.combo = this.time - this.lastMatch < 4000 ? this.combo + 1 : 1; this.lastMatch = this.time;
        this.emit('match', { ids: p.ids, combo: this.combo });
        if (this.practice && this.stage === 2 && this.mode.baby && !this.babyShown) { this.babyShown = true; this.restore(1); }
        this.checkEnd();
      } else { this.combo = 0; this.emit('miss', { ids: p.ids }); }
    }
    checkEnd() {
      if (this.matched !== this.cards.length / 2) return;
      this.state = 'result'; this.catRun = null; this.effect = null; this.emit('win');
    }
    motionOffset(c) {
      if (this.effect?.type !== 'ghost' || c.matched || c.pinnedAt === this.time || c.id === this.dragging || this.selected.includes(c.id)) return { x: 0, y: 0, angle: 0 };
      const flight = this.effect.entries.find(e => e.id === c.id);
      if (!flight || flight.free || this.time <= flight.start || this.time >= flight.end) return { x: 0, y: 0, angle: 0 };
      const t = this.time - flight.start, envelope = Math.sin(Math.PI * t / (flight.end - flight.start));
      return { x: Math.sin(t / 500 + c.id) * .018 * envelope, y: Math.sin(t / 650 + c.id) * .025 * envelope, angle: Math.sin(t / 600 + c.id) * 12 * envelope };
    }
    pin(c) {
      const offset = this.motionOffset(c); c.x += offset.x; c.y += offset.y;
      if (['hole', 'ghost'].includes(this.effect?.type)) { const entry = this.effect.entries.find(e => e.id === c.id); if (entry) entry.free = true; }
    }
    startIncident() {
      const types = this.mode.incidents, type = types.find(t => ['ghost','hole','dragon'].includes(t)) || types[0];
      if (!this.active || !type || this.effect) return false;
      this.effect = { type, types: types.slice(), start: this.time, end: this.time + Math.max(...types.map(t=>INCIDENTS[t].duration)) };
      if (type === 'dragon') { this.effect.nextSneeze = this.time + 1200; this.effect.sneezes = 0; }
      if (type === 'hole') this.effect.entries = this.cards.filter(c => !c.matched).map(c => {
        return { id: c.id, x: c.x, y: c.y, tx: .5 + (c.x - .5) * .22, ty: .5 + (c.y - .5) * .22, free: this.selected.includes(c.id) || c.id === this.dragging };
      });
      if (type === 'ghost') {
        const candidates = shuffle(this.cards.filter(c => !c.matched && !this.selected.includes(c.id) && c.id !== this.dragging), this.rng);
        this.effect.entries = candidates.slice(0, Math.min(20, Math.ceil(candidates.length * .65))).map((c, i) => {
          const start = this.time + Math.floor(i / 2) * 1600 + this.rng() * 300;
          let tx = .15 + this.rng() * .7, ty = .15 + this.rng() * .7;
          if (Math.hypot(tx - c.x, ty - c.y) < .2) { tx = c.x < .5 ? .8 : .2; ty = c.y < .5 ? .8 : .2; }
          return { id: c.id, x: c.x, y: c.y, tx, ty, start, end: start + 2400 + this.rng() * 400, free: false };
        });
      }
      this.emit('incident', { incident: type }); return true;
    }
    advanceEffect() {
      const e = this.effect; if (!e) return;
      if (e.type === 'dragon') {
        while (this.time >= e.nextSneeze && e.nextSneeze < e.end) {
          const ids = [];
          const [dx, dy, direction] = [[0,-1,'うえ'],[0,1,'した'],[1,0,'みぎ'],[-1,0,'ひだり']][e.sneezes % 4];
          for (const c of this.cards) {
            if (c.matched || c.id === this.dragging || this.selected.includes(c.id)) continue;
            const push = .38 + this.rng() * .20, sideways = (this.rng() - .5) * .22;
            c.x = Math.max(.02, Math.min(.98, c.x + dx * push + (dy ? sideways : 0)));
            c.y = Math.max(.02, Math.min(.98, c.y + dy * push + (dx ? sideways : 0)));
            c.rotation += Math.round(this.rng() * 110 - 55); ids.push(c.id);
          }
          e.lastSneeze = e.nextSneeze; e.nextSneeze += 4000; e.sneezes++;
          this.emit('sneeze', { ids, direction });
        }
      }
      if (e.type === 'hole') {
        const p = Math.min(1, (this.time - e.start) / (e.end - e.start)), eased = p * p * (3 - 2 * p);
        for (const entry of e.entries) {
          const c = this.cards[entry.id];
          if (c.matched || entry.free) continue;
          c.x = entry.x + (entry.tx - entry.x) * eased; c.y = entry.y + (entry.ty - entry.y) * eased;
        }
      }
      if (e.type === 'ghost') {
        for (const flight of e.entries) {
          const c = this.cards[flight.id];
          if (c.matched || flight.free || this.time < flight.start) continue;
          const p = Math.min(1, (this.time - flight.start) / (flight.end - flight.start)), eased = p * p * (3 - 2 * p);
          c.x = flight.x + (flight.tx - flight.x) * eased; c.y = flight.y + (flight.ty - flight.y) * eased;
        }
      }
      if (this.time >= e.end) { this.effect = null; this.nextIncident = this.time + 14000; this.emit('incidentEnd', { incident: e.type }); }
    }
    scatter() {
      if (!this.active || this.catRun) return;
      this.catRun = { start: this.time, duration: 1100, pending: this.cards.filter(c => !c.matched).map(c => ({ id: c.id, at: this.time + 1100 * (1.16 - c.x) / 1.32 })) };
      this.emit('cat');
    }
    advanceCat() {
      if (!this.catRun) return;
      const due = this.catRun.pending.filter(item => item.at <= this.time);
      this.catRun.pending = this.catRun.pending.filter(item => item.at > this.time);
      const ids = [];
      for (const item of due) {
        const c = this.cards[item.id];
        if (c.matched || c.id === this.dragging || this.selected.includes(c.id)) continue;
        c.x = Math.max(.12, Math.min(.88, c.x + (this.rng() - .6) * .45));
        c.y = Math.max(.12, Math.min(.88, c.y + (this.rng() - .5) * .5));
        c.rotation += Math.round(this.rng() * 150 - 75); c.z = ++this.maxZ; ids.push(c.id);
      }
      if (ids.length) this.emit('scatter', { ids });
      if (this.time >= this.catRun.start + this.catRun.duration) { this.catRun = null; this.emit('catGone'); }
    }
    restore(limit = 3) {
      if (!this.active) return;
      const keys = shuffle([...new Set(this.cards.filter(c => c.matched).map(c => c.key))], this.rng).slice(0, limit);
      if (!keys.length) return;
      this.cards.forEach(c => { if (keys.includes(c.key)) { c.matched = false; c.x = .15 + this.rng() * .7; c.y = .15 + this.rng() * .7; c.z = ++this.maxZ; } });
      this.matched -= keys.length; this.restored += keys.length; this.emit('baby', { count: keys.length });
    }
  }
  const api = { COLORS, PATTERNS, MODES, INCIDENTS, Game, random, makeCards };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Socks = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
