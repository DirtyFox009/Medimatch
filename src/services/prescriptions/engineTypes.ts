// Clinical decision-support engine types.
// Ported from the CurePd Rx three-layer engine (medicine registry,
// disease knowledge base, suggestion engine).

import type { PatientRiskFlags } from '../../types/prescription';

export interface MedicineSafety {
  pregnancy: boolean;
  renal: boolean;
  hepatic: boolean;
  elderly: boolean;
  pediatric: boolean;
}

export interface Medicine {
  name: string;
  generic: string;
  category: string;
  brand: string;
  strength: string;
  safe: MedicineSafety;
  contraindications: string[];
  caution: string;
  timing: string;
  patientNote: string;
}

export interface DiseaseContextualCategories {
  pregnancy?: string[];
  withCKD?: string[];
  elderly?: string[];
  withHeartDisease?: string[];
  withHeartFailure?: string[];
  withDiabetes?: string[];
  obesity?: string[];
  asthma?: string[];
  allergic?: string[];
  poorControl?: string[];
}

export interface DiseaseCategories {
  /** Always suggested. Plain single-list diseases store their whole list here. */
  firstLine: string[];
  /** Added only when no contextual branch applies. */
  secondLine?: string[];
  /** Added only for poorly controlled disease. */
  advanced?: string[];
  contextual?: DiseaseContextualCategories;
}

export interface DiseaseContraindicatedContextual {
  pregnancy?: string[];
  ckd?: string[];
  elderly?: string[];
  asthma?: string[];
  pepticUlcer?: string[];
  renal?: string[];
  hyperkalemia?: string[];
}

export interface Disease {
  key: string;
  displayName: string;
  icd10: string;
  aliases: string[];
  symptoms: string[];
  categories: DiseaseCategories;
  contraindicatedCategories: string[];
  contraindicatedContextual?: DiseaseContraindicatedContextual;
  tests: string[];
  advice: string[];
  emergencyFlags: string[];
  note: string;
}

export interface MedicineWarning {
  /** danger = explicit contraindication for this patient; caution = flagged unsafe/adjust. */
  level: 'danger' | 'caution';
  message: string;
}

export interface MedicineSuggestion {
  medicine: Medicine;
  warnings: MedicineWarning[];
  /** True when any warning is danger-level. */
  blocked: boolean;
}

export interface DiseaseMatch {
  key: string;
  displayName: string;
  icd10: string;
  note: string;
}

export interface SuggestionResult {
  diseases: DiseaseMatch[];
  suggestions: MedicineSuggestion[];
  tests: string[];
  advice: string[];
  emergencyFlags: string[];
  /** Flattened "Medicine: warning" strings for banner display. */
  warnings: string[];
}

export interface MedicineValidation {
  found: boolean;
  name: string;
  generic: string | null;
  category: string | null;
  warnings: MedicineWarning[];
  caution: string | null;
  timing: string | null;
}

export type { PatientRiskFlags };
