export const BOARD_SIZE = 15;

function drawGrid(ctx, canvas, size = BOARD_SIZE) {
  const padding = 24; // px
  const cssW = canvas.clientWidth;
  const cssH = canvas.clientHeight || cssW;
  const w = Math.min(cssW, cssH);
  const usable = w - padding * 2;
  const cell = usable / (size - 1);

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

export function drawBoard(ctx, canvas, size = BOARD_SIZE) {
  drawGrid(ctx, canvas, size);
}
