import { useEffect } from "react";

let ctx: AudioContext | null = null;

function getContext(): AudioContext | null {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

/**
 * Browsers only allow sound after a user gesture, so call this from the
 * "Set alarm" click. It primes the audio context for the ring later.
 */
export function unlockAlarmSound(): void {
  getContext();
}

function beep(audio: AudioContext): void {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  const t = audio.currentTime;
  osc.type = "square";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.25, t + 0.02);
  gain.gain.linearRampToValueAtTime(0, t + 0.5);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + 0.55);
}

/** Loops a plain two-tone-free beep while active. No melody, so it reads as an alarm, not a ringtone. */
export function useAlarmSound(active: boolean): void {
  useEffect(() => {
    if (!active) return;
    const audio = getContext();
    if (!audio) return;
    beep(audio);
    const id = window.setInterval(() => {
      if (audio.state === "running") beep(audio);
    }, 1100);
    return () => window.clearInterval(id);
  }, [active]);
}
