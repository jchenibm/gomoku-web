import { GameState } from './gameState.js';

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const undoBtn = document.getElementById('undoBtn');
const restartBtn = document.getElementById('restartBtn');
const aiToggle = document.getElementById('aiToggle');
const turnLabel = document.getElementById('turnLabel');
const moveCountEl = document.getElementById('moveCount');
const winnerLabel = document.getElementById('winnerLabel');

const SIZE = 15;
const MARGIN = 24; // 画布边距
const GAP = (canvas.width - MARGIN * 2) / (SIZE - 1);

const game = new GameState(SIZE);

function playerName(p) {
  return p === 1 ? '黑' : '白';
}

function drawBoard() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // 木纹背景色在 CSS 设置

  // 网格
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1;
  for (let i = 0; i < SIZE; i++) {
    const x = MARGIN + i * GAP;
    const y = MARGIN + i * GAP;
    // 竖线
    ctx.beginPath();
    ctx.moveTo(x, MARGIN);
    ctx.lineTo(x, canvas.height - MARGIN);
    ctx.stroke();
    // 横线
    ctx.beginPath();
    ctx.moveTo(MARGIN, y);
    ctx.lineTo(canvas.width - MARGIN, y);
    ctx.stroke();
  }

  // 星位（可视化辅助）
  const starIdx = [3, 7, 11];
  ctx.fillStyle = '#333';
  for (const sy of starIdx) {
    for (const sx of starIdx) {
      const cx = MARGIN + sx * GAP;
      const cy = MARGIN + sy * GAP;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 棋子
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const p = game.board.get(x, y);
      if (!p) continue;
      drawStone(x, y, p);
    }
  }

  // 胜利高亮
  if (game.winner && game.winningLine) {
    highlightWin(game.winningLine);
  }
}

function drawStone(x, y, player) {
  const cx = MARGIN + x * GAP;
  const cy = MARGIN + y * GAP;
  const r = GAP * 0.42;

  // 阴影
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = player === 1 ? '#111' : '#f5f5f5';
  ctx.fill();
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#222';
  ctx.stroke();

  // 清除阴影影响
  ctx.shadowColor = 'transparent';
}

function highlightWin(lineCells) {
  // 高亮5子描边
  for (const { x, y } of lineCells) {
    const cx = MARGIN + x * GAP;
    const cy = MARGIN + y * GAP;
    const r = GAP * 0.50;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 196, 0, 0.95)';
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // 连线（首尾）
  const first = lineCells[0];
  const last = lineCells[lineCells.length - 1];
  const x1 = MARGIN + first.x * GAP;
  const y1 = MARGIN + first.y * GAP;
  const x2 = MARGIN + last.x * GAP;
  const y2 = MARGIN + last.y * GAP;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = 'rgba(255, 196, 0, 0.55)';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function screenToCell(px, py) {
  const rect = canvas.getBoundingClientRect();
  const x = (px - rect.left - MARGIN) / GAP;
  const y = (py - rect.top - MARGIN) / GAP;
  let cx = Math.round(x);
  let cy = Math.round(y);
  cx = Math.max(0, Math.min(SIZE - 1, cx));
  cy = Math.max(0, Math.min(SIZE - 1, cy));
  return { x: cx, y: cy };
}

function updateStatus() {
  if (game.winner) {
    winnerLabel.textContent = `胜者：${playerName(game.winner)}`;
    turnLabel.textContent = '当前方：—';
  } else {
    winnerLabel.textContent = '';
    turnLabel.textContent = `当前方：${playerName(game.currentPlayer)}`;
  }
  moveCountEl.textContent = `步数：${game.moveCount}`;
}

function aiMoveRandom() {
  if (!aiToggle.checked) return;
  if (game.frozen) return;
  if (game.currentPlayer !== 2) return; // AI 执白

  const empties = game.board.emptyCells();
  if (empties.length === 0) return;

  // 简单随机策略
  const choice = empties[Math.floor(Math.random() * empties.length)];
  game.makeMove(choice.x, choice.y);
  drawBoard();
  updateStatus();
}

canvas.addEventListener('click', (e) => {
  if (game.frozen) return; // 胜利后冻结
  if (aiToggle.checked && game.currentPlayer === 2) return; // AI回合，忽略用户点击
  const { x, y } = screenToCell(e.clientX, e.clientY);
  const res = game.makeMove(x, y);
  if (!res.ok) return;

  drawBoard();
  updateStatus();

  // AI 回应一步
  if (!res.win) {
    setTimeout(() => {
      aiMoveRandom();
    }, 120);
    // 更新一次（AI行棋后）
    setTimeout(() => {
      drawBoard();
      updateStatus();
    }, 150);
  }
});

undoBtn.addEventListener('click', () => {
  const ok = game.undoPair();
  if (ok) {
    drawBoard();
    updateStatus();
  }
});

restartBtn.addEventListener('click', () => {
  game.reset();
  drawBoard();
  updateStatus();
});

// 初始渲染
drawBoard();
updateStatus();
