let enabled = true;
let audioCtx = null;

export function setSoundEnabled(value) {
  enabled = !!value;
}

function ensureCtx() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  return audioCtx;
}

function beep({ frequency = 600, duration = 120, volume = 0.08, type = 'sine' } = {}) {
  if (!enabled) return;
  const ctx = ensureCtx();
  if (!ctx) return;
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, now);
  gain.gain.setValueAtTime(volume, now);
  osc.connect(gain).connect(ctx.destination);
  osc.start(now);
  osc.stop(now + duration / 1000);
}

export function playPlace() {
  beep({ frequency: 520, duration: 90, volume: 0.09, type: 'triangle' });
}

export function playWin() {
  beep({ frequency: 440, duration: 120, volume: 0.12, type: 'sine' });
  setTimeout(() => beep({ frequency: 660, duration: 120, volume: 0.12, type: 'sine' }), 140);
}

export function playHint() {
  beep({ frequency: 720, duration: 100, volume: 0.08, type: 'square' });
}
