/**
 * The two sounds a sticker makes (`sections/skills.tsx`), synthesised with
 * the Web Audio API rather than loaded from files:
 *
 *  - peel, on pick-up: a short burst of noise whose pitch sweeps upward, with
 *    a little crackle — vinyl lifting off the mat
 *  - slap, on drop: a dull low thump under a quick, muffled smack
 *
 * The audio context is only created on the first pick-up — browsers won't
 * start one before a user gesture anyway — and is shared after that.
 */

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;

function audio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    // one second of white noise, reused by every sound
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** a noise source starting at a random point in the buffer */
function noiseSource(ac: AudioContext) {
  const src = ac.createBufferSource();
  src.buffer = noise;
  return src;
}

/** an envelope: up to `peak` in `attack` s, then away to silence by `end` s */
function envelope(ac: AudioContext, t: number, peak: number, attack: number, end: number) {
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + end);
  return g;
}

export function playPeel() {
  const ac = audio();
  if (!ac || !noise) return;
  const t = ac.currentTime;
  const dur = 0.17;

  const src = noiseSource(ac);
  const band = ac.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 1.1;
  band.frequency.setValueAtTime(900, t);
  band.frequency.exponentialRampToValueAtTime(4200, t + dur);
  const env = envelope(ac, t, 0.22, 0.012, dur);

  // crackle: the adhesive letting go in little steps
  const crackle = ac.createGain();
  crackle.gain.setValueAtTime(1, t);
  for (let i = 1; i < 9; i++) {
    crackle.gain.setValueAtTime(0.35 + Math.random() * 0.65, t + (dur * i) / 9);
  }

  src.connect(band).connect(crackle).connect(env).connect(ac.destination);
  src.start(t, Math.random() * 0.5, dur + 0.02);
}

export function playSlap() {
  const ac = audio();
  if (!ac || !noise) return;
  const t = ac.currentTime;

  // the smack
  const src = noiseSource(ac);
  const low = ac.createBiquadFilter();
  low.type = "lowpass";
  low.frequency.setValueAtTime(2400, t);
  low.frequency.exponentialRampToValueAtTime(500, t + 0.06);
  src.connect(low).connect(envelope(ac, t, 0.32, 0.003, 0.07)).connect(ac.destination);
  src.start(t, Math.random() * 0.5, 0.09);

  // the thump under it
  const osc = ac.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(55, t + 0.1);
  osc.connect(envelope(ac, t, 0.38, 0.004, 0.12)).connect(ac.destination);
  osc.start(t);
  osc.stop(t + 0.14);
}
