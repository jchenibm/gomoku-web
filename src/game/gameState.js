import { BOARD_SIZE } from './board.js';

export class GameState {
  constructor({ boardSize = BOARD_SIZE } = {}) {
    this.boardSize = boardSize;
    this.reset();
  }

  reset() {
    this.board = Array.from({ length: this.boardSize }, () => Array(this.boardSize).fill(0));
    this.current = 1; // 1: black, 2: white
    this.history = [];
  }
}
