window.slimeMatch = (() => {
  const dialog = document.querySelector('#slime-room');
  const roomInput = dialog.querySelector('input');
  const status = dialog.querySelector('[role=status]');
  const controls = dialog.querySelector('fieldset');
  const api = 'https://kemono-karate-room.metoatama-gamepark.workers.dev/slime-rooms/';
  let session;

  async function request(s, op, data) {
    const options = { headers: { Authorization: 'Bearer ' + s.token }, signal: AbortSignal.timeout(10000) };
    if (data) {
      options.method = 'POST';
      options.headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(data);
    }
    const response = await fetch(api + s.code + '/' + op, options);
    const body = await response.json();
    if (!response.ok) throw Object.assign(new Error(body.error || '通信できませんでした。'), { status: response.status });
    return body;
  }

  function showResult(s, message) {
    session = null;
    clearInterval(timerInterval);
    resetPauseState({ clearTasks: true });
    clearSelection();
    dialog.close();
    document.querySelector('#result-score').textContent = score;
    document.querySelector('#result-rank').textContent = message;
    document.querySelector('#result-speech').textContent = '部屋番号 ' + s.code;
    const again = document.querySelector('#result-screen .primary-button');
    again.onclick = () => { showTitle(); openRoom(); };
    switchScreen('result-screen');
  }

  function drop(values) {
    for (const value of values) {
      const available = [];
      for (let c = 0; c < COLS; c++) if (!board[c][0]) available.push(c);
      if (!available.length) { lose(); return; }
      const col = available[Math.floor(Math.random() * available.length)];
      const top = board[col].findIndex(Boolean);
      const row = top === -1 ? ROWS - 1 : top - 1;
      const block = createBlock(col, row, value);
      board[col][row] = block;
      block.el.animate([
        { translate: '0 -' + ((row + 1) * 100) + '%' },
        { translate: '0 0' }
      ], { duration: 260, easing: 'ease-in' });
    }
  }

  async function poll(s) {
    if (s !== session) return;
    const packet = s.outbox[0];
    const data = { ...packet, ack: s.received, lost: s.lost };
    try {
      const state = await request(s, 'play', data);
      if (s !== session) return;
      if (state.winner !== null) {
        showResult(s, state.winner === state.seat ? 'あなたの かち！' : 'あなたの まけ');
        return;
      }
      if (state.ready && !s.started) {
        s.started = true;
        dialog.close();
        startGame();
        pauseButtonEl.disabled = true;
      }
      if (packet && state.sent >= packet.id) s.outbox.shift();
      if (s.started && !s.lost) {
        timerLabelEl.textContent = 'スライムが すすむ';
        if (!isDragging && !isResolving) {
          for (const incoming of state.inbox) {
            if (incoming.id <= s.received) continue;
            drop(incoming.values);
            s.received = incoming.id;
            if (s.lost) break;
          }
        }
      }
    } catch (error) {
      if (s !== session) return;
      if (error.status === 404 || error.status === 403) {
        if (s.started) showResult(s, '対戦が終了しました');
        else { session = null; controls.disabled = false; status.textContent = error.message; }
        return;
      }
      (s.started ? timerLabelEl : status).textContent = '通信を確認しています…';
    }
    if (s === session) setTimeout(() => poll(s), 650);
  }

  function openRoom() {
    controls.disabled = false;
    roomInput.value = '';
    status.textContent = '';
    dialog.showModal();
  }

  async function enterRoom(create) {
    if (!create && !/^\d{4}$/.test(roomInput.value)) {
      status.textContent = '4けたの部屋番号をいれてね。';
      return;
    }
    const s = { token: crypto.randomUUID(), received: 0, next: 1, outbox: [], started: false, lost: false };
    session = s;
    controls.disabled = true;
    status.textContent = '接続しています…';
    try {
      for (let attempt = 0; ; attempt++) {
        s.code = create ? String(Math.floor(Math.random() * 10000)).padStart(4, '0') : roomInput.value;
        try { await request(s, create ? 'create' : 'join', {}); break; }
        catch (e) { if (!create || e.status !== 409 || attempt >= 9 || s !== session) throw e; }
      }
      if (s !== session) return;
      status.textContent = '部屋番号 ' + s.code + '　相手を待っています';
      poll(s);
    } catch (e) {
      if (s !== session) return;
      session = null;
      controls.disabled = false;
      status.textContent = e.status ? e.message : '接続できませんでした。もう一度ためしてね。';
    }
  }

  function lose() {
    if (!session?.started) return false;
    session.lost = true;
    isResolving = true;
    gameIsActive = false;
    clearInterval(timerInterval);
    clearScheduledTasks();
    timerLabelEl.textContent = '結果を確認中…';
    return true;
  }
  dialog.querySelector('[data-create]').onclick = () => enterRoom(true);
  dialog.querySelector('[data-join]').onclick = () => enterRoom(false);
  dialog.querySelector('[data-close]').onclick = () => dialog.close();
  dialog.addEventListener('close', () => { if (session && !session.started) session = null; });
  return {
    openRoom, lose,
    send(blocks) {
      if (session?.started && !session.lost)
        session.outbox.push({ id: session.next++, values: blocks.map(block => block.val) });
    }
  };
})();
