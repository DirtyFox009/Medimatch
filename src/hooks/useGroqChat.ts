import { useCallback } from 'react';
import { streamChatCompletion } from '../services/groq/client';
import { parseTriageResult, extractSpecialty, stripTriageJson } from '../services/groq/triage';
import { useChatStore } from '../store/chatStore';
import type { ChatMessage } from '../types/chat';

function makeId() {
  return Math.random().toString(36).slice(2);
}

export function useGroqChat() {
  const { messages, triageResult, isStreaming, addMessage, updateLastAssistantMessage, setTriageResult, setStreaming } =
    useChatStore();

  const sendMessage = useCallback(
    async (text: string) => {
      if (isStreaming) return;

      const userMsg: ChatMessage = {
        id: makeId(),
        role: 'user',
        content: text,
        timestamp: new Date(),
      };
      addMessage(userMsg);

      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: '',
        timestamp: new Date(),
      };
      addMessage(assistantMsg);
      setStreaming(true);

      try {
        // System prompt is prepended server-side by the proxy (api/groq.ts).
        const fullContent = await streamChatCompletion(
          [...messages, userMsg].map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          updateLastAssistantMessage,
        );

        // Check for triage result in the completed response
        const triage = parseTriageResult(fullContent);
        if (triage) {
          const specialty = extractSpecialty(fullContent);
          setTriageResult(triage, specialty);
          // Show clean message without JSON block
          updateLastAssistantMessage(stripTriageJson(fullContent));
        }
      } catch (err: unknown) {
        const reason = err instanceof Error ? err.message : 'unknown_error';
        // The user-facing copy is deliberately vague, so make sure the real
        // cause reaches somewhere a developer can actually read it.
        console.warn('[triage] chat completion failed:', reason);
        let errMsg: string;
        if (reason.includes('rate_limit')) {
          errMsg = 'Too many requests. Please wait a moment and try again.';
        } else if (reason.includes('groq_proxy_error')) {
          // The request reached the proxy and it answered — blaming the user's
          // connection here is what hid an upstream outage for four days.
          errMsg = 'The AI assistant is unavailable right now. Please try again later.';
        } else {
          errMsg = 'Connection error. Please check your internet and try again.';
        }
        updateLastAssistantMessage(errMsg);
      } finally {
        setStreaming(false);
      }
    },
    [messages, isStreaming],
  );

  return { messages, triageResult, isStreaming, sendMessage };
}
