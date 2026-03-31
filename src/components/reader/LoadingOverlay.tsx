// src/components/reader/LoadingOverlay.tsx
// Full-screen spinner shown while PDF.js renders the document.

import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../../constants/theme';

export function LoadingOverlay() {
  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color={COLORS.accent} />
      <Text style={styles.text}>Opening PDF…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    zIndex: 10,
  },
  text: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '600' },
});
