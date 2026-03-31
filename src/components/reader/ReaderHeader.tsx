// src/components/reader/ReaderHeader.tsx
// Custom dark navigation bar shown at the top of the PDF reader.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';

interface ReaderHeaderProps {
  title: string;
  currentPage: number;
  totalPages: number;
  onBack: () => void;
}

const STATUS_BAR_H =
  Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 44;

export function ReaderHeader({ title, currentPage, totalPages, onBack }: ReaderHeaderProps) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        style={styles.backBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </TouchableOpacity>

      <View style={styles.center}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        {totalPages > 0 && (
          <Text style={styles.sub}>Page {currentPage} of {totalPages}</Text>
        )}
      </View>

      {/* Spacer to keep title centred */}
      <View style={styles.backBtn} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingTop: STATUS_BAR_H + 8,
    paddingBottom: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124,58,237,0.25)',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(124,58,237,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', paddingHorizontal: 10 },
  title: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '700' },
  sub: { color: COLORS.accent, fontSize: 11, marginTop: 2, fontWeight: '500' },
});
