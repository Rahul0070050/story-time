// src/hooks/useSAFDiscovery.ts
// Uses Expo FileSystem v19+ Directory API to discover PDFs.

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import React, { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Story } from '../utils/pdfManager';

const SAF_STORAGE_KEY = '@storytime_saf_uri';

interface UseSAFDiscoveryResult {
  discovering: boolean;
  discover: (forcePrompt?: boolean) => Promise<Story[]>;
  hasFolderAccess: boolean;
  refresh: () => void;
}

async function scanRecursive(directory: any, depth = 0): Promise<Story[]> {
  const found: Story[] = [];
  if (depth > 5) return found; // Increased depth slightly

  try {
    const items = await directory.list();
    const subDirPromises: Promise<Story[]>[] = [];

    for (const item of items) {
      // Use isDirectory property or check if it has a list method
      const isDirectory = (item as any).isDirectory || typeof (item as any).list === 'function';

      if (isDirectory) {
        subDirPromises.push(scanRecursive(item, depth + 1));
      } else if ((item as any).uri && (item as any).uri.toLowerCase().endsWith('.pdf')) {
        const decoded = decodeURIComponent((item as any).uri);
        const parts = decoded.split('/');
        const fileName = parts[parts.length - 1].replace(/\.pdf$/i, '');

        found.push({
          id: `saf-${(item as any).uri}`,
          title: fileName || 'Unknown Book',
          author: 'Local Storage',
          localUri: (item as any).uri,
          isLocal: true,
        });
      }
    }

    const subResults = await Promise.all(subDirPromises);
    return [...found, ...subResults.flat()];
  } catch (err) {
    console.error('[scanRecursive] error:', err);
    return found;
  }
}

export function useSAFDiscovery(): UseSAFDiscoveryResult {
  const [discovering, setDiscovering] = useState(false);
  const [hasFolderAccess, setHasFolderAccess] = useState(false);

  const loadAccess = useCallback(async () => {
    const uri = await AsyncStorage.getItem(SAF_STORAGE_KEY);
    setHasFolderAccess(!!uri);
  }, []);

  React.useEffect(() => {
    loadAccess();
  }, [loadAccess]);

  const discover = useCallback(async (forcePrompt = false): Promise<Story[]> => {
    if (Platform.OS !== 'android') return [];

    try {
      let directory: any = null;
      const savedUri = await AsyncStorage.getItem(SAF_STORAGE_KEY);

      if (forcePrompt) {
        // New modern pick API
        try {
          directory = await FileSystem.Directory.pickDirectoryAsync();
        } catch (pickErr: any) {
          // Gracefully handle cancellation - it's not a real "error"
          if (pickErr.message?.toLowerCase().includes('cancel') || pickErr.code === 'ERR_PICKER_CANCELLED') {
            console.log('[useSAFDiscovery] Picker was cancelled by user');
            return [];
          }
          throw pickErr; // Rethrow actual system errors
        }

        if (!directory) {
          return [];
        }
        await AsyncStorage.setItem(SAF_STORAGE_KEY, directory.uri);
        setHasFolderAccess(true);
      } else if (savedUri) {
        directory = new FileSystem.Directory(savedUri);
      } else {
        // Silent: No folder linked and no prompt requested
        return [];
      }

      setDiscovering(true);
      console.log('[useSAFDiscovery] Scanning folder:', directory.uri);
      const allPdfs = await scanRecursive(directory);
      console.log(`[useSAFDiscovery] Found ${allPdfs.length} PDFs`);
      setDiscovering(false);

      if (allPdfs.length === 0 && forcePrompt) {
        Alert.alert('No PDFs Found', 'We couldn\'t find any PDF files in that folder. Try selecting a different folder.');
      }

      return allPdfs;
    } catch (err: any) {
      // Don't log or reset state if it's just a user cancellation we re-threw
      if (err.message?.toLowerCase().includes('cancel') || err.code === 'ERR_PICKER_CANCELLED') {
        setDiscovering(false);
        return [];
      }
      
      console.error('[useSAFDiscovery] error:', err);
      setDiscovering(false);
      if (!forcePrompt) {
          await AsyncStorage.removeItem(SAF_STORAGE_KEY);
          setHasFolderAccess(false);
      }
      return [];
    }
  }, []);

  return { discovering, discover, hasFolderAccess, refresh: loadAccess };
}

