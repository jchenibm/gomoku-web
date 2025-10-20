import { evaluate } from './evaluator.js';
import { generateMoves } from './moveGenerator.js';
import { checkWin } from '../game/rules.js';

const INF = 1e12;

function clone2D(board) {
  return board.map(row => row.slice());
}

function applyMove(board, move, player) {
  board[move.y][move.x] = player;
}

function undoMove(board, move) {
  board[move.y][move.x] = 0;
}

function isTimeout(deadline) {
  return deadline && Date.now() >= deadline;
}

export async function searchBestMove(boardIn, player, options = {}) {
  const timeLimitMs = options.timeLimitMs ?? 1500;
  const maxDepth = options.maxDepth ?? 6;
  const neighborDistance = options.neighborDistance ?? 2;
  const moveLimit = options.moveLimit ?? 24;
  const shouldAbort = options.shouldAbort || (() => false);
  const onProgress = options.onProgress || (() => {});

  const board = clone2D(boardIn);
  const deadline = Date.now() + timeLimitMs;
  let best = { move: null, score: -INF, depth: 0 };

  function search(depth, alpha, beta, currentPlayer, lastMove) {
    if (shouldAbort() || isTimeout(deadline)) throw new Error('ABORT');

    const winner = lastMove ? checkWin(board, lastMove) : 0;
    if (winner) {
      const score = winner === player ? INF - (maxDepth - depth) : -INF + (maxDepth - depth);
      return score;
    }

    if (depth === 0) {
      return evaluate(board, player);
    }

    // Move generation with ordering
    const moves = generateMoves(board, currentPlayer, { neighborDistance, limit: moveLimit });

    if (moves.length === 0) {
      // No moves: evaluate as draw-ish
      return 0;
    }

    if (currentPlayer === player) {
      let value = -INF;
      for (let i = 0; i < moves.length; i++) {
        const m = moves[i];
        applyMove(board, m, currentPlayer);
        const v = search(depth - 1, alpha, beta, 3 - currentPlayer, { x: m.x, y: m.y, player: currentPlayer });
        undoMove(board, m);
        if (v > value) value = v;
        if (v > alpha) alpha = v;
        if (alpha >= beta) break; // beta cut-off
      }
      return value;
    } else {
      let value = INF;
      for (let i = 0; i < moves.length; i++) {
        const m = moves[i];
        applyMove(board, m, currentPlayer);
        const v = search(depth - 1, alpha, beta, 3 - currentPlayer, { x: m.x, y: m.y, player: currentPlayer });
        undoMove(board, m);
        if (v < value) value = v;
        if (v < beta) beta = v;
        if (alpha >= beta) break; // alpha cut-off
      }
      return value;
    }
  }

  // Iterative deepening
  for (let depth = 1; depth <= maxDepth; depth++) {
    let bestAtDepth = { move: null, score: -INF };
    try {
      const moves = generateMoves(board, player, { neighborDistance, limit: moveLimit });
      // Principal Variation search: try previous best first if exists
      if (best.move) {
        const idx = moves.findIndex(m => m.x === best.move.x && m.y === best.move.y);
        if (idx > 0) {
          const [mv] = moves.splice(idx, 1);
          moves.unshift(mv);
        }
      }

      let alpha = -INF, beta = INF;
      for (let i = 0; i < moves.length; i++) {
        const m = moves[i];
        applyMove(board, m, player);
        const v = search(depth - 1, alpha, beta, 3 - player, { x: m.x, y: m.y, player });
        undoMove(board, m);

        if (v > bestAtDepth.score) {
          bestAtDepth = { move: { x: m.x, y: m.y }, score: v };
          if (v > alpha) alpha = v;
        }

        if (shouldAbort() || isTimeout(deadline)) throw new Error('ABORT');
      }

      best = { ...bestAtDepth, depth };
      onProgress({ depth, best });

      if (Math.abs(best.score) >= INF / 2) break; // decisive
    } catch (e) {
      if (e && e.message === 'ABORT') {
        break; // use last best
      } else {
        throw e;
      }
    }
  }

  if (!best.move) {
    // Fallback: choose first available cell (should rarely happen)
    outer: for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board.length; x++) {
        if (board[y][x] === 0) { best.move = { x, y }; best.score = 0; break outer; }
      }
    }
  }

  return best;
}
