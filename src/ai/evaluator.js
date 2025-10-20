// Heuristic evaluator for Gomoku board positions
// board: 2D array, 0 empty, 1 black, 2 white
// player: current player (1 or 2). Returns positive scores good for 'player'.

const SCORE = {
  FIVE: 100000,
  OPEN_FOUR: 12000,
  CLOSED_FOUR: 3500,
  OPEN_THREE: 1200,
  CLOSED_THREE: 350,
  OPEN_TWO: 80,
  CLOSED_TWO: 20
};

export function evaluate(board, player) {
  const opponent = player === 1 ? 2 : 1;
  const sPlayer = evalFor(board, player);
  const sOpp = evalFor(board, opponent);
  return sPlayer - sOpp * 0.95; // slightly discount opponent to encourage attack
}

function evalFor(board, player) {
  const size = board.length;
  let score = 0;
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1]
  ];

  for (const [dx, dy] of dirs) {
    // enumerate start points for each line to avoid duplicates
    const starts = lineStarts(size, dx, dy);
    for (const [sx, sy] of starts) {
      let x = sx;
      let y = sy;
      let runVal = 0;
      let runLen = 0;

      while (x >= 0 && y >= 0 && x < size && y < size) {
        const v = board[y][x];
        if (v === runVal) {
          runLen++;
        } else {
          if (runVal === player) score += segmentScore(board, x - dx, y - dy, dx, dy, runLen);
          runVal = v;
          runLen = 1;
        }
        x += dx;
        y += dy;
      }
      if (runVal === player) score += segmentScore(board, x - dx, y - dy, dx, dy, runLen);
    }
  }
  return score;
}

function lineStarts(size, dx, dy) {
  const starts = [];
  if (dx === 1 && dy === 0) {
    for (let y = 0; y < size; y++) starts.push([0, y]);
  } else if (dx === 0 && dy === 1) {
    for (let x = 0; x < size; x++) starts.push([x, 0]);
  } else if (dx === 1 && dy === 1) {
    for (let i = 0; i < size; i++) starts.push([0, i]);
    for (let i = 1; i < size; i++) starts.push([i, 0]);
  } else if (dx === 1 && dy === -1) {
    for (let i = 0; i < size; i++) starts.push([0, i]);
    for (let i = 1; i < size; i++) starts.push([i, size - 1]);
  }
  return starts;
}

function segmentScore(board, xEnd, yEnd, dx, dy, len) {
  // xEnd,yEnd is last coord of the segment with value 'player'
  const size = board.length;
  // Find start coordinate
  const xStart = xEnd - (len - 1) * dx;
  const yStart = yEnd - (len - 1) * dy;

  // Check open ends
  const preX = xStart - dx;
  const preY = yStart - dy;
  const postX = xEnd + dx;
  const postY = yEnd + dy;

  const preEmpty = preX >= 0 && preY >= 0 && preX < size && preY < size && board[preY][preX] === 0;
  const postEmpty = postX >= 0 && postY >= 0 && postX < size && postY < size && board[postY][postX] === 0;
  const openEnds = (preEmpty ? 1 : 0) + (postEmpty ? 1 : 0);

  if (len >= 5) return SCORE.FIVE;
  if (len === 4) {
    if (openEnds === 2) return SCORE.OPEN_FOUR;
    if (openEnds === 1) return SCORE.CLOSED_FOUR;
  }
  if (len === 3) {
    if (openEnds === 2) return SCORE.OPEN_THREE;
    if (openEnds === 1) return SCORE.CLOSED_THREE;
  }
  if (len === 2) {
    if (openEnds === 2) return SCORE.OPEN_TWO;
    if (openEnds === 1) return SCORE.CLOSED_TWO;
  }
  return 0;
}
