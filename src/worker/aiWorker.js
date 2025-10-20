import { searchBestMove } from '../ai/search.js';

let aborted = false;

function resetAbort() { aborted = false; }
function abort() { aborted = true; }

self.onmessage = async (ev) => {
  const { type, payload } = ev.data || {};
  switch (type) {
    case 'SEARCH': {
      resetAbort();
      const { board, player, options, id } = payload || {};
      try {
        const res = await searchBestMove(board, player, {
          timeLimitMs: options?.timeLimitMs ?? 1500,
          maxDepth: options?.maxDepth ?? 6,
          neighborDistance: options?.neighborDistance ?? 2,
          moveLimit: options?.moveLimit ?? 24,
          shouldAbort: () => aborted,
          onProgress: (p) => {
            postMessage({ type: 'PROGRESS', id, payload: p });
          }
        });
        if (aborted) {
          postMessage({ type: 'CANCELLED', id });
        } else {
          postMessage({ type: 'RESULT', id, payload: res });
        }
      } catch (e) {
        if (aborted) {
          postMessage({ type: 'CANCELLED', id });
        } else {
          postMessage({ type: 'ERROR', id, payload: { message: e?.message || String(e) } });
        }
      }
      break;
    }
    case 'CANCEL': {
      abort();
      break;
    }
    default:
      // ignore
      break;
  }
};
