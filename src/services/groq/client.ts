import { Platform } from 'react-native';
import { CONFIG } from '../../constants/config';

export type ChatCompletionMessage = { role: 'user' | 'assistant'; content: string };

// React Native's built-in fetch buffers the whole response body; expo/fetch
// implements WHATWG streaming, which we need to render tokens as they arrive.
function getFetch(): typeof fetch {
  if (Platform.OS === 'web') return globalThis.fetch.bind(globalThis);
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { fetch: expoFetch } = require('expo/fetch');
  return expoFetch as typeof fetch;
}

/**
 * Streams a chat completion through the Vercel proxy (api/groq.ts).
 * Calls onDelta with the accumulated text after every chunk; resolves with the
 * full response text. Throws Error('rate_limit') on HTTP 429 so callers can
 * show their rate-limit message.
 */
export async function streamChatCompletion(
  messages: ChatCompletionMessage[],
  onDelta: (fullText: string) => void,
): Promise<string> {
  const fetchImpl = getFetch();
  const res = await fetchImpl(CONFIG.groqProxyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });

  if (res.status === 429) throw new Error('rate_limit');
  if (!res.ok) throw new Error(`groq_proxy_error_${res.status}`);
  if (!res.body) throw new Error('groq_proxy_no_stream');

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
      const line = buffer.slice(0, newlineIndex).trim();
      buffer = buffer.slice(newlineIndex + 1);
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (!data || data === '[DONE]') continue;
      try {
        const parsed = JSON.parse(data);
        const delta: string = parsed.choices?.[0]?.delta?.content ?? '';
        if (delta) {
          fullText += delta;
          onDelta(fullText);
        }
      } catch {
        // Ignore malformed SSE fragments; complete lines follow.
      }
    }
  }

  return fullText;
}
