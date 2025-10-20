/*
  Placeholder Web Worker for AI search. In future tasks we will move the
  computationally heavy search to this worker to keep the UI responsive.
*/

self.onmessage = async (ev) => {
  const { type, payload } = ev.data || {};
  switch (type) {
    case 'SEARCH': {
      // TODO: Perform AI search
      // postMessage({ type: 'RESULT', payload: { move: { x, y }, score } });
      postMessage({ type: 'RESULT', payload: { move: null, score: 0 } });
      break;
    }
    default:
      // ignore
      break;
  }
};
