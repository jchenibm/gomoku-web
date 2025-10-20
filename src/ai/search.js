// Simple time-bounded negamax search with alpha-beta pruning for Gomoku
import { generateMoves } from './moveGenerator.js';
import { evaluate } from './evaluator.js';
import { checkWin } from '../game/rules.js';

export async function searchBestMove(board, player, options = {}) {
  const timeLimitMs = options.timeLimitMs ?? 1500;
  const maxDepth = options.maxDepth ?? 2;
  const deadline = Date.now() + timeLimitMs;

  // Quick win: if any move wins immediately, take it
  const moves = generateMoves(board);
  for (const m of moves) {
    const b2 = play(board, m.x, m.y, player);
    const win = checkWin(b2, m);
    if (win && win.winner === player) return { x: m.x, y: m.y, score: Infinity };
  }

  let best = null;
  let alpha = -Infinity;
  let beta = Infinity;

  // Iterative deepening
  for (let depth = 1; depth <= maxDepth; depth++) {
    if (Date.now() > deadline) break;
    let currentBest = null;
    for (const m of moves) {
      if (Date.now() > deadline) break;
      const b2 = play(board, m.x, m.y, player);
      const score = -negamax(b2, switchPlayer(player), depth - 1, -beta, -alpha, deadline);
      if (currentBest === null || score > currentBest.score) {
        currentBest = { x: m.x, y: m.y, score };
      }
      if (score > alpha) alpha = score;
    }
    if (currentBest) best = currentBest;
  }

  // Fallback: choose first if nothing
  return best || moves[0] || null;
}

function negamax(board, player, depth, alpha, beta, deadline) {
  if (Date.now() > deadline) return heuristic(board, player);
  const maybeWin = checkWin(board);
  if (maybeWin) return maybeWin.winner === player ? Infinity / 2 : -Infinity / 2;
  if (depth === 0) return heuristic(board, player);

  const moves = generateMoves(board);
  if (moves.length === 0) return 0;

  let best = -Infinity;
  for (const m of moves) {
    if (Date.now() > deadline) break;
    const b2 = play(board, m.x, m.y, player);
    const score = -negamax(b2, switchPlayer(player), depth - 1, -beta, -alpha, deadline);
    if (score > best) best = score;
    if (score > alpha) alpha = score;
    if (alpha >= beta) break; // beta cut
  }
  return best;
}

function heuristic(board, player) {
  return evaluate(board, player);
}

function play(board, x, y, player) {
  const size = board.length;
  const nb = new Array(size);
  for (let i = 0; i < size; i++) {
    nb[i] = board[i].slice();
  }
  nb[y][x] = player;
  return nb;
}

function switchPlayer(p) {
  return p === 1 ? 2 : 1;
}
