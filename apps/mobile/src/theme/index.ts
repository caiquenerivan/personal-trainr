// Mesmos tokens do tailwind.config.js do web (ver apps/web/DESIGN.md).
export const colors = {
  menu: '#262626',
  panel: '#333333',
  base: '#333333',
  card: '#262626',
  accent: '#AF9150',
  accentLight: '#D4B060',
  textPrimary: '#D9D9D9',
  textSecondary: '#A3A3A3',
  border: '#4A4A4A',
  borderSubtle: 'rgba(255,255,255,0.1)',
  overlay: 'rgba(0,0,0,0.6)',
  // Cores de apoio usadas pontualmente no web (text-green-400, orange-400…).
  success: '#4ADE80',
  orange: '#FB923C',
  blue: '#60A5FA',
  warning: '#FACC15',
  danger: '#F87171',
  black: '#000000',
  white: '#ffffff',
} as const;

// Trainr Block (fonte própria, tools/trainr-block) para títulos e números.
export const fonts = {
  title: 'TrainrBlock',
  number: 'TrainrBlock',
  body: 'Play',
  bodyBold: 'Play-Bold',
} as const;

export const fontAssets = {
  TrainrBlock: require('../../assets/fonts/TrainrBlock-Regular.ttf'),
  [fonts.body]: require('../../assets/fonts/Play-Regular.ttf'),
  [fonts.bodyBold]: require('../../assets/fonts/Play-Bold.ttf'),
};

export const radius = {
  lg: 8,
  xl: 12,
  '2xl': 16,
  full: 9999,
} as const;

// Alvo mínimo de toque, igual ao min-h-[44px] do web.
export const touchTarget = 44;
