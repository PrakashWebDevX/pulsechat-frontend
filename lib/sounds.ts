/**
 * Notification sounds using Web Audio API — no external files needed.
 */

let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = "sine", volume = 0.3) {
  try {
    const ctx = getCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  } catch {}
}

export const sounds = {
  // Incoming message — soft pop
  message: () => {
    playTone(800, 0.1, "sine", 0.2);
    setTimeout(() => playTone(1000, 0.1, "sine", 0.15), 80);
  },

  // Sent message — click
  sent: () => playTone(600, 0.08, "sine", 0.1),

  // Incoming call — ringtone pattern
  call: () => {
    const pattern = [400, 600, 400, 600];
    pattern.forEach((freq, i) => setTimeout(() => playTone(freq, 0.3, "square", 0.15), i * 400));
  },

  // Call connected
  callStart: () => {
    playTone(880, 0.15, "sine", 0.2);
    setTimeout(() => playTone(1100, 0.15, "sine", 0.2), 150);
  },

  // Call ended
  callEnd: () => {
    playTone(440, 0.2, "sine", 0.2);
    setTimeout(() => playTone(300, 0.3, "sine", 0.15), 200);
  },

  // Notification
  notification: () => {
    playTone(1200, 0.08, "sine", 0.15);
    setTimeout(() => playTone(900, 0.12, "sine", 0.1), 100);
  },

  // Error
  error: () => playTone(200, 0.3, "sawtooth", 0.1),
};

// Check if sounds are enabled
export function isSoundEnabled(): boolean {
  return localStorage.getItem("pc_sound") !== "false";
}

export function toggleSound(): boolean {
  const current = isSoundEnabled();
  localStorage.setItem("pc_sound", current ? "false" : "true");
  return !current;
}

export function playSound(name: keyof typeof sounds) {
  if (isSoundEnabled()) sounds[name]();
}
