import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { getUserRecords, addRecord, deleteRecord } from '../../src/services/firebase/firestore';
import { uploadMedicalFile } from '../../src/services/firebase/storage';
import { useAuth } from '../../src/hooks/useAuth';
import { showAlert } from '../../src/utils/alert';
import { ResponsiveContainer } from '../../src/components/layout/ResponsiveContainer';
import type { MedicalRecord, RecordType } from '../../src/types/record';

const TYPE_COLORS: Record<RecordType, 'blue' | 'green' | 'amber' | 'teal'> = {
  prescription: 'blue',
  report: 'green',
  scan: 'amber',
  other: 'teal',
};

const TYPE_ICONS: Record<RecordType, string> = {
  prescription: 'document-text',
  report: 'flask',
  scan: 'scan',
  other: 'attach',
};

export default function RecordsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserRecords(user.uid).then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, [user]);

  const handleUpload = async (type: RecordType) => {
    if (!user) return;
    setUploading(true);
    try {
      let result: { uri: string; name: string; mimeType: string; size: number } | null = null;

      if (type === 'scan') {
        const picked = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
        });
        if (!picked.canceled && picked.assets[0]) {
          const asset = picked.assets[0];
          result = { uri: asset.uri, name: `scan_${Date.now()}.jpg`, mimeType: 'image/jpeg', size: asset.fileSize ?? 0 };
        }
      } else {
        const picked = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
        if (!picked.canceled && picked.assets[0]) {
          const asset = picked.assets[0];
          result = { uri: asset.uri, name: asset.name, mimeType: asset.mimeType ?? 'application/octet-stream', size: asset.size ?? 0 };
        }
      }

      if (!result) return;

      const { url } = await uploadMedicalFile(user.uid, result.uri, result.name, result.mimeType);
      const id = await addRecord(user.uid, {
        userId: user.uid,
        type,
        title: result.name,
        doctorName: '',
        hospitalName: '',
        date: new Date().toISOString().split('T')[0],
        fileUrl: url,
        fileName: result.name,
        fileSize: result.size,
        mimeType: result.mimeType,
        notes: '',
      });
      const newRecord: MedicalRecord = {
        id,
        userId: user.uid,
        type,
        title: result.name,
        doctorName: '',
        hospitalName: '',
        date: new Date().toISOString().split('T')[0],
        fileUrl: url,
        fileName: result.name,
        fileSize: result.size,
        mimeType: result.mimeType,
        notes: '',
        createdAt: new Date(),
      };
      setRecords((prev) => [newRecord, ...prev]);
    } catch (e) {
      showAlert('Upload failed', 'Could not upload file. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (record: MedicalRecord) => {
    if (!user) return;
    showAlert(t('common.delete'), t('records.delete_confirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          await deleteRecord(user.uid, record.id);
          setRecords((prev) => prev.filter((r) => r.id !== record.id));
        },
      },
    ]);
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      <ResponsiveContainer>
      {/* Upload buttons */}
      <View className="bg-white px-4 py-3 border-b border-slate-100">
        <Text className="text-xs text-slate-500 mb-2">{t('records.add_record')}</Text>
        <View className="flex-row gap-2 flex-wrap">
          {(['prescription', 'report', 'scan', 'other'] as RecordType[]).map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => handleUpload(type)}
              disabled={uploading}
              className="flex-row items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
            >
              <Ionicons name={TYPE_ICONS[type] as any} size={14} color="#64748B" />
              <Text className="text-slate-600 text-xs capitalize">{t(`records.${type}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {uploading && (
        <View className="bg-primary-50 px-4 py-2 flex-row items-center gap-2">
          <ActivityIndicator size="small" color="#2563EB" />
          <Text className="text-primary-700 text-sm">Uploading...</Text>
        </View>
      )}

      <FlatList
        data={records}
        keyExtractor={(r) => r.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={
          !loading ? (
            <View className="items-center py-20 gap-2">
              <Ionicons name="folder-open-outline" size={48} color="#CBD5E1" />
              <Text className="text-slate-400">{t('records.no_records')}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Card className="p-4 flex-row items-start gap-3">
            <View className="w-10 h-10 rounded-xl bg-slate-100 items-center justify-center">
              <Ionicons name={TYPE_ICONS[item.type] as any} size={20} color="#64748B" />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="font-semibold text-slate-800 text-sm" numberOfLines={1}>{item.title}</Text>
              <Text className="text-slate-500 text-xs">{item.date}</Text>
              <Badge label={t(`records.${item.type}`)} color={TYPE_COLORS[item.type]} />
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} className="p-1">
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </Card>
        )}
      />
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
