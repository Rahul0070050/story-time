// src/hooks/useStoragePermission.ts
// Handles Android runtime storage permission request.

import { useState, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

export type PermissionStatus = 'unknown' | 'granted' | 'denied' | 'unavailable';

interface UseStoragePermissionResult {
  status: PermissionStatus;
  request: () => Promise<boolean>;
}

export function useStoragePermission(): UseStoragePermissionResult {
  const [status, setStatus] = useState<PermissionStatus>('unknown');

  const request = useCallback(async (): Promise<boolean> => {
    if (Platform.OS !== 'android') {
      setStatus('unavailable');
      return false;
    }

    try {
      const sdkVersion = Platform.Version as number;

      // Android 13+ uses READ_MEDIA_* instead of READ_EXTERNAL_STORAGE
      const permissions =
        sdkVersion >= 33
          ? [
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
              PermissionsAndroid.PERMISSIONS.READ_MEDIA_VIDEO,
            ]
          : [PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE];

      const results = await PermissionsAndroid.requestMultiple(permissions);
      const allGranted = Object.values(results).every(
        (r) => r === PermissionsAndroid.RESULTS.GRANTED
      );

      if (allGranted) {
        setStatus('granted');
        return true;
      }

      const permanentlyDenied = Object.values(results).some(
        (r) => r === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      );
      setStatus('denied');

      if (permanentlyDenied) {
        Alert.alert(
          'Permission Required',
          'Storage access was permanently denied. Enable it in Settings → Apps → Storytime → Permissions.',
          [{ text: 'OK' }]
        );
      }
      return false;
    } catch (err) {
      console.warn('[useStoragePermission] error:', err);
      setStatus('denied');
      return false;
    }
  }, []);

  return { status, request };
}
