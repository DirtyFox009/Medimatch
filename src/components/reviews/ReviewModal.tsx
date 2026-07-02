import React, { useState } from 'react';
import { View, Text, Modal, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { submitReview } from '../../services/firebase/firestore';
import { useAuth } from '../../hooks/useAuth';
import { showAlert } from '../../utils/alert';
import type { Appointment } from '../../types/appointment';

interface ReviewModalProps {
  appointment: Appointment | null;
  onClose: () => void;
  onSubmitted: (appointmentId: string) => void;
}

export function ReviewModal({ appointment, onClose, onSubmitted }: ReviewModalProps) {
  const { t } = useTranslation();
  const { appUser } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setRating(0);
    setComment('');
  };

  const handleSubmit = async () => {
    if (!appointment || rating < 1) return;
    setSubmitting(true);
    try {
      await submitReview(appointment, rating, comment.trim(), appUser?.displayName ?? 'Patient');
      onSubmitted(appointment.id);
      reset();
      onClose();
    } catch {
      showAlert(t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={!!appointment} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 bg-black/50 items-center justify-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full max-w-md gap-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-slate-800">{t('reviews.rate_doctor')}</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close" size={22} color="#64748B" />
            </TouchableOpacity>
          </View>

          {appointment && (
            <Text className="text-slate-600">{appointment.doctorNameEn} · {appointment.specialty}</Text>
          )}

          <View>
            <Text className="text-sm font-medium text-slate-600 mb-2">{t('reviews.your_rating')}</Text>
            <View className="flex-row gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity key={star} onPress={() => setRating(star)} hitSlop={6}>
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            className="border border-slate-200 rounded-xl px-4 py-3 text-slate-800 min-h-[88px]"
            placeholder={t('reviews.comment_placeholder')}
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={1000}
            value={comment}
            onChangeText={setComment}
            textAlignVertical="top"
          />

          <Button
            title={t('reviews.submit')}
            onPress={handleSubmit}
            loading={submitting}
            disabled={rating < 1}
            fullWidth
          />
        </View>
      </View>
    </Modal>
  );
}
