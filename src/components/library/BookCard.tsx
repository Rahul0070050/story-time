// src/components/library/BookCard.tsx
// Renders a single book row in the library list.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Story } from '../../utils/pdfManager';
import { COLORS, BOOK_EMOJIS } from '../../constants/theme';

interface BookCardProps {
  item: Story;
  index: number;
  onPress: (item: Story) => void;
  onRemove: (id: string) => void;
}

export function BookCard({ item, index, onPress, onRemove }: BookCardProps) {
  const emoji = BOOK_EMOJIS[index % BOOK_EMOJIS.length];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(item)}
      onLongPress={item.isLocal ? () => onRemove(item.id) : undefined}
      activeOpacity={0.82}
    >
      <View style={styles.emojiBox}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <View style={styles.meta}>
          <Ionicons
            name={item.isLocal ? 'phone-portrait-outline' : 'globe-outline'}
            size={12}
            color={COLORS.accent}
          />
          <Text style={styles.author}> {item.author}</Text>
        </View>
      </View>

      {item.isLocal ? (
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => onRemove(item.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close-circle" size={20} color="#6b21a8" />
        </TouchableOpacity>
      ) : (
        <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: 18,
    marginBottom: 11,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    elevation: 3,
  },
  emojiBox: {
    width: 50,
    height: 50,
    borderRadius: 13,
    backgroundColor: 'rgba(124,58,237,0.13)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.22)',
  },
  emoji: { fontSize: 24 },
  content: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  meta: { flexDirection: 'row', alignItems: 'center' },
  author: { fontSize: 12, color: COLORS.accent, fontWeight: '500' },
  removeBtn: { marginLeft: 6, padding: 2 },
});
