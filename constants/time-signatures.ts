export type TimeSignatureId =
  | '2-4'
  | '3-4'
  | '4-4'
  | '5-4'
  | '6-8'
  | '6-8-compound'
  | '7-4'
  | '9-8'
  | '12-8';

export type TimeSignaturePreset = {
  id: TimeSignatureId;
  /** Primary label shown on the chip */
  label: string;
  /** Shorter label for narrow layouts (optional) */
  shortLabel?: string;
  /** How many metronome clicks form one full bar before the downbeat repeats */
  beatsPerMeasure: number;
};

/**
 * BPM is always “clicks per minute”: one scheduler tick equals one displayed beat dot.
 * For 6/8 compound, each click is a dotted-quarter pulse (two beats per bar in traditional 6/8).
 */
export const TIME_SIGNATURE_PRESETS: readonly TimeSignaturePreset[] = [
  { id: '2-4', label: '2/4', beatsPerMeasure: 2 },
  { id: '3-4', label: '3/4', beatsPerMeasure: 3 },
  { id: '4-4', label: '4/4', beatsPerMeasure: 4 },
  { id: '5-4', label: '5/4', beatsPerMeasure: 5 },
  { id: '6-8', label: '6/8', shortLabel: '6/8·6', beatsPerMeasure: 6 },
  {
    id: '6-8-compound',
    label: '6/8 · 2',
    shortLabel: '6/8·2',
    beatsPerMeasure: 2,
  },
  { id: '7-4', label: '7/4', beatsPerMeasure: 7 },
  { id: '9-8', label: '9/8', beatsPerMeasure: 9 },
  { id: '12-8', label: '12/8', beatsPerMeasure: 12 },
] as const;

export const DEFAULT_TIME_SIGNATURE_ID: TimeSignatureId = '4-4';

export function getTimeSignaturePreset(
  id: TimeSignatureId,
): TimeSignaturePreset | undefined {
  return TIME_SIGNATURE_PRESETS.find((p) => p.id === id);
}
