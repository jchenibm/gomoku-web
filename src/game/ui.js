// Placeholder UI helpers

export function updateStatus(el, text) {
  if (!el) return;
  el.textContent = text;
}

export function setButtonEnabled(button, enabled) {
  if (!button) return;
  button.disabled = !enabled;
}
