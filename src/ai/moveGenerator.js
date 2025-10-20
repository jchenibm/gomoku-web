// Move generator: generate candidate moves near existing stones (1–2 cells),
// deduplicate, heuristically score and sort (longer lines prioritized),
// and limit to top N candidates.

function inBounds(board, x, y) {
  const n = board?.length || 0;
  return x >= 0 && y >= 0 && x < n && y < n;
}

function hasNeighbor(board, x, y, dist) {
  const n = board.length;
  for (let dy = -dist; dy <= dist; dy++) {
    for (let dx = -dist; dx <= dist; dx++) {
      if (dx === 0 && dy === 0) continue;
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue;
      if (board[ny][nx] !== 0) return true;
    }
  }
  return false;
}

function countDir(board, x, y, dx, dy, player) {
  let c = 0;
  let i = 1;
  while (inBounds(board, x + dx * i, y + dy * i) && board[y + dy * i][x + dx * i] === player) { c++; i++; }
  return c;
}

function openEndsForPlaced(board, x, y, dx, dy, c1, c2) {
  const n1x = x + dx * (c1 + 1);
  const n1y = y + dy * (c1 + 1);
  const n2x = x - dx * (c2 + 1);
  const n2y = y - dy * (c2 + 1);
  let open = 0;
  if (inBounds(board, n1x, n1y) && board[n1y][n1x] === 0) open++;
  if (inBounds(board, n2x, n2y) && board[n2y][n2x] === 0) open++;
  return open;
}

function quickMoveScore(board, x, y, player) {
  // Heuristic per move: check max line length and open ends for both sides
  const opp = 3 - player;
  const dirs = [ [1,0], [0,1], [1,1], [1,-1] ];
  let bestLenP = 0, bestOpenP = 0;
  let bestLenO = 0, bestOpenO = 0;

  for (const [dx, dy] of dirs) {
    const c1p = countDir(board, x, y, dx, dy, player);
    const c2p = countDir(board, x, y, -dx, -dy, player);
    const lenP = c1p + c2p + 1;
    const openP = openEndsForPlaced(board, x, y, dx, dy, c1p, c2p);
    if (lenP > bestLenP || (lenP === bestLenP && openP > bestOpenP)) {
      bestLenP = lenP; bestOpenP = openP;
    }

    const c1o = countDir(board, x, y, dx, dy, opp);
    const c2o = countDir(board, x, y, -dx, -dy, opp);
    const lenO = c1o + c2o + 1;
    const openO = openEndsForPlaced(board, x, y, dx, dy, c1o, c2o);
    if (lenO > bestLenO || (lenO === bestLenO && openO > bestOpenO)) {
      bestLenO = lenO; bestOpenO = openO;
    }
  }

  if (bestLenP >= 5) return 100000000; // winning move
  if (bestLenO >= 5) return 90000000;  // must-block

  // Prefer center proximity slightly
  const n = board.length;
  const cx = (n - 1) / 2;
  const cy = (n - 1) / 2;
  const centerBoost = 10 - Math.hypot(x - cx, y - cy);

  // Combine: prioritize own longer lines, then opponent threats
  const sP = bestLenP * 1000 + bestOpenP * 120;
  const sO = bestLenO * 900 + bestOpenO * 100;
  return Math.floor(sP + sO + centerBoost);
}

export function generateMoves(board, player, options = {}) {
  const n = board.length;
  const dist = options.neighborDistance ?? 2;
  const limit = options.limit ?? 24;

  // If empty board, play center
  let anyStone = false;
  for (let y = 0; y < n && !anyStone; y++) {
    for (let x = 0; x < n && !anyStone; x++) {
      if (board[y][x] !== 0) anyStone = true;
    }
  }
  if (!anyStone) {
    const c = Math.floor(n / 2);
    return [{ x: c, y: c, score: 0 }];
  }

  const moves = [];
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (board[y][x] !== 0) continue;
      if (!hasNeighbor(board, x, y, dist)) continue;
      const score = quickMoveScore(board, x, y, player);
      moves.push({ x, y, score });
    }
  }

  moves.sort((a, b) => b.score - a.score);
  return moves.slice(0, limit);
}
