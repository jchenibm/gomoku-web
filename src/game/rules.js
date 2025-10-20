// Rules utilities: basic Gomoku (free-style), no forbidden moves.
// Provide win detection and valid move checks.

function inBounds(board, x, y) {
  const n = board?.length || 0;
  return x >= 0 && y >= 0 && x < n && y < n;
}

// Check a direction count for a given last move
function countDirection(board, x, y, dx, dy, player) {
  let cnt = 0;
  let i = 1;
  while (inBounds(board, x + dx * i, y + dy * i) && board[y + dy * i][x + dx * i] === player) {
    cnt++; i++;
  }
  return cnt;
}

// Returns winner player number (1 or 2), or 0 if none
export function checkWin(board, lastMove) {
  if (!lastMove) return 0;
  const { x, y, player } = lastMove;
  if (!inBounds(board, x, y)) return 0;

  // 4 directions
  const dirs = [
    [1, 0],  // horizontal
    [0, 1],  // vertical
    [1, 1],  // diag \
    [1, -1], // diag /
  ];

  for (const [dx, dy] of dirs) {
    const c1 = countDirection(board, x, y, dx, dy, player);
    const c2 = countDirection(board, x, y, -dx, -dy, player);
    if (c1 + c2 + 1 >= 5) return player;
  }
  return 0;
}

export function isValidMove(board, x, y) {
  return board?.[y]?.[x] === 0;
}
