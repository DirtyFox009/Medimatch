import type { TriageResult } from '../types/chat';

// ─── Adaptive guided-triage question engine (data only) ──────────────────────
// Each complaint gets its own ~7-8 step path (FLOWS) instead of one generic
// 12-question list. Red flags short-circuit to a deterministic emergency
// result without an LLM round-trip. Answers are always stored in English;
// bubbles display the chatLang label.

export interface QOption {
  en: string;
  bn: string;
  icon?: string; // Ionicons name — rendered on the q1 complaint chips
  exclusive?: boolean; // in multi-select, picking this clears all others
}

export interface QDef {
  key: string;
  text: { en: string; bn: string };
  options: QOption[] | ((answers: Record<string, string>) => QOption[]);
  multi?: boolean; // multi-select with a Done button
  freeText?: boolean; // renders the text input instead of pills
}

const NONE: QOption = { en: 'None of these', bn: 'কোনোটিই নয়', exclusive: true };

// Q2 sub-location options keyed by English q1 value
const Q2_OPTIONS: Record<string, QOption[]> = {
  Chest: [
    { en: 'Centre', bn: 'মাঝখানে' },
    { en: 'Left side', bn: 'বাম পাশে' },
    { en: 'Right side', bn: 'ডান পাশে' },
    { en: 'All over', bn: 'সব জায়গায়' },
  ],
  Stomach: [
    { en: 'Upper', bn: 'উপরে' },
    { en: 'Lower', bn: 'নিচে' },
    { en: 'Left side', bn: 'বাম পাশে' },
    { en: 'Right side', bn: 'ডান পাশে' },
  ],
  Head: [
    { en: 'Forehead', bn: 'কপালে' },
    { en: 'Back of head', bn: 'পেছনে' },
    { en: 'One side', bn: 'এক পাশে' },
    { en: 'All over', bn: 'সব জায়গায়' },
  ],
  Joints: [
    { en: 'Knee', bn: 'হাঁটু' },
    { en: 'Hip', bn: 'কোমর' },
    { en: 'Shoulder', bn: 'কাঁধ' },
    { en: 'Wrist', bn: 'কব্জি' },
    { en: 'Ankle', bn: 'গোড়ালি' },
  ],
};

const QUESTION_LIST: QDef[] = [
  {
    key: 'q1',
    text: { en: "What's bothering you most right now?", bn: 'এখন সবচেয়ে বেশি কোথায় সমস্যা হচ্ছে?' },
    options: [
      { en: 'Chest', bn: 'বুক', icon: 'pulse' },
      { en: 'Stomach', bn: 'পেট', icon: 'restaurant' },
      { en: 'Head', bn: 'মাথা', icon: 'person' },
      { en: 'Joints', bn: 'হাড়/গাঁট', icon: 'body' },
      { en: 'Skin', bn: 'চামড়া', icon: 'hand-left' },
      { en: 'Eyes', bn: 'চোখ', icon: 'eye' },
      { en: 'Throat', bn: 'গলা', icon: 'mic' },
      { en: 'Back', bn: 'পিঠ', icon: 'accessibility' },
      { en: 'Other', bn: 'অন্যান্য', icon: 'ellipsis-horizontal' },
    ],
  },
  {
    key: 'q2',
    text: { en: 'Where exactly?', bn: 'ঠিক কোথায়?' },
    options: (a) => Q2_OPTIONS[a.q1] ?? [],
  },
  {
    key: 'describe',
    text: { en: 'Briefly describe what is wrong', bn: 'সংক্ষেপে সমস্যাটি লিখুন' },
    options: [],
    freeText: true,
  },
  {
    key: 'duration',
    text: { en: 'How long has this been going on?', bn: 'কতদিন ধরে এই সমস্যা?' },
    options: [
      { en: 'Started today', bn: 'আজই শুরু' },
      { en: '2–3 days', bn: '২-৩ দিন' },
      { en: 'About a week', bn: 'প্রায় এক সপ্তাহ' },
      { en: 'More than a week', bn: 'এক সপ্তাহের বেশি' },
      { en: 'Over a month', bn: 'এক মাসের বেশি' },
    ],
  },
  {
    key: 'onset',
    text: { en: 'Did it start suddenly or gradually?', bn: 'হঠাৎ শুরু হয়েছে নাকি ধীরে ধীরে?' },
    options: [
      { en: 'Suddenly', bn: 'হঠাৎ' },
      { en: 'Gradually', bn: 'ধীরে ধীরে' },
      { en: 'Comes and goes', bn: 'আসে-যায়' },
    ],
  },
  {
    key: 'severity',
    text: { en: 'How bad does it feel?', bn: 'ব্যথা বা সমস্যা কতটা তীব্র?' },
    options: [
      { en: 'Mild (bearable)', bn: 'সামান্য (সহনীয়)' },
      { en: 'Moderate (distracting)', bn: 'মাঝারি (বিরক্তিকর)' },
      { en: 'Severe (unbearable)', bn: 'তীব্র (অসহনীয়)' },
    ],
  },
  {
    key: 'fever',
    text: { en: 'Any fever?', bn: 'জ্বর আছে কি?' },
    options: [
      { en: 'High fever', bn: 'বেশি জ্বর' },
      { en: 'Mild fever', bn: 'হালকা জ্বর' },
      { en: 'No fever', bn: 'জ্বর নেই' },
    ],
  },
  {
    key: 'spread',
    text: { en: 'Is it spreading?', bn: 'এটা কি ছড়াচ্ছে?' },
    options: [
      { en: 'Spreading fast', bn: 'দ্রুত ছড়াচ্ছে' },
      { en: 'Spreading slowly', bn: 'ধীরে ছড়াচ্ছে' },
      { en: 'Staying the same', bn: 'একই রকম আছে' },
      { en: 'Getting better', bn: 'কমছে' },
    ],
  },
  {
    key: 'history',
    text: { en: 'Have you had this before?', bn: 'আগে এরকম হয়েছিল?' },
    options: [
      { en: 'Yes same thing', bn: 'হ্যাঁ একই রকম' },
      { en: 'Yes but different', bn: 'হ্যাঁ কিন্তু আলাদা' },
      { en: 'No first time', bn: 'না এই প্রথম' },
    ],
  },
  // Complaint-specific associated symptoms (multi-select)
  {
    key: 'assoc_chest',
    text: { en: 'Any of these along with it?', bn: 'এর সাথে আর কিছু আছে?' },
    multi: true,
    options: [
      { en: 'Shortness of breath', bn: 'শ্বাসকষ্ট' },
      { en: 'Palpitations', bn: 'বুক ধড়ফড়' },
      { en: 'Sweating', bn: 'ঘাম হওয়া' },
      { en: 'Pain spreading to arm or jaw', bn: 'হাত বা চোয়ালে ব্যথা ছড়ানো' },
      NONE,
    ],
  },
  {
    key: 'assoc_head',
    text: { en: 'Any of these along with it?', bn: 'এর সাথে আর কিছু আছে?' },
    multi: true,
    options: [
      { en: 'Vision changes', bn: 'দৃষ্টিতে সমস্যা' },
      { en: 'Vomiting', bn: 'বমি' },
      { en: 'Neck stiffness', bn: 'ঘাড় শক্ত হওয়া' },
      { en: 'Weakness on one side', bn: 'এক পাশে দুর্বলতা' },
      { en: 'Difficulty speaking', bn: 'কথা বলতে সমস্যা' },
      NONE,
    ],
  },
  {
    key: 'assoc_stomach',
    text: { en: 'Any of these along with it?', bn: 'এর সাথে আর কিছু আছে?' },
    multi: true,
    options: [
      { en: 'Nausea or vomiting', bn: 'বমি বমি ভাব বা বমি' },
      { en: 'Diarrhea', bn: 'ডায়রিয়া' },
      { en: 'Blood in stool or vomit', bn: 'পায়খানা বা বমিতে রক্ত' },
      { en: 'Bloating', bn: 'পেট ফাঁপা' },
      NONE,
    ],
  },
  {
    key: 'assoc_skin',
    text: { en: 'Any of these along with it?', bn: 'এর সাথে আর কিছু আছে?' },
    multi: true,
    options: [
      { en: 'Itching', bn: 'চুলকানি' },
      { en: 'Blisters or pus', bn: 'ফোসকা বা পুঁজ' },
      { en: 'Swelling', bn: 'ফোলা' },
      { en: 'Pain or burning', bn: 'ব্যথা বা জ্বালা' },
      NONE,
    ],
  },
  {
    key: 'assoc_eyes',
    text: { en: 'Any of these along with it?', bn: 'এর সাথে আর কিছু আছে?' },
    multi: true,
    options: [
      { en: 'Redness', bn: 'লাল হওয়া' },
      { en: 'Discharge', bn: 'পানি বা ময়লা পড়া' },
      { en: 'Blurred vision', bn: 'ঝাপসা দেখা' },
      { en: 'Light sensitivity', bn: 'আলোতে অস্বস্তি' },
      NONE,
    ],
  },
  {
    key: 'assoc_throat',
    text: { en: 'Any of these along with it?', bn: 'এর সাথে আর কিছু আছে?' },
    multi: true,
    options: [
      { en: 'Difficulty swallowing', bn: 'গিলতে কষ্ট' },
      { en: 'Hoarse voice', bn: 'গলা ভাঙা' },
      { en: 'Swollen glands', bn: 'গ্রন্থি ফোলা' },
      { en: 'Cough', bn: 'কাশি' },
      NONE,
    ],
  },
  {
    key: 'assoc_joints',
    text: { en: 'Any of these along with it?', bn: 'এর সাথে আর কিছু আছে?' },
    multi: true,
    options: [
      { en: 'Swelling', bn: 'ফোলা' },
      { en: 'Redness or warmth', bn: 'লাল বা গরম ভাব' },
      { en: 'Morning stiffness', bn: 'সকালে শক্ত ভাব' },
      { en: 'Difficulty moving', bn: 'নড়াতে কষ্ট' },
      NONE,
    ],
  },
  {
    key: 'assoc_back',
    text: { en: 'Any of these along with it?', bn: 'এর সাথে আর কিছু আছে?' },
    multi: true,
    options: [
      { en: 'Pain going down the leg', bn: 'পা পর্যন্ত ব্যথা' },
      { en: 'Numbness or tingling', bn: 'অবশ বা ঝিনঝিন ভাব' },
      { en: 'Difficulty urinating', bn: 'প্রস্রাবে সমস্যা' },
      { en: 'Weakness in legs', bn: 'পায়ে দুর্বলতা' },
      NONE,
    ],
  },
  {
    key: 'assoc_general',
    text: { en: 'Any of these along with it?', bn: 'এর সাথে আর কিছু আছে?' },
    multi: true,
    options: [
      { en: 'Fever', bn: 'জ্বর' },
      { en: 'Nausea or vomiting', bn: 'বমি বমি ভাব বা বমি' },
      { en: 'Fatigue or weakness', bn: 'দুর্বলতা বা ক্লান্তি' },
      { en: 'Dizziness', bn: 'মাথা ঘোরা' },
      { en: 'Shortness of breath', bn: 'শ্বাসকষ্ট' },
      NONE,
    ],
  },
  {
    key: 'conditions',
    text: { en: 'Any existing medical conditions?', bn: 'কোনো পুরনো রোগ আছে?' },
    multi: true,
    options: [
      { en: 'Diabetes', bn: 'ডায়াবেটিস' },
      { en: 'Hypertension', bn: 'উচ্চ রক্তচাপ' },
      { en: 'Heart disease', bn: 'হৃদরোগ' },
      { en: 'Asthma', bn: 'হাঁপানি' },
      { en: 'Kidney disease', bn: 'কিডনি রোগ' },
      { en: 'None', bn: 'কোনোটিই না', exclusive: true },
    ],
  },
  {
    key: 'meds',
    text: { en: 'Any medications currently?', bn: 'এখন কোনো ওষুধ খাচ্ছেন?' },
    options: [
      { en: 'Yes painkillers', bn: 'হ্যাঁ ব্যথার ওষুধ' },
      { en: 'Yes prescription meds', bn: 'হ্যাঁ ডাক্তারের ওষুধ' },
      { en: 'No medications', bn: 'না কোনো ওষুধ নেই' },
    ],
  },
];

export const QUESTION_MAP: Record<string, QDef> = Object.fromEntries(
  QUESTION_LIST.map((q) => [q.key, q]),
);

// Per-complaint question paths (~7-8 steps, all include q1 as step 1)
export const FLOWS: Record<string, string[]> = {
  Chest: ['q1', 'q2', 'duration', 'onset', 'severity', 'assoc_chest', 'conditions', 'meds'],
  Stomach: ['q1', 'q2', 'duration', 'severity', 'assoc_stomach', 'fever', 'conditions', 'meds'],
  Head: ['q1', 'q2', 'duration', 'onset', 'severity', 'assoc_head', 'conditions', 'meds'],
  Joints: ['q1', 'q2', 'duration', 'severity', 'assoc_joints', 'history', 'conditions', 'meds'],
  Skin: ['q1', 'duration', 'spread', 'assoc_skin', 'fever', 'conditions', 'meds'],
  Eyes: ['q1', 'duration', 'severity', 'assoc_eyes', 'history', 'conditions', 'meds'],
  Throat: ['q1', 'duration', 'fever', 'assoc_throat', 'severity', 'conditions', 'meds'],
  Back: ['q1', 'duration', 'onset', 'severity', 'assoc_back', 'conditions', 'meds'],
  Other: ['q1', 'describe', 'duration', 'severity', 'assoc_general', 'conditions', 'meds'],
};

export function resolveOptions(q: QDef, answers: Record<string, string>): QOption[] {
  return typeof q.options === 'function' ? q.options(answers) : q.options;
}

// ─── Red flags: deterministic emergency short-circuit ────────────────────────

interface RedFlag {
  when: (a: Record<string, string>) => boolean;
  reason: { en: string; bn: string };
}

const has = (a: Record<string, string>, key: string, value: string) =>
  (a[key] ?? '').includes(value);

export const RED_FLAGS: RedFlag[] = [
  {
    when: (a) => a.q1 === 'Chest' && has(a, 'severity', 'Severe'),
    reason: {
      en: 'Severe chest pain can be serious. Please seek emergency care immediately.',
      bn: 'বুকের তীব্র ব্যথা গুরুতর হতে পারে। এখনই জরুরি চিকিৎসা নিন।',
    },
  },
  {
    when: (a) =>
      has(a, 'assoc_chest', 'Shortness of breath') ||
      has(a, 'assoc_chest', 'Pain spreading to arm or jaw'),
    reason: {
      en: 'Chest problems with breathlessness or spreading pain need emergency care right now.',
      bn: 'শ্বাসকষ্ট বা ছড়ানো ব্যথাসহ বুকের সমস্যায় এখনই জরুরি চিকিৎসা দরকার।',
    },
  },
  {
    when: (a) =>
      has(a, 'assoc_head', 'Weakness on one side') || has(a, 'assoc_head', 'Difficulty speaking'),
    reason: {
      en: 'These symptoms may indicate a stroke. Emergency care is needed right now.',
      bn: 'এই লক্ষণগুলো স্ট্রোকের ইঙ্গিত হতে পারে। এখনই জরুরি চিকিৎসা দরকার।',
    },
  },
  {
    when: (a) => a.q1 === 'Head' && has(a, 'onset', 'Suddenly') && has(a, 'severity', 'Severe'),
    reason: {
      en: 'A sudden, severe headache needs emergency evaluation.',
      bn: 'হঠাৎ তীব্র মাথাব্যথায় জরুরি চিকিৎসা দরকার।',
    },
  },
  {
    when: (a) => has(a, 'assoc_stomach', 'Blood in stool or vomit'),
    reason: {
      en: 'Blood in stool or vomit needs urgent medical attention.',
      bn: 'পায়খানা বা বমিতে রক্ত থাকলে দ্রুত চিকিৎসা দরকার।',
    },
  },
  {
    when: (a) =>
      has(a, 'assoc_back', 'Difficulty urinating') || has(a, 'assoc_back', 'Weakness in legs'),
    reason: {
      en: 'Back pain with these symptoms needs urgent evaluation.',
      bn: 'এই লক্ষণসহ পিঠে ব্যথার জন্য দ্রুত ডাক্তারি পরীক্ষা দরকার।',
    },
  },
  {
    when: (a) => has(a, 'assoc_general', 'Shortness of breath'),
    reason: {
      en: 'Shortness of breath needs urgent medical attention.',
      bn: 'শ্বাসকষ্ট হলে দ্রুত জরুরি চিকিৎসা দরকার।',
    },
  },
];

export function checkRedFlags(answers: Record<string, string>): RedFlag | null {
  return RED_FLAGS.find((f) => f.when(answers)) ?? null;
}

export function buildEmergencyResult(lang: 'en' | 'bn'): TriageResult {
  return {
    severity: 'Severe',
    conditions: [],
    firstAid:
      lang === 'bn'
        ? 'শান্ত থাকুন এবং পরিশ্রম এড়িয়ে চলুন। কিছু খাবেন না বা পান করবেন না। সাহায্য না আসা পর্যন্ত কাউকে সাথে রাখুন।'
        : 'Stay calm and avoid exertion. Do not eat or drink anything. Keep someone with you until help arrives.',
    recommendation:
      lang === 'bn'
        ? 'এখনই নিকটতম জরুরি বিভাগে যান অথবা ৯৯৯ নম্বরে কল করুন।'
        : 'Go to the nearest emergency department or call 999 immediately.',
    language: lang,
  };
}

// ─── Summary sent to the LLM ─────────────────────────────────────────────────

const SUMMARY_LABELS: Record<string, string> = {
  q1: 'Main complaint',
  q2: 'Location',
  describe: 'Patient description',
  duration: 'Duration',
  onset: 'Onset',
  severity: 'Severity',
  fever: 'Fever',
  spread: 'Spread',
  history: 'Previous episodes',
  assoc_chest: 'Associated symptoms',
  assoc_head: 'Associated symptoms',
  assoc_stomach: 'Associated symptoms',
  assoc_skin: 'Associated symptoms',
  assoc_eyes: 'Associated symptoms',
  assoc_throat: 'Associated symptoms',
  assoc_joints: 'Associated symptoms',
  assoc_back: 'Associated symptoms',
  assoc_general: 'Associated symptoms',
  conditions: 'Existing conditions',
  meds: 'Medications',
};

// Answers stay English regardless of chatLang; the parenthesised directive
// tells the model which language to respond in (see STRUCTURED INTAKE rule
// in the system prompt).
export function buildSummary(
  answers: Record<string, string>,
  path: string[],
  lang: 'en' | 'bn',
): string {
  const lines = path
    .filter((key) => answers[key])
    .map((key) => `${SUMMARY_LABELS[key] ?? key}: ${answers[key]}.`);
  return `STRUCTURED INTAKE (respond in ${lang === 'bn' ? 'Bengali' : 'English'}): ${lines.join(' ')}`;
}
