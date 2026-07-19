// Clinical suggestion engine — bridges the disease KB and medicine registry
// to produce context-aware, contraindication-filtered suggestions.
// Ported from the CurePd Rx layer-2 engine.

import type { PatientRiskFlags } from '../../types/prescription';
import type {
  Disease,
  Medicine,
  MedicineSuggestion,
  MedicineValidation,
  MedicineWarning,
  SuggestionResult,
} from './engineTypes';
import { matchDiseases } from './diseases';
import { getMedicine, getMedicinesByCategory, isSafeFor } from './medicines';

export const EMPTY_RISK_FLAGS: PatientRiskFlags = {
  pregnancy: false,
  renal: false,
  hepatic: false,
  elderly: false,
  pediatric: false,
  asthma: false,
  pepticUlcer: false,
  dengue: false,
  ckd: false,
  heartDisease: false,
};

const EMPTY_RESULT: SuggestionResult = {
  diseases: [],
  suggestions: [],
  tests: [],
  advice: [],
  emergencyFlags: [],
  warnings: [],
};

/** Text-derived context the risk-factor toggles don't cover. */
interface EngineContext extends PatientRiskFlags {
  obesity: boolean;
  poorControl: boolean;
}

function buildEngineContext(
  diagnosis: string,
  complaint: string,
  flags: PatientRiskFlags,
): EngineContext {
  const combined = `${diagnosis || ''} ${complaint || ''}`.toLowerCase();
  return {
    ...flags,
    renal: flags.renal || combined.includes('kidney'),
    hepatic: flags.hepatic || combined.includes('liver') || combined.includes('hepatic'),
    asthma: flags.asthma || combined.includes('asthma'),
    pepticUlcer: flags.pepticUlcer || combined.includes('ulcer'),
    dengue: flags.dengue || combined.includes('dengue'),
    ckd: flags.ckd || combined.includes('ckd') || combined.includes('kidney disease'),
    heartDisease: flags.heartDisease || combined.includes('heart') || combined.includes('cardiac'),
    obesity: combined.includes('obese') || combined.includes('obesity'),
    poorControl: combined.includes('poor control') || combined.includes('uncontrolled'),
  };
}

function gatherCategories(disease: Disease, ctx: EngineContext, into: Set<string>): void {
  const cats = disease.categories;
  cats.firstLine.forEach((c) => into.add(c));

  const contextual = cats.contextual;
  if (contextual && ctx.pregnancy && contextual.pregnancy) {
    contextual.pregnancy.forEach((c) => into.add(c));
  } else if (contextual && ctx.ckd && contextual.withCKD) {
    contextual.withCKD.forEach((c) => into.add(c));
  } else if (contextual && ctx.elderly && contextual.elderly) {
    contextual.elderly.forEach((c) => into.add(c));
  } else if (contextual && ctx.heartDisease && contextual.withHeartDisease) {
    contextual.withHeartDisease.forEach((c) => into.add(c));
  } else if (contextual && ctx.obesity && contextual.obesity) {
    contextual.obesity.forEach((c) => into.add(c));
  } else if (contextual && ctx.asthma && contextual.asthma) {
    contextual.asthma.forEach((c) => into.add(c));
  } else {
    (cats.secondLine ?? []).forEach((c) => into.add(c));
  }
  if (ctx.poorControl) (cats.advanced ?? []).forEach((c) => into.add(c));
}

function gatherContraindicated(disease: Disease, ctx: EngineContext, into: Set<string>): void {
  disease.contraindicatedCategories.forEach((c) => into.add(c));
  const ctxContra = disease.contraindicatedContextual;
  if (!ctxContra) return;
  if (ctx.pregnancy) (ctxContra.pregnancy ?? []).forEach((c) => into.add(c));
  if (ctx.ckd) (ctxContra.ckd ?? []).forEach((c) => into.add(c));
  if (ctx.elderly) (ctxContra.elderly ?? []).forEach((c) => into.add(c));
  if (ctx.asthma) (ctxContra.asthma ?? []).forEach((c) => into.add(c));
  if (ctx.pepticUlcer) (ctxContra.pepticUlcer ?? []).forEach((c) => into.add(c));
  if (ctx.renal) (ctxContra.renal ?? []).forEach((c) => into.add(c));
}

export function getSuggestions(
  diagnosisText: string,
  complaintText: string,
  flags: PatientRiskFlags,
): SuggestionResult {
  const diseases = matchDiseases(diagnosisText, complaintText);
  if (!diseases.length) return EMPTY_RESULT;

  const ctx = buildEngineContext(diagnosisText, complaintText, flags);
  const categories = new Set<string>();
  const contraindicated = new Set<string>();
  const tests: string[] = [];
  const advice: string[] = [];
  const emergencyFlags: string[] = [];

  diseases.forEach((disease) => {
    gatherCategories(disease, ctx, categories);
    gatherContraindicated(disease, ctx, contraindicated);
    disease.tests.forEach((t) => { if (!tests.includes(t)) tests.push(t); });
    disease.advice.forEach((a) => { if (!advice.includes(a)) advice.push(a); });
    disease.emergencyFlags.forEach((f) => { if (!emergencyFlags.includes(f)) emergencyFlags.push(f); });
  });

  const suggestions: MedicineSuggestion[] = [];
  const added = new Set<string>();
  const warnings: string[] = [];

  categories.forEach((category) => {
    if (contraindicated.has(category)) return;
    getMedicinesByCategory(category).forEach((medicine) => {
      if (added.has(medicine.name)) return;
      added.add(medicine.name);
      const medWarnings = isSafeFor(medicine, ctx);
      suggestions.push({
        medicine,
        warnings: medWarnings,
        blocked: medWarnings.some((w) => w.level === 'danger'),
      });
      medWarnings.forEach((w) => warnings.push(`${medicine.name}: ${w.message}`));
    });
  });

  if (ctx.dengue) {
    warnings.unshift('DENGUE PROTOCOL: NSAIDs and Aspirin are contraindicated. Paracetamol only.');
  }

  // Safe options first, then cautioned, blocked last.
  suggestions.sort((a, b) => Number(a.blocked) - Number(b.blocked) || a.warnings.length - b.warnings.length);

  return {
    diseases: diseases.map((d) => ({
      key: d.key,
      displayName: d.displayName,
      icd10: d.icd10,
      note: d.note,
    })),
    suggestions: suggestions.slice(0, 10),
    tests: tests.slice(0, 8),
    advice: advice.slice(0, 6),
    emergencyFlags,
    warnings: [...new Set(warnings)],
  };
}

/** Validate a (possibly free-text) medicine name against the patient context. */
export function validateMedicineName(
  medicineName: string,
  diagnosisText: string,
  complaintText: string,
  flags: PatientRiskFlags,
): MedicineValidation | null {
  if (!medicineName || medicineName.trim().length < 2) return null;
  const ctx = buildEngineContext(diagnosisText, complaintText, flags);
  const med = getMedicine(medicineName);
  return {
    found: !!med,
    name: med ? med.name : medicineName,
    generic: med ? med.generic : null,
    category: med ? med.category : null,
    warnings: med ? isSafeFor(med, ctx) : [],
    caution: med ? med.caution : null,
    timing: med ? med.timing : null,
  };
}

/** Validate a known medicine object against the patient context. */
export function validateMedicine(
  medicine: Medicine,
  diagnosisText: string,
  complaintText: string,
  flags: PatientRiskFlags,
): MedicineWarning[] {
  const ctx = buildEngineContext(diagnosisText, complaintText, flags);
  return isSafeFor(medicine, ctx);
}
