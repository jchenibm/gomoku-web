// Move generator for Gomoku. Generates promising moves near existing stones.
export function generateMoves(board) {
  const size = board.length;
  const hasStone = [];
  let minX = size, minY = size, maxX = -1, maxY = -1;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      if (board[y][x] !== 0) {
        hasStone.push({ x, y });
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If board empty, suggest center
  if (hasStone.length === 0) {
    const c = Math.floor(size / 2);
    return [{ x: c, y: c }];
  }

  const margin = 2;
  minX = Math.max(0, minX - margin);
  minY = Math.max(0, minY - margin);
  maxX = Math.min(size - 1, maxX + margin);
  maxY = Math.min(size - 1, maxY + margin);

  const candidates = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (board[y][x] !== 0) continue;
      const prox = neighborCount(board, x, y);
      if (prox > 0) candidates.push({ x, y, prox });
    }
  }

  // Sort by proximity score desc
  candidates.sort((a, b) => b.prox - a.prox);
  // Strip prox
  return candidates.map(({ x, y }) => ({ x, y }));
}

function neighborCount(board, x, y) {
  const size = board.length;
  let count = 0;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= size || ny >= size) continue;
      if (board[ny][nx] !== 0) count++;
    }
  }
  return count;
}
