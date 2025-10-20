import { drawBoard, BOARD_SIZE, pointToCell } from './game/board.js';
import { GameState } from './game/gameState.js';

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
let soundEnabled = true;
let aiPlayer = els.firstPlayer.value === 'ai' ? 1 : 2; // 1: black, 2: white
let aiWorker = null;
let aiThinking = false;
let searchId = 0;
let currentSearchId = 0;

function ensureWorker() {
  if (aiWorker) return aiWorker;
  aiWorker = new Worker('src/worker/aiWorker.js', { type: 'module' });
  aiWorker.onmessage = (ev) => {
    const { type, id, payload } = ev.data || {};
    if (id != null && id !== currentSearchId) {
      return; // stale message
    }
    switch (type) {
      case 'PROGRESS': {
        setStatus(`AI 思考中… 深度 ${payload?.depth ?? ''}`);
        break;
      }
      case 'RESULT': {
        const res = payload;
        if (aiThinking) {
          aiThinking = false;
          if (res?.move && !state.winner) {
            state.place(res.move.x, res.move.y);
            render();
            if (state.winner) {
              setStatus(`AI 获胜！`);
            } else {
              setStatus('轮到玩家');
            }
          }
        } else {
          if (res?.move) {
            setStatus(`提示：建议下在 (${res.move.x + 1}, ${res.move.y + 1})`);
          } else {
            setStatus('暂无可行提示');
          }
        }
        break;
      }
      case 'CANCELLED': {
        aiThinking = false;
        setStatus('AI 已中止');
        break;
      }
      case 'ERROR': {
        aiThinking = false;
        setStatus(`AI 出错：${payload?.message || '未知错误'}`);
        break;
      }
    }
  };
  return aiWorker;
}

function setStatus(text) {
  if (els.status) els.status.textContent = text;
}

function resizeCanvasToDisplaySize() {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const size = Math.min(rect.width, rect.height || rect.width);
  const target = Math.max(300, Math.min(640, Math.floor(size)));

  canvas.width = Math.floor(target * dpr);
  canvas.height = Math.floor(target * dpr);

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function updateControls() {
  if (els.btnUndo) els.btnUndo.disabled = state.history.length === 0;
}

function render() {
  resizeCanvasToDisplaySize();
  drawBoard(ctx, canvas, BOARD_SIZE, state.board, state.lastMove);
  updateControls();
}

function startAiTurn({ hint = false } = {}) {
  if (state.winner) return;
  if (state.current !== aiPlayer) return;
  const worker = ensureWorker();
  cancelAi();
  aiThinking = true;
  currentSearchId = ++searchId;
  setStatus(hint ? 'AI 计算提示中…' : 'AI 思考中…');
  worker.postMessage({ type: 'SEARCH', payload: {
    id: currentSearchId,
    board: state.board,
    player: aiPlayer,
    options: {
      timeLimitMs: hint ? 800 : 1600,
      maxDepth: 6,
      neighborDistance: 2,
      moveLimit: 28,
    }
  } });
}

function cancelAi() {
  if (aiWorker) aiWorker.postMessage({ type: 'CANCEL' });
}

function restartGame() {
  cancelAi();
  state.reset();
  aiPlayer = els.firstPlayer.value === 'ai' ? 1 : 2;
  render();
  setStatus('已重开');
  if (aiPlayer === 1) {
    // AI opens
    startAiTurn();
  } else {
    setStatus('玩家先手');
  }
}

function onCanvasClick(e) {
  if (state.winner) return;
  if (state.current === aiPlayer) return; // wait for AI
  const cell = pointToCell(canvas, e.clientX, e.clientY, BOARD_SIZE);
  if (!cell) return;
  const ok = state.place(cell.x, cell.y);
  if (!ok) return;
  render();
  if (state.winner) {
    setStatus('玩家获胜！');
    return;
  }
  // AI turn now
  startAiTurn();
}

// Wire controls
els.firstPlayer.addEventListener('change', () => {
  restartGame();
});

els.btnUndo.addEventListener('click', () => {
  cancelAi();
  if (state.undo()) {
    if (state.current === aiPlayer) {
      // Also undo AI move to give control back to player
      state.undo();
    }
    render();
    setStatus('已悔棋');
  }
});

els.btnRestart.addEventListener('click', () => {
  restartGame();
});

els.btnHint.addEventListener('click', () => {
  if (state.winner || aiThinking) return;
  // Perform a background search for hint, but do not place the stone
  const worker = ensureWorker();
  currentSearchId = ++searchId;
  worker.postMessage({ type: 'SEARCH', payload: {
    id: currentSearchId,
    board: state.board,
    player: state.current,
    options: { timeLimitMs: 800, maxDepth: 5, neighborDistance: 2, moveLimit: 24 }
  } });
  setStatus('正在计算提示…');
  // We will handle the result in onmessage but avoid placing if current !== aiPlayer
});

els.toggleSound.addEventListener('change', () => {
  soundEnabled = !!els.toggleSound.checked;
  setStatus(`音效：${soundEnabled ? '开' : '关'}`);
});

canvas.addEventListener('click', onCanvasClick);
window.addEventListener('resize', render);

// Initial render
render();
setStatus('准备就绪，祝游戏愉快！');

// If AI is set to go first by default, start
if (aiPlayer === 1) startAiTurn();
