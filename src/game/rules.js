// Gomoku rules utilities

export function isValidMove(board, x, y) {
  const size = board?.length || 0;
  if (x < 0 || y < 0 || x >= size || y >= size) return false;
  return board?.[y]?.[x] === 0;
}

export function checkWin(board, lastMove) {
  const size = board.length;
  const dirs = [
    [1, 0], // horizontal
    [0, 1], // vertical
    [1, 1], // diag down-right
    [1, -1] // diag up-right
  ];

  const checkFrom = (x, y) => {
    const v = board[y][x];
    if (!v) return null;
    for (const [dx, dy] of dirs) {
      let count = 1;
      const cells = [{ x, y }];

      // Extend one direction
      let nx = x + dx;
      let ny = y + dy;
      while (nx >= 0 && ny >= 0 && nx < size && ny < size && board[ny][nx] === v) {
        cells.push({ x: nx, y: ny });
        count++;
        nx += dx;
        ny += dy;
      }

      // Extend opposite
      nx = x - dx;
      ny = y - dy;
      while (nx >= 0 && ny >= 0 && nx < size && ny < size && board[ny][nx] === v) {
        cells.unshift({ x: nx, y: ny });
        count++;
        nx -= dx;
        ny -= dy;
      }

      if (count >= 5) return { winner: v, line: cells.slice(0, 5) };
    }
    return null;
  };

  if (lastMove) {
    return checkFrom(lastMove.x, lastMove.y);
  }

  // Fallback: scan all
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const res = checkFrom(x, y);
      if (res) return res;
    }
  }
  return null;
}
