// src/hooks/usePdfPicker.ts
// Opens the system document picker to let the user select PDF files.

import { useCallback } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Story } from '../utils/pdfManager';

interface UsePdfPickerResult {
  pick: () => Promise<Story[]>;
}

export function usePdfPicker(): UsePdfPickerResult {
  const pick = useCallback(async (): Promise<Story[]> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return [];

      return result.assets.map((asset, i): Story => ({
        id: `pick-${Date.now()}-${i}`,
        title: asset.name.replace(/\.pdf$/i, ''),
        author: 'From Device',
        localUri: asset.uri,
        isLocal: true,
      }));
    } catch {
      Alert.alert('Error', 'Could not open the file picker. Please try again.');
      return [];
    }
  }, []);

  return { pick };
}
