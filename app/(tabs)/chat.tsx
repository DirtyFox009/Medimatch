import React, { useRef, useEffect, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatBubble } from '../../src/components/chat/ChatBubble';
import { ChatInput } from '../../src/components/chat/ChatInput';
import { SeverityCard } from '../../src/components/chat/SeverityCard';
import { useGroqChat } from '../../src/hooks/useGroqChat';
import { useChatStore } from '../../src/store/chatStore';
import {
  QUESTION_MAP,
  FLOWS,
  resolveOptions,
  checkRedFlags,
  buildEmergencyResult,
  buildSummary,
  type QOption,
} from '../../src/constants/triageFlow';

function makeId() {
  return Math.random().toString(36).slice(2);
}

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
function toBnDigits(n: number): string {
  return String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export default function ChatScreen() {
  const { t } = useTranslation();
  const { messages, triageResult, isStreaming, sendMessage } = useGroqChat();
  const {
    suggestedSpecialty, reset,
    questionPath, stepIndex, answers, multiDraft, qaComplete,
    chatMode, chatLang,
    addMessage, updateLastAssistantMessage, setAnswer, setPath, advance, goBack, setMultiDraft, completeQA,
    setChatMode, setChatLang, setTriageResult,
  } = useChatStore();

  const listRef = useRef<FlatList>(null);
  const handlingRef = useRef(false);

  const isBn = chatLang === 'bn';

  // Current question: q1 until a complaint picks the path, then path[stepIndex]
  const currentKey = questionPath.length === 0 ? 'q1' : questionPath[stepIndex];
  const currentQ = currentKey ? QUESTION_MAP[currentKey] : undefined;
  const currentOptions = currentQ ? resolveOptions(currentQ, answers) : [];

  // Seed q1 as the opening bot message (QA mode only, runs on mount and after reset)
  useEffect(() => {
    if (chatMode === 'qa' && messages.length === 0 && !qaComplete && !triageResult) {
      addMessage({
        id: makeId(),
        role: 'assistant',
        content: QUESTION_MAP.q1.text[chatLang],
        timestamp: new Date(),
      });
    }
  }, [chatMode, messages.length, qaComplete, triageResult]);

  // Re-render the current question bubble when the language toggles mid-question
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (chatMode === 'qa' && !qaComplete && !triageResult && currentQ && last?.role === 'assistant') {
      updateLastAssistantMessage(currentQ.text[chatLang]);
    }
  }, [chatLang]);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  // Shared continuation once an answer (pill, multi-select, or free text) lands.
  const proceed = useCallback(
    async (key: string, englishValue: string, displayValue: string, path: string[]) => {
      addMessage({ id: makeId(), role: 'user', content: displayValue, timestamp: new Date() });
      setAnswer(key, englishValue);

      const merged = { ...answers, [key]: englishValue };

      // Red-flag short-circuit: deterministic emergency result, no LLM call.
      const flag = checkRedFlags(merged);
      if (flag) {
        await new Promise<void>((r) => setTimeout(r, 400));
        addMessage({
          id: makeId(),
          role: 'assistant',
          content: flag.reason[chatLang],
          timestamp: new Date(),
        });
        completeQA();
        setTriageResult(buildEmergencyResult(chatLang), 'General Medicine');
        return;
      }

      await new Promise<void>((r) => setTimeout(r, 500));

      const nextIdx = stepIndex + 1;
      if (nextIdx >= path.length) {
        addMessage({
          id: makeId(),
          role: 'assistant',
          content: isBn ? 'আপনার উপসর্গ বিশ্লেষণ করা হচ্ছে...' : 'Analyzing your symptoms…',
          timestamp: new Date(),
        });
        completeQA();
        sendMessage(buildSummary(merged, path, chatLang));
      } else {
        advance();
        const nextQ = QUESTION_MAP[path[nextIdx]];
        addMessage({
          id: makeId(),
          role: 'assistant',
          content: nextQ.text[chatLang],
          timestamp: new Date(),
        });
      }
    },
    [answers, stepIndex, chatLang, isBn, sendMessage],
  );

  const handleOptionSelect = useCallback(
    async (opt: QOption) => {
      if (handlingRef.current || isStreaming || qaComplete || !currentQ) return;
      handlingRef.current = true;
      try {
        let path = questionPath;
        if (currentQ.key === 'q1') {
          path = FLOWS[opt.en] ?? FLOWS.Other;
          setPath(path);
        }
        await proceed(currentQ.key, opt.en, isBn ? opt.bn : opt.en, path);
      } finally {
        handlingRef.current = false;
      }
    },
    [currentQ, questionPath, isStreaming, qaComplete, isBn, proceed],
  );

  const handleMultiToggle = useCallback(
    (opt: QOption) => {
      if (isStreaming || qaComplete) return;
      if (multiDraft.includes(opt.en)) {
        setMultiDraft(multiDraft.filter((v) => v !== opt.en));
      } else if (opt.exclusive) {
        setMultiDraft([opt.en]);
      } else {
        // picking a normal option clears any exclusive ("None") selection
        const exclusives = new Set(currentOptions.filter((o) => o.exclusive).map((o) => o.en));
        setMultiDraft([...multiDraft.filter((v) => !exclusives.has(v)), opt.en]);
      }
    },
    [multiDraft, currentOptions, isStreaming, qaComplete],
  );

  const handleMultiDone = useCallback(async () => {
    if (handlingRef.current || isStreaming || qaComplete || !currentQ || multiDraft.length === 0) return;
    handlingRef.current = true;
    try {
      const chosen = currentOptions.filter((o) => multiDraft.includes(o.en));
      const english = chosen.map((o) => o.en).join(', ');
      const display = chosen.map((o) => (isBn ? o.bn : o.en)).join(', ');
      await proceed(currentQ.key, english, display, questionPath);
    } finally {
      handlingRef.current = false;
    }
  }, [currentQ, currentOptions, multiDraft, questionPath, isStreaming, qaComplete, isBn, proceed]);

  const handleFreeText = useCallback(
    async (text: string) => {
      if (handlingRef.current || isStreaming || qaComplete || !currentQ) return;
      handlingRef.current = true;
      try {
        await proceed(currentQ.key, text, text, questionPath);
      } finally {
        handlingRef.current = false;
      }
    },
    [currentQ, questionPath, isStreaming, qaComplete, proceed],
  );

  const handleBack = useCallback(() => {
    if (isStreaming || qaComplete || stepIndex === 0) return;
    goBack();
  }, [isStreaming, qaComplete, stepIndex]);

  // ── Derived display values ──────────────────────────────────────────────────
  const inQAFlow = chatMode === 'qa' && !qaComplete && !triageResult && !isStreaming && !!currentQ;
  const showQAPills = inQAFlow && !currentQ?.freeText && currentOptions.length > 0;
  const showQAFreeText = inQAFlow && !!currentQ?.freeText;
  const showFreeInput = chatMode === 'free' && !triageResult;
  const showProgress = chatMode === 'qa' && questionPath.length > 0 && !triageResult && !qaComplete;
  const totalSteps = questionPath.length;
  const stepNum = Math.min(stepIndex + 1, totalSteps || 1);
  const isQ1 = currentKey === 'q1';

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      {/* Desktop: chat sits in a centered ~760px column (Figma 10:64). */}
      <View className="w-full max-w-[800px] flex-1 self-center">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <View className="bg-white border-b border-slate-100">
        {/* Row 1: title + lang toggle + new-chat */}
        <View className="flex-row items-center justify-between px-4 pt-3 pb-2">
          <View>
            <Text className="text-base font-bold text-slate-800">{t('chat.title')}</Text>
            <Text className="text-xs text-slate-500">{t('chat.subtitle')}</Text>
          </View>

          <View className="flex-row items-center gap-2">
            {/* Language toggle */}
            <View className="flex-row bg-slate-100 rounded-full p-0.5">
              <TouchableOpacity
                onPress={() => setChatLang('en')}
                activeOpacity={0.8}
                className={`px-3 py-1 rounded-full ${!isBn ? 'bg-white' : ''}`}
              >
                <Text className={`text-xs font-semibold ${!isBn ? 'text-slate-800' : 'text-slate-400'}`}>EN</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setChatLang('bn')}
                activeOpacity={0.8}
                className={`px-3 py-1 rounded-full ${isBn ? 'bg-white' : ''}`}
              >
                <Text className={`text-xs font-semibold ${isBn ? 'text-slate-800' : 'text-slate-400'}`}>বাং</Text>
              </TouchableOpacity>
            </View>

            {/* New Chat */}
            {messages.length > 0 && (
              <TouchableOpacity
                onPress={reset}
                activeOpacity={0.8}
                className="flex-row items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full"
              >
                <Ionicons name="refresh" size={14} color="#64748B" />
                <Text className="text-slate-600 text-xs font-medium">
                  {isBn ? 'নতুন চ্যাট' : t('chat.new_chat')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Row 2: mode toggle */}
        <View className="flex-row items-center px-4 pb-3 gap-2">
          <TouchableOpacity
            onPress={() => setChatMode('qa')}
            activeOpacity={0.8}
            className={`px-4 py-1.5 rounded-full border ${chatMode === 'qa' ? 'bg-primary-500 border-primary-500' : 'bg-white border-slate-200'}`}
          >
            <Text className={`text-xs font-semibold ${chatMode === 'qa' ? 'text-white' : 'text-slate-500'}`}>
              {isBn ? 'দ্রুত প্রশ্ন' : 'Quick Q&A'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setChatMode('free')}
            activeOpacity={0.8}
            className={`px-4 py-1.5 rounded-full border ${chatMode === 'free' ? 'bg-primary-500 border-primary-500' : 'bg-white border-slate-200'}`}
          >
            <Text className={`text-xs font-semibold ${chatMode === 'free' ? 'text-white' : 'text-slate-500'}`}>
              {isBn ? 'সরাসরি চ্যাট' : 'Chat freely'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Progress bar (QA mode, once a path is chosen) ───────────────────── */}
      {showProgress && (
        <View className="px-4 pt-2 pb-2.5 bg-white border-b border-slate-100">
          <Text className="text-xs text-slate-500 mb-1.5">
            {isBn
              ? `ধাপ ${toBnDigits(stepNum)} / ${toBnDigits(totalSteps)}`
              : `Step ${stepNum} of ${totalSteps}`}
          </Text>
          <View className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${(stepNum / Math.max(totalSteps, 1)) * 100}%` }}
            />
          </View>
        </View>
      )}

      {/* ── Message list ────────────────────────────────────────────────────── */}
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
        ListFooterComponent={
          triageResult ? (
            <SeverityCard result={triageResult} suggestedSpecialty={suggestedSpecialty} />
          ) : null
        }
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {/* ── QA mode: option pills ───────────────────────────────────────────── */}
      {showQAPills && (
        <View className="bg-white border-t border-slate-100">
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 190 }}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 }}
          >
            {currentOptions.map((opt) => {
              const selected = currentQ?.multi && multiDraft.includes(opt.en);
              return (
                <TouchableOpacity
                  key={opt.en}
                  onPress={() => (currentQ?.multi ? handleMultiToggle(opt) : handleOptionSelect(opt))}
                  activeOpacity={0.7}
                  className={`flex-row items-center gap-1.5 border rounded-full px-4 ${isQ1 ? 'py-2.5' : 'py-2'} ${
                    selected ? 'bg-primary-500 border-primary-500' : 'bg-white border-primary-300 active:bg-primary-50'
                  }`}
                >
                  {opt.icon ? (
                    <Ionicons name={opt.icon as any} size={15} color={selected ? '#fff' : '#2563EB'} />
                  ) : null}
                  <Text className={`text-sm font-medium ${selected ? 'text-white' : 'text-primary-600'}`}>
                    {isBn ? opt.bn : opt.en}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Back + Done row */}
          {(stepIndex > 0 || currentQ?.multi) && (
            <View className="flex-row items-center justify-between px-3 pb-3 gap-2">
              {stepIndex > 0 ? (
                <TouchableOpacity
                  onPress={handleBack}
                  activeOpacity={0.7}
                  className="flex-row items-center gap-1 bg-slate-100 rounded-full px-4 py-2"
                >
                  <Ionicons name="arrow-back" size={14} color="#475569" />
                  <Text className="text-slate-600 text-sm font-medium">{t('chat.back')}</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              {currentQ?.multi ? (
                <TouchableOpacity
                  onPress={handleMultiDone}
                  disabled={multiDraft.length === 0}
                  activeOpacity={0.8}
                  className={`rounded-full px-6 py-2 ${multiDraft.length === 0 ? 'bg-slate-200' : 'bg-primary-500'}`}
                >
                  <Text className={`text-sm font-semibold ${multiDraft.length === 0 ? 'text-slate-400' : 'text-white'}`}>
                    {t('chat.done')}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>
      )}

      {/* ── QA mode: free-text step ("Other" description) ───────────────────── */}
      {showQAFreeText && (
        <View className="bg-white border-t border-slate-100">
          <ChatInput onSend={handleFreeText} disabled={isStreaming} placeholder={t('chat.describe_placeholder')} />
          {stepIndex > 0 && (
            <View className="px-3 pb-3">
              <TouchableOpacity
                onPress={handleBack}
                activeOpacity={0.7}
                className="self-start flex-row items-center gap-1 bg-slate-100 rounded-full px-4 py-2"
              >
                <Ionicons name="arrow-back" size={14} color="#475569" />
                <Text className="text-slate-600 text-sm font-medium">{t('chat.back')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ── Free mode: text input ───────────────────────────────────────────── */}
      {showFreeInput && (
        <ChatInput onSend={sendMessage} disabled={isStreaming} />
      )}

      {/* ── Disclaimer ──────────────────────────────────────────────────────── */}
      <View className="px-4 py-2 bg-white">
        <Text className="text-center text-xs text-slate-400">{t('chat.disclaimer')}</Text>
      </View>
      </View>
    </SafeAreaView>
  );
}
