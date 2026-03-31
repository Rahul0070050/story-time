// app/reader/[id].tsx
// PDF reader screen — thin orchestrator.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';

import { SAMPLE_STORIES } from '../../src/utils/pdfManager';
import { COLORS } from '../../src/constants/theme';
import { buildLocalPdfHtml } from '../../src/utils/pdfHtml';
import { useReaderMessages } from '../../src/hooks/useReaderMessages';
import { useLocalPdfFile } from '../../src/hooks/useLocalPdfFile';
import { ReaderHeader } from '../../src/components/reader/ReaderHeader';
import { ProgressBar } from '../../src/components/reader/ProgressBar';
import { LoadingOverlay } from '../../src/components/reader/LoadingOverlay';

function isLocalUri(uri: string): boolean {
  return uri.startsWith('file://') || uri.startsWith('content://');
}

export default function ReaderScreen() {
  const { id, uri, title: titleParam } = useLocalSearchParams<{
    id: string; uri?: string; title?: string;
  }>();
  const router = useRouter();

  const story = SAMPLE_STORIES.find((s) => s.id === id);
  const pdfUrl = (uri as string | undefined) || story?.remoteUrl || '';
  const bookTitle = (titleParam as string | undefined) || story?.title || 'Reading';

  const local = isLocalUri(pdfUrl);

  // For local files: copy to cache and create file-based viewer (avoids bridge size limits)
  const { viewerUri, preparing, prepareError } = useLocalPdfFile(local ? pdfUrl : undefined);

  const { loading, currentPage, totalPages, progress, onMessage } = useReaderMessages();

  // ── Error states ────────────────────────────────────────────────────────────
  if (!pdfUrl) return <ErrorView message="Book not found" onBack={() => router.back()} />;
  if (prepareError) return <ErrorView message={prepareError} onBack={() => router.back()} />;

  // Remote PDFs → Google Docs Viewer (handles CORS, fetching, rendering internally)
  // Local PDFs  → file-based HTML viewer via useLocalPdfFile
  const remoteViewerUrl = !local
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`
    : null;
  const isReady = local ? viewerUri !== null : true;

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <ReaderHeader
        title={bookTitle}
        currentPage={currentPage}
        totalPages={totalPages}
        onBack={() => router.back()}
      />
      <ProgressBar progress={progress} />

      {(preparing || (loading && isReady)) && <LoadingOverlay />}

      {/* Local PDFs: file:// viewer so PDF.js reads from same origin */}
      {isReady && local && (
        <WebView
          source={{ uri: viewerUri! }}
          style={styles.webview}
          onMessage={onMessage}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          allowFileAccessFromFileURLs
          allowUniversalAccessFromFileURLs
          mixedContentMode="always"
          onError={() => {}}
        />
      )}

      {/* Remote PDFs: Google Docs Viewer — no CORS issues, no PDF.js needed */}
      {isReady && !local && (
        <WebView
          source={{ uri: remoteViewerUrl! }}
          style={styles.webview}
          onMessage={onMessage}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          mixedContentMode="always"
          onError={() => {}}
          startInLoadingState={true}
          renderLoading={() => <LoadingOverlay />}
        />
      )}
    </View>
  );
}

// ── Shared error screen ───────────────────────────────────────────────────────
function ErrorView({ message, onBack }: { message: string; onBack: () => void }) {
  return (
    <View style={styles.center}>
      <Stack.Screen options={{ headerShown: false }} />
      <Ionicons name="document-text-outline" size={52} color={COLORS.textMuted} />
      <Text style={styles.errTitle}>Couldn't open PDF</Text>
      <Text style={styles.errSub}>{message}</Text>
      <TouchableOpacity style={styles.backBtn} onPress={onBack}>
        <Text style={styles.backText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  webview: { flex: 1, backgroundColor: COLORS.surface },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.bg, padding: 36, gap: 12,
  },
  errTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '700' },
  errSub: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
  backBtn: {
    backgroundColor: COLORS.primary, paddingHorizontal: 28,
    paddingVertical: 12, borderRadius: 14, marginTop: 8,
  },
  backText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
