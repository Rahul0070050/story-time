import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { Story } from '../utils/pdfManager';

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const getRNFS = () => {
  if (isExpoGo) return null;
  try {
    return require('react-native-fs');
  } catch (e) {
    return null;
  }
};

interface UseDeviceScannerResult {
  scanning: boolean;
  scan: (requestPermission: () => Promise<boolean>) => Promise<Story[]>;
  isAvailable: boolean;
}

async function scanDirectory(RNFS: any, dirPath: string, depth = 0): Promise<Story[]> {
  const found: Story[] = [];
  if (depth > 3 || !RNFS) return found;

  try {
    const files = await RNFS.readDir(dirPath);
    const subDirPromises: Promise<Story[]>[] = [];

    for (const file of files) {
      if (file.name.startsWith('.')) continue;

      if (file.isFile() && file.name.toLowerCase().endsWith('.pdf')) {
        found.push({
          id: `scan-${file.path}`,
          title: file.name.replace(/\.pdf$/i, ''),
          author: 'Folder: ' + dirPath.split('/').slice(-2, -1)[0] || 'Device',
          localUri: file.path,
          isLocal: true,
        });
      } else if (file.isDirectory()) {
        subDirPromises.push(scanDirectory(RNFS, file.path, depth + 1));
      }
    }

    const subResults = await Promise.all(subDirPromises);
    return [...found, ...subResults.flat()];
  } catch (err) {
    return found;
  }
}

export function useDeviceScanner(): UseDeviceScannerResult {
  const [scanning, setScanning] = useState(false);
  const RNFS = getRNFS();

  const scan = useCallback(
    async (requestPermission: () => Promise<boolean>): Promise<Story[]> => {
      if (!RNFS || !RNFS.DownloadDirectoryPath) {
        console.warn('RNFS or its native properties are not available.');
        return [];
      }

      if (Platform.OS !== 'android') {
        Alert.alert(
          'Download PDF Manually',
          'Automatic device scanning is optimized for Android.'
        );
        return [];
      }

      const granted = await requestPermission();
      if (!granted) return [];

      setScanning(true);
      try {
        const scanPaths = [
          RNFS.DownloadDirectoryPath,
          RNFS.ExternalStorageDirectoryPath ? RNFS.ExternalStorageDirectoryPath + '/Documents' : null,
          RNFS.ExternalStorageDirectoryPath,
          RNFS.DownloadDirectoryPath,
          RNFS.ExternalStorageDirectoryPath + '/Books',
          RNFS.ExternalStorageDirectoryPath + '/DCIM',
          RNFS.ExternalStorageDirectoryPath + '/Pictures',
          RNFS.ExternalStorageDirectoryPath + '/Music',
        ].filter(Boolean);

        const results = await Promise.all(
          scanPaths.map(p => scanDirectory(RNFS, p!))
        );

        const allFound = results.flat();
        const unique = allFound.filter((v, i, a) =>
          a.findIndex(t => t.localUri === v.localUri) === i
        );

        return unique;
      } catch (err) {
        console.error('Scan Error:', err);
        return [];
      } finally {
        setScanning(false);
      }
    },
    [RNFS]
  );

  return { scanning, scan, isAvailable: !!(RNFS && RNFS.DownloadDirectoryPath) };
}
