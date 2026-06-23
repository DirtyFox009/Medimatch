import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');
  const { t } = useTranslation();

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
  };

  return (
    <View className="flex-row items-end gap-2 px-4 py-3 bg-white border-t border-slate-100">
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={t('chat.placeholder')}
        placeholderTextColor="#94A3B8"
        multiline
        maxLength={500}
        editable={!disabled}
        className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-800 text-base max-h-28"
        onSubmitEditing={handleSend}
      />
      <TouchableOpacity
        onPress={handleSend}
        disabled={!text.trim() || disabled}
        className={`w-11 h-11 rounded-full items-center justify-center ${!text.trim() || disabled ? 'bg-slate-200' : 'bg-primary-500'}`}
      >
        <Ionicons name="send" size={18} color={!text.trim() || disabled ? '#94A3B8' : '#fff'} />
      </TouchableOpacity>
    </View>
  );
}
