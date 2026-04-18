import { useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const CLICK = require('@/assets/audio/click.wav');
const CLICK_DOWNBEAT = require('@/assets/audio/click-downbeat.wav');

export const BPM_MIN = 40;
export const BPM_MAX = 240;

export function clampBpm(bpm: number): number {
  return Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(bpm)));
}

/** How many equal subdivisions fire within each quarter-note beat. */
export type NoteSubdivision = 'quarter' | 'eighth' | 'triplet' | 'sixteenth';

export const SLOTS_PER_BEAT: Record<NoteSubdivision, number> = {
  quarter: 1,
  eighth: 2,
  triplet: 3,
  sixteenth: 4,
};

type UseMetronomeOptions = {
  bpm: number;
  isRunning: boolean;
  /** Beats per bar; downbeat is beat 1. */
  beatsPerMeasure?: number;
  /** Rhythmic subdivision of each beat (quarter = one click per beat). */
  subdivision?: NoteSubdivision;
};

/**
 * Drift-corrected scheduling: each deadline extends by the current interval (from `bpm`),
 * so tempo can change while running without resetting the transport.
 */
export function useMetronome({
  bpm,
  isRunning,
  beatsPerMeasure = 4,
  subdivision = 'quarter',
}: UseMetronomeOptions) {
  const [currentBeat, setCurrentBeat] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const downbeatSoundRef = useRef<Audio.Sound | null>(null);
  const bpmRef = useRef(bpm);
  bpmRef.current = bpm;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
          staysActiveInBackground: false,
        });
        const [{ sound }, { sound: downbeatSound }] = await Promise.all([
          Audio.Sound.createAsync(CLICK, { shouldPlay: false }),
          Audio.Sound.createAsync(CLICK_DOWNBEAT, { shouldPlay: false }),
        ]);
        if (cancelled) {
          await Promise.all([sound.unloadAsync(), downbeatSound.unloadAsync()]);
          return;
        }
        soundRef.current = sound;
        downbeatSoundRef.current = downbeatSound;
        setIsAudioReady(true);
      } catch {
        setIsAudioReady(false);
      }
    })();
    return () => {
      cancelled = true;
      const s = soundRef.current;
      const d = downbeatSoundRef.current;
      soundRef.current = null;
      downbeatSoundRef.current = null;
      setIsAudioReady(false);
      void Promise.all([s?.unloadAsync() ?? Promise.resolve(), d?.unloadAsync() ?? Promise.resolve()]);
    };
  }, []);

  useEffect(() => {
    if (!isRunning) {
      setCurrentBeat(0);
      return;
    }

    const slotsPerBeat = SLOTS_PER_BEAT[subdivision];
    const slotsPerMeasure = beatsPerMeasure * slotsPerBeat;
    const tickIntervalMs = () => 60000 / bpmRef.current / slotsPerBeat;
    const timeoutRef = { id: null as ReturnType<typeof setTimeout> | null };
    let tickIndex = 0;
    let nextAt = performance.now() + tickIntervalMs();

    const pulse = (beatInMeasure: number, subInBeat: number) => {
      setCurrentBeat(beatInMeasure);
      const measureDown = beatInMeasure === 1 && subInBeat === 0;
      const target = measureDown ? downbeatSoundRef.current : soundRef.current;
      if (target) {
        void target.replayAsync();
      }
      if (Platform.OS !== 'web') {
        const quarterBoundary = subInBeat === 0;
        if (measureDown) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else if (quarterBoundary) {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    };

    const slotInMeasure = tickIndex % slotsPerMeasure;
    pulse(
      Math.floor(slotInMeasure / slotsPerBeat) + 1,
      slotInMeasure % slotsPerBeat,
    );
    tickIndex += 1;

    const schedule = () => {
      timeoutRef.id = setTimeout(() => {
        const slot = tickIndex % slotsPerMeasure;
        pulse(Math.floor(slot / slotsPerBeat) + 1, slot % slotsPerBeat);
        tickIndex += 1;
        nextAt += tickIntervalMs();
        while (nextAt < performance.now()) {
          nextAt += tickIntervalMs();
        }
        schedule();
      }, Math.max(0, nextAt - performance.now()));
    };

    schedule();

    return () => {
      if (timeoutRef.id != null) {
        clearTimeout(timeoutRef.id);
      }
    };
  }, [isRunning, beatsPerMeasure, subdivision]);

  return { currentBeat, isAudioReady };
}
