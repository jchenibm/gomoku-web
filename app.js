(function() {
  const BOARD_SIZE = 15;
  const CELL_COUNT = BOARD_SIZE;

  const Stone = {
    Empty: 0,
    Black: 1,
    White: 2,
  };

  const $ = (sel) => document.querySelector(sel);

  // Sound Manager using WebAudio
  class SoundManager {
    constructor() {
      this.enabled = true;
      this.unlocked = false;
      this.ctx = null;
      this.buffers = {
        place: null,
        hint: null,
        win: null,
      };
    }

    unlock() {
      if (this.unlocked) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        this.ctx = new AudioContext();
        // Create small buffers for sound effects
        this.buffers.place = this._createTone(700, 0.045, 'sine', 0.002, 0.03);
        this.buffers.hint = this._createTone(1050, 0.09, 'triangle', 0.005, 0.05);
        // For win, create a little sequence
        this.buffers.win = this._createChord([660, 880, 990], 0.22);
        this.unlocked = true;
        console.log('Audio unlocked');
      } catch (e) {
        console.warn('Audio init failed', e);
      }
    }

    setEnabled(on) {
      this.enabled = !!on;
    }

    play(name) {
      if (!this.enabled) return;
      if (!this.unlocked) return; // will only play after unlock per mobile policy
      const buf = this.buffers[name];
      if (!buf || !this.ctx) return;
      const src = this.ctx.createBufferSource();
      src.buffer = buf;
      src.connect(this.ctx.destination);
      src.start();
    }

    _createTone(freq, duration, type = 'sine', attack = 0.01, release = 0.05) {
      const sampleRate = 44100;
      const length = Math.floor(sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        let amp = 1.0;
        if (t < attack) amp = t / attack; else if (t > duration - release) amp = Math.max(0, (duration - t) / release);
        let value;
        const phase = 2 * Math.PI * freq * t;
        switch (type) {
          case 'square': value = Math.sign(Math.sin(phase)); break;
          case 'triangle': value = 2 * Math.asin(Math.sin(phase)) / Math.PI; break;
          case 'sawtooth': value = 2 * (t * freq - Math.floor(0.5 + t * freq)); break;
          default: value = Math.sin(phase);
        }
        data[i] = value * amp * 0.35; // volume
      }
      return buffer;
    }

    _createChord(freqs, duration) {
      const sampleRate = 44100;
      const length = Math.floor(sampleRate * duration);
      const buffer = this.ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) {
        const t = i / sampleRate;
        const attack = 0.01;
        const release = 0.08;
        let amp = 1.0;
        if (t < attack) amp = t / attack; else if (t > duration - release) amp = Math.max(0, (duration - t) / release);
        let v = 0;
        for (const f of freqs) v += Math.sin(2 * Math.PI * f * t);
        data[i] = (v / freqs.length) * amp * 0.32;
      }
      return buffer;
    }
  }

  // Game state
  const state = {
    playing: false,
    current: Stone.Black,
    human: Stone.Black,
    board: createBoard(CELL_COUNT),
    history: [],
    winner: Stone.Empty,
    hintCell: null,
  };

  const sound = new SoundManager();

  // UI elements
  const canvas = $('#board');
  const ctx = canvas.getContext('2d');
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  const btnStart = $('#btn-start');
  const btnRestart = $('#btn-restart');
  const btnUndo = $('#btn-undo');
  const btnHint = $('#btn-hint');
  const btnSound = $('#btn-sound');
  const toast = $('#toast');
  const overlayUnlock = $('#overlay-unlock');
  const btnUnlock = $('#btn-unlock');

  // Resize canvas for DPR
  function fitCanvas() {
    const rect = canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height);
    canvas.width = Math.floor(size * dpr);
    canvas.height = Math.floor(size * dpr);
    drawAll();
  }
  window.addEventListener('resize', fitCanvas);

  function createBoard(n) {
    return Array.from({ length: n }, () => Array(n).fill(Stone.Empty));
  }

  function resetGame() {
    state.playing = true;
    state.current = $('input[name="firstPlayer"]:checked').value === 'black' ? Stone.Black : Stone.White;
    state.human = state.current; // human picks first player color
    state.board = createBoard(CELL_COUNT);
    state.history = [];
    state.winner = Stone.Empty;
    state.hintCell = null;
    updateTurnIndicator();
    drawAll();
    if (state.current !== state.human) {
      // AI first move if human chose white
      aiMoveLater();
    }
  }

  function restartGame() {
    const humanColor = state.human; // keep human color
    state.playing = true;
    state.current = humanColor; // human starts for convenience
    state.board = createBoard(CELL_COUNT);
    state.history = [];
    state.winner = Stone.Empty;
    state.hintCell = null;
    updateTurnIndicator();
    drawAll();
  }

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), 1600);
  }

  function drawAll() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    drawBoardGrid();
    drawHint();
    drawStones();
  }

  function drawBoardGrid() {
    const W = canvas.width, H = canvas.height;
    ctx.save();
    ctx.lineWidth = 1 * dpr;
    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    const margin = 24 * dpr;
    const stepX = (W - margin * 2) / (CELL_COUNT - 1);
    const stepY = (H - margin * 2) / (CELL_COUNT - 1);

    // wooden texture overlay
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(255,255,255,0.15)');
    grad.addColorStop(1, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // grid lines
    for (let i = 0; i < CELL_COUNT; i++) {
      const x = margin + i * stepX;
      ctx.beginPath();
      ctx.moveTo(x, margin);
      ctx.lineTo(x, H - margin);
      ctx.stroke();

      const y = margin + i * stepY;
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(W - margin, y);
      ctx.stroke();
    }

    // star points like Go/gomoku
    const stars = starPoints(CELL_COUNT);
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    for (const [i, j] of stars) {
      const x = margin + i * stepX, y = margin + j * stepY;
      ctx.beginPath();
      ctx.arc(x, y, 3 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function starPoints(n) {
    // 15x15 standard star points
    if (n !== 15) return [];
    return [
      [3, 3], [3, 7], [3, 11],
      [7, 3], [7, 7], [7, 11],
      [11, 3], [11, 7], [11, 11]
    ];
  }

  function drawStones() {
    const W = canvas.width, H = canvas.height;
    const margin = 24 * dpr;
    const stepX = (W - margin * 2) / (CELL_COUNT - 1);
    const stepY = (H - margin * 2) / (CELL_COUNT - 1);

    for (let y = 0; y < CELL_COUNT; y++) {
      for (let x = 0; x < CELL_COUNT; x++) {
        const s = state.board[y][x];
        if (s === Stone.Empty) continue;
        const cx = margin + x * stepX;
        const cy = margin + y * stepY;
        drawStone(cx, cy, s);
      }
    }
  }

  function drawStone(cx, cy, color) {
    const r = Math.min(canvas.width, canvas.height) / (CELL_COUNT + 2.2);
    ctx.save();
    const grd = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, r * 0.2, cx, cy, r);
    if (color === Stone.Black) {
      grd.addColorStop(0, '#444');
      grd.addColorStop(0.6, '#111');
      grd.addColorStop(1, '#000');
    } else {
      grd.addColorStop(0, '#fff');
      grd.addColorStop(0.6, '#e9e9e9');
      grd.addColorStop(1, '#cfcfcf');
    }
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHint() {
    const cell = state.hintCell;
    if (!cell) return;
    const W = canvas.width, H = canvas.height;
    const margin = 24 * dpr;
    const stepX = (W - margin * 2) / (CELL_COUNT - 1);
    const stepY = (H - margin * 2) / (CELL_COUNT - 1);
    const cx = margin + cell.x * stepX;
    const cy = margin + cell.y * stepY;
    const r = Math.min(W, H) / (CELL_COUNT + 2.2) * 0.9;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.85)';
    ctx.lineWidth = 2 * dpr;
    ctx.setLineDash([4 * dpr, 4 * dpr]);
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function posToCell(px, py) {
    const rect = canvas.getBoundingClientRect();
    const x = (px - rect.left) * dpr;
    const y = (py - rect.top) * dpr;
    const W = canvas.width, H = canvas.height;
    const margin = 24 * dpr;
    const stepX = (W - margin * 2) / (CELL_COUNT - 1);
    const stepY = (H - margin * 2) / (CELL_COUNT - 1);
    const cx = Math.round((x - margin) / stepX);
    const cy = Math.round((y - margin) / stepY);
    if (cx < 0 || cy < 0 || cx >= CELL_COUNT || cy >= CELL_COUNT) return null;
    return { x: cx, y: cy };
  }

  function isHumanTurn() {
    return state.playing && state.current === state.human;
  }

  function placeStone(x, y, player) {
    if (state.board[y][x] !== Stone.Empty) {
      showToast('非法落子：该位置已有棋子');
      return false;
    }
    state.board[y][x] = player;
    state.history.push({ x, y, player });
    const win = checkWin(x, y, player);
    drawAll();
    sound.play('place');
    if (win) {
      state.playing = false;
      state.winner = player;
      updateTurnIndicator();
      sound.play('win');
      showToast((player === Stone.Black ? '黑' : '白') + '方胜利!');
    } else {
      state.current = player === Stone.Black ? Stone.White : Stone.Black;
      state.hintCell = null;
      updateTurnIndicator();
    }
    return true;
  }

  function aiMoveLater() {
    setTimeout(() => {
      if (!state.playing || state.current === state.human) return;
      const mv = chooseAiMove();
      if (mv) placeStone(mv.x, mv.y, state.current);
    }, 420);
  }

  function chooseAiMove() {
    // Simple heuristic: pick center if empty; else prefer empty cells adjacent to any stone
    if (state.history.length === 0) {
      const mid = Math.floor(CELL_COUNT / 2);
      return { x: mid, y: mid };
    }
    const candidates = new Set();
    const dirs = [ [1,0],[0,1],[1,1],[1,-1],[-1,0],[0,-1],[-1,-1],[-1,1] ];
    for (let y = 0; y < CELL_COUNT; y++) {
      for (let x = 0; x < CELL_COUNT; x++) {
        if (state.board[y][x] !== Stone.Empty) continue;
        for (const [dx, dy] of dirs) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= CELL_COUNT || ny >= CELL_COUNT) continue;
          if (state.board[ny][nx] !== Stone.Empty) {
            candidates.add(y * 100 + x);
            break;
          }
        }
      }
    }
    const list = Array.from(candidates).map(v => ({ x: v % 100, y: Math.floor(v / 100) }));
    const pool = list.length ? list : allEmptyCells();
    // Prefer proximity to last move
    const last = state.history[state.history.length - 1];
    pool.sort((a, b) => dist2(a, last) - dist2(b, last));
    const topK = pool.slice(0, Math.min(8, pool.length));
    return topK[Math.floor(Math.random() * topK.length)] || null;
  }

  function allEmptyCells() {
    const arr = [];
    for (let y = 0; y < CELL_COUNT; y++) for (let x = 0; x < CELL_COUNT; x++) if (state.board[y][x] === Stone.Empty) arr.push({ x, y });
    return arr;
  }

  function dist2(a, b) {
    const dx = a.x - b.x, dy = a.y - b.y; return dx * dx + dy * dy;
  }

  function checkWin(x, y, player) {
    // 4 directions
    const dirs = [ [1,0], [0,1], [1,1], [1,-1] ];
    for (const [dx, dy] of dirs) {
      let count = 1;
      count += countDir(x, y, dx, dy, player);
      count += countDir(x, y, -dx, -dy, player);
      if (count >= 5) return true;
    }
    return false;
  }

  function countDir(x, y, dx, dy, player) {
    let c = 0, nx = x + dx, ny = y + dy;
    while (nx >= 0 && ny >= 0 && nx < CELL_COUNT && ny < CELL_COUNT && state.board[ny][nx] === player) {
      c++; nx += dx; ny += dy;
    }
    return c;
  }

  function updateTurnIndicator() {
    const el = $('#turn-indicator');
    const isBlack = state.playing ? (state.current === Stone.Black) : false;
    const who = state.playing ? (state.current === Stone.Black ? '黑' : '白') : (state.winner ? ((state.winner === Stone.Black ? '黑' : '白') + '胜') : '未开始');
    el.innerHTML = '当前回合：' + (state.playing ? `<span class="dot ${isBlack ? 'black' : 'white'}"></span><span class="label">${who}</span>` : `<span class="label">${who}</span>`);
  }

  function onCanvasClick(ev) {
    ev.preventDefault();
    if (!state.playing) { showToast('请点击“开始”开始对弈'); return; }
    if (!isHumanTurn()) { showToast('等待AI落子...'); return; }
    const cell = posToCell(ev.clientX, ev.clientY);
    if (!cell) return;
    const ok = placeStone(cell.x, cell.y, state.current);
    if (ok && state.playing) aiMoveLater();
  }

  function onCanvasTouch(ev) {
    if (ev.touches && ev.touches.length > 0) {
      const t = ev.touches[0];
      onCanvasClick({ clientX: t.clientX, clientY: t.clientY, preventDefault: () => ev.preventDefault() });
    }
  }

  function undo() {
    if (state.history.length === 0) return;
    // If AI is enabled (always in this demo), undo last two moves to return to human
    let steps = 1;
    if (state.history.length >= 2) steps = 2;
    while (steps-- > 0 && state.history.length > 0) {
      const last = state.history.pop();
      state.board[last.y][last.x] = Stone.Empty;
      state.current = last.player; // restore to who just placed before undo
    }
    state.playing = true;
    state.winner = Stone.Empty;
    state.hintCell = null;
    updateTurnIndicator();
    drawAll();
  }

  function hint() {
    if (!state.playing) { showToast('未开始'); return; }
    if (!isHumanTurn()) { showToast('当前为AI回合'); return; }
    const mv = chooseAiMove();
    if (!mv) return; // board full
    state.hintCell = mv;
    sound.unlock(); // ensure audio is ready on first interaction
    sound.play('hint');
    drawAll();
    clearTimeout(hint._t);
    hint._t = setTimeout(() => { state.hintCell = null; drawAll(); }, 1600);
  }

  function setSound(on) {
    sound.setEnabled(on);
    btnSound.textContent = on ? '🔊 声音开' : '🔈 声音关';
  }

  // Event wiring
  canvas.addEventListener('click', onCanvasClick);
  canvas.addEventListener('touchstart', onCanvasTouch, { passive: false });

  btnStart.addEventListener('click', () => {
    // Unlock audio on first real user gesture
    sound.unlock();
    overlayUnlock.classList.add('hidden');
    resetGame();
  });

  btnRestart.addEventListener('click', () => {
    sound.unlock();
    overlayUnlock.classList.add('hidden');
    restartGame();
  });

  btnUndo.addEventListener('click', () => {
    sound.unlock();
    overlayUnlock.classList.add('hidden');
    undo();
  });

  btnHint.addEventListener('click', () => {
    sound.unlock();
    overlayUnlock.classList.add('hidden');
    hint();
  });

  btnSound.addEventListener('click', () => {
    setSound(!sound.enabled);
  });

  btnUnlock.addEventListener('click', () => {
    sound.unlock();
    overlayUnlock.classList.add('hidden');
    showToast('音频已解锁');
  });

  // Also listen for first pointer/touch anywhere to unlock audio
  window.addEventListener('pointerdown', () => {
    if (!sound.unlocked) {
      sound.unlock();
      overlayUnlock.classList.add('hidden');
    }
  }, { once: true });

  // Initial render
  fitCanvas();
  updateTurnIndicator();

  // Show unlock overlay on mobile devices
  if (/Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    overlayUnlock.classList.remove('hidden');
  }
})();
