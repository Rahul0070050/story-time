import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const getPermissionsModule = () => {
  if (isExpoGo) return null;
  try {
    return require('react-native-permissions');
  } catch {
    return null;
  }
};

export type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'unavailable';

interface UseStoragePermissionResult {
  status: PermissionStatus;
  request: () => Promise<boolean>;
  isAvailable: boolean;
}

export function useStoragePermission(): UseStoragePermissionResult {
  const [status, setStatus] = useState<PermissionStatus>('unknown');
  const permissionsModule = getPermissionsModule();

  const isAvailable = !!(
    permissionsModule &&
    permissionsModule.PERMISSIONS &&
    permissionsModule.PERMISSIONS.ANDROID
  );

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      setStatus('unavailable');
      return false;
    }

    // SAF is the main path for modern Android PDFs.
    // Permission is only needed for RNFS fallback on older Android.
    const sdkVersion = Number(Platform.Version);
    if (sdkVersion >= 33) {
      setStatus('unavailable');
      return false;
    }

    const { check, request, PERMISSIONS, RESULTS, openSettings } =
      permissionsModule || {};

    if (!isAvailable || !check || !request || !PERMISSIONS) {
      if (!isExpoGo) {
        console.warn(
          'react-native-permissions or Android permissions are not available.'
        );
      }
      setStatus('unavailable');
      return false;
    }

    try {
      const permission = PERMISSIONS.ANDROID?.READ_EXTERNAL_STORAGE;

      if (!permission) {
        setStatus('unavailable');
        return false;
      }

      const current = await check(permission);

      if (current === RESULTS.GRANTED) {
        setStatus('granted');
        return true;
      }

      const result = await request(permission);

      if (result === RESULTS.GRANTED) {
        setStatus('granted');
        return true;
      }

      if (result === RESULTS.BLOCKED) {
        Alert.alert(
          'Permission Required',
          'Storage access was permanently denied. Enable it in Settings to scan common folders.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => openSettings?.() },
          ]
        );
      }

      setStatus('denied');
      return false;
    } catch (err) {
      console.warn('[useStoragePermission] error:', err);
      setStatus('denied');
      return false;
    }
  }, [isAvailable, permissionsModule]);

  return { status, request: requestPermission, isAvailable };
}