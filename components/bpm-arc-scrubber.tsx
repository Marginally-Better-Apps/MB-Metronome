import { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Path } from 'react-native-svg';
import { runOnJS } from 'react-native-reanimated';

import { BPM_MAX, BPM_MIN, clampBpm } from '@/hooks/use-metronome';

/**
 * Large horseshoe: center sits below the readout so the ring wraps up and around the BPM,
 * with endpoints dropping toward the − / + controls (angles in `Math.atan2` space).
 */
const W = 340;
const H = 300;
const CX = W / 2;
const CY = 198;
const R = 124;
/** Right, lower (max BPM). ~15° */
const ANGLE_RIGHT = Math.PI / 12;
/** Left, lower (min BPM). ~165° */
const ANGLE_LEFT = (11 * Math.PI) / 12;
const SWEEP = ANGLE_LEFT - ANGLE_RIGHT;
const ARC_LEN = R * SWEEP;

function arcPath(): string {
  const xl = CX + R * Math.cos(ANGLE_LEFT);
  const yl = CY + R * Math.sin(ANGLE_LEFT);
  const xr = CX + R * Math.cos(ANGLE_RIGHT);
  const yr = CY + R * Math.sin(ANGLE_RIGHT);
  return `M ${xl} ${yl} A ${R} ${R} 0 0 1 ${xr} ${yr}`;
}

function bpmFromLocalXY(x: number, y: number): number {
  let a = Math.atan2(y - CY, x - CX);
  if (a < ANGLE_RIGHT || a > ANGLE_LEFT) {
    const xl = CX + R * Math.cos(ANGLE_LEFT);
    const yl = CY + R * Math.sin(ANGLE_LEFT);
    const xr = CX + R * Math.cos(ANGLE_RIGHT);
    const yr = CY + R * Math.sin(ANGLE_RIGHT);
    const dL = (x - xl) ** 2 + (y - yl) ** 2;
    const dR = (x - xr) ** 2 + (y - yr) ** 2;
    a = dL < dR ? ANGLE_LEFT : ANGLE_RIGHT;
  }
  const t = (ANGLE_LEFT - a) / SWEEP;
  const raw = BPM_MIN + t * (BPM_MAX - BPM_MIN);
  return clampBpm(Math.round(raw));
}

type Props = {
  bpm: number;
  onChange: (bpm: number) => void;
  textColor: string;
  secondaryColor: string;
  trackColor: string;
  accentColor: string;
};

export function BpmArcScrubber({
  bpm,
  onChange,
  textColor,
  secondaryColor,
  trackColor,
  accentColor,
}: Props) {
  const d = useMemo(() => arcPath(), []);

  const t = (bpm - BPM_MIN) / (BPM_MAX - BPM_MIN);
  const angle = ANGLE_LEFT - t * SWEEP;
  const thumbX = CX + R * Math.cos(angle);
  const thumbY = CY + R * Math.sin(angle);
  const dashOffset = ARC_LEN * (1 - t);

  const apply = useCallback(
    (x: number, y: number) => {
      onChange(bpmFromLocalXY(x, y));
    },
    [onChange],
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => {
          runOnJS(apply)(e.x, e.y);
        })
        .onUpdate((e) => {
          runOnJS(apply)(e.x, e.y);
        }),
    [apply],
  );

  return (
    <View
      style={styles.wrap}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel="Tempo"
      accessibilityValue={{ text: `${bpm} BPM` }}
      accessibilityHint="Drag along the arc to change beats per minute.">
      <Svg width={W} height={H} style={styles.svg}>
        <Path d={d} stroke={trackColor} strokeWidth={6} strokeLinecap="round" fill="none" />
        <Path
          d={d}
          stroke={accentColor}
          strokeWidth={6}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${ARC_LEN} ${ARC_LEN}`}
          strokeDashoffset={dashOffset}
        />
        <Circle cx={thumbX} cy={thumbY} r={10} fill={accentColor} />
        <Circle cx={thumbX} cy={thumbY} r={5} fill="white" opacity={0.35} />
      </Svg>
      <View style={styles.readout} pointerEvents="none">
        <Text style={[styles.bpmNumber, { color: textColor }]}>{bpm}</Text>
        <Text style={[styles.bpmCaption, { color: secondaryColor }]}>BPM</Text>
      </View>
      <GestureDetector gesture={pan}>
        <View style={styles.hit} />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: W,
    height: H,
    alignSelf: 'center',
  },
  svg: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  readout: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 48,
  },
  bpmNumber: {
    fontSize: 96,
    fontWeight: '200',
    fontVariant: ['tabular-nums'],
    letterSpacing: -3,
  },
  bpmCaption: {
    marginTop: -4,
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  hit: {
    ...StyleSheet.absoluteFillObject,
  },
});
