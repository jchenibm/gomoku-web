import { describe, it, expect } from 'vitest';
import { checkWin, isValidMove } from '../src/game/rules.js';

function emptyBoard(n = 15) {
  return Array.from({ length: n }, () => Array(n).fill(0));
}

describe('rules.checkWin', () => {
  it('detects horizontal five', () => {
    const b = emptyBoard();
    for (let i = 3; i < 8; i++) b[7][i] = 1;
    const res = checkWin(b, { x: 7, y: 7 });
    expect(res?.winner).toBe(1);
  });

  it('detects vertical five', () => {
    const b = emptyBoard();
    for (let i = 5; i < 10; i++) b[i][4] = 2;
    const res = checkWin(b, { x: 4, y: 9 });
    expect(res?.winner).toBe(2);
  });

  it('detects diagonal five', () => {
    const b = emptyBoard();
    for (let i = 0; i < 5; i++) b[2 + i][3 + i] = 1;
    const res = checkWin(b, { x: 7, y: 6 });
    expect(res?.winner).toBe(1);
  });

  it('no win returns null', () => {
    const b = emptyBoard();
    b[0][0] = 1; b[1][1] = 1; b[2][2] = 1; b[3][3] = 0;
    const res = checkWin(b, { x: 2, y: 2 });
    expect(res).toBeNull();
  });
});

describe('rules.isValidMove', () => {
  it('only allows empty in-bounds', () => {
    const b = emptyBoard();
    expect(isValidMove(b, 0, 0)).toBe(true);
    b[0][0] = 1;
    expect(isValidMove(b, 0, 0)).toBe(false);
    expect(isValidMove(b, -1, 0)).toBe(false);
    expect(isValidMove(b, 15, 0)).toBe(false);
  });
});
