// Vercel Edge function: streaming proxy for Groq chat completions.
// The Groq API key lives only in Vercel's environment (GROQ_API_KEY) — clients
// send bare user/assistant messages and receive the raw SSE stream back.

import { TRIAGE_SYSTEM_PROMPT } from './_prompts';

export const config = { runtime: 'edge' };

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';
const MAX_MESSAGES = 24;
const MAX_MESSAGE_CHARS = 4000;

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(status: number, body: object): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

type IncomingMessage = { role: string; content: string };

function validateMessages(input: unknown): IncomingMessage[] | null {
  if (typeof input !== 'object' || input === null) return null;
  const messages = (input as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return null;
  }
  for (const m of messages) {
    if (typeof m !== 'object' || m === null) return null;
    const { role, content } = m as IncomingMessage;
    if (role !== 'user' && role !== 'assistant') return null;
    if (typeof content !== 'string' || content.length === 0 || content.length > MAX_MESSAGE_CHARS) {
      return null;
    }
  }
  return messages as IncomingMessage[];
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }
  if (req.method !== 'POST') {
    return jsonResponse(405, { error: 'method_not_allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return jsonResponse(500, { error: 'server_not_configured' });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: 'invalid_json' });
  }

  const messages = validateMessages(body);
  if (!messages) {
    return jsonResponse(400, { error: 'invalid_messages' });
  }

  const upstream = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'system', content: TRIAGE_SYSTEM_PROMPT }, ...messages],
      max_tokens: 1024,
      temperature: 0.4,
      stream: true,
    }),
  });

  if (!upstream.ok || !upstream.body) {
    // Pass Groq's status through (429 lets clients show their rate-limit copy)
    // without leaking upstream error details.
    return jsonResponse(upstream.status === 429 ? 429 : 502, { error: 'upstream_error' });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      ...CORS_HEADERS,
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}
