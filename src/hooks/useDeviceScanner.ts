import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Story } from '../utils/pdfManager';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const getRNFS = () => {
  if (isExpoGo) return null;
  try {
    return require('react-native-fs');
  } catch {
    return null;
  }
};

interface UseDeviceScannerResult {
  scanning: boolean;
  scan: (requestPermission: () => Promise<boolean>) => Promise<Story[]>;
  isAvailable: boolean;
}

function makeStoryFromPath(filePath: string): Story {
  const parts = filePath.split('/').filter(Boolean);
  const fileName = parts[parts.length - 1] || 'Unknown.pdf';
  const parentFolder = parts[parts.length - 2] || 'Device';

  return {
    id: `scan-${filePath}`,
    title: fileName.replace(/\.pdf$/i, ''),
    author: `Folder: ${parentFolder}`,
    localUri: filePath,
    isLocal: true,
  };
}

async function scanDirectory(
  RNFS: any,
  dirPath: string,
  depth = 0,
  maxDepth = 4
): Promise<Story[]> {
  const found: Story[] = [];
  if (!RNFS || !dirPath || depth > maxDepth) return found;

  try {
    const files = await RNFS.readDir(dirPath);
    const subDirPromises: Promise<Story[]>[] = [];

    for (const file of files) {
      if (!file?.name || file.name.startsWith('.')) continue;

      if (file.isFile?.() && file.name.toLowerCase().endsWith('.pdf')) {
        found.push(makeStoryFromPath(file.path));
      } else if (file.isDirectory?.()) {
        subDirPromises.push(scanDirectory(RNFS, file.path, depth + 1, maxDepth));
      }
    }

    const nested = await Promise.all(subDirPromises);
    return [...found, ...nested.flat()];
  } catch {
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

export function useDeviceScanner(): UseDeviceScannerResult {
  const [scanning, setScanning] = useState(false);
  const RNFS = getRNFS();

  const scan = useCallback(
    async (requestPermission: () => Promise<boolean>): Promise<Story[]> => {
      if (!RNFS || Platform.OS !== 'android') {
        if (Platform.OS !== 'android') {
          Alert.alert(
            'Unsupported',
            'Automatic device scanning is currently optimized for Android.'
          );
        }
        return [];
      }

      const ext = RNFS.ExternalStorageDirectoryPath;
      const download = RNFS.DownloadDirectoryPath;

      const scanPaths = [
        download,
        ext,
        ext ? `${ext}/Download` : null,
        ext ? `${ext}/Documents` : null,
        ext ? `${ext}/Books` : null,
        ext ? `${ext}/PDF` : null,
        ext ? `${ext}/PDFs` : null,
      ].filter(Boolean) as string[];

      if (!scanPaths.length) {
        console.warn('No scan paths available from RNFS.');
        return [];
      }

      const granted = await requestPermission();
      if (!granted) return [];

      setScanning(true);
      try {
        const results = await Promise.all(
          scanPaths.map((path) => scanDirectory(RNFS, path))
        );

        return uniqueByUri(results.flat());
      } catch (err) {
        console.error('[useDeviceScanner] scan error:', err);
        return [];
      } finally {
        setScanning(false);
      }
    },
    [RNFS]
  );

  return {
    scanning,
    scan,
    isAvailable: !!RNFS,
  };
}