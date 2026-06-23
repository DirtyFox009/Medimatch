import Groq from 'groq-sdk';
import { CONFIG } from '../../constants/config';

export const groq = new Groq({
  apiKey: CONFIG.groqApiKey,
  dangerouslyAllowBrowser: true,
});

export const GROQ_MODEL = 'llama-3.3-70b-versatile';
