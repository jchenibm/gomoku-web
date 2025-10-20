import { drawBoard, BOARD_SIZE, clientToBoard, getBoardGeometry } from './game/board.js';
import { GameState } from './game/gameState.js';
import { isValidMove, checkWin } from './game/rules.js';
import { searchBestMove } from './ai/search.js';
import { setSoundEnabled, playPlace, playWin, playHint } from './game/sounds.js';

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

const els = {
  firstPlayer: document.getElementById('firstPlayer'),
  btnUndo: document.getElementById('btnUndo'),
  btnRestart: document.getElementById('btnRestart'),
  btnHint: document.getElementById('btnHint'),
  toggleSound: document.getElementById('toggleSound'),
  status: document.getElementById('status')
};

const state = new GameState({ boardSize: BOARD_SIZE });
let gameOver = false;
let hintMove = null; // {x,y}
let computingHint = false;

function setStatus(text) {
  if (els.status) els.status.textContent = text;
}

function resizeCanvasToDisplaySize() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height || rect.width);
  const target = Math.max(320, Math.min(640, Math.floor(size)));

  canvas.width = Math.floor(target * dpr);
  canvas.height = Math.floor(target * dpr);

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function render() {
  resizeCanvasToDisplaySize();
  drawBoard(ctx, canvas, {
    board: state.board,
    hint: gameOver ? null : hintMove,
    lastMove: state.history[state.history.length - 1] || null,
    currentPlayer: state.current
  });
}

function switchTurn() {
  state.current = state.current === 1 ? 2 : 1;
}

function updateControls() {
  els.btnUndo.disabled = state.history.length === 0;
  els.btnHint.disabled = computingHint || gameOver;
}

function describePlayer(p) {
  return p === 1 ? '黑' : '白';
}

function placeMove(x, y) {
  if (!isValidMove(state.board, x, y) || gameOver) return;
  state.board[y][x] = state.current;
  state.history.push({ x, y, player: state.current });
  hintMove = null; // placing a move clears previous hint
  playPlace();

  const win = checkWin(state.board, { x, y });
  if (win) {
    gameOver = true;
    setStatus(`${describePlayer(win.winner)}方胜！`);
    playWin();
  } else {
    switchTurn();
    setStatus(`轮到 ${describePlayer(state.current)} 方`);
  }

  updateControls();
  render();
}

function onPointerDown(ev) {
  // Support tap/click with tolerance
  const size = state.boardSize || BOARD_SIZE;
  const pt = clientToBoard(canvas, ev.clientX, ev.clientY, size);
  const g = getBoardGeometry(canvas, size);

  const cx = pt.x * g.cell + g.originX;
  const cy = pt.y * g.cell + g.originY;
  const dx = ev.clientX - canvas.getBoundingClientRect().left - cx;
  const dy = ev.clientY - canvas.getBoundingClientRect().top - cy;
  const dist = Math.hypot(dx, dy);

  // Touch-friendly tolerance: slightly larger on small screens
  const baseTol = 0.45; // of a cell
  const smallScreen = Math.min(window.innerWidth, window.innerHeight) < 480;
  const tol = (smallScreen ? 0.55 : baseTol) * g.cell;

  if (dist <= tol) {
    placeMove(pt.x, pt.y);
  }
}

// Controls
els.firstPlayer.addEventListener('change', () => {
  // For now just reset and start with black
  resetGame();
  setStatus(`已重开，先手：玩家（黑）`);
});

els.btnUndo.addEventListener('click', () => {
  if (state.history.length === 0) return;
  const last = state.history.pop();
  state.board[last.y][last.x] = 0;
  gameOver = false;
  hintMove = null;
  state.current = last.player; // revert turn to the player who just moved
  setStatus(`悔棋：轮到 ${describePlayer(state.current)} 方`);
  updateControls();
  render();
});

function resetGame() {
  state.reset();
  gameOver = false;
  hintMove = null;
  computingHint = false;
  updateControls();
  render();
}

els.btnRestart.addEventListener('click', () => {
  resetGame();
  setStatus('已重开');
});

els.btnHint.addEventListener('click', async () => {
  if (computingHint || gameOver) return;
  computingHint = true;
  updateControls();
  els.btnHint.classList.add('loading');
  setStatus('计算提示中…');

  try {
    const res = await searchBestMove(state.board, state.current, { timeLimitMs: 1500, maxDepth: 2 });
    if (res) {
      hintMove = { x: res.x, y: res.y, boardSize: state.boardSize };
      playHint();
      setStatus(`建议：${describePlayer(state.current)} 落在 (${res.x + 1}, ${res.y + 1})`);
    } else {
      setStatus('暂无建议');
      hintMove = null;
    }
  } catch (e) {
    console.error(e);
    setStatus('提示失败');
    hintMove = null;
  } finally {
    computingHint = false;
    els.btnHint.classList.remove('loading');
    updateControls();
    render();
  }
});

els.toggleSound.addEventListener('change', () => {
  const enabled = !!els.toggleSound.checked;
  setSoundEnabled(enabled);
  setStatus(`音效：${enabled ? '开' : '关'}`);
});

// Pointer events
canvas.addEventListener('pointerdown', onPointerDown, { passive: true });
window.addEventListener('resize', render);

// Initial render
render();
setStatus('准备就绪，点击棋盘开始对局');
