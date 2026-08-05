import React, { useEffect, useState } from 'react';
import { View, Text, Modal, Image, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { WebView } from 'react-native-webview';
import { isWeb } from '../../utils/platform';
import { dataUriToBlobUrl } from '../../services/firebase/storage';
import type { MedicalRecord } from '../../types/record';

interface RecordFileModalProps {
  /** The record whose file to show, or null when closed. */
  record: MedicalRecord | null;
  onClose: () => void;
}

/**
 * Shows a record's inline file (base64 data URI in `fileUrl`).
 *
 * This used to call window.open(fileUrl) on web, which silently failed: browsers
 * block top-level navigation to `data:` URIs, so window.open returned null and
 * the doctor saw "Could not open this file" — or nothing at all. The file is now
 * rendered in-app on every platform. `<img src="data:…">` is not subject to that
 * block, so images need no conversion; PDFs and other documents go through a
 * blob: URL, which frames and new tabs do accept.
 */
export function RecordFileModal({ record, onClose }: RecordFileModalProps) {
  const { t } = useTranslation();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const isImage = (record?.mimeType ?? '').startsWith('image/');

  // Only non-images need the blob conversion, and only on web.
  useEffect(() => {
    if (!record || !isWeb || isImage) {
      setBlobUrl(null);
      return;
    }
    const url = dataUriToBlobUrl(record.fileUrl);
    setBlobUrl(url);
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [record, isImage]);

  if (!record) return null;

  const openInNewTab = () => {
    // Convert on demand so the URL is not held open for the modal's lifetime.
    const url = isImage ? dataUriToBlobUrl(record.fileUrl) : blobUrl;
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/90">
        <View className="flex-row items-center justify-between px-4 pt-12 pb-3">
          <Text className="text-white font-semibold flex-1 mr-3" numberOfLines={1}>
            {record.title}
          </Text>
          {isWeb && (
            <TouchableOpacity onPress={openInNewTab} className="px-3 py-1.5 mr-2 rounded-lg border border-white/40">
              <Text className="text-white text-xs font-semibold">{t('patient_records.open_new_tab')}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={onClose} className="p-1">
            <Ionicons name="close" size={26} color="#fff" />
          </TouchableOpacity>
        </View>

        {isImage ? (
          <ScrollView
            className="flex-1"
            maximumZoomScale={4}
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          >
            <Image source={{ uri: record.fileUrl }} className="w-full h-full" resizeMode="contain" />
          </ScrollView>
        ) : isWeb ? (
          blobUrl ? (
            // react-native-webview has no web build; render a real iframe instead.
            React.createElement('iframe', {
              src: blobUrl,
              title: record.title,
              style: { flex: 1, border: 'none', width: '100%', height: '100%' },
            })
          ) : (
            <View className="flex-1 items-center justify-center px-8">
              <Text className="text-white/70 text-center">{t('patient_records.cannot_open')}</Text>
            </View>
          )
        ) : (
          <WebView source={{ uri: record.fileUrl }} className="flex-1" originWhitelist={['*']} />
        )}
      </View>
    </Modal>
  );
}
