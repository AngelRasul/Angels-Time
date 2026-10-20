/**
 * Web Audio API Sound Player for Angels' Time
 * Implements GainNode volume control ensuring 100% compatibility with Safari on iOS.
 */

const STORAGE_KEY = 'angelTimeVolume';
const DEFAULT_VOLUME = 0;

let audioContext: AudioContext | null = null;
let currentPreviewStop: (() => void) | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioContext = new AudioCtx();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

/**
 * Retrieves saved volume level from localStorage (0.0 to 1.0)
 */
export function getSavedVolume(): number {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_VOLUME;
}

/**
 * Persists volume level to localStorage (0.0 to 1.0)
 */
export function saveVolume(volume: number): void {
  try {
    const clamped = Math.max(0, Math.min(1, volume));
    localStorage.setItem(STORAGE_KEY, clamped.toFixed(2));
  } catch {
    // ignore
  }
}

/**
 * Plays a 2-3 second melodic adhan chime using Web Audio API GainNode.
 * Used for volume preview on slider release.
 */
export function playPreviewSound(volume: number): void {
  try {
    // Stop any previously playing preview
    if (currentPreviewStop) {
      currentPreviewStop();
      currentPreviewStop = null;
    }

    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const clampedVolume = Math.max(0, Math.min(1, volume));

    // If volume is muted (0), do nothing
    if (clampedVolume <= 0.001) return;

    // Master GainNode as requested for iOS Safari compatibility
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(clampedVolume, now);
    masterGain.connect(ctx.destination);

    // Warm resonant low-pass filter
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2400, now);
    filter.connect(masterGain);

    // Harmonic prayer chime chord notes (D4, F#4, A4, D5) spanning ~2.5s
    const notes = [
      { freq: 293.66, delay: 0.0, dur: 2.3 },
      { freq: 369.99, delay: 0.16, dur: 2.1 },
      { freq: 440.0, delay: 0.32, dur: 1.9 },
      { freq: 587.33, delay: 0.48, dur: 1.8 },
    ];

    const activeOscillators: OscillatorNode[] = [];

    notes.forEach(({ freq, delay, dur }) => {
      const osc = ctx.createOscillator();
      const noteGain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + delay);

      const startTime = now + delay;
      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.exponentialRampToValueAtTime(0.24, startTime + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + dur);

      osc.connect(noteGain);
      noteGain.connect(filter);

      osc.start(startTime);
      osc.stop(startTime + dur);
      activeOscillators.push(osc);
    });

    currentPreviewStop = () => {
      try {
        activeOscillators.forEach((osc) => {
          try {
            osc.stop();
          } catch {}
        });
        masterGain.disconnect();
      } catch {}
    };

    setTimeout(() => {
      if (currentPreviewStop) {
        currentPreviewStop = null;
      }
    }, 2600);
  } catch (error) {
    console.error('Failed to play preview sound with Web Audio API:', error);
  }
}
