// src/hooks/useLocalPdfData.ts
// Reads a local PDF file as base64 for use with PDF.js in a WebView.
// PDF.js cannot fetch file:// or content:// URIs inside a WebView on Android,
// so we read the bytes ourselves and send the raw data to the renderer.

import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';

interface LocalPdfDataResult {
  base64: string | null;   // set once the file has been read
  readError: string | null; // set if reading fails
  reading: boolean;
}

/** Returns true if the URI is a local file that needs to be pre-read. */
export function isLocalUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('content://');
}

export function useLocalPdfData(uri: string | undefined): LocalPdfDataResult {
  const [base64, setBase64] = useState<string | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    if (!uri || !isLocalUri(uri)) return; // remote URL — nothing to do

    let cancelled = false;
    setReading(true);
    setBase64(null);
    setReadError(null);

    FileSystem.readAsStringAsync(uri, { encoding: 'base64' })
      .then((data) => {
        if (!cancelled) {
          setBase64(data);
          setReading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.warn('[useLocalPdfData] failed to read file:', err);
          setReadError(err?.message ?? 'Could not read the PDF file.');
          setReading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [uri]);

  return { base64, readError, reading };
}
