import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Card } from '../../src/components/ui/Card';
import { Badge } from '../../src/components/ui/Badge';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { getUserRecords, addRecord, deleteRecord } from '../../src/services/firebase/firestore';
import { uploadMedicalFile, FileTooLargeError, MAX_RECORD_FILE_BYTES } from '../../src/services/firebase/storage';
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

interface PickedFile {
  uri: string;
  name: string;
  mimeType: string;
  size: number;
}

export default function RecordsScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Add-record modal state
  const [showModal, setShowModal] = useState(false);
  const [recordType, setRecordType] = useState<RecordType>('prescription');
  const [file, setFile] = useState<PickedFile | null>(null);
  const [title, setTitle] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!user) return;
    getUserRecords(user.uid).then((data) => {
      setRecords(data);
      setLoading(false);
    });
  }, [user]);

  const openModal = (type: RecordType) => {
    setRecordType(type);
    setFile(null);
    setTitle('');
    setDoctorName('');
    setHospitalName('');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setShowModal(true);
  };

  const applyPickedFile = (picked: PickedFile) => {
    setFile(picked);
    // Prefill the title with the file name; the user can overwrite it.
    setTitle((prev) => prev || picked.name);
  };

  const pickFromCamera = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      const picked = await ImagePicker.launchCameraAsync({ quality: 0.8 });
      if (!picked.canceled && picked.assets[0]) {
        const asset = picked.assets[0];
        applyPickedFile({
          uri: asset.uri,
          name: `photo_${Date.now()}.jpg`,
          mimeType: 'image/jpeg',
          size: asset.fileSize ?? 0,
        });
      }
    } catch {
      showAlert(t('common.error'));
    }
  };

  const pickFromGallery = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });
    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0];
      applyPickedFile({
        uri: asset.uri,
        name: asset.fileName ?? `image_${Date.now()}.jpg`,
        mimeType: asset.mimeType ?? 'image/jpeg',
        size: asset.fileSize ?? 0,
      });
    }
  };

  const pickDocument = async () => {
    const picked = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'] });
    if (!picked.canceled && picked.assets[0]) {
      const asset = picked.assets[0];
      applyPickedFile({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType ?? 'application/octet-stream',
        size: asset.size ?? 0,
      });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!file) {
      showAlert(t('records.no_file'));
      return;
    }

    setSaving(true);
    try {
      const { url } = await uploadMedicalFile(user.uid, file.uri, file.name, file.mimeType);
      const data = {
        userId: user.uid,
        type: recordType,
        title: title.trim() || file.name,
        doctorName: doctorName.trim(),
        hospitalName: hospitalName.trim(),
        date: date || new Date().toISOString().split('T')[0],
        fileUrl: url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.mimeType,
        notes: notes.trim(),
      };
      const id = await addRecord(user.uid, data);
      setRecords((prev) => [{ id, ...data, createdAt: new Date() }, ...prev]);
      setShowModal(false);
    } catch (e) {
      if (e instanceof FileTooLargeError) {
        const maxKb = Math.round(MAX_RECORD_FILE_BYTES / 1024);
        showAlert('File too large', `Files must be under ${maxKb} KB. Try a smaller file or a compressed photo.`);
      } else {
        showAlert('Upload failed', 'Could not upload file. Please try again.');
      }
    } finally {
      setSaving(false);
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
              onPress={() => openModal(type)}
              disabled={saving}
              className="flex-row items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
            >
              <Ionicons name={TYPE_ICONS[type] as any} size={14} color="#64748B" />
              <Text className="text-slate-600 text-xs capitalize">{t(`records.${type}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

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
              <Text className="text-slate-500 text-xs">
                {item.date}
                {item.doctorName ? ` · ${item.doctorName}` : ''}
                {item.hospitalName ? ` · ${item.hospitalName}` : ''}
              </Text>
              {item.notes ? (
                <Text className="text-slate-400 text-xs" numberOfLines={2}>{item.notes}</Text>
              ) : null}
              <Badge label={t(`records.${item.type}`)} color={TYPE_COLORS[item.type]} />
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} className="p-1">
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </Card>
        )}
      />

      {/* Add-record modal: pick a source, then fill in the details */}
      <Modal visible={showModal} animationType="slide" presentationStyle="pageSheet">
        <View className="flex-1 bg-white">
          <View className="flex-row items-center justify-between px-6 py-4 border-b border-slate-100">
            <Text className="text-lg font-bold text-slate-800">
              {t('records.add_record')} — {t(`records.${recordType}`)}
            </Text>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Ionicons name="close" size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
            <View className="gap-2">
              <Text className="text-sm font-medium text-slate-700">{t('records.upload_file')}</Text>
              <View className="flex-row gap-2 flex-wrap">
                <TouchableOpacity
                  onPress={pickFromCamera}
                  className="flex-row items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                >
                  <Ionicons name="camera-outline" size={16} color="#64748B" />
                  <Text className="text-slate-600 text-xs">{t('records.take_photo')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={pickFromGallery}
                  className="flex-row items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                >
                  <Ionicons name="images-outline" size={16} color="#64748B" />
                  <Text className="text-slate-600 text-xs">{t('records.from_gallery')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={pickDocument}
                  className="flex-row items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
                >
                  <Ionicons name="document-outline" size={16} color="#64748B" />
                  <Text className="text-slate-600 text-xs">{t('records.choose_file')}</Text>
                </TouchableOpacity>
              </View>
              {file && (
                <View className="flex-row items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <Ionicons name="checkmark-circle" size={16} color="#059669" />
                  <Text className="text-emerald-700 text-xs flex-1" numberOfLines={1}>{file.name}</Text>
                </View>
              )}
            </View>

            <Input label={t('records.record_title')} value={title} onChangeText={setTitle} />
            <Input label={t('records.doctor_name')} placeholder="Dr. ..." value={doctorName} onChangeText={setDoctorName} />
            <Input label={t('records.hospital_name')} value={hospitalName} onChangeText={setHospitalName} />
            <Input label={t('records.date')} placeholder="YYYY-MM-DD" value={date} onChangeText={setDate} />
            <Input label={t('records.notes')} value={notes} onChangeText={setNotes} multiline />

            <Button title={t('common.save')} onPress={handleSave} loading={saving} fullWidth size="lg" />
          </ScrollView>
        </View>
      </Modal>
      </ResponsiveContainer>
    </SafeAreaView>
  );
}
