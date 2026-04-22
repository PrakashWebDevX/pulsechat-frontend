/**
 * Mobile-compatible notification sounds.
 * iOS/Android require a user gesture before AudioContext works.
 * We unlock audio on first user tap then play sounds normally.
 */

let audioCtx: AudioContext | null = null;
let audioUnlocked = false;

// Call this on first user interaction (tap/click)
export function unlockAudio(): void {
  if (audioUnlocked) return;
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    // Play silent buffer to unlock
    const buffer = audioCtx.createBuffer(1, 1, 22050);
    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);
    source.start(0);
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    audioUnlocked = true;
  } catch {}
}

function getCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.3,
  delay = 0
): void {
  try {
    const ctx = getCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
    gain.gain.setValueAtTime(0, ctx.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  } catch {}
}

export const sounds = {
  // Incoming message — two soft pops
  message: (): void => {
    playTone(880, 0.12, "sine", 0.2);
    playTone(1100, 0.12, "sine", 0.15, 0.1);
  },

  // Sent — single soft click
  sent: (): void => {
    playTone(700, 0.08, "sine", 0.1);
  },

  // Incoming call — repeating ringtone
  call: (): void => {
    for (let i = 0; i < 3; i++) {
      playTone(480, 0.25, "square", 0.12, i * 0.6);
      playTone(600, 0.25, "square", 0.12, i * 0.6 + 0.3);
    }
  },

  // Call connected
  callStart: (): void => {
    playTone(880, 0.15, "sine", 0.2);
    playTone(1100, 0.15, "sine", 0.18, 0.15);
    playTone(1320, 0.2, "sine", 0.15, 0.3);
  },

  // Call ended
  callEnd: (): void => {
    playTone(440, 0.2, "sine", 0.2);
    playTone(330, 0.3, "sine", 0.15, 0.2);
  },

  // Notification
  notification: (): void => {
    playTone(1200, 0.1, "sine", 0.18);
    playTone(900, 0.15, "sine", 0.12, 0.12);
  },

  // Error
  error: (): void => {
    playTone(220, 0.3, "sawtooth", 0.12);
  },
};

export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem("pc_sound") !== "false";
  } catch {
    return true;
  }
}

export function toggleSound(): boolean {
  const current = isSoundEnabled();
  try {
    localStorage.setItem("pc_sound", current ? "false" : "true");
  } catch {}
  return !current;
}

export function playSound(name: keyof typeof sounds): void {
  if (!isSoundEnabled()) return;
  // Try to unlock audio context first (needed on mobile)
  unlockAudio();
  try {
    sounds[name]();
  } catch {}
}
