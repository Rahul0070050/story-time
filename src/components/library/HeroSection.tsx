// src/components/library/HeroSection.tsx
// Gradient hero header with scan & pick buttons and a permission status badge.

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RotateCw } from 'lucide-react-native';
import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { COLORS, GRADIENTS } from '../../constants/theme';
import { PermissionStatus } from '../../hooks/useStoragePermission';

interface HeroSectionProps {
  bookCount: number;
  scanning: boolean;
  permissionStatus: PermissionStatus;
  hasFolderAccess: boolean;
  onScan: (forcePrompt?: boolean) => void;
  isAvailable?: boolean;
}

function NotificationIcon({
  hasFolderAccess,
  permissionStatus,
  isAvailable
}: {
  hasFolderAccess: boolean;
  permissionStatus: PermissionStatus;
  isAvailable: boolean;
}) {
  const router = useRouter();
  // Show dot if folder is missing OR (if native scanner is available and permission is missing)
  const showDot = !hasFolderAccess || (isAvailable && Platform.OS === 'android' && permissionStatus !== 'granted');

  return (
    <TouchableOpacity
      style={styles.notificationBtn}
      onPress={() => router.push('/notifications')}
    >
      <Ionicons name="notifications-outline" size={24} color="#fff" />
      {showDot && <View style={styles.notificationDot} />}
    </TouchableOpacity>
  );
}

export const HeroSection = React.memo(({
  bookCount,
  scanning,
  permissionStatus,
  hasFolderAccess,
  onScan,
  isAvailable = true,
}: HeroSectionProps) => {
  return (
    <View>
      <LinearGradient colors={GRADIENTS.hero} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.topRow}>
          <Text style={styles.title}>StoryTime</Text>
          <NotificationIcon
            hasFolderAccess={hasFolderAccess}
            permissionStatus={permissionStatus}
            isAvailable={isAvailable}
          />
        </View>
      </LinearGradient>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>My Library</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{bookCount}</Text>
        </View>
        <Pressable style={styles.scanBtn} onPress={() => onScan(true)}>
          <RotateCw />
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  hero: {
    paddingTop: Platform.OS === 'android' ? 44 : 56,
    paddingBottom: 16,
    paddingHorizontal: 22,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.5 },
  notificationBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    position: 'relative',
  },
  scanBtn: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 12,
  },
  scanBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  notificationDot: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.danger,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 20, paddingBottom: 8, gap: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  countBadge: {
    backgroundColor: COLORS.primary, borderRadius: 10,
    minWidth: 22, height: 22, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 6,
  },
  countText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});

