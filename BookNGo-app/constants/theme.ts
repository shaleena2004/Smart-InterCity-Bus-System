import { Platform } from 'react-native';

const tintColorLight = '#D4AF37';
const tintColorDark = '#D4AF37';

export const Colors = {
  light: {
    text: '#121212',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#333333',
    tabIconDefault: '#888888',
    tabIconSelected: tintColorLight,
    surface: '#F5F5F5',
    border: '#E0E0E0',
    error: '#D32F2F',
    success: '#388E3C',
  },
  dark: {
    text: '#FFFFFF',
    background: '#121212',
    tint: tintColorDark,
    icon: '#888888',
    tabIconDefault: '#888888',
    tabIconSelected: tintColorDark,
    surface: '#1E1E1E',
    border: '#333333',
    error: '#EF5350',
    success: '#66BB6A',
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
