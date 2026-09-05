// Pure Web Audio API Procedural Sound Synthesizer for Pac-Man

class PacmanAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.6;
  private lastWakaTone: number = 0;
  private sirenOsc: OscillatorNode | null = null;
  private sirenGain: GainNode | null = null;
  private sirenInterval: number | null = null;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.stopSiren();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  public playWaka() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      // Alternate tones between ~260Hz and ~490Hz for realistic waka-waka
      this.lastWakaTone = (this.lastWakaTone + 1) % 2;
      const baseFreq = this.lastWakaTone === 0 ? 270 : 480;
      
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.7, now + 0.08);

      gain.gain.setValueAtTime(this.volume * 0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // Ignore audio context errors
    }
  }

  public playPowerPellet() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(900, now + 0.15);

      gain.gain.setValueAtTime(this.volume * 0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore
    }
  }

  public playEatGhost() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [400, 600, 800, 1000];

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        const start = now + idx * 0.06;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(this.volume * 0.28, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.07);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.07);
      });
    } catch {
      // Ignore
    }
  }

  public playEatFruit() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6

      chords.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        const start = now + idx * 0.07;
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(this.volume * 0.35, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.14);
      });
    } catch {
      // Ignore
    }
  }

  public playDeath() {
    if (this.isMuted) return;
    try {
      this.stopSiren();
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';

      // Downward chromatic stepped frequency drop
      const duration = 1.1;
      const startFreq = 800;
      const endFreq = 60;

      osc.frequency.setValueAtTime(startFreq, now);
      osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration - 0.1);

      gain.gain.setValueAtTime(this.volume * 0.3, now);
      gain.gain.linearRampToValueAtTime(this.volume * 0.25, now + duration - 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);

      // Final pop at the end
      setTimeout(() => {
        if (this.isMuted || !this.ctx) return;
        try {
          const popOsc = this.ctx.createOscillator();
          const popGain = this.ctx.createGain();
          popOsc.type = 'triangle';
          const pNow = this.ctx.currentTime;
          popOsc.frequency.setValueAtTime(150, pNow);
          popOsc.frequency.exponentialRampToValueAtTime(40, pNow + 0.15);

          popGain.gain.setValueAtTime(this.volume * 0.4, pNow);
          popGain.gain.exponentialRampToValueAtTime(0.001, pNow + 0.15);

          popOsc.connect(popGain);
          popGain.connect(this.ctx.destination);
          popOsc.start(pNow);
          popOsc.stop(pNow + 0.15);
        } catch {
          // Ignore
        }
      }, (duration - 0.05) * 1000);
    } catch {
      // Ignore
    }
  }

  public playGameStart() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Classic Pac-Man introductory fanfare notes
      const notes = [
        { f: 493.88, d: 0.1 },  // B4
        { f: 987.77, d: 0.1 },  // B5
        { f: 739.99, d: 0.1 },  // F#5
        { f: 622.25, d: 0.1 },  // D#5
        { f: 987.77, d: 0.1 },  // B5
        { f: 739.99, d: 0.15 }, // F#5
        { f: 622.25, d: 0.2 },  // D#5
        { f: 523.25, d: 0.1 },  // C5
        { f: 1046.5, d: 0.1 },  // C6
        { f: 783.99, d: 0.1 },  // G5
        { f: 659.25, d: 0.1 },  // E5
        { f: 1046.5, d: 0.1 },  // C6
        { f: 783.99, d: 0.15 }, // G5
        { f: 659.25, d: 0.2 },  // E5
      ];

      let t = now;
      notes.forEach((note) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(note.f, t);

        gain.gain.setValueAtTime(this.volume * 0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + note.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t);
        osc.stop(t + note.d);

        t += note.d * 1.05;
      });
    } catch {
      // Ignore
    }
  }

  public startSiren(frightened: boolean = false) {
    if (this.isMuted) return;
    this.stopSiren();

    try {
      this.initCtx();
      if (!this.ctx) return;

      this.sirenOsc = this.ctx.createOscillator();
      this.sirenGain = this.ctx.createGain();

      this.sirenOsc.type = frightened ? 'triangle' : 'sine';
      const baseFreq = frightened ? 320 : 160;
      this.sirenOsc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

      this.sirenGain.gain.setValueAtTime(this.volume * (frightened ? 0.18 : 0.08), this.ctx.currentTime);
      this.sirenOsc.connect(this.sirenGain);
      this.sirenGain.connect(this.ctx.destination);
      this.sirenOsc.start();

      let toggle = false;
      this.sirenInterval = window.setInterval(() => {
        if (!this.sirenOsc || !this.ctx) return;
        toggle = !toggle;
        const now = this.ctx.currentTime;
        const targetFreq = frightened
          ? (toggle ? 420 : 260)
          : (toggle ? 190 : 140);
        this.sirenOsc.frequency.linearRampToValueAtTime(targetFreq, now + 0.18);
      }, 200);
    } catch {
      // Ignore
    }
  }

  public stopSiren() {
    if (this.sirenInterval !== null) {
      clearInterval(this.sirenInterval);
      this.sirenInterval = null;
    }
    if (this.sirenOsc) {
      try {
        this.sirenOsc.stop();
        this.sirenOsc.disconnect();
      } catch {
        // Ignore
      }
      this.sirenOsc = null;
    }
    if (this.sirenGain) {
      try {
        this.sirenGain.disconnect();
      } catch {
        // Ignore
      }
      this.sirenGain = null;
    }
  }
}

export const pacmanAudio = new PacmanAudio();
