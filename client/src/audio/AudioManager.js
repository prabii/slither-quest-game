class AudioManager {
  constructor() {
    this._ctx = null;
    this._master = null;
    this._boostOsc = null;
    this._boostGain = null;
    this.muted = false;
  }

  _init() {
    if (this._ctx) return;
    this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    this._master = this._ctx.createGain();
    this._master.gain.value = 0.35;
    this._master.connect(this._ctx.destination);
  }

  resume() {
    try { this._init(); if (this._ctx.state === 'suspended') this._ctx.resume(); } catch {}
  }

  _tone(freq, dur, type = 'sine', vol = 0.3, delay = 0) {
    if (this.muted) return;
    try {
      this._init();
      const t = this._ctx.currentTime + delay;
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(this._master);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    } catch {}
  }

  click()     { this._tone(900,  0.05, 'square', 0.1); }
  eat()       { this._tone(1400, 0.07, 'sine', 0.15); this._tone(1800, 0.05, 'sine', 0.1, 0.05); }
  kill()      { this._tone(200,  0.1,  'sawtooth', 0.3); this._tone(150, 0.25, 'sawtooth', 0.2, 0.1); }
  navSwitch() { this._tone(600,  0.06, 'sine', 0.08); }
  join()      { [440, 554, 659, 880].forEach((f, i) => this._tone(f, 0.18, 'sine', 0.2, i * 0.1)); }
  achievement() { [523, 659, 784, 1047, 1047].forEach((f, i) => this._tone(f, 0.22, 'sine', 0.25, i * 0.13)); }

  die() {
    if (this.muted) return;
    try {
      this._init();
      const t = this._ctx.currentTime;
      const osc = this._ctx.createOscillator();
      const gain = this._ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(300, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 2);
      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 2);
      osc.connect(gain);
      gain.connect(this._master);
      osc.start(t);
      osc.stop(t + 2.1);
    } catch {}
  }

  startBoost() {
    if (this.muted || this._boostOsc) return;
    try {
      this._init();
      this._boostOsc = this._ctx.createOscillator();
      this._boostGain = this._ctx.createGain();
      this._boostOsc.type = 'sawtooth';
      this._boostOsc.frequency.value = 75;
      this._boostGain.gain.value = 0.07;
      this._boostOsc.connect(this._boostGain);
      this._boostGain.connect(this._master);
      this._boostOsc.start();
    } catch {}
  }

  stopBoost() {
    if (!this._boostOsc) return;
    try {
      const t = this._ctx.currentTime;
      this._boostGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      this._boostOsc.stop(t + 0.16);
    } catch {}
    this._boostOsc = null;
    this._boostGain = null;
  }

  setMuted(val) {
    this.muted = val;
    if (this._master) this._master.gain.value = val ? 0 : 0.35;
    if (val) this.stopBoost();
  }
}

export const audio = new AudioManager();
