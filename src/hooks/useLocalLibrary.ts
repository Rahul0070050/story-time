// src/hooks/useLocalLibrary.ts
// Manages the user's locally-added PDF library in component state.

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Story } from '../utils/pdfManager';

interface UseLocalLibraryResult {
  localBooks: Story[];
  addBooks: (incoming: Story[]) => void;
  removeBook: (id: string) => void;
}

export function useLocalLibrary(): UseLocalLibraryResult {
  const [localBooks, setLocalBooks] = useState<Story[]>([]);

  const addBooks = useCallback((incoming: Story[]) => {
    setLocalBooks((prev) => {
      const existingKeys = new Set(prev.map((b) => b.id));
      const deduped = incoming.filter((b) => !existingKeys.has(b.id));
      return [...prev, ...deduped];
    });
  }, []);

  const removeBook = useCallback((id: string) => {
    Alert.alert('Remove Book', 'Remove this book from your library?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setLocalBooks((prev) => prev.filter((b) => b.id !== id)),
      },
    ]);
  }, []);

  return { localBooks, addBooks, removeBook };
}
