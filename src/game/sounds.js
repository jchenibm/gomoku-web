// Placeholder for sound management
let enabled = true;

export function setSoundEnabled(value) {
  enabled = !!value;
}

export function playPlace() {
  if (!enabled) return;
  // TODO: play assets/sounds/place.wav
}

export function playWin() {
  if (!enabled) return;
  // TODO: play assets/sounds/win.mp3
}

export function playHint() {
  if (!enabled) return;
  // TODO: play assets/sounds/hint.wav
}
