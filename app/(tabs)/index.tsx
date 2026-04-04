// app/(tabs)/library.tsx
import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import { Alert, FlatList, StatusBar, StyleSheet, View } from 'react-native';

import { BookCard } from '../../src/components/library/BookCard';
import { EmptyLibrary } from '../../src/components/library/EmptyLibrary';
import { HeroSection } from '../../src/components/library/HeroSection';
import { COLORS } from '../../src/constants/theme';
import { useDeviceScanner } from '../../src/hooks/useDeviceScanner';
import { useLocalLibrary } from '../../src/hooks/useLocalLibrary';
import { useSAFDiscovery } from '../../src/hooks/useSAFDiscovery';
import { useStoragePermission } from '../../src/hooks/useStoragePermission';
import { Story } from '../../src/utils/pdfManager';

export default function LibraryScreen() {
  const router = useRouter();
  const { status: permissionStatus, request: requestPermission, isAvailable } = useStoragePermission();
  const { scanning: scanningOld, scan: scanOld, isAvailable: rnfsAvailable } = useDeviceScanner();
  const { discovering, discover, hasFolderAccess, refresh: refreshSAF } = useSAFDiscovery();
  const { localBooks, addBooks, removeBook, refresh: refreshLibrary } = useLocalLibrary();

  const scanning = scanningOld || discovering;

  useFocusEffect(
    React.useCallback(() => {
      refreshSAF();
      refreshLibrary();
    }, [refreshSAF, refreshLibrary])
  );

  const openBook = (item: Story) => {
    router.push({
      pathname: '/reader/[id]',
      params: {
        id: item.id,
        title: item.title,
        ...(item.isLocal && item.localUri ? { uri: item.localUri } : {}),
      },
    });
  };

  /**
   * Full scan strategy:
   * 1. If SAF folder is linked → silent rescan (fast, modern Android)
   * 2. If forcePrompt → ask user to pick their root storage folder via SAF
   * 3. Fallback → RNFS scan of common directories (old Android / bare workflow)
   */
  const handleScan = React.useCallback(async (forcePrompt = false) => {
    // Modern Android path (SAF)
    if (hasFolderAccess || forcePrompt) {
      const found = await discover(forcePrompt);
      if (found.length > 0) {
        addBooks(found);
        return;
      }
    }

    // First launch on modern Android: guide user to pick root storage
    if (!hasFolderAccess && forcePrompt) {
      Alert.alert(
        'Select Your Storage Folder',
        'To find all your PDFs, please select your device\'s root storage folder (usually "Internal Storage" or "SD Card").',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Choose Folder',
            onPress: async () => {
              const found = await discover(true); // forcePrompt = true → opens SAF picker
              if (found.length > 0) addBooks(found);
            },
          },
        ]
      );
      return;
    }

    // Fallback: RNFS scan (older Android or no SAF support)
    if (rnfsAvailable) {
      const found = await scanOld(requestPermission);
      if (found.length > 0) addBooks(found);
    }
  }, [discover, scanOld, requestPermission, addBooks, hasFolderAccess, rnfsAvailable]);

  // Auto-scan on mount
  const hasScannedRef = React.useRef(false);
  React.useEffect(() => {
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;

    if (hasFolderAccess) {
      // Already linked a folder → silent rescan
      handleScan(false);
    } else if (permissionStatus === 'granted' && rnfsAvailable) {
      // Old Android with permission → RNFS scan
      handleScan(false);
    }
    // Otherwise wait for user to tap the scan button (forcePrompt = true)
  }, [hasFolderAccess, permissionStatus, handleScan, rnfsAvailable]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <FlatList
        data={localBooks}
        style={{ backgroundColor: COLORS.bg }}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <BookCard
            item={item}
            index={index}
            onPress={openBook}
            onRemove={removeBook}
          />
        )}
        ListHeaderComponent={
          <HeroSection
            bookCount={localBooks.length}
            scanning={scanning}
            permissionStatus={permissionStatus}
            hasFolderAccess={hasFolderAccess}
            onScan={handleScan}   // pass forcePrompt=true when user taps button
            isAvailable={rnfsAvailable}
          />
        }
        ListEmptyComponent={<EmptyLibrary />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  list: { paddingBottom: 48 },
});