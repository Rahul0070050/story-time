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
  const { status: permissionStatus, request: requestPermission } = useStoragePermission();
  const { scanning: scanningOld, scan: scanOld, isAvailable } = useDeviceScanner();
  const { discovering, discover, hasFolderAccess, refresh: refreshSAF } = useSAFDiscovery();
  const { localBooks, addBooks, removeBook, refresh: refreshLibrary } = useLocalLibrary();

  const allBooks = [...localBooks];
  const scanning = scanningOld || discovering;

  // Sync library when screen is focused (e.g., returning from notifications)
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

  const handleScan = React.useCallback(async (forcePrompt = false) => {
    // Try SAF first (Modern Android)
    const found = await discover(forcePrompt);
    if (found.length > 0) {
      addBooks(found);
    } else if (!hasFolderAccess && !forcePrompt && isAvailable) {
      // Falling back to standard scanner if no SAF folder linked and available
      const standardFound = await scanOld(requestPermission);
      addBooks(standardFound);
    }
  }, [discover, scanOld, requestPermission, addBooks, hasFolderAccess, isAvailable]);

  const hasScannedRef = React.useRef(false);

  // Auto-scan on mount — fully automatic discovery
  React.useEffect(() => {
    if (hasScannedRef.current) return;

    const triggerInitialScan = async () => {
      if (hasFolderAccess) {
        // We already have a folder, just sync it
        handleScan(false);
        hasScannedRef.current = true;
      } else if (permissionStatus === 'granted' && isAvailable) {
        // Permission already granted, just scan device
        handleScan(false);
        hasScannedRef.current = true;
      }
    };

    triggerInitialScan();
  }, [hasFolderAccess, permissionStatus, handleScan, isAvailable]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <FlatList
        data={allBooks}
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
        bookCount={allBooks.length}
        scanning={scanning}
        permissionStatus={permissionStatus}
        hasFolderAccess={hasFolderAccess}
        onScan={handleScan}
        isAvailable={isAvailable}
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
