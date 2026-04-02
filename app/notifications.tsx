import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../src/constants/theme';
import { useLocalLibrary } from '../src/hooks/useLocalLibrary';
import { useSAFDiscovery } from '../src/hooks/useSAFDiscovery';
import { useStoragePermission } from '../src/hooks/useStoragePermission';

export default function NotificationsScreen() {
  const router = useRouter();
  const { hasFolderAccess, discover } = useSAFDiscovery();
  const { addBooks } = useLocalLibrary();
  const { status: permissionStatus, request: requestNativePermission, isAvailable } = useStoragePermission();

  const handleRequestSAF = async () => {
    const found = await discover(true);
    if (found.length > 0) {
      addBooks(found);
    }
  };

  const handleNativePermission = async () => {
    if (!isAvailable) {
      Alert.alert(
        'Feature Limited',
        'Automatic device-wide scanning is not supported in the standard Expo Go app. \n\nPlease use the "Folder Access" method above to find your PDFs.',
        [{ text: 'Got it', style: 'default' }]
      );
      return;
    }
    await requestNativePermission();
  };

  const notifications = [
    {
      id: 'permission-required',
      title: 'Folder Access Required',
      description: 'Choose a folder to find and organize your local PDF stories.',
      icon: 'folder-open-outline',
      type: 'warning',
      active: !hasFolderAccess,
      action: handleRequestSAF,
    },
    {
      id: 'native-permission',
      title: isAvailable ? 'Storage Permission Required' : 'Native Scanner Limited',
      description: isAvailable 
        ? 'Grant storage permission to allow the app to find PDF files across your device.'
        : 'Device-wide scanning is limited in Expo Go. Use "Folder Access" to list your PDFs.',
      icon: isAvailable ? 'shield-outline' : 'information-circle-outline',
      type: isAvailable ? 'warning' : 'info',
      active: Platform.OS === 'android' && permissionStatus !== 'granted',
      action: handleNativePermission,
    },
    {
      id: 'welcome',
      title: 'Welcome to StoryTime',
      description: 'Your personal library for reading and organizing PDF stories.',
      icon: 'sparkles-outline',
      type: 'info',
      active: true,
    }
  ].filter(n => n.active);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ 
        title: 'Notifications',
        headerStyle: { backgroundColor: COLORS.bg },
        headerTintColor: '#fff',
        headerLeft: () => (
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        ),
      }} />

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="notifications-off-outline" size={64} color="rgba(255,255,255,0.2)" />
          <Text style={styles.emptyText}>No new notifications</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.notificationItem}
              onPress={item.action}
              disabled={!item.action}
            >
              <View style={[
                styles.iconBox, 
                item.type === 'warning' ? styles.warningIcon : styles.infoIcon
              ]}>
                <Ionicons name={item.icon as any} size={22} color="#fff" />
              </View>
              <View style={styles.content}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.description}>{item.description}</Text>
                {item.action && (
                  <View style={styles.actionBadge}>
                    <Text style={styles.actionText}>Fix Now</Text>
                    <Ionicons name="chevron-forward" size={12} color={COLORS.accent} />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  list: { padding: 16 },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  warningIcon: { backgroundColor: 'rgba(248,113,113,0.2)' },
  infoIcon: { backgroundColor: 'rgba(124,58,237,0.2)' },
  content: { flex: 1 },
  title: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  description: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 8 },
  actionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(167,139,250,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  actionText: { color: COLORS.accent, fontSize: 11, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', opacity: 0.6 },
  emptyText: { color: '#fff', marginTop: 16, fontSize: 16 },
  warning: {}, // dummy for linter
  info: {}, // dummy for linter
});
