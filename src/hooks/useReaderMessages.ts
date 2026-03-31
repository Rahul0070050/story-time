// src/hooks/useReaderMessages.ts
// Parses postMessage events from the PDF.js WebView and exposes reader state.

import { useState, useCallback } from 'react';
import { WebViewMessageEvent } from 'react-native-webview';

interface ReaderState {
  loading: boolean;
  currentPage: number;
  totalPages: number;
  errorMsg: string | null;
  progress: number;
}

interface UseReaderMessagesResult extends ReaderState {
  onMessage: (event: WebViewMessageEvent) => void;
}

export function useReaderMessages(): UseReaderMessagesResult {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data);

      if (msg.type === 'loaded') {
        setLoading(false);
        setTotalPages(msg.pages);
        setCurrentPage(1);
      } else if (msg.type === 'page') {
        setCurrentPage(msg.current);
        setTotalPages(msg.total);
      } else if (msg.type === 'error') {
        setLoading(false);
        setErrorMsg(msg.message);
      }
    } catch {
      // Ignore malformed messages
    }
  }, []);

  const progress = totalPages > 0 ? currentPage / totalPages : 0;

  return { loading, currentPage, totalPages, errorMsg, progress, onMessage };
}
