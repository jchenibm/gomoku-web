import { BOARD_SIZE } from './board.js';
import { checkWin } from './rules.js';

export class GameState {
  constructor({ boardSize = BOARD_SIZE } = {}) {
    this.boardSize = boardSize;
    this.reset();
  }

  reset() {
    this.board = Array.from({ length: this.boardSize }, () => Array(this.boardSize).fill(0));
    this.current = 1; // 1: black, 2: white
    this.history = [];
    this.lastMove = null;
    this.winner = 0;
  }

  place(x, y) {
    if (this.winner) return false;
    if (this.board?.[y]?.[x] === undefined) return false;
    if (this.board[y][x] !== 0) return false;
    const player = this.current;
    this.board[y][x] = player;
    const move = { x, y, player };
    this.history.push(move);
    this.lastMove = move;
    // Check win
    const w = checkWin(this.board, move);
    if (w) this.winner = w;
    // Switch turn if no winner
    if (!this.winner) this.current = 3 - this.current;
    return true;
  }

  undo() {
    if (this.history.length === 0) return false;
    const last = this.history.pop();
    this.board[last.y][last.x] = 0;
    this.current = last.player; // revert to the player who made the undone move
    this.winner = 0;
    this.lastMove = this.history[this.history.length - 1] || null;
    return true;
  }
}
