export class CameraAudio {
  constructor() {
    this.context = null;
    this.enabled = true;
  }

  setEnabled(enabled) {
    this.enabled = Boolean(enabled);
  }

  ensureContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.context;
  }
}
