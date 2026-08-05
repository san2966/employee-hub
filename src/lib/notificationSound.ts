// Lightweight WebAudio notification chime used across the whole portal.
let ctx: AudioContext | null = null;
let lastPlayed = 0;

export const playNotificationSound = () => {
  try {
    if (typeof window === "undefined") return;
    const now = Date.now();
    if (now - lastPlayed < 400) return; // debounce bursts
    lastPlayed = now;

    const Ctor: typeof AudioContext =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === "suspended") void ctx.resume();

    const start = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.45);
    gain.connect(ctx.destination);

    [880, 1174].forEach((freq, i) => {
      const osc = ctx!.createOscillator();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start + i * 0.12);
      osc.connect(gain);
      osc.start(start + i * 0.12);
      osc.stop(start + i * 0.12 + 0.3);
    });
  } catch {
    /* audio not available */
  }
};
