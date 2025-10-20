export const BOARD_SIZE = 15;

function getMetrics(canvas, size = BOARD_SIZE) {
  const padding = 24; // px
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight || cssW;
  const w = Math.min(cssW, cssH);
  const usable = w - padding * 2;
  const cell = usable / (size - 1);
  return { padding, cssW, cssH, usable, cell };
}

function drawGrid(ctx, canvas, size = BOARD_SIZE) {
  const { padding, cssW, cssH, usable, cell } = getMetrics(canvas, size);

  // Clear
  ctx.clearRect(0, 0, cssW, cssH);

  // Background wood-like tone
  ctx.fillStyle = '#f7d794';
  ctx.fillRect(0, 0, cssW, cssH);

  ctx.save();
  ctx.translate(padding, padding);
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.lineWidth = 1;

  // Grid lines
  for (let i = 0; i < size; i++) {
    const x = i * cell;
    const y = i * cell;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(usable, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, usable);
    ctx.stroke();
  }

  // Star points (typical Gomoku at 3, 7, 11 on 15x15)
  const stars = [3, 7, 11];
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  stars.forEach(ix => {
    stars.forEach(iy => {
      const x = ix * cell;
      const y = iy * cell;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  });

  ctx.restore();
}

function drawPieces(ctx, canvas, board, size = BOARD_SIZE, lastMove) {
  if (!board) return;
  const { padding, cell } = getMetrics(canvas, size);
  ctx.save();
  ctx.translate(padding, padding);

  const n = board.length;
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const v = board[y][x];
      if (!v) continue;
      const cx = x * cell;
      const cy = y * cell;
      ctx.beginPath();
      ctx.arc(cx, cy, Math.max(6, cell * 0.4), 0, Math.PI * 2);
      if (v === 1) {
        ctx.fillStyle = '#111';
        ctx.fill();
      } else {
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#111';
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  // Highlight last move
  if (lastMove) {
    const { x, y } = lastMove;
    const cx = x * cell;
    const cy = y * cell;
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,0,0,0.8)';
    ctx.lineWidth = 2;
    ctx.arc(cx, cy, Math.max(6, cell * 0.46), 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawBoard(ctx, canvas, size = BOARD_SIZE, board, lastMove) {
  drawGrid(ctx, canvas, size);
  drawPieces(ctx, canvas, board, size, lastMove);
}

export function pointToCell(canvas, clientX, clientY, size = BOARD_SIZE) {
  const { padding, cssW, cssH, usable, cell } = getMetrics(canvas, size);
  const rect = canvas.getBoundingClientRect();
  // transform to canvas local CSS coords
  const x = clientX - rect.left - padding;
  const y = clientY - rect.top - padding;
  const gx = Math.round(x / cell);
  const gy = Math.round(y / cell);
  if (gx < 0 || gy < 0 || x < -cell * 0.5 || y < -cell * 0.5) return null;
  const max = size - 1;
  if (gx > max || gy > max) return null;
  return { x: gx, y: gy };
}
