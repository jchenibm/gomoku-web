import { drawBoard, BOARD_SIZE } from './game/board.js';
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

function render() {
  resizeCanvasToDisplaySize();
  drawBoard(ctx, canvas);
}

// Wire controls (placeholders)
els.firstPlayer.addEventListener('change', () => {
  setStatus(`已切换先手：${els.firstPlayer.value === 'human' ? '玩家' : 'AI'}`);
});

els.btnUndo.addEventListener('click', () => {
  // Placeholder: actual undo logic will be implemented later
  setStatus('悔棋（占位）');
});

els.btnRestart.addEventListener('click', () => {
  state.reset();
  setStatus('已重开');
  render();
});

els.btnHint.addEventListener('click', () => {
  // Placeholder: will request AI hint in future tasks
  setStatus('提示（占位）');
});

els.toggleSound.addEventListener('change', () => {
  soundEnabled = !!els.toggleSound.checked;
  setStatus(`音效：${soundEnabled ? '开' : '关'}`);
});

window.addEventListener('resize', render);

// Initial render
render();
setStatus('准备就绪，祝游戏愉快！');
