// src/hooks/useLocalLibrary.ts
// Manages the user's locally-added PDF library in component state.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Story } from '../utils/pdfManager';

const LIBRARY_STORAGE_KEY = '@storytime_local_library';

interface UseLocalLibraryResult {
  localBooks: Story[];
  addBooks: (incoming: Story[]) => void;
  removeBook: (id: string) => void;
  refresh: () => void;
}

export function useLocalLibrary(): UseLocalLibraryResult {
  const [localBooks, setLocalBooks] = useState<Story[]>([]);

  const loadLibrary = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem(LIBRARY_STORAGE_KEY);
      if (saved) {
        setLocalBooks(JSON.parse(saved));
      }
    } catch (err) {
      console.error('[useLocalLibrary] Load error:', err);
    }
  }, []);

  // Load library from storage on mount
  useEffect(() => {
    loadLibrary();
  }, [loadLibrary]);

  // Save library to storage whenever it changes
  const saveLibrary = async (books: Story[]) => {
    try {
      await AsyncStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(books));
    } catch (err) {
      console.error('[useLocalLibrary] Save error:', err);
    }
  };

  const addBooks = useCallback((incoming: Story[]) => {
    setLocalBooks((prev) => {
      const existingKeys = new Set(prev.map((b) => b.id));
      const deduped = incoming.filter((b) => !existingKeys.has(b.id));
      const updated = [...prev, ...deduped];
      saveLibrary(updated);
      return updated;
    });
  }, []);

  const removeBook = useCallback((id: string) => {
    Alert.alert('Remove Book', 'Remove this book from your library?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setLocalBooks((prev) => {
            const updated = prev.filter((b) => b.id !== id);
            saveLibrary(updated);
            return updated;
          });
        },
      },
    ]);
  }, []);

  return { localBooks, addBooks, removeBook, refresh: loadLibrary };
}
