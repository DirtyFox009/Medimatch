import { create } from 'zustand';
import type { ChatMessage, TriageResult } from '../types/chat';
import type { Specialty } from '../types/doctor';

interface ChatState {
  messages: ChatMessage[];
  triageResult: TriageResult | null;
  suggestedSpecialty: Specialty | null;
  isStreaming: boolean;
  currentQuestionIndex: number;
  answers: Record<string, string>;
  qaComplete: boolean;
  addMessage: (msg: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setTriageResult: (result: TriageResult, specialty: Specialty | null) => void;
  setStreaming: (streaming: boolean) => void;
  reset: () => void;
  setAnswer: (questionKey: string, answer: string) => void;
  nextQuestion: () => void;
  completeQA: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  triageResult: null,
  suggestedSpecialty: null,
  isStreaming: false,
  currentQuestionIndex: 0,
  answers: {},
  qaComplete: false,

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
    set({
      messages: [],
      triageResult: null,
      suggestedSpecialty: null,
      isStreaming: false,
      currentQuestionIndex: 0,
      answers: {},
      qaComplete: false,
    }),

  setAnswer: (questionKey, answer) =>
    set((s) => ({ answers: { ...s.answers, [questionKey]: answer } })),

  nextQuestion: () =>
    set((s) => ({ currentQuestionIndex: s.currentQuestionIndex + 1 })),

  completeQA: () => set({ qaComplete: true }),
}));
