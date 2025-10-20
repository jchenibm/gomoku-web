export const BOARD_SIZE = 15;

export function getBoardGeometry(canvas, size = BOARD_SIZE) {
  const padding = 24; // px
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight || cssW;
  const w = Math.min(cssW, cssH);
  const usable = w - padding * 2;
  const cell = usable / (size - 1);
  const originX = padding;
  const originY = padding;
  return { padding, cssW, cssH, w, usable, cell, originX, originY, size };
}

function drawGrid(ctx, canvas, size = BOARD_SIZE) {
  const g = getBoardGeometry(canvas, size);

  // Clear
  ctx.clearRect(0, 0, g.cssW, g.cssH);

  // Background wood-like tone
  ctx.fillStyle = '#f7d794';
  ctx.fillRect(0, 0, g.cssW, g.cssH);

  ctx.save();
  ctx.translate(g.originX, g.originY);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1;

  // Grid lines
  for (let i = 0; i < size; i++) {
    const x = i * g.cell;
    const y = i * g.cell;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(g.usable, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, g.usable);
    ctx.stroke();
  }

  // Star points (typical Gomoku at 3, 7, 11 on 15x15)
  const stars = size === 15 ? [3, 7, 11] : [];
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  stars.forEach((ix) => {
    stars.forEach((iy) => {
      const x = ix * g.cell;
      const y = iy * g.cell;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  ctx.restore();
}

function stoneColor(value) {
  return value === 1 ? '#111' : '#f5f5f5';
}

function drawStones(ctx, canvas, board, lastMove) {
  const size = board.length;
  const g = getBoardGeometry(canvas, size);
  ctx.save();
  ctx.translate(g.originX, g.originY);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const v = board[y][x];
      if (!v) continue;
      const cx = x * g.cell;
      const cy = y * g.cell;
      const r = Math.max(6, Math.floor(g.cell * 0.42));

      // Shadow
      ctx.beginPath();
      ctx.arc(cx + 1, cy + 1, r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fill();

      // Stone body
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = stoneColor(v);
      ctx.fill();

      // Outline
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Last move marker
      if (lastMove && lastMove.x === x && lastMove.y === y) {
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(2, r * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 120, 220, 0.8)';
        ctx.fill();
      }
    }
  }

  ctx.restore();
}

function drawHint(ctx, canvas, hint, currentPlayer, alpha = 0.35) {
  if (!hint) return;
  const size = hint.size || hint.boardSize || BOARD_SIZE;
  const g = getBoardGeometry(canvas, size);
  ctx.save();
  ctx.translate(g.originX, g.originY);

  const cx = hint.x * g.cell;
  const cy = hint.y * g.cell;
  const r = Math.max(6, Math.floor(g.cell * 0.42));

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  const color = currentPlayer === 2 ? '255,255,255' : '0,0,0';
  ctx.fillStyle = `rgba(${color}, ${alpha})`;
  ctx.fill();

  // Ring
  ctx.beginPath();
  ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(0, 120, 220, 0.8)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.restore();
}

export function drawBoard(ctx, canvas, { board, hint, lastMove, currentPlayer } = {}) {
  const size = board?.length || BOARD_SIZE;
  drawGrid(ctx, canvas, size);
  if (board) drawStones(ctx, canvas, board, lastMove);
  if (hint) drawHint(ctx, canvas, hint, currentPlayer);
}

export function clientToBoard(canvas, clientX, clientY, size = BOARD_SIZE) {
  const g = getBoardGeometry(canvas, size);
  const rect = canvas.getBoundingClientRect();
  const x = clientX - rect.left - g.originX;
  const y = clientY - rect.top - g.originY;
  const gx = Math.round(x / g.cell);
  const gy = Math.round(y / g.cell);
  return { x: gx, y: gy, cell: g.cell };
}
