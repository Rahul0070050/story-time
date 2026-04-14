import { useFocusEffect, useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StatusBar, StyleSheet, View } from 'react-native';

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

  const {
    status: permissionStatus,
    request: requestPermission,
  } = useStoragePermission();

  const {
    scanning: scanningOld,
    scan: scanOld,
    isAvailable: rnfsAvailable,
  } = useDeviceScanner();

  const {
    discovering,
    discover,
    hasFolderAccess,
    refresh: refreshSAF,
  } = useSAFDiscovery();

  const {
    localBooks,
    addBooks,
    removeBook,
    refresh: refreshLibrary,
  } = useLocalLibrary();

  const scanning = scanningOld || discovering;

  useFocusEffect(
    React.useCallback(() => {
      refreshSAF();
      refreshLibrary();
    }, [refreshSAF, refreshLibrary])
  );

  const openBook = React.useCallback((item: Story) => {
    router.push({
      pathname: '/reader/[id]',
      params: {
        id: item.id,
        title: item.title,
        ...(item.isLocal && item.localUri ? { uri: item.localUri } : {}),
      },
    });
  }, [router]);

  const mergeFoundBooks = React.useCallback((found: Story[]) => {
    if (found.length > 0) {
      addBooks(found);
    }
  }, [addBooks]);

  const handleScan = React.useCallback(async (forcePrompt = false) => {
    // 1. Preferred path: already-linked SAF folder
    if (hasFolderAccess) {
      const found = await discover(false);
      mergeFoundBooks(found);
      return;
    }

    // 2. If user explicitly tapped scan and no folder is linked yet,
    // open folder picker and scan selected tree.
    if (forcePrompt) {
      const found = await discover(true);
      if (found.length > 0) {
        mergeFoundBooks(found);
        return;
      }
    }

    // 3. Fallback for older Android / direct-path workflow
    if (rnfsAvailable) {
      const found = await scanOld(requestPermission);
      mergeFoundBooks(found);
    }
  }, [
    hasFolderAccess,
    discover,
    mergeFoundBooks,
    rnfsAvailable,
    scanOld,
    requestPermission,
  ]);

  const hasScannedRef = React.useRef(false);

  React.useEffect(() => {
    if (hasScannedRef.current) return;
    hasScannedRef.current = true;

    if (hasFolderAccess) {
      handleScan(false);
      return;
    }

    if (rnfsAvailable) {
      handleScan(false);
    }
  }, [hasFolderAccess, rnfsAvailable, handleScan]);

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
            onScan={handleScan}
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