import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, StatusBar, StyleSheet, View } from 'react-native';

import { BookCard } from '../../src/components/library/BookCard';
import { EmptyLibrary } from '../../src/components/library/EmptyLibrary';
import { HeroSection } from '../../src/components/library/HeroSection';
import { COLORS } from '../../src/constants/theme';
import { useDeviceScanner } from '../../src/hooks/useDeviceScanner';
import { useLocalLibrary } from '../../src/hooks/useLocalLibrary';
import { usePdfPicker } from '../../src/hooks/usePdfPicker';
import { useStoragePermission } from '../../src/hooks/useStoragePermission';
import { SAMPLE_STORIES, Story } from '../../src/utils/pdfManager';

export default function LibraryScreen() {
  const router = useRouter();
  const { status: permissionStatus, request: requestPermission } = useStoragePermission();
  const { scanning, scan } = useDeviceScanner();
  const { pick } = usePdfPicker();
  const { localBooks, addBooks, removeBook } = useLocalLibrary();

  const allBooks = [...SAMPLE_STORIES, ...localBooks];

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

  const handleScan = async () => {
    const found = await scan(requestPermission);
    addBooks(found);
  };

  const handlePick = async () => {
    const picked = await pick();
    addBooks(picked);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <FlatList
        data={allBooks}
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
            onScan={handleScan}
            onPick={handlePick}
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
