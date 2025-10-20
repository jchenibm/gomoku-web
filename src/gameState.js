import { Board } from './board.js';

export class GameState {
  constructor(size = 15) {
    this.board = new Board(size);
    this.size = size;
    this.currentPlayer = 1; // 1: 黑, 2: 白
    this.moveCount = 0;
    this.history = []; // {x,y,player}
    this.winner = 0; // 0: 无, 1: 黑, 2: 白
    this.winningLine = null; // [{x,y} * 5]
    this.frozen = false;
  }

  reset() {
    this.board.reset();
    this.currentPlayer = 1;
    this.moveCount = 0;
    this.history = [];
    this.winner = 0;
    this.winningLine = null;
    this.frozen = false;
  }

  makeMove(x, y) {
    if (this.frozen) return { ok: false, reason: 'frozen' };
    if (!this.board.inBounds(x, y)) return { ok: false, reason: 'out_of_bounds' };
    if (!this.board.isEmpty(x, y)) return { ok: false, reason: 'occupied' };

    const ok = this.board.place(x, y, this.currentPlayer);
    if (!ok) return { ok: false, reason: 'place_failed' };

    this.history.push({ x, y, player: this.currentPlayer });
    this.moveCount += 1;

    const winInfo = this.checkWinFrom(x, y, this.currentPlayer);
    if (winInfo.win) {
      this.winner = this.currentPlayer;
      this.winningLine = winInfo.line;
      this.frozen = true;
    } else {
      this.togglePlayer();
    }

    return { ok: true, win: !!winInfo.win, winner: this.winner, winningLine: this.winningLine };
  }

  togglePlayer() {
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
  }

  undoPair() {
    // 撤销两步（玩家+AI），若不足两步则不动作
    if (this.history.length < 2) return false;

    for (let i = 0; i < 2; i++) {
      const last = this.history.pop();
      if (!last) break;
      this.board.remove(last.x, last.y);
      this.moveCount -= 1;
      this.currentPlayer = last.player; // 回到撤销手的落子方
    }

    // 撤销后清除胜负状态，再从头检查一次（简化处理）
    this.winner = 0;
    this.winningLine = null;
    this.frozen = false;

    const replayWin = this.recomputeWinner();
    if (replayWin.win) {
      this.winner = replayWin.winner;
      this.winningLine = replayWin.line;
      this.frozen = true;
    }

    return true;
  }

  recomputeWinner() {
    const dirs = [ [1,0], [0,1], [1,1], [1,-1] ];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        const p = this.board.get(x, y);
        if (!p) continue;
        for (const [dx, dy] of dirs) {
          const info = this.lineInfoFrom(x, y, p, dx, dy);
          if (info.len >= 5) {
            const line = this.extractFiveIncluding({ x, y }, info.cells);
            return { win: true, winner: p, line };
          }
        }
      }
    }
    return { win: false };
  }

  checkWinFrom(x, y, player) {
    const dirs = [ [1,0], [0,1], [1,1], [1,-1] ];
    for (const [dx, dy] of dirs) {
      const info = this.lineInfoFrom(x, y, player, dx, dy);
      if (info.len >= 5) {
        const line = this.extractFiveIncluding({ x, y }, info.cells);
        return { win: true, line };
      }
    }
    return { win: false };
  }

  lineInfoFrom(x, y, player, dx, dy) {
    // 回溯到该方向上连续棋子的起点
    let sx = x, sy = y;
    while (this.board.inBounds(sx - dx, sy - dy) && this.board.get(sx - dx, sy - dy) === player) {
      sx -= dx; sy -= dy;
    }
    // 从起点向前收集
    const cells = [];
    let cx = sx, cy = sy;
    while (this.board.inBounds(cx, cy) && this.board.get(cx, cy) === player) {
      cells.push({ x: cx, y: cy });
      cx += dx; cy += dy;
    }
    return { len: cells.length, cells };
  }

  extractFiveIncluding(target, cells) {
    // 在 cells 连续序列中，取包含 target 的 5 连片段
    const idx = cells.findIndex(c => c.x === target.x && c.y === target.y);
    if (idx === -1) return cells.slice(0, 5);
    const n = cells.length;
    const start = Math.max(0, Math.min(idx, n - 5));
    return cells.slice(start, start + 5);
  }
}
