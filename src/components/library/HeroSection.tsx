// src/components/library/HeroSection.tsx
// Gradient hero header with scan & pick buttons and a permission status badge.

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, GRADIENTS } from '../../constants/theme';
import { PermissionStatus } from '../../hooks/useStoragePermission';

interface HeroSectionProps {
  bookCount: number;
  scanning: boolean;
  permissionStatus: PermissionStatus;
  onScan: () => void;
  onPick: () => void;
}

function PermissionBadge({ status }: { status: PermissionStatus }) {
  if (Platform.OS !== 'android' || status === 'unknown') return null;
  const granted = status === 'granted';
  return (
    <View style={[styles.permBadge, granted ? styles.permGranted : styles.permDenied]}>
      <Ionicons
        name={granted ? 'shield-checkmark' : 'shield-outline'}
        size={13}
        color={granted ? COLORS.success : COLORS.danger}
      />
      <Text style={[styles.permText, { color: granted ? COLORS.success : COLORS.danger }]}>
        {granted ? 'Storage access granted' : 'Storage access denied'}
      </Text>
    </View>
  );
}

export function HeroSection({
  bookCount,
  scanning,
  permissionStatus,
  onScan,
  onPick,
}: HeroSectionProps) {
  return (
    <View>
      <LinearGradient colors={GRADIENTS.hero} style={styles.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✨ Your Story Space</Text>
        </View>

        <Text style={styles.title}>StoryTime</Text>
        <Text style={styles.subtitle}>Read, collect &amp; explore PDFs — all in one place.</Text>

        <PermissionBadge status={permissionStatus} />

        {Platform.OS === 'android' && (
          <TouchableOpacity style={styles.scanBtn} onPress={onScan} activeOpacity={0.85} disabled={scanning}>
            <LinearGradient colors={GRADIENTS.button} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {scanning
                ? <ActivityIndicator color="#fff" size="small" />
                : <Ionicons name="search" size={19} color="#fff" />}
              <Text style={styles.btnText}>{scanning ? 'Scanning…' : 'Scan Device for PDFs'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.pickBtn} onPress={onPick} activeOpacity={0.85}>
          <Ionicons name="folder-open-outline" size={19} color={COLORS.textSecondary} />
          <Text style={styles.pickText}>Pick PDFs Manually</Text>
        </TouchableOpacity>
      </LinearGradient>

      <View style={styles.sectionRow}>
        <Text style={styles.sectionTitle}>My Library</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{bookCount}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    paddingTop: Platform.OS === 'android' ? 52 : 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  badgeText: { color: COLORS.accent, fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  title: { fontSize: 50, fontWeight: '800', color: '#fff', letterSpacing: -1.5, marginBottom: 10 },
  subtitle: {
    fontSize: 14, color: COLORS.textSecondary, textAlign: 'center',
    lineHeight: 21, marginBottom: 20, maxWidth: 260,
  },
  permBadge: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 5, marginBottom: 18,
    gap: 6, borderWidth: 1,
  },
  permGranted: {
    backgroundColor: 'rgba(74,222,128,0.08)',
    borderColor: 'rgba(74,222,128,0.25)',
  },
  permDenied: {
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderColor: 'rgba(248,113,113,0.25)',
  },
  permText: { fontSize: 12, fontWeight: '600' },
  scanBtn: {
    borderRadius: 15, overflow: 'hidden', width: '100%', marginBottom: 12,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  btnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, paddingHorizontal: 24, gap: 10,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },
  pickBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    width: '100%', paddingVertical: 13, borderRadius: 15,
    borderWidth: 1.5, borderColor: 'rgba(167,139,250,0.4)',
    backgroundColor: 'rgba(124,58,237,0.08)', gap: 8,
  },
  pickText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 22, paddingTop: 26, paddingBottom: 10, gap: 10,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  countBadge: {
    backgroundColor: COLORS.primary, borderRadius: 12,
    minWidth: 26, height: 26, alignItems: 'center',
    justifyContent: 'center', paddingHorizontal: 8,
  },
  countText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
