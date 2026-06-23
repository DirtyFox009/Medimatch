import React from 'react';
import { Platform, View, Text } from 'react-native';
import type { ChatMessage } from '../../types/chat';

interface ChatBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
}

export function ChatBubble({ message, isStreaming }: ChatBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <View className={`mb-3 ${isUser ? 'items-end' : 'items-start'}`}>
      <View
        className={`max-w-[85%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-primary-500 rounded-tr-sm'
            : 'bg-white rounded-tl-sm border border-slate-100'
        }`}
        style={Platform.select({ web: { boxShadow: isUser ? 'none' : '0px 1px 2px rgba(0,0,0,0.05)' }, default: { elevation: isUser ? 0 : 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, shadowOffset: { width: 0, height: 1 } } })}
      >
        <Text className={`text-base leading-relaxed ${isUser ? 'text-white' : 'text-slate-800'}`}>
          {message.content}
          {isStreaming && !isUser && (
            <Text className="text-primary-400"> ▋</Text>
          )}
        </Text>
      </View>
    </View>
  );
}
