import { create } from 'zustand';
import type { ChatMessage, TriageResult } from '../types/chat';
import type { Specialty } from '../types/doctor';

interface ChatState {
  messages: ChatMessage[];
  triageResult: TriageResult | null;
  suggestedSpecialty: Specialty | null;
  isStreaming: boolean;
  // Adaptive guided flow: ordered question keys (from FLOWS) + current position.
  // Path is empty until q1 is answered; q1 renders as the implicit first step.
  questionPath: string[];
  stepIndex: number;
  answers: Record<string, string>;
  multiDraft: string[]; // in-progress multi-select toggles (English values)
  qaComplete: boolean;
  chatMode: 'qa' | 'free';
  chatLang: 'en' | 'bn';
  pendingSpecialty: string | null;
  addMessage: (msg: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setTriageResult: (result: TriageResult, specialty: Specialty | null) => void;
  setStreaming: (streaming: boolean) => void;
  reset: () => void;
  setAnswer: (questionKey: string, answer: string) => void;
  setPath: (path: string[]) => void;
  advance: () => void;
  goBack: () => void;
  setMultiDraft: (draft: string[]) => void;
  completeQA: () => void;
  setChatMode: (mode: 'qa' | 'free') => void;
  setChatLang: (lang: 'en' | 'bn') => void;
  setPendingSpecialty: (specialty: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  triageResult: null,
  suggestedSpecialty: null,
  isStreaming: false,
  questionPath: [],
  stepIndex: 0,
  answers: {},
  multiDraft: [],
  qaComplete: false,
  chatMode: 'qa',
  chatLang: 'en',
  pendingSpecialty: null,

  addMessage: (msg) => set((s) => ({ messages: [...s.messages, msg] })),

  updateLastAssistantMessage: (content) =>
    set((s) => {
      const msgs = [...s.messages];
      const last = msgs.findLastIndex((m) => m.role === 'assistant');
      if (last >= 0) msgs[last] = { ...msgs[last], content };
      return { messages: msgs };
    }),

  setTriageResult: (triageResult, suggestedSpecialty) =>
    set({ triageResult, suggestedSpecialty }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  reset: () =>
    set((s) => ({
      messages: [],
      triageResult: null,
      suggestedSpecialty: null,
      isStreaming: false,
      questionPath: [],
      stepIndex: 0,
      answers: {},
      multiDraft: [],
      qaComplete: false,
      chatMode: 'qa',
      chatLang: s.chatLang, // language persists across resets
    })),

  setAnswer: (questionKey, answer) =>
    set((s) => ({ answers: { ...s.answers, [questionKey]: answer } })),

  setPath: (questionPath) => set({ questionPath }),

  advance: () => set((s) => ({ stepIndex: s.stepIndex + 1, multiDraft: [] })),

  // Step back one question: drop that answer and the last user+assistant
  // message pair (previous answer bubble + current question bubble).
  goBack: () =>
    set((s) => {
      if (s.stepIndex === 0 || s.qaComplete) return s;
      const newIdx = s.stepIndex - 1;
      const key = s.questionPath[newIdx];
      const answers = { ...s.answers };
      delete answers[key];
      return {
        stepIndex: newIdx,
        answers,
        multiDraft: [],
        messages: s.messages.slice(0, -2),
      };
    }),

  setMultiDraft: (multiDraft) => set({ multiDraft }),

  completeQA: () => set({ qaComplete: true }),

  setChatMode: (chatMode) => set({ chatMode }),

  setChatLang: (chatLang) => set({ chatLang }),

  setPendingSpecialty: (pendingSpecialty) => set({ pendingSpecialty }),
}));
