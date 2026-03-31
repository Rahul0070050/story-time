// src/components/reader/ProgressBar.tsx
// Thin progress bar at the top of the reader screen.

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS } from '../../constants/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const width = `${Math.min(Math.max(progress, 0), 1) * 100}%` as any;
  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: 3, backgroundColor: 'rgba(124,58,237,0.15)' },
  fill: { height: '100%', backgroundColor: COLORS.primary },
});
