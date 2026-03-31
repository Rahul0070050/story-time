// app/(tabs)/bookmarks.tsx
// Bookmarks screen — placeholder for saved/favourite pages or books.

import React from 'react';
import { View, Text, StyleSheet, FlatList, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';

const PLACEHOLDER_BOOKMARKS = [
  { id: '1', book: 'Alice in Wonderland', page: 24, note: 'The rabbit hole scene' },
  { id: '2', book: 'The Little Prince', page: 7, note: 'About the baobabs' },
];

export default function BookmarksScreen() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.header}>
        <Text style={styles.title}>Bookmarks</Text>
        <Text style={styles.subtitle}>Your saved pages</Text>
      </View>

      {PLACEHOLDER_BOOKMARKS.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={52} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No bookmarks yet</Text>
          <Text style={styles.emptySub}>Long-press a page while reading to save it here</Text>
        </View>
      ) : (
        <FlatList
          data={PLACEHOLDER_BOOKMARKS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.pageTag}>
                <Text style={styles.pageNum}>P.{item.page}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.bookName} numberOfLines={1}>{item.book}</Text>
                <Text style={styles.note} numberOfLines={2}>{item.note}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingTop: 60, paddingBottom: 20, paddingHorizontal: 24,
    borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 2 },
  list: { padding: 18, gap: 10 },
  card: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card,
    borderRadius: 14, padding: 14, borderWidth: 1, borderColor: COLORS.border,
  },
  pageTag: {
    width: 44, height: 44, borderRadius: 11, backgroundColor: 'rgba(124,58,237,0.15)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)',
  },
  pageNum: { color: COLORS.accent, fontSize: 11, fontWeight: '700' },
  info: { flex: 1 },
  bookName: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700', marginBottom: 3 },
  note: { color: COLORS.textMuted, fontSize: 12, lineHeight: 17 },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingHorizontal: 36,
  },
  emptyTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '700' },
  emptySub: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
