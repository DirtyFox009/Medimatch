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

function makeId() {
  return Math.random().toString(36).slice(2);
}

// ─── Question definitions ────────────────────────────────────────────────────

interface QOption {
  en: string;
  bn: string;
}

interface QDef {
  key: string;
  text: { en: string; bn: string };
  options: QOption[] | ((a: Record<string, string>) => QOption[]);
}

// Q2 sub-location options keyed by English Q1 value (answers are always stored in English)
const Q2_OPTIONS: Record<string, QOption[]> = {
  Chest: [
    { en: 'Centre',     bn: 'মাঝখানে' },
    { en: 'Left side',  bn: 'বাম পাশে' },
    { en: 'Right side', bn: 'ডান পাশে' },
    { en: 'All over',   bn: 'সব জায়গায়' },
  ],
  Stomach: [
    { en: 'Upper',      bn: 'উপরে' },
    { en: 'Lower',      bn: 'নিচে' },
    { en: 'Left side',  bn: 'বাম পাশে' },
    { en: 'Right side', bn: 'ডান পাশে' },
  ],
  Head: [
    { en: 'Forehead',     bn: 'কপালে' },
    { en: 'Back of head', bn: 'পেছনে' },
    { en: 'One side',     bn: 'এক পাশে' },
    { en: 'All over',     bn: 'সব জায়গায়' },
  ],
  Joints: [
    { en: 'Knee',     bn: 'হাঁটু' },
    { en: 'Hip',      bn: 'কোমর' },
    { en: 'Shoulder', bn: 'কাঁধ' },
    { en: 'Wrist',    bn: 'কব্জি' },
    { en: 'Ankle',    bn: 'গোড়ালি' },
  ],
};

// Q2 only appears when Q1 English answer is one of these four
const Q2_TRIGGERS = new Set(['Chest', 'Stomach', 'Head', 'Joints']);

const QUESTIONS: QDef[] = [
  {
    key: 'q1',
    text: { en: "What's bothering you most right now?", bn: 'এখন সবচেয়ে বেশি কোথায় সমস্যা হচ্ছে?' },
    options: [
      { en: 'Chest',   bn: 'বুক' },
      { en: 'Stomach', bn: 'পেট' },
      { en: 'Head',    bn: 'মাথা' },
      { en: 'Joints',  bn: 'হাড়/গাঁট' },
      { en: 'Skin',    bn: 'চামড়া' },
      { en: 'Eyes',    bn: 'চোখ' },
      { en: 'Throat',  bn: 'গলা' },
      { en: 'Back',    bn: 'পিঠ' },
      { en: 'Other',   bn: 'অন্যান্য' },
    ],
  },
  {
    key: 'q2',
    text: { en: 'Where exactly?', bn: 'ঠিক কোথায়?' },
    options: (a) => Q2_OPTIONS[a.q1] ?? [],
  },
  {
    key: 'q3',
    text: { en: 'How long has this been going on?', bn: 'কতদিন ধরে এই সমস্যা?' },
    options: [
      { en: 'Started today',    bn: 'আজই শুরু' },
      { en: '2–3 days',         bn: '২-৩ দিন' },
      { en: 'About a week',     bn: 'প্রায় এক সপ্তাহ' },
      { en: 'More than a week', bn: 'এক সপ্তাহের বেশি' },
      { en: 'Over a month',     bn: 'এক মাসের বেশি' },
    ],
  },
  {
    key: 'q4',
    text: { en: 'Did it start suddenly or gradually?', bn: 'হঠাৎ শুরু হয়েছে নাকি ধীরে ধীরে?' },
    options: [
      { en: 'Suddenly',       bn: 'হঠাৎ' },
      { en: 'Gradually',      bn: 'ধীরে ধীরে' },
      { en: 'Comes and goes', bn: 'আসে-যায়' },
    ],
  },
  {
    key: 'q5',
    text: { en: 'How bad does it feel?', bn: 'ব্যথা বা সমস্যা কতটা তীব্র?' },
    options: [
      { en: 'Mild (bearable)',        bn: 'সামান্য (সহনীয়)' },
      { en: 'Moderate (distracting)', bn: 'মাঝারি (বিরক্তিকর)' },
      { en: 'Severe (unbearable)',    bn: 'তীব্র (অসহনীয়)' },
    ],
  },
  {
    key: 'q6',
    text: { en: 'Does anything make it worse?', bn: 'কোন কারণে সমস্যা বাড়ে?' },
    options: [
      { en: 'Movement',         bn: 'নড়াচড়ায়' },
      { en: 'Eating',           bn: 'খাবার পরে' },
      { en: 'Stress',           bn: 'মানসিক চাপে' },
      { en: 'Deep breathing',   bn: 'গভীর শ্বাসে' },
      { en: 'Lying down',       bn: 'শুয়ে থাকলে' },
      { en: 'Nothing specific', bn: 'কোনো কারণ নেই' },
    ],
  },
  {
    key: 'q7',
    text: { en: 'Does anything make it better?', bn: 'কোন কারণে সমস্যা কমে?' },
    options: [
      { en: 'Rest',          bn: 'বিশ্রামে' },
      { en: 'Medication',    bn: 'ওষুধে' },
      { en: 'Heat or cold',  bn: 'গরম/ঠান্ডায়' },
      { en: 'Food',          bn: 'খাবারে' },
      { en: 'Nothing helps', bn: 'কোনোভাবেই কমে না' },
    ],
  },
  {
    key: 'q8',
    text: { en: 'Any fever?', bn: 'জ্বর আছে কি?' },
    options: [
      { en: 'High fever', bn: 'বেশি জ্বর' },
      { en: 'Mild fever', bn: 'হালকা জ্বর' },
      { en: 'No fever',   bn: 'জ্বর নেই' },
    ],
  },
  {
    key: 'q9',
    text: { en: 'Any of these also present?', bn: 'এর সাথে আর কিছু আছে?' },
    options: [
      { en: 'Nausea or vomiting',  bn: 'বমি বমি ভাব' },
      { en: 'Fatigue or weakness', bn: 'দুর্বলতা/ক্লান্তি' },
      { en: 'Dizziness',           bn: 'মাথা ঘোরা' },
      { en: 'Shortness of breath', bn: 'শ্বাসকষ্ট' },
      { en: 'None of these',       bn: 'আর কিছু নেই' },
    ],
  },
  {
    key: 'q10',
    text: { en: 'Have you had this before?', bn: 'আগে এরকম হয়েছিল?' },
    options: [
      { en: 'Yes same thing',   bn: 'হ্যাঁ একই রকম' },
      { en: 'Yes but different', bn: 'হ্যাঁ কিন্তু আলাদা' },
      { en: 'No first time',    bn: 'না এই প্রথম' },
    ],
  },
  {
    key: 'q11',
    text: { en: 'Any existing medical conditions?', bn: 'কোনো পুরনো রোগ আছে?' },
    options: [
      { en: 'Diabetes',      bn: 'ডায়াবেটিস' },
      { en: 'Hypertension',  bn: 'উচ্চ রক্তচাপ' },
      { en: 'Heart disease', bn: 'হৃদরোগ' },
      { en: 'Asthma',        bn: 'হাঁপানি' },
      { en: 'None',          bn: 'কোনোটিই না' },
    ],
  },
  {
    key: 'q12',
    text: { en: 'Any medications currently?', bn: 'এখন কোনো ওষুধ খাচ্ছেন?' },
    options: [
      { en: 'Yes painkillers',       bn: 'হ্যাঁ ব্যথার ওষুধ' },
      { en: 'Yes prescription meds', bn: 'হ্যাঁ ডাক্তারের ওষুধ' },
      { en: 'No medications',        bn: 'না কোনো ওষুধ নেই' },
    ],
  },
];

function resolveOptions(q: QDef, answers: Record<string, string>): QOption[] {
  return typeof q.options === 'function' ? q.options(answers) : q.options;
}

// Summary always built in English regardless of chatLang — Groq receives English
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

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ChatScreen() {
  const { t } = useTranslation();
  const { messages, triageResult, isStreaming, sendMessage } = useGroqChat();
  const {
    suggestedSpecialty, reset,
    currentQuestionIndex, answers, qaComplete,
    chatMode, chatLang,
    addMessage, setAnswer, nextQuestion, completeQA,
    setChatMode, setChatLang,
  } = useChatStore();

  const listRef = useRef<FlatList>(null);
  const handlingRef = useRef(false);

  const isBn = chatLang === 'bn';

  // Seed Q1 as the opening bot message (QA mode only, runs on mount and after reset)
  useEffect(() => {
    if (chatMode === 'qa' && messages.length === 0 && !qaComplete && !triageResult) {
      addMessage({
        id: makeId(),
        role: 'assistant',
        content: QUESTIONS[0].text[chatLang],
        timestamp: new Date(),
      });
    }
  }, [chatMode, messages.length, qaComplete, triageResult]);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

  const handleOptionSelect = useCallback(async (opt: QOption) => {
    if (handlingRef.current || isStreaming || qaComplete) return;
    handlingRef.current = true;

    try {
      const qIdx = currentQuestionIndex;
      const q = QUESTIONS[qIdx];
      const displayLabel = isBn ? opt.bn : opt.en;

      // User bubble shows the language-appropriate label; answers always store English
      addMessage({ id: makeId(), role: 'user', content: displayLabel, timestamp: new Date() });
      setAnswer(q.key, opt.en);

      // Q2 is conditional on the English Q1 value (stored in answers)
      const skipQ2 = qIdx === 0 && !Q2_TRIGGERS.has(opt.en);
      const nextIdx = qIdx + 1 + (skipQ2 ? 1 : 0);

      await new Promise<void>((r) => setTimeout(r, 600));

      if (nextIdx >= QUESTIONS.length) {
        const finalAnswers = { ...answers, [q.key]: opt.en };
        const analyzingText = isBn
          ? 'আপনার উপসর্গ বিশ্লেষণ করা হচ্ছে...'
          : 'Analyzing your symptoms…';
        addMessage({ id: makeId(), role: 'assistant', content: analyzingText, timestamp: new Date() });
        nextQuestion();
        completeQA();
        sendMessage(buildSummary(finalAnswers));
      } else {
        nextQuestion();
        if (skipQ2) nextQuestion();
        const nextQ = QUESTIONS[nextIdx];
        addMessage({
          id: makeId(),
          role: 'assistant',
          content: nextQ.text[chatLang],
          timestamp: new Date(),
        });
      }
    } finally {
      handlingRef.current = false;
    }
  }, [currentQuestionIndex, answers, isStreaming, qaComplete, chatLang, isBn]);

  // ── Derived display values ──────────────────────────────────────────────────
  const currentQ = QUESTIONS[currentQuestionIndex];
  const currentOptions = currentQ ? resolveOptions(currentQ, answers) : [];
  const showQAPills = chatMode === 'qa' && !qaComplete && !triageResult && !isStreaming && currentOptions.length > 0;
  const showFreeInput = chatMode === 'free' && !triageResult;
  const showProgress = chatMode === 'qa' && messages.length > 0 && !triageResult;
  const stepNum = Math.min(currentQuestionIndex + 1, 12);

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

      {/* ── Progress bar (QA mode only) ─────────────────────────────────────── */}
      {showProgress && (
        <View className="px-4 pt-2 pb-2.5 bg-white border-b border-slate-100">
          <Text className="text-xs text-slate-500 mb-1.5">
            {isBn ? `ধাপ ${stepNum} / ১২` : `Step ${stepNum} of 12`}
          </Text>
          <View className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <View
              className="h-full bg-primary-500 rounded-full"
              style={{ width: `${(stepNum / 12) * 100}%` }}
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
            style={{ maxHeight: 160 }}
            contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 12 }}
          >
            {currentOptions.map((opt) => (
              <TouchableOpacity
                key={opt.en}
                onPress={() => handleOptionSelect(opt)}
                activeOpacity={0.7}
                className="border border-primary-300 rounded-full px-4 py-2 bg-white active:bg-primary-50"
              >
                <Text className="text-primary-600 text-sm font-medium">
                  {isBn ? opt.bn : opt.en}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
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
