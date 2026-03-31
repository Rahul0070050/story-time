// src/constants/theme.ts
// Single source of truth for colours, spacing, and shared constants.

export const COLORS = {
  bg: '#0f0120',
  card: '#1a0a2e',
  surface: '#18082b',
  primary: '#7c3aed',
  primaryLight: '#a855f7',
  accent: '#a78bfa',
  textPrimary: '#f3e8ff',
  textSecondary: '#c4b5fd',
  textMuted: '#7c5fac',
  success: '#4ade80',
  danger: '#f87171',
  border: 'rgba(124,58,237,0.2)',
} as const;

export const GRADIENTS = {
  hero: ['#1a0533', '#2d0a5f', '#180430'] as const,
  button: ['#7c3aed', '#a855f7'] as const,
};

export const BOOK_EMOJIS = ['📖', '📚', '📕', '📗', '📘', '📙', '📓', '📔'];

// Common Android directories scanned for PDF files
export const ANDROID_SCAN_DIRS = [
  '/storage/emulated/0/Download/',
  '/storage/emulated/0/Documents/',
  '/storage/emulated/0/DCIM/',
  '/storage/emulated/0/',
];
