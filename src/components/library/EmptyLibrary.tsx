// src/components/library/EmptyLibrary.tsx
// Shown when the library has no books to display.

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { COLORS } from '../../constants/theme';

export function EmptyLibrary() {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📭</Text>
      <Text style={styles.title}>Library is empty</Text>
      <Text style={styles.subtitle}>
        {Platform.OS === 'android'
          ? 'Tap "Scan Device for PDFs" to find PDFs automatically, or pick files manually.'
          : 'Tap "Pick PDFs Manually" to add your first book.'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 36,
  },
  icon: { fontSize: 52, marginBottom: 14 },
  title: {
    fontSize: 19,
    fontWeight: '700',
    color: '#e9d5ff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
