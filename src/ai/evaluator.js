// Heuristic evaluator based on Gomoku patterns.
// Patterns considered: open two/three/four, closed three/four, five or more.
// No forbidden move handling (free-style).

function inBounds(board, x, y) {
  const n = board?.length || 0;
  return x >= 0 && y >= 0 && x < n && y < n;
}

function lineOpenEnds(board, x, y, dx, dy, len, player) {
  // Check both ends adjacent to the segment [x..x+dx*(len-1), y..]
  const sx = x - dx;
  const sy = y - dy;
  const ex = x + dx * len;
  const ey = y + dy * len;
  let open = 0;
  if (inBounds(board, sx, sy) && board[sy][sx] === 0) open++;
  if (inBounds(board, ex, ey) && board[ey][ex] === 0) open++;
  return open; // 0,1,2
}

function scoreSegment(len, openEnds) {
  if (len >= 5) return 10000000; // five or more
  if (len === 4) {
    if (openEnds === 2) return 1000000; // open four (活四)
    if (openEnds === 1) return 100000;  // closed four (冲四)
  }
  if (len === 3) {
    if (openEnds === 2) return 12000;   // open three (活三)
    if (openEnds === 1) return 1500;    // closed three (眠三)
  }
  if (len === 2) {
    if (openEnds === 2) return 400;     // open two (活二)
    if (openEnds === 1) return 100;     // closed two (眠二)
  }
  if (len === 1) {
    if (openEnds === 2) return 20;
    if (openEnds === 1) return 4;
  }
  return 0;
}

function evalForPlayer(board, player) {
  const n = board.length;
  let total = 0;
  const dirs = [
    [1, 0],  // horizontal
    [0, 1],  // vertical
    [1, 1],  // diag \
    [1, -1], // diag /
  ];

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (board[y][x] !== player) continue;
      for (const [dx, dy] of dirs) {
        const px = x - dx;
        const py = y - dy;
        // Only count segment if this is the start (previous is not same player)
        if (inBounds(board, px, py) && board[py][px] === player) continue;
        // count length forward
        let len = 0;
        while (inBounds(board, x + dx * len, y + dy * len) && board[y + dy * len][x + dx * len] === player) {
          len++;
        }
        const openEnds = lineOpenEnds(board, x, y, dx, dy, len, player);
        total += scoreSegment(len, openEnds);
      }
    }
  }
  return total;
}

export function evaluate(board, player) {
  // Positive is good for 'player'
  const self = evalForPlayer(board, player);
  const opp = evalForPlayer(board, 3 - player);
  // Slightly weight opponent to encourage defense
  return self - Math.floor(opp * 1.05);
}
