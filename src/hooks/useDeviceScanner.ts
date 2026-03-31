// src/hooks/useDeviceScanner.ts
// Scans common Android directories for PDF files after permission is granted.

import { useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Story } from '../utils/pdfManager';
import { ANDROID_SCAN_DIRS } from '../constants/theme';

interface UseDeviceScannerResult {
  scanning: boolean;
  scan: (requestPermission: () => Promise<boolean>) => Promise<Story[]>;
}

async function scanDirectory(dirPath: string): Promise<Story[]> {
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
}

export function useDeviceScanner(): UseDeviceScannerResult {
  const [scanning, setScanning] = useState(false);

  const scan = useCallback(
    async (requestPermission: () => Promise<boolean>): Promise<Story[]> => {
      if (Platform.OS !== 'android') {
        Alert.alert(
          'Not Supported',
          'Automatic scanning is only available on Android. Use "Pick PDFs" to select files manually.'
        );
        return [];
      }

      const granted = await requestPermission();
      if (!granted) return [];

      setScanning(true);
      try {
        const results = await Promise.all(ANDROID_SCAN_DIRS.map(scanDirectory));
        const allFound = results.flat();

        if (allFound.length === 0) {
          Alert.alert(
            'No PDFs Found',
            'No PDF files found in Downloads or Documents. Try "Pick PDFs" to browse manually.',
            [{ text: 'OK' }]
          );
        }
        return allFound;
      } catch {
        Alert.alert('Scan Failed', 'Could not complete the scan. Try picking files manually.');
        return [];
      } finally {
        setScanning(false);
      }
    },
    []
  );

  return { scanning, scan };
}
