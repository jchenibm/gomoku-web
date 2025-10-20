export class Board {
  constructor(size = 15) {
    this.size = size;
    this.grid = Array.from({ length: size }, () => Array(size).fill(0));
  }

  inBounds(x, y) {
    return x >= 0 && x < this.size && y >= 0 && y < this.size;
  }

  isEmpty(x, y) {
    return this.inBounds(x, y) && this.grid[y][x] === 0;
  }

  get(x, y) {
    if (!this.inBounds(x, y)) return undefined;
    return this.grid[y][x];
  }

  place(x, y, player) {
    if (!this.inBounds(x, y)) return false;
    if (!this.isEmpty(x, y)) return false;
    this.grid[y][x] = player;
    return true;
  }

  remove(x, y) {
    if (!this.inBounds(x, y)) return false;
    this.grid[y][x] = 0;
    return true;
  }

  reset() {
    for (let y = 0; y < this.size; y++) {
      this.grid[y].fill(0);
    }
  }

  emptyCells() {
    const cells = [];
    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        if (this.grid[y][x] === 0) cells.push({ x, y });
      }
    }
    return cells;
  }
}
