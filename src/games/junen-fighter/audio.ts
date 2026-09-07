export class FightAudio {
  context?: AudioContext;
  noiseBuffer?: AudioBuffer;
  enabled = true;
  volume = 0.7;

  unlock() {
    if (!this.context) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.context = new AudioCtx();
      this.initNoiseBuffer();
    }
    void this.context.resume();
  }

  private initNoiseBuffer() {
    if (!this.context || this.noiseBuffer) return;
    const length = Math.floor(this.context.sampleRate * 0.14);
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    }
    this.noiseBuffer = buffer;
  }

  hit(heavy = false, counter = false) {
    const ctx = this.context;
    if (!ctx || !this.enabled) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = counter ? 'sine' : 'triangle';
    osc.frequency.setValueAtTime(counter ? 620 : heavy ? 130 : 190, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.15);

    gain.gain.setValueAtTime(0.25 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.21);

    if (this.noiseBuffer) {
      const noise = ctx.createBufferSource();
      const ng = ctx.createGain();
      noise.buffer = this.noiseBuffer;
      ng.gain.value = 0.18 * this.volume;
      noise.connect(ng);
      ng.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + 0.14);
    }
  }

  dispose() {
    void this.context?.close();
    this.context = undefined;
    this.noiseBuffer = undefined;
  }
}
