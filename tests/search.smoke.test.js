import { describe, it, expect } from 'vitest';
import { searchBestMove } from '../src/ai/search.js';

function emptyBoard(n = 15) {
  return Array.from({ length: n }, () => Array(n).fill(0));
}

describe('AI search smoke', () => {
  it('returns a move within ~2 seconds', async () => {
    const b = emptyBoard();
    // Create a small opening
    b[7][7] = 1; b[7][8] = 2; b[6][7] = 1; b[8][8] = 2; b[6][6] = 1;

    const start = Date.now();
    const res = await searchBestMove(b, 1, { timeLimitMs: 1500, maxDepth: 2 });
    const elapsed = Date.now() - start;

    expect(res).toBeTruthy();
    expect(res.x).toBeGreaterThanOrEqual(0);
    expect(res.x).toBeLessThan(15);
    expect(res.y).toBeGreaterThanOrEqual(0);
    expect(res.y).toBeLessThan(15);
    expect(elapsed).toBeLessThanOrEqual(2000);
  });
});
