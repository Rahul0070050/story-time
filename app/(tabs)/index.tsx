import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SAMPLE_STORIES, Story } from '../../src/utils/pdfManager';

// Common Android directories to scan for PDFs
const ANDROID_SCAN_DIRS = [
  '/storage/emulated/0/Download/',
  '/storage/emulated/0/Documents/',
  '/storage/emulated/0/DCIM/',
  '/storage/emulated/0/',
];

const EMOJI_ICONS = ['📖', '📚', '📕', '📗', '📘', '📙', '📓', '📔'];

type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'unavailable';

export default function LibraryScreen() {
  const router = useRouter();
  const [localBooks, setLocalBooks] = useState<Story[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('unknown');
  const [scanning, setScanning] = useState(false);

  // ─── Navigation ────────────────────────────────────────────────────────────
  const openStory = (item: Story) => {
    if (item.isLocal && item.localUri) {
      router.push({
        pathname: '/reader/[id]',
        params: { id: item.id, uri: item.localUri, title: item.title },
      });
    } else {
      router.push({
        pathname: '/reader/[id]',
        params: { id: item.id, title: item.title },
      });
    }
  };

  // ─── Permission request ────────────────────────────────────────────────────
  const requestStoragePermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      setPermissionStatus('unavailable');
      return false;
    }

    try {
      const sdkVersion = Platform.Version as number;

      // Android 13+ uses READ_MEDIA_* instead of READ_EXTERNAL_STORAGE
      const permissions =
        sdkVersion >= 33
          ? [
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES, // still needed for SAF
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            ]
          : [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE];

      const results = await PermissionsAndroid.requestMultiple(permissions);

      const allGranted = Object.values(results).every(
        (r) => r === PermissionsAndroid.RESULTS.GRANTED
      );

      if (allGranted) {
        setPermissionStatus('granted');
        return true;
      } else {
        const denied = Object.values(results).some(
          (r) => r === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
        );
        setPermissionStatus('denied');
        if (denied) {
          Alert.alert(
            'Permission Required',
            'Storage access was permanently denied. Please enable it in your device Settings → Apps → Storytime → Permissions.',
            [{ text: 'OK' }]
          );
        }
        return false;
      }
    } catch (err) {
      console.warn('Permission error:', err);
      setPermissionStatus('denied');
      return false;
    }
  }, []);

  // ─── Scan directories for PDFs ─────────────────────────────────────────────
  const scanDirForPdfs = async (dirPath: string): Promise<Story[]> => {
    const found: Story[] = [];
    try {
      const info = await FileSystem.getInfoAsync(dirPath);
      if (!info.exists || !info.isDirectory) return found;

      const items = await FileSystem.readDirectoryAsync(dirPath);
      for (const name of items) {
        if (name.toLowerCase().endsWith('.pdf')) {
          const uri = dirPath + name;
          found.push({
            id: `scan-${uri}`,
            title: name.replace(/\.pdf$/i, ''),
            author: 'From Device',
            localUri: uri,
            isLocal: true,
          });
        }
      }
    } catch {
      // Directory inaccessible — skip silently
    }
    return found;
  };

  const scanDeviceForPdfs = useCallback(async () => {
    if (Platform.OS !== 'android') {
      Alert.alert(
        'Not Supported',
        'Automatic scanning is only available on Android. Use "Pick PDFs" to select files manually.'
      );
      return;
    }

    const granted = await requestStoragePermission();
    if (!granted) return;

    setScanning(true);
    try {
      const allFound: Story[] = [];
      for (const dir of ANDROID_SCAN_DIRS) {
        const pdfs = await scanDirForPdfs(dir);
        allFound.push(...pdfs);
      }

      if (allFound.length === 0) {
        Alert.alert(
          'No PDFs Found',
          'No PDF files were found in common directories (Downloads, Documents). Try using "Pick PDFs" to browse manually.',
          [{ text: 'OK' }]
        );
      } else {
        setLocalBooks((prev) => {
          const existingIds = new Set(prev.map((b) => b.id));
          const newOnes = allFound.filter((b) => !existingIds.has(b.id));
          return [...prev, ...newOnes];
        });
      }
    } catch (err) {
      Alert.alert('Scan Failed', 'Could not complete the scan. Try picking files manually.');
    } finally {
      setScanning(false);
    }
  }, [requestStoragePermission]);

  // ─── Manual document picker ────────────────────────────────────────────────
  const pickPDF = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const newBooks: Story[] = result.assets.map((asset, i) => ({
        id: `pick-${Date.now()}-${i}`,
        title: asset.name.replace(/\.pdf$/i, ''),
        author: 'From Device',
        localUri: asset.uri,
        isLocal: true,
      }));

      setLocalBooks((prev) => {
        const existingUris = new Set(prev.map((b) => b.localUri));
        return [...prev, ...newBooks.filter((b) => !existingUris.has(b.localUri))];
      });
    } catch {
      Alert.alert('Error', 'Could not open the file picker. Please try again.');
    }
  }, []);

  const removeLocalBook = (id: string) => {
    Alert.alert('Remove Book', 'Remove this book from your library?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setLocalBooks((prev) => prev.filter((b) => b.id !== id)),
      },
    ]);
  };

  const allBooks = [...SAMPLE_STORIES, ...localBooks];

  // ─── Render book card ──────────────────────────────────────────────────────
  const renderBook = ({ item, index }: { item: Story; index: number }) => {
    const emoji = EMOJI_ICONS[index % EMOJI_ICONS.length];
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => openStory(item)}
        activeOpacity={0.82}
        onLongPress={item.isLocal ? () => removeLocalBook(item.id) : undefined}
      >
        <View style={styles.cardEmoji}>
          <Text style={styles.emojiText}>{emoji}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <View style={styles.cardMeta}>
            <Ionicons
              name={item.isLocal ? 'phone-portrait-outline' : 'globe-outline'}
              size={12}
              color="#a78bfa"
            />
            <Text style={styles.cardAuthor}> {item.author}</Text>
          </View>
        </View>
        {item.isLocal && (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => removeLocalBook(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="close-circle" size={20} color="#6b21a8" />
          </TouchableOpacity>
        )}
        {!item.isLocal && (
          <View style={styles.cardArrow}>
            <Ionicons name="chevron-forward" size={18} color="#7c3aed" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // ─── Permission status indicator ───────────────────────────────────────────
  const PermissionBadge = () => {
    if (Platform.OS !== 'android' || permissionStatus === 'unknown') return null;
    const granted = permissionStatus === 'granted';
    return (
      <View style={[styles.permBadge, granted ? styles.permGranted : styles.permDenied]}>
        <Ionicons
          name={granted ? 'shield-checkmark' : 'shield-outline'}
          size={13}
          color={granted ? '#4ade80' : '#f87171'}
        />
        <Text style={[styles.permText, { color: granted ? '#4ade80' : '#f87171' }]}>
          {granted ? 'Storage access granted' : 'Storage access denied'}
        </Text>
      </View>
    );
  };

  // ─── List header ───────────────────────────────────────────────────────────
  const ListHeader = () => (
    <View>
      <LinearGradient
        colors={['#1a0533', '#2d0a5f', '#180430']}
        style={styles.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Badge */}
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>✨ Your Story Space</Text>
        </View>

        <Text style={styles.heroTitle}>StoryTime</Text>
        <Text style={styles.heroSubtitle}>
          Read, collect &amp; explore PDFs — all in one place.
        </Text>

        <PermissionBadge />

        {/* Scan button — Android only */}
        {Platform.OS === 'android' && (
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={scanDeviceForPdfs}
            activeOpacity={0.85}
            disabled={scanning}
          >
            <LinearGradient
              colors={['#7c3aed', '#a855f7']}
              style={styles.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {scanning ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="search" size={19} color="#fff" />
              )}
              <Text style={styles.btnText}>
                {scanning ? 'Scanning…' : 'Scan Device for PDFs'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Manual pick button */}
        <TouchableOpacity
          style={[styles.pickBtn, Platform.OS !== 'android' && { marginTop: 0 }]}
          onPress={pickPDF}
          activeOpacity={0.85}
        >
          <Ionicons name="folder-open-outline" size={19} color="#c4b5fd" />
          <Text style={styles.pickBtnText}>Pick PDFs Manually</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Library</Text>
        <View style={styles.sectionBadge}>
          <Text style={styles.sectionBadgeText}>{allBooks.length}</Text>
        </View>
      </View>
    </View>
  );

  const ListEmpty = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📭</Text>
      <Text style={styles.emptyTitle}>Library is empty</Text>
      <Text style={styles.emptySubtitle}>
        {Platform.OS === 'android'
          ? 'Tap "Scan Device for PDFs" to find PDFs automatically, or pick files manually.'
          : 'Tap "Pick PDFs Manually" to add books.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0120" />
      <FlatList
        data={allBooks}
        keyExtractor={(item) => item.id}
        renderItem={renderBook}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0120' },
  listContent: { paddingBottom: 48 },

  // Hero
  hero: {
    paddingTop: Platform.OS === 'android' ? 52 : 64,
    paddingBottom: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  heroBadge: {
    backgroundColor: 'rgba(167,139,250,0.15)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(167,139,250,0.3)',
  },
  heroBadgeText: {
    color: '#a78bfa',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 50,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -1.5,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#c4b5fd',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 20,
    maxWidth: 260,
  },

  // Permission badge
  permBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 18,
    gap: 6,
    borderWidth: 1,
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

  // Scan button
  scanBtn: {
    borderRadius: 15,
    overflow: 'hidden',
    width: '100%',
    marginBottom: 12,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  btnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 24,
    gap: 10,
  },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 0.2 },

  // Pick button
  pickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: 'rgba(167,139,250,0.4)',
    backgroundColor: 'rgba(124,58,237,0.08)',
    gap: 8,
    marginTop: 0,
  },
  pickBtnText: { color: '#c4b5fd', fontSize: 15, fontWeight: '600' },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 10,
    gap: 10,
  },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  sectionBadge: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    minWidth: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  sectionBadgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a0a2e',
    marginHorizontal: 18,
    marginBottom: 11,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.18)',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  cardEmoji: {
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
  emojiText: { fontSize: 24 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#f3e8ff', marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center' },
  cardAuthor: { fontSize: 12, color: '#a78bfa', fontWeight: '500' },
  cardArrow: { marginLeft: 6 },
  removeBtn: { marginLeft: 6, padding: 2 },

  // Empty state
  emptyState: { alignItems: 'center', paddingTop: 50, paddingHorizontal: 36 },
  emptyIcon: { fontSize: 52, marginBottom: 14 },
  emptyTitle: { fontSize: 19, fontWeight: '700', color: '#e9d5ff', marginBottom: 8 },
  emptySubtitle: { fontSize: 13, color: '#7c5fac', textAlign: 'center', lineHeight: 20 },
});
