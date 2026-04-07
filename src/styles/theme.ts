import { StyleSheet } from 'react-native';

export const COLORS: Record<string, any> = {
  background: '#0B0B0B',
  surface: '#1A1A1A',
  surfaceLight: '#222222',
  accent: '#00FF88',
  accentDim: 'rgba(0, 255, 136, 0.2)',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: '#333333',
  danger: '#FF4444',
  dangerBg: 'rgba(255, 68, 68, 0.1)',
  success: '#00CC6F',
  transparent: 'transparent',
  muscleGroups: {
    All: '#FFFFFF',
    Chest: '#FF3B3B',   // blue-500
    Back: '#3B82F6',    // green-500
    Legs: '#22C55E',    // red-500
    Shoulders: '#F97316',// yellow-500
    Biceps: '#FACC15',  // purple-500
    Triceps: '#A855F7', // purple-500
    Core: '#22D3EE',    // orange-500
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  round: 9999,
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
