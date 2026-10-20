import Svg, { Circle, G, Line, Path, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../../theme';
import { formatDate } from './format';

// Mesmo gráfico de linha do LoadProgress do web, em react-native-svg.
export function LoadChart({ points }: { points: { date: string; weight: number }[] }) {
  const W = 420;
  const H = 220;
  const pad = { l: 44, r: 24, t: 16, b: 34 };
  if (points.length === 0) return null;

  const weights = points.map((p) => p.weight);
  let min = Math.min(...weights);
  let max = Math.max(...weights);
  if (min === max) {
    min = Math.max(0, min - 5);
    max = max + 5;
  }
  const x = (i: number) =>
    pad.l + (points.length === 1 ? (W - pad.l - pad.r) / 2 : (i / (points.length - 1)) * (W - pad.l - pad.r));
  const y = (w: number) => pad.t + (1 - (w - min) / (max - min)) * (H - pad.t - pad.b);
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.weight).toFixed(1)}`).join(' ');
  const ticks = [min, (min + max) / 2, max];
  const labelIdx =
    points.length <= 2 ? points.map((_, i) => i) : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  return (
    <Svg viewBox={`0 0 ${W} ${H}`} width="100%" height={undefined} style={{ aspectRatio: W / H }} accessibilityLabel="Evolução da carga ao longo do tempo">
      {ticks.map((t) => (
        <G key={t}>
          <Line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke={colors.border} strokeDasharray="3 4" />
          <SvgText x={pad.l - 8} y={y(t) + 4} textAnchor="end" fill={colors.textSecondary} fontSize={14} fontFamily={fonts.body}>
            {Math.round(t)}
          </SvgText>
        </G>
      ))}
      <Path d={path} fill="none" stroke={colors.accent} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <Circle key={i} cx={x(i)} cy={y(p.weight)} r={4} fill={colors.accentLight} />
      ))}
      {labelIdx.map((i) => (
        <SvgText
          key={i}
          x={x(i)}
          y={H - 10}
          textAnchor={points.length > 1 && i === 0 ? 'start' : points.length > 1 && i === points.length - 1 ? 'end' : 'middle'}
          fill={colors.textSecondary}
          fontSize={14}
          fontFamily={fonts.body}
        >
          {formatDate(points[i].date)}
        </SvgText>
      ))}
    </Svg>
  );
}
