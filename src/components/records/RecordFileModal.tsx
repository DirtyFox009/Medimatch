import React, { useEffect } from 'react';
import { View, Text, Modal, Image, TouchableOpacity, Platform, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { WebView } from 'react-native-webview';
import { showAlert } from '../../utils/alert';
import type { MedicalRecord } from '../../types/record';

interface RecordFileModalProps {
  /** The record whose file to show, or null when closed. */
  record: MedicalRecord | null;
  onClose: () => void;
}

/** Opens a record's inline file (base64 data URI in `fileUrl`).
 *  Web opens it in a new tab; native shows an in-app image/PDF viewer. */
export function RecordFileModal({ record, onClose }: RecordFileModalProps) {
  const { t } = useTranslation();

  // On web a data URI opens cleanly in a new tab — no in-app modal needed.
  useEffect(() => {
    if (record && Platform.OS === 'web') {
      const opened = window.open(record.fileUrl, '_blank');
      if (!opened) showAlert(t('patient_records.cannot_open'));
      onClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [record]);

  if (!record || Platform.OS === 'web') return null;

  const isImage = (record.mimeType ?? '').startsWith('image/');

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/90">
        <View className="flex-row items-center justify-between px-4 pt-12 pb-3">
          <Text className="text-white font-semibold flex-1 mr-3" numberOfLines={1}>
            {record.title}
          </Text>
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
            <Image
              source={{ uri: record.fileUrl }}
              className="w-full h-full"
              resizeMode="contain"
            />
          </ScrollView>
        ) : (
          <WebView source={{ uri: record.fileUrl }} className="flex-1" originWhitelist={['*']} />
        )}
      </View>
    </Modal>
  );
}
