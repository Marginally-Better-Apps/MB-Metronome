import Ionicons from '@expo/vector-icons/Ionicons';
import { useCallback, useMemo, useState } from 'react';
import {
  DynamicColorIOS,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BpmArcScrubber } from '@/components/bpm-arc-scrubber';
import {
  DEFAULT_TIME_SIGNATURE_ID,
  type TimeSignatureId,
  TIME_SIGNATURE_PRESETS,
  getTimeSignaturePreset,
} from '@/constants/time-signatures';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  clampBpm,
  type NoteSubdivision,
  useMetronome,
} from '@/hooks/use-metronome';

const SUBDIVISION_OPTIONS: { value: NoteSubdivision; label: string }[] = [
  { value: 'quarter', label: 'Quarter' },
  { value: 'eighth', label: '8th' },
  { value: 'triplet', label: 'Triplet' },
  { value: 'sixteenth', label: '16th' },
];

const playTint =
  Platform.OS === 'ios'
    ? DynamicColorIOS({ light: '#FFFFFF', dark: '#FFFFFF' })
    : '#FFFFFF';

const playBackground =
  Platform.OS === 'ios'
    ? DynamicColorIOS({ light: '#007AFF', dark: '#0A84FF' })
    : '#007AFF';

export function MetronomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const insets = useSafeAreaInsets();
  const [bpm, setBpm] = useState(120);
  const [isRunning, setIsRunning] = useState(false);
  const [timeSignatureId, setTimeSignatureId] = useState<TimeSignatureId>(
    DEFAULT_TIME_SIGNATURE_ID,
  );
  const [subdivision, setSubdivision] = useState<NoteSubdivision>('quarter');
  const timeSignature = useMemo(() => {
    return (
      getTimeSignaturePreset(timeSignatureId) ??
      getTimeSignaturePreset(DEFAULT_TIME_SIGNATURE_ID)!
    );
  }, [timeSignatureId]);
  const beatsPerMeasure = timeSignature.beatsPerMeasure;
  const { currentBeat, isAudioReady } = useMetronome({
    bpm,
    isRunning,
    beatsPerMeasure,
    subdivision,
  });

  const step = useCallback((delta: number) => {
    setBpm((b) => clampBpm(b + delta));
  }, []);

  const secondary =
    colorScheme === 'dark' ? 'rgba(235, 235, 245, 0.6)' : 'rgba(60, 60, 67, 0.6)';
  const surface = colorScheme === 'dark' ? '#1C1C1E' : '#F2F2F7';
  const dotInactive = colorScheme === 'dark' ? 'rgba(255,255,255,0.22)' : 'rgba(0,0,0,0.12)';
  const accentSolid = colorScheme === 'dark' ? '#0A84FF' : '#007AFF';
  const arcTrack =
    colorScheme === 'dark' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.08)';

  const dotSize = beatsPerMeasure > 8 ? 8 : 10;
  const dotGap = beatsPerMeasure > 8 ? 7 : 14;

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 24 }]}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
      style={{ backgroundColor: palette.background }}>
      <View style={styles.center}>
        <BpmArcScrubber
          bpm={bpm}
          onChange={(v) => setBpm(clampBpm(v))}
          textColor={palette.text}
          secondaryColor={secondary}
          trackColor={arcTrack}
          accentColor={accentSolid}
        />

        <View style={styles.stepperRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Decrease tempo"
            onPress={() => step(-1)}
            style={({ pressed }) => [
              styles.stepperHit,
              { backgroundColor: surface, opacity: pressed ? 0.7 : 1 },
            ]}>
            <Ionicons name="remove" size={28} color={palette.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Increase tempo"
            onPress={() => step(1)}
            style={({ pressed }) => [
              styles.stepperHit,
              { backgroundColor: surface, opacity: pressed ? 0.7 : 1 },
            ]}>
            <Ionicons name="add" size={28} color={palette.text} />
          </Pressable>
        </View>

        <View style={styles.timeSigBlock}>
          <Text style={[styles.timeSigHeading, { color: secondary }]}>Time signature</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeSigChips}
            keyboardShouldPersistTaps="handled">
            {TIME_SIGNATURE_PRESETS.map((preset) => {
              const selected = preset.id === timeSignatureId;
              return (
                <Pressable
                  key={preset.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`Time signature ${preset.label}`}
                  onPress={() => setTimeSignatureId(preset.id)}
                  style={({ pressed }) => [
                    styles.timeSigChip,
                    {
                      backgroundColor: selected ? accentSolid : surface,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.timeSigChipText,
                      { color: selected ? '#FFFFFF' : palette.text },
                    ]}>
                    {preset.shortLabel ?? preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.subdivisionBlock}>
          <Text style={[styles.subdivisionHeading, { color: secondary }]}>Subdivision</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subdivisionChips}
            keyboardShouldPersistTaps="handled">
            {SUBDIVISION_OPTIONS.map(({ value, label }) => {
              const selected = subdivision === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={`${label} note subdivision`}
                  onPress={() => setSubdivision(value)}
                  style={({ pressed }) => [
                    styles.subdivisionChip,
                    {
                      backgroundColor: selected ? accentSolid : surface,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.subdivisionChipText,
                      { color: selected ? '#FFFFFF' : palette.text },
                    ]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={[styles.dots, { gap: dotGap, flexWrap: 'wrap', justifyContent: 'center' }]}>
          {Array.from({ length: beatsPerMeasure }, (_, i) => {
            const on = isRunning && currentBeat === i + 1;
            return (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    width: dotSize,
                    height: dotSize,
                    borderRadius: dotSize / 2,
                    backgroundColor: on ? playBackground : dotInactive,
                    transform: [{ scale: on ? 1.08 : 1 }],
                  },
                ]}
              />
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRunning ? 'Stop metronome' : 'Start metronome'}
          disabled={!isAudioReady}
          onPress={() => setIsRunning((v) => !v)}
          style={({ pressed }) => [
            styles.play,
            { backgroundColor: playBackground, opacity: !isAudioReady ? 0.45 : pressed ? 0.88 : 1 },
          ]}>
          <Ionicons
            name={isRunning ? 'pause' : 'play'}
            size={36}
            color={playTint}
            style={!isRunning ? styles.playIconNudge : undefined}
          />
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    minHeight: '100%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    paddingHorizontal: 24,
  },
  stepperRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: -26,
  },
  stepperHit: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeSigBlock: {
    alignSelf: 'stretch',
    marginTop: 28,
    maxWidth: 360,
  },
  timeSigHeading: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  timeSigChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    paddingRight: 4,
  },
  timeSigChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  timeSigChipText: {
    fontSize: 15,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  subdivisionBlock: {
    alignSelf: 'stretch',
    marginTop: 22,
    maxWidth: 360,
  },
  subdivisionHeading: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  subdivisionChips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
    paddingRight: 4,
  },
  subdivisionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  subdivisionChipText: {
    fontSize: 15,
    fontWeight: '600',
  },
  dots: {
    flexDirection: 'row',
    marginTop: 28,
    alignItems: 'center',
    maxWidth: 340,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  play: {
    marginTop: 52,
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIconNudge: {
    marginLeft: 4,
  },
});
