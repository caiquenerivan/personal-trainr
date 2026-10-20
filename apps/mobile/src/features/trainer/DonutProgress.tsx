import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts } from '../../theme';
import { Text } from '../../components/Text';

const RADIUS = 36;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DonutProgress({ percentage, color = colors.accent, size = 80 }: { percentage: number; color?: string; size?: number }) {
  const offset = CIRCUMFERENCE - (Math.min(100, Math.max(0, percentage)) / 100) * CIRCUMFERENCE;
  return (
    <View style={{ width: size, height: size }}>
      <Svg viewBox="0 0 80 80" width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={40} cy={40} r={RADIUS} stroke={colors.base} strokeWidth={7} fill="none" />
        <Circle
          cx={40}
          cy={40}
          r={RADIUS}
          stroke={color}
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          fill="none"
        />
      </Svg>
      <View style={styles.center}>
        <Text style={styles.value}>{percentage}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  value: { fontFamily: fonts.number, fontSize: 16, color: colors.white },
});
