// Placeholder for rules utilities
// Will include win detection, valid move checks, etc.

export function checkWin(board, lastMove) {
  // TODO: Implement win checking
  return false;
}

export function isValidMove(board, x, y) {
  return board?.[y]?.[x] === 0;
}
