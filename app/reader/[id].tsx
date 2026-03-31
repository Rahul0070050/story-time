import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Pdf from 'react-native-pdf';
import { SAMPLE_STORIES } from '../../src/utils/pdfManager';

export default function ReaderScreen() {
  const { id, uri, title: titleParam } = useLocalSearchParams<{
    id: string;
    uri?: string;
    title?: string;
  }>();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Resolve the PDF source
  const story = SAMPLE_STORIES.find((s) => s.id === id);
  const pdfUri = uri || story?.remoteUrl || '';
  const bookTitle = titleParam || story?.title || 'Reading';

  if (!pdfUri) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={52} color="#f87171" />
        <Text style={styles.errorTitle}>Book not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const source =
    uri
      ? { uri, cache: true }
      : { uri: pdfUri, cache: true };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0f0120" />

      {/* ── Custom Header ── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {bookTitle}
          </Text>
          {totalPages > 0 && (
            <Text style={styles.headerSub}>
              {currentPage} / {totalPages}
            </Text>
          )}
        </View>

        <View style={styles.headerRight} />
      </View>

      {/* ── PDF Viewer ── */}
      <View style={styles.pdfWrapper}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#a78bfa" />
            <Text style={styles.loadingText}>Opening PDF…</Text>
          </View>
        )}

        {error && (
          <View style={styles.center}>
            <Ionicons name="document-text-outline" size={52} color="#7c5fac" />
            <Text style={styles.errorTitle}>Couldn't load PDF</Text>
            <Text style={styles.errorSub}>{error}</Text>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Text style={styles.backBtnText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        )}

        {!error && (
          <Pdf
            source={source}
            style={styles.pdf}
            trustAllCerts={false}
            onLoadComplete={(pages) => {
              setTotalPages(pages);
              setLoading(false);
            }}
            onPageChanged={(page) => setCurrentPage(page)}
            onError={(err) => {
              console.warn('PDF error:', err);
              setError(String(err));
              setLoading(false);
            }}
            onLoadProgress={() => setLoading(true)}
            enablePaging={false}
            horizontal={false}
          />
        )}
      </View>

      {/* ── Bottom progress bar ── */}
      {totalPages > 0 && (
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${(currentPage / totalPages) * 100}%` },
            ]}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0120' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a0a2e',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight ?? 28) + 4 : 52,
    paddingBottom: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(124,58,237,0.25)',
  },
  headerBack: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: 'rgba(124,58,237,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center', paddingHorizontal: 12 },
  headerTitle: {
    color: '#f3e8ff',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerSub: { color: '#a78bfa', fontSize: 11, marginTop: 2, fontWeight: '500' },
  headerRight: { width: 36 },

  // PDF
  pdfWrapper: { flex: 1 },
  pdf: { flex: 1, width: '100%', backgroundColor: '#18082b' },

  // Loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0120',
    gap: 14,
    zIndex: 10,
  },
  loadingText: { color: '#c4b5fd', fontSize: 14, fontWeight: '600' },

  // Error / center state
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f0120',
    padding: 36,
  },
  errorTitle: {
    color: '#f3e8ff',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSub: {
    color: '#7c5fac',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  backBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 14,
  },
  backBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },

  // Progress bar
  progressBar: {
    height: 3,
    backgroundColor: 'rgba(124,58,237,0.2)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7c3aed',
    borderRadius: 2,
  },
});
