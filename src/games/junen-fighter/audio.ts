export class FightAudio {
  context?: AudioContext;
  enabled = true;
  volume = .7;
  unlock() { this.context ??= new AudioContext(); void this.context.resume(); }
  hit(heavy = false, counter = false) {
    const ctx = this.context; if (!ctx || !this.enabled) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = counter ? 'sine' : 'triangle'; osc.frequency.setValueAtTime(counter ? 620 : heavy ? 130 : 190, now); osc.frequency.exponentialRampToValueAtTime(45, now + .15);
    gain.gain.setValueAtTime(.25 * this.volume, now); gain.gain.exponentialRampToValueAtTime(.001, now + .2);
    osc.connect(gain).connect(ctx.destination); osc.start(); osc.stop(now + .21);
    const buffer = ctx.createBuffer(1, ctx.sampleRate * .14, ctx.sampleRate), data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length) ** 3;
    const noise = ctx.createBufferSource(), ng = ctx.createGain(); noise.buffer = buffer; ng.gain.value = .18 * this.volume;
    noise.connect(ng).connect(ctx.destination); noise.start();
  }
  dispose() { void this.context?.close(); }
}
