import React, { useRef, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatBubble } from '../../src/components/chat/ChatBubble';
import { ChatInput } from '../../src/components/chat/ChatInput';
import { SeverityCard } from '../../src/components/chat/SeverityCard';
import { useGroqChat } from '../../src/hooks/useGroqChat';
import { useChatStore } from '../../src/store/chatStore';

export default function ChatScreen() {
  const { t } = useTranslation();
  const { messages, triageResult, isStreaming, sendMessage } = useGroqChat();
  const { suggestedSpecialty, reset } = useChatStore();
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      {/* Header row with reset */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <View>
          <Text className="text-base font-bold text-slate-800">{t('chat.title')}</Text>
          <Text className="text-xs text-slate-500">{t('chat.subtitle')}</Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity onPress={reset} className="flex-row items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full">
            <Ionicons name="refresh" size={14} color="#64748B" />
            <Text className="text-slate-600 text-xs font-medium">{t('chat.new_chat')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ChatBubble
            message={item}
            isStreaming={isStreaming && index === messages.length - 1 && item.role === 'assistant'}
          />
        )}
        contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-20 gap-3">
            <Ionicons name="chatbubble-ellipses-outline" size={48} color="#CBD5E1" />
            <Text className="text-slate-400 text-base text-center px-8">{t('chat.subtitle')}</Text>
          </View>
        }
        ListFooterComponent={
          triageResult ? (
            <SeverityCard result={triageResult} suggestedSpecialty={suggestedSpecialty} />
          ) : null
        }
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isStreaming || !!triageResult} />

      {/* Disclaimer */}
      <View className="px-4 pb-2">
        <Text className="text-center text-xs text-slate-400">{t('chat.disclaimer')}</Text>
      </View>
    </SafeAreaView>
  );
}
