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
  refresh: () => Promise<void>;
  clearAccess: () => Promise<void>;
}

function makeStoryFromUri(uri: string): Story {
  const decoded = decodeURIComponent(uri);
  const parts = decoded.split('/').filter(Boolean);
  const fileName = parts[parts.length - 1] || 'Unknown.pdf';
  const parentFolder = parts[parts.length - 2] || 'Local Storage';

  return {
    id: `saf-${uri}`,
    title: fileName.replace(/\.pdf$/i, ''),
    author: `Folder: ${parentFolder}`,
    localUri: uri,
    isLocal: true,
  };
}

async function scanRecursive(directory: any, depth = 0, maxDepth = 6): Promise<Story[]> {
  const found: Story[] = [];
  if (!directory || depth > maxDepth) return found;

  try {
    const items = await directory.list();
    const subDirPromises: Promise<Story[]>[] = [];

    for (const item of items) {
      const isDirectory =
        (item as any)?.isDirectory || typeof (item as any)?.list === 'function';

      if (isDirectory) {
        subDirPromises.push(scanRecursive(item, depth + 1, maxDepth));
        continue;
      }

      const uri = (item as any)?.uri;
      if (uri && uri.toLowerCase().endsWith('.pdf')) {
        found.push(makeStoryFromUri(uri));
      }
    }

    const nested = await Promise.all(subDirPromises);
    return [...found, ...nested.flat()];
  } catch (err) {
    console.error('[useSAFDiscovery] scanRecursive error:', err);
    return found;
  }
}

function uniqueByUri(items: Story[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = item.localUri || item.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function useSAFDiscovery(): UseSAFDiscoveryResult {
  const [discovering, setDiscovering] = useState(false);
  const [hasFolderAccess, setHasFolderAccess] = useState(false);

  const refresh = useCallback(async () => {
    const uri = await AsyncStorage.getItem(SAF_STORAGE_KEY);
    setHasFolderAccess(!!uri);
  }, []);

  const clearAccess = useCallback(async () => {
    await AsyncStorage.removeItem(SAF_STORAGE_KEY);
    setHasFolderAccess(false);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const discover = useCallback(async (forcePrompt = false): Promise<Story[]> => {
    if (Platform.OS !== 'android') return [];

    try {
      let directory: any = null;
      const savedUri = await AsyncStorage.getItem(SAF_STORAGE_KEY);

      if (forcePrompt) {
        try {
          directory = await FileSystem.Directory.pickDirectoryAsync();
        } catch (err: any) {
          if (
            err?.message?.toLowerCase().includes('cancel') ||
            err?.code === 'ERR_PICKER_CANCELLED'
          ) {
            return [];
          }
          throw err;
        }

        if (!directory?.uri) return [];

        await AsyncStorage.setItem(SAF_STORAGE_KEY, directory.uri);
        setHasFolderAccess(true);
      } else if (savedUri) {
        directory = new FileSystem.Directory(savedUri);
      } else {
        return [];
      }

      setDiscovering(true);
      const found = await scanRecursive(directory);
      const unique = uniqueByUri(found);

      if (!unique.length && forcePrompt) {
        Alert.alert(
          'No PDFs Found',
          'No PDF files were found in that folder. Choose a broader folder like Internal Storage, Download, or Documents.'
        );
      }

      return unique;
    } catch (err) {
      console.error('[useSAFDiscovery] discover error:', err);
      return [];
    } finally {
      setDiscovering(false);
    }
  }, []);

  return {
    discovering,
    discover,
    hasFolderAccess,
    refresh,
    clearAccess,
  };
}