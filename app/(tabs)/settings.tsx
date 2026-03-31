// app/(tabs)/settings.tsx
// Settings screen — app preferences and info.

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, StatusBar, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants/theme';

interface SettingRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel?: string;
  right?: React.ReactNode;
  onPress?: () => void;
}

function SettingRow({ icon, label, sublabel, right, onPress }: SettingRowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={19} color={COLORS.accent} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {sublabel ? <Text style={styles.rowSub}>{sublabel}</Text> : null}
      </View>
      {right ?? <Ionicons name="chevron-forward" size={16} color={COLORS.textMuted} />}
    </TouchableOpacity>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionLabel}>{title.toUpperCase()}</Text>;
}

export default function SettingsScreen() {
  const [darkMode, setDarkMode] = useState(true);
  const [autoScroll, setAutoScroll] = useState(false);
  const [keepAwake, setKeepAwake] = useState(true);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Customise your experience</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Reading */}
        <SectionHeader title="Reading" />
        <View style={styles.section}>
          <SettingRow
            icon="moon-outline"
            label="Dark Mode"
            sublabel="Easy on the eyes"
            right={<Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ true: COLORS.primary }} thumbColor="#fff" />}
          />
          <SettingRow
            icon="phone-portrait-outline"
            label="Keep Screen Awake"
            sublabel="While reading"
            right={<Switch value={keepAwake} onValueChange={setKeepAwake} trackColor={{ true: COLORS.primary }} thumbColor="#fff" />}
          />
          <SettingRow
            icon="play-outline"
            label="Auto Scroll"
            sublabel="Scroll pages automatically"
            right={<Switch value={autoScroll} onValueChange={setAutoScroll} trackColor={{ true: COLORS.primary }} thumbColor="#fff" />}
          />
        </View>

        {/* Library */}
        <SectionHeader title="Library" />
        <View style={styles.section}>
          <SettingRow icon="folder-outline" label="Default Import Folder" sublabel="Downloads" />
          <SettingRow icon="trash-outline" label="Clear Cache" sublabel="Free up storage" onPress={() => {}} />
        </View>

        {/* About */}
        <SectionHeader title="About" />
        <View style={styles.section}>
          <SettingRow icon="information-circle-outline" label="Version" right={<Text style={styles.versionText}>1.0.0</Text>} />
          <SettingRow icon="heart-outline" label="Rate Storytime" onPress={() => {}} />
          <SettingRow icon="mail-outline" label="Send Feedback" onPress={() => {}} />
        </View>
      </ScrollView>
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
  scroll: { padding: 18, paddingBottom: 48 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: COLORS.textMuted,
    letterSpacing: 1.2, marginTop: 20, marginBottom: 8, marginLeft: 4,
  },
  section: {
    backgroundColor: COLORS.card, borderRadius: 16,
    borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden',
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  rowIcon: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: 'rgba(124,58,237,0.12)',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowText: { flex: 1 },
  rowLabel: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '600' },
  rowSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 1 },
  versionText: { color: COLORS.textMuted, fontSize: 13 },
});
