import type { TriageResult } from '../../types/chat';
import type { Specialty } from '../../types/doctor';

// Detect Bengali script by Unicode range
export function detectLanguage(text: string): 'en' | 'bn' {
  return /[ঀ-৿]/.test(text) ? 'bn' : 'en';
}

const TRIAGE_JSON_REGEX = /\{[\s\S]*?"severity"\s*:[\s\S]*?\}/;

export function parseTriageResult(content: string): TriageResult | null {
  const match = content.match(TRIAGE_JSON_REGEX);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[0]);
    if (!parsed.severity || !Array.isArray(parsed.conditions)) return null;
    return {
      severity: parsed.severity,
      conditions: parsed.conditions,
      firstAid: parsed.firstAid ?? '',
      recommendation: parsed.recommendation ?? '',
      language: parsed.language ?? 'en',
    } as TriageResult;
  } catch {
    return null;
  }
}

export function extractSpecialty(content: string): Specialty | null {
  const match = content.match(TRIAGE_JSON_REGEX);
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    return (parsed.specialty as Specialty) ?? null;
  } catch {
    return null;
  }
}

// Strip the JSON block from the display content
export function stripTriageJson(content: string): string {
  return content.replace(TRIAGE_JSON_REGEX, '').trim();
}
