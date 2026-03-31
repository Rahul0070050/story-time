// src/hooks/useLocalPdfFile.ts
// Copies a local PDF (file:// or content://) into the app's cache directory,
// then writes a tiny HTML viewer page alongside it. The WebView loads the
// viewer as a file:// URL so PDF.js can fetch the PDF from the same origin—
// avoiding both the RN bridge size limit and Android WebView CORS restrictions.

import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { buildLocalPdfHtml } from '../utils/pdfHtml';

const PDF_CACHE_PATH  = FileSystem.cacheDirectory + 'storytime_view.pdf';
const HTML_CACHE_PATH = FileSystem.cacheDirectory + 'storytime_viewer.html';
// Note: cacheDirectory already starts with file://, so HTML_CACHE_PATH is the correct URI
const HTML_CACHE_URI  = HTML_CACHE_PATH;

interface LocalPdfFileResult {
  viewerUri: string | null;   // file:// URI of the generated HTML viewer
  preparing: boolean;
  prepareError: string | null;
}

export function useLocalPdfFile(uri: string | undefined): LocalPdfFileResult {
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [prepareError, setPrepareError] = useState<string | null>(null);

  useEffect(() => {
    if (!uri) return;

    let cancelled = false;
    setPreparing(true);
    setViewerUri(null);
    setPrepareError(null);

    (async () => {
      try {
        // 1. Copy PDF to a known cache path (works for both file:// and content://)
        await FileSystem.copyAsync({ from: uri, to: PDF_CACHE_PATH });

        // 2. Write the viewer HTML next to the PDF so PDF.js can fetch it
        //    using a relative path (same file:// origin → no CORS block)
        const html = buildLocalPdfHtml('./storytime_view.pdf');
        await FileSystem.writeAsStringAsync(HTML_CACHE_PATH, html, { encoding: 'utf8' });

        if (!cancelled) {
          setViewerUri(HTML_CACHE_URI);
          setPreparing(false);
        }
      } catch (err: any) {
        if (!cancelled) {
          console.warn('[useLocalPdfFile] error:', err);
          setPrepareError(err?.message ?? 'Could not prepare the PDF for viewing.');
          setPreparing(false);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [uri]);

  return { viewerUri, preparing, prepareError };
}
