import { create } from 'zustand';
import type { ChatMessage, TriageResult } from '../types/chat';
import type { Specialty } from '../types/doctor';

interface ChatState {
  messages: ChatMessage[];
  triageResult: TriageResult | null;
  suggestedSpecialty: Specialty | null;
  isStreaming: boolean;
  addMessage: (msg: ChatMessage) => void;
  updateLastAssistantMessage: (content: string) => void;
  setTriageResult: (result: TriageResult, specialty: Specialty | null) => void;
  setStreaming: (streaming: boolean) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  triageResult: null,
  suggestedSpecialty: null,
  isStreaming: false,

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
    }),
}));
