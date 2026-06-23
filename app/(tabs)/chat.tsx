import React, { useRef, useEffect, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Text, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatBubble } from '../../src/components/chat/ChatBubble';
import { SeverityCard } from '../../src/components/chat/SeverityCard';
import { useGroqChat } from '../../src/hooks/useGroqChat';
import { useChatStore } from '../../src/store/chatStore';

function makeId() {
  return Math.random().toString(36).slice(2);
}

const Q2_OPTIONS: Record<string, string[]> = {
  Chest:   ['Centre', 'Left side', 'Right side', 'All over'],
  Stomach: ['Upper', 'Lower', 'Left side', 'Right side'],
  Head:    ['Forehead', 'Back of head', 'One side', 'All over'],
  Joints:  ['Knee', 'Hip', 'Shoulder', 'Wrist', 'Ankle'],
};
const Q2_TRIGGERS = new Set(['Chest', 'Stomach', 'Head', 'Joints']);

interface QDef {
  key: string;
  text: string;
  options: string[] | ((a: Record<string, string>) => string[]);
}

const QUESTIONS: QDef[] = [
  { key: 'q1',  text: "What's bothering you most right now?",  options: ['Chest', 'Stomach', 'Head', 'Joints', 'Skin', 'Eyes', 'Throat', 'Back', 'Other'] },
  { key: 'q2',  text: 'Where exactly?',                        options: (a) => Q2_OPTIONS[a.q1] ?? [] },
  { key: 'q3',  text: 'How long has this been going on?',      options: ['Started today', '2–3 days', 'About a week', 'More than a week', 'Over a month'] },
  { key: 'q4',  text: 'Did it start suddenly or gradually?',   options: ['Suddenly', 'Gradually', 'Comes and goes'] },
  { key: 'q5',  text: 'How bad does it feel?',                 options: ['Mild (bearable)', 'Moderate (distracting)', 'Severe (unbearable)'] },
  { key: 'q6',  text: 'Does anything make it worse?',          options: ['Movement', 'Eating', 'Stress', 'Deep breathing', 'Lying down', 'Nothing specific'] },
  { key: 'q7',  text: 'Does anything make it better?',         options: ['Rest', 'Medication', 'Heat or cold', 'Food', 'Nothing helps'] },
  { key: 'q8',  text: 'Any fever?',                            options: ['High fever', 'Mild fever', 'No fever'] },
  { key: 'q9',  text: 'Any of these also present?',            options: ['Nausea or vomiting', 'Fatigue or weakness', 'Dizziness', 'Shortness of breath', 'None of these'] },
  { key: 'q10', text: 'Have you had this before?',             options: ['Yes same thing', 'Yes but different', 'No first time'] },
  { key: 'q11', text: 'Any existing medical conditions?',      options: ['Diabetes', 'Hypertension', 'Heart disease', 'Asthma', 'None'] },
  { key: 'q12', text: 'Any medications currently?',            options: ['Yes painkillers', 'Yes prescription meds', 'No medications'] },
];

function resolveOptions(q: QDef, answers: Record<string, string>): string[] {
  return typeof q.options === 'function' ? q.options(answers) : q.options;
}

function buildSummary(answers: Record<string, string>): string {
  return [
    `Main complaint: ${answers.q1}${answers.q2 ? ` (${answers.q2})` : ''}.`,
    `Duration: ${answers.q3}.`,
    `Onset: ${answers.q4}.`,
    `Severity: ${answers.q5}.`,
    `Worse with: ${answers.q6}.`,
    `Better with: ${answers.q7}.`,
    `Fever: ${answers.q8}.`,
    `Other symptoms: ${answers.q9}.`,
    `History: ${answers.q10}.`,
    `Conditions: ${answers.q11}.`,
    `Medications: ${answers.q12}.`,
  ].join(' ');
}

export default function ChatScreen() {
  const { t } = useTranslation();
  const { messages, triageResult, isStreaming, sendMessage } = useGroqChat();
  const {
    suggestedSpecialty, reset,
    currentQuestionIndex, answers, qaComplete,
    addMessage, setAnswer, nextQuestion, completeQA,
  } = useChatStore();

  const listRef = useRef<FlatList>(null);
  const handlingRef = useRef(false);

  // Seed Q1 on mount and after every reset (messages emptied)
  useEffect(() => {
    if (messages.length === 0 && !qaComplete && !triageResult) {
      addMessage({
        id: makeId(),
        role: 'assistant',
        content: QUESTIONS[0].text,
        timestamp: new Date(),
      });
    }
  }, [messages.length, qaComplete, triageResult]);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const handleOptionSelect = useCallback(async (option: string) => {
    if (handlingRef.current || isStreaming || qaComplete) return;
    handlingRef.current = true;

    try {
      const qIdx = currentQuestionIndex;
      const q = QUESTIONS[qIdx];

      addMessage({ id: makeId(), role: 'user', content: option, timestamp: new Date() });
      setAnswer(q.key, option);

      // Q2 is skipped when Q1 answer is not one of the four body areas that need location detail
      const skipQ2 = qIdx === 0 && !Q2_TRIGGERS.has(option);
      const nextIdx = qIdx + 1 + (skipQ2 ? 1 : 0);

      await new Promise<void>((r) => setTimeout(r, 600));

      if (nextIdx >= QUESTIONS.length) {
        const finalAnswers = { ...answers, [q.key]: option };
        addMessage({
          id: makeId(),
          role: 'assistant',
          content: 'Analyzing your symptoms…',
          timestamp: new Date(),
        });
        nextQuestion();
        completeQA();
        sendMessage(buildSummary(finalAnswers));
      } else {
        nextQuestion();
        if (skipQ2) nextQuestion();
        const updatedAnswers = { ...answers, [q.key]: option };
        const nextQ = QUESTIONS[nextIdx];
        // pre-resolve options so Q2's dynamic lookup uses the just-selected Q1 answer
        resolveOptions(nextQ, updatedAnswers);
        addMessage({
          id: makeId(),
          role: 'assistant',
          content: nextQ.text,
          timestamp: new Date(),
        });
      }
    } finally {
      handlingRef.current = false;
    }
  }, [currentQuestionIndex, answers, isStreaming, qaComplete]);

  const currentQ = QUESTIONS[currentQuestionIndex];
  const currentOptions = currentQ ? resolveOptions(currentQ, answers) : [];
  const showOptions = !qaComplete && !triageResult && !isStreaming && currentOptions.length > 0;
  const showProgress = messages.length > 0 && !triageResult;
  const stepNum = Math.min(currentQuestionIndex + 1, 12);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
        <View>
          <Text className="text-base font-bold text-slate-800">{t('chat.title')}</Text>
          <Text className="text-xs text-slate-500">{t('chat.subtitle')}</Text>
        </View>
        {messages.length > 0 && (
          <TouchableOpacity
            onPress={reset}
            className="flex-row items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full"
          >
            <Ionicons name="refresh" size={14} color="#64748B" />
            <Text className="text-slate-600 text-xs font-medium">{t('chat.new_chat')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar */}
      {showProgress && (
        <View className="px-4 pt-2 pb-2.5 bg-white border-b border-slate-100">
          <Text className="text-xs text-slate-500 mb-1.5">
            Step {stepNum} of 12
          </Text>
          <View className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${(stepNum / 12) * 100}%` }}
            />
          </View>
        </View>
      )}

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
        ListFooterComponent={
          triageResult ? (
            <SeverityCard result={triageResult} suggestedSpecialty={suggestedSpecialty} />
          ) : null
        }
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Option pills */}
      {showOptions && (
        <View className="bg-white border-t border-slate-100">
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ maxHeight: 160 }}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 }}
          >
            {currentOptions.map((opt) => (
              <TouchableOpacity
                key={opt}
                onPress={() => handleOptionSelect(opt)}
                activeOpacity={0.7}
                className="border border-primary-300 rounded-full px-4 py-2 bg-white active:bg-primary-50"
              >
                <Text className="text-primary-600 text-sm font-medium">{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Disclaimer */}
      <View className="px-4 py-2 bg-white">
        <Text className="text-center text-xs text-slate-400">{t('chat.disclaimer')}</Text>
      </View>
    </SafeAreaView>
  );
}
