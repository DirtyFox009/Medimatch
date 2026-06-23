import type { Severity } from './appointment';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface TriageResult {
  severity: Severity;
  conditions: string[];
  firstAid: string;
  recommendation: string;
  language: 'en' | 'bn';
}
