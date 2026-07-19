// Medicine registry — Bangladeshi brands with generic names, categories and
// per-condition safety flags. Ported from the CurePd Rx layer-0 dataset.

import type { Medicine, MedicineWarning, PatientRiskFlags } from './engineTypes';

export const MEDICINES: Medicine[] = [
  // ── Analgesics / antipyretics ─────────────────────────────
  {
    name: 'Napa 500mg', generic: 'Paracetamol 500mg', category: 'Analgesic/Antipyretic',
    brand: 'Napa', strength: '500mg',
    safe: { pregnancy: true, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Severe hepatic impairment'],
    caution: 'Do not exceed 4g/day. Avoid alcohol.',
    timing: 'After meal', patientNote: 'Reduces fever and relieves mild to moderate pain.',
  },
  {
    name: 'Napa Extra', generic: 'Paracetamol + Caffeine', category: 'Analgesic/Antipyretic',
    brand: 'Napa Extra', strength: '500mg+65mg',
    safe: { pregnancy: false, renal: true, hepatic: false, elderly: false, pediatric: false },
    contraindications: ['Pregnancy', 'Severe hepatic impairment'],
    caution: 'Avoid in pregnancy. Contains caffeine — may cause insomnia.',
    timing: 'After meal', patientNote: 'Stronger pain relief. Contains caffeine.',
  },
  {
    name: 'Ace 500mg', generic: 'Paracetamol 500mg', category: 'Analgesic/Antipyretic',
    brand: 'Ace', strength: '500mg',
    safe: { pregnancy: true, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Severe hepatic impairment'],
    caution: 'Same as Napa — paracetamol brand.',
    timing: 'After meal', patientNote: 'Reduces fever and pain.',
  },
  {
    name: 'Ibupax 400mg', generic: 'Ibuprofen 400mg', category: 'NSAID',
    brand: 'Ibupax', strength: '400mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: false, pediatric: false },
    contraindications: ['Pregnancy (3rd trimester)', 'Renal impairment', 'Peptic ulcer', 'Dengue'],
    caution: 'AVOID in dengue — increases bleeding risk. Avoid in pregnancy.',
    timing: 'After meal', patientNote: 'Reduces pain and inflammation. Take with food.',
  },
  {
    name: 'Voltaren 50mg', generic: 'Diclofenac 50mg', category: 'NSAID',
    brand: 'Voltaren', strength: '50mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: false, pediatric: false },
    contraindications: ['Pregnancy', 'Renal impairment', 'Peptic ulcer'],
    caution: 'Monitor renal function in long-term use.',
    timing: 'After meal', patientNote: 'Reduces joint and muscle pain.',
  },
  {
    name: 'Mefenamic Acid 500mg', generic: 'Mefenamic Acid 500mg', category: 'NSAID',
    brand: 'Ponstan', strength: '500mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: false, pediatric: false },
    contraindications: ['Pregnancy', 'Renal impairment'],
    caution: 'Short-term use only.',
    timing: 'After meal', patientNote: 'For pain and menstrual cramps.',
  },
  {
    name: 'Tramadol 50mg', generic: 'Tramadol HCl 50mg', category: 'Opioid Analgesic',
    brand: 'Tramadol', strength: '50mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: false, pediatric: false },
    contraindications: ['Pregnancy', 'Renal/hepatic impairment', 'Seizure disorder'],
    caution: 'Risk of dependence. Short-term only.',
    timing: 'After meal', patientNote: 'Strong pain reliever. Do not drive.',
  },

  // ── Antibiotics ───────────────────────────────────────────
  {
    name: 'Azithromycin 500mg', generic: 'Azithromycin 500mg', category: 'Macrolide Antibiotic',
    brand: 'Zithromax/Zimax', strength: '500mg',
    safe: { pregnancy: true, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Severe hepatic impairment', 'QT prolongation'],
    caution: 'Complete full course. Once daily.',
    timing: 'Before meal', patientNote: 'Kills bacteria. Take full 3-5 day course.',
  },
  {
    name: 'Amoxicillin 500mg', generic: 'Amoxicillin 500mg', category: 'Penicillin Antibiotic',
    brand: 'Moxacil/Amoxil', strength: '500mg',
    safe: { pregnancy: true, renal: true, hepatic: true, elderly: true, pediatric: false },
    contraindications: ['Penicillin allergy'],
    caution: 'Check penicillin allergy before prescribing.',
    timing: 'After meal', patientNote: 'Antibiotic for infections. Complete the course.',
  },
  {
    name: 'Amoxicillin + Clavulanate 625mg', generic: 'Co-amoxiclav 625mg', category: 'Penicillin Antibiotic',
    brand: 'Augmentin/Moxaclav', strength: '625mg',
    safe: { pregnancy: true, renal: false, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Penicillin allergy', 'Renal impairment (adjust dose)'],
    caution: 'Broader spectrum than amoxicillin alone.',
    timing: 'After meal', patientNote: 'Strong antibiotic. Complete the full course.',
  },
  {
    name: 'Ciprofloxacin 500mg', generic: 'Ciprofloxacin 500mg', category: 'Fluoroquinolone Antibiotic',
    brand: 'Ciprocin/Ciplox', strength: '500mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: false, pediatric: false },
    contraindications: ['Pregnancy', 'Children under 18', 'Tendinopathy history'],
    caution: 'Avoid dairy 2h before/after. Risk of tendon rupture in elderly.',
    timing: 'After meal', patientNote: 'Antibiotic. Avoid milk around dose time.',
  },
  {
    name: 'Levofloxacin 500mg', generic: 'Levofloxacin 500mg', category: 'Fluoroquinolone Antibiotic',
    brand: 'Levox/Levoday', strength: '500mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: false, pediatric: false },
    contraindications: ['Pregnancy', 'Children', 'QT prolongation'],
    caution: 'Once daily dosing. Monitor QT interval.',
    timing: 'After meal', patientNote: 'Antibiotic. Take once daily.',
  },
  {
    name: 'Cefixime 200mg', generic: 'Cefixime 200mg', category: 'Cephalosporin Antibiotic',
    brand: 'Cef-3/Cefim', strength: '200mg',
    safe: { pregnancy: true, renal: false, hepatic: true, elderly: true, pediatric: false },
    contraindications: ['Cephalosporin allergy', 'Severe renal impairment'],
    caution: 'Reduce dose in renal impairment.',
    timing: 'After meal', patientNote: 'Antibiotic for urinary and respiratory infections.',
  },
  {
    name: 'Doxycycline 100mg', generic: 'Doxycycline 100mg', category: 'Tetracycline Antibiotic',
    brand: 'Doxin', strength: '100mg',
    safe: { pregnancy: false, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Pregnancy', 'Children under 8'],
    caution: 'Take with full glass of water. Avoid sun exposure.',
    timing: 'After meal', patientNote: 'Antibiotic. Take with water, avoid lying down.',
  },
  {
    name: 'Metronidazole 400mg', generic: 'Metronidazole 400mg', category: 'Antiprotozoal/Antibiotic',
    brand: 'Amodis/Flagyl', strength: '400mg',
    safe: { pregnancy: false, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['1st trimester pregnancy'],
    caution: 'STRICTLY avoid alcohol. Metallic taste common.',
    timing: 'After meal', patientNote: 'STRICTLY avoid alcohol during treatment.',
  },
  {
    name: 'Cefalexin 500mg', generic: 'Cefalexin 500mg', category: 'Cephalosporin Antibiotic',
    brand: 'Cefalexin', strength: '500mg',
    safe: { pregnancy: true, renal: false, hepatic: true, elderly: true, pediatric: false },
    contraindications: ['Cephalosporin allergy'],
    caution: 'Adjust dose in renal impairment.',
    timing: 'After meal', patientNote: 'Antibiotic for skin and soft tissue infections.',
  },
  {
    name: 'Clarithromycin 500mg', generic: 'Clarithromycin 500mg', category: 'Macrolide Antibiotic',
    brand: 'Klaricid', strength: '500mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Pregnancy', 'QT prolongation', 'Severe renal/hepatic'],
    caution: 'Used in H. Pylori triple therapy.',
    timing: 'After meal', patientNote: 'Antibiotic. Take with food.',
  },

  // ── GI / antacids ─────────────────────────────────────────
  {
    name: 'Omeprazole 20mg', generic: 'Omeprazole 20mg', category: 'PPI',
    brand: 'Losectil/Seclo', strength: '20mg',
    safe: { pregnancy: true, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Severe hepatic impairment'],
    caution: 'Take 30 min before breakfast. Long-term use may reduce B12/Mg.',
    timing: 'Before meal', patientNote: 'Reduces stomach acid. Take 30 min before eating.',
  },
  {
    name: 'Pantoprazole 40mg', generic: 'Pantoprazole 40mg', category: 'PPI',
    brand: 'Pantonix/Pantocid', strength: '40mg',
    safe: { pregnancy: true, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Severe hepatic impairment'],
    caution: 'Take before breakfast.',
    timing: 'Before meal', patientNote: 'Reduces acid. Take 30-60 min before eating.',
  },
  {
    name: 'Esomeprazole 40mg', generic: 'Esomeprazole 40mg', category: 'PPI',
    brand: 'Nexum', strength: '40mg',
    safe: { pregnancy: true, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Severe hepatic impairment'],
    caution: 'Most potent PPI. Before breakfast.',
    timing: 'Before meal', patientNote: 'Strong acid reducer. Take before breakfast.',
  },
  {
    name: 'Domperidone 10mg', generic: 'Domperidone 10mg', category: 'Antiemetic/Prokinetic',
    brand: 'Dominol/Motilium', strength: '10mg',
    safe: { pregnancy: false, renal: true, hepatic: false, elderly: false, pediatric: false },
    contraindications: ['Cardiac disease (QT prolongation)', 'Hepatic impairment'],
    caution: 'Short-term use. Caution in elderly cardiac patients.',
    timing: 'Before meal', patientNote: 'Reduces nausea and bloating. Take before meals.',
  },
  {
    name: 'Ondansetron 4mg', generic: 'Ondansetron 4mg', category: 'Antiemetic',
    brand: 'Onset/Emeset', strength: '4mg',
    safe: { pregnancy: true, renal: true, hepatic: false, elderly: true, pediatric: true },
    contraindications: ['QT prolongation', 'Severe hepatic impairment'],
    caution: 'Best antiemetic for chemotherapy/severe vomiting.',
    timing: 'Before meal', patientNote: 'Stops vomiting. Can dissolve under tongue.',
  },
  {
    name: 'Loperamide 2mg', generic: 'Loperamide 2mg', category: 'Antidiarrheal',
    brand: 'Imodium', strength: '2mg',
    safe: { pregnancy: false, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Bloody diarrhea', 'Antibiotic-associated colitis'],
    caution: 'Do NOT use in bloody diarrhea or fever with diarrhea.',
    timing: 'After meal', patientNote: 'Controls diarrhea. Do not take for bloody stools.',
  },
  {
    name: 'ORS Saline', generic: 'Oral Rehydration Salt', category: 'Rehydration',
    brand: 'ORS', strength: 'Standard WHO formula',
    safe: { pregnancy: true, renal: false, hepatic: true, elderly: true, pediatric: true },
    contraindications: ['Renal failure (use with caution)'],
    caution: 'Essential in diarrhea/vomiting. Dissolve 1 sachet in 250ml water.',
    timing: 'Anytime', patientNote: 'Dissolve in water. Drink small sips frequently.',
  },
  {
    name: 'Zinc 20mg', generic: 'Zinc Sulfate 20mg', category: 'Mineral/Supplement',
    brand: 'Zin/Zinco', strength: '20mg',
    safe: { pregnancy: true, renal: true, hepatic: true, elderly: true, pediatric: true },
    contraindications: [],
    caution: 'Essential in diarrhea management in children.',
    timing: 'After meal', patientNote: 'Boosts immunity and reduces diarrhea duration.',
  },

  // ── Respiratory ───────────────────────────────────────────
  {
    name: 'Cetirizine 10mg', generic: 'Cetirizine HCl 10mg', category: 'Antihistamine',
    brand: 'Actin/Cetrin', strength: '10mg',
    safe: { pregnancy: false, renal: false, hepatic: true, elderly: false, pediatric: false },
    contraindications: ['Renal impairment (reduce dose)'],
    caution: 'May cause drowsiness. Avoid driving. Reduce dose in renal failure.',
    timing: 'Night time', patientNote: 'Relieves allergy and itching. May cause drowsiness.',
  },
  {
    name: 'Fexofenadine 120mg', generic: 'Fexofenadine 120mg', category: 'Antihistamine',
    brand: 'Histacin/Fexo', strength: '120mg',
    safe: { pregnancy: false, renal: false, hepatic: true, elderly: true, pediatric: false },
    contraindications: ['Renal impairment (adjust dose)'],
    caution: 'Non-sedating. Preferred for daytime use.',
    timing: 'Morning', patientNote: 'Allergy relief. Non-drowsy, safe for daytime.',
  },
  {
    name: 'Loratadine 10mg', generic: 'Loratadine 10mg', category: 'Antihistamine',
    brand: 'Loratin/Alavert', strength: '10mg',
    safe: { pregnancy: true, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Severe hepatic impairment'],
    caution: 'Non-sedating antihistamine. Once daily.',
    timing: 'Morning', patientNote: 'Allergy relief. Non-drowsy.',
  },
  {
    name: 'Salbutamol 2mg', generic: 'Salbutamol Sulfate 2mg', category: 'Short-Acting Beta Agonist',
    brand: 'Ventolin tablet', strength: '2mg',
    safe: { pregnancy: true, renal: true, hepatic: true, elderly: false, pediatric: false },
    contraindications: ['Severe cardiac disease'],
    caution: 'Tachycardia possible. Prefer inhaler route.',
    timing: 'After meal', patientNote: 'Opens airways. May cause mild tremor.',
  },
  {
    name: 'Ventolin Inhaler', generic: 'Salbutamol Inhaler 100mcg/dose', category: 'Short-Acting Beta Agonist',
    brand: 'Ventolin', strength: '100mcg/puff',
    safe: { pregnancy: true, renal: true, hepatic: true, elderly: true, pediatric: true },
    contraindications: [],
    caution: 'Shake before use. 2 puffs as needed. Rinse mouth after.',
    timing: 'As needed', patientNote: 'Shake inhaler. 2 puffs when breathless. Rinse mouth after.',
  },
  {
    name: 'Montelukast 10mg', generic: 'Montelukast Sodium 10mg', category: 'Leukotriene Receptor Antagonist',
    brand: 'Singulair/Monlucast', strength: '10mg',
    safe: { pregnancy: true, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Severe hepatic impairment'],
    caution: 'Take at night. Monitor for mood changes.',
    timing: 'Night time', patientNote: 'Prevents asthma. Take every night consistently.',
  },
  {
    name: 'Ambroxol 30mg', generic: 'Ambroxol HCl 30mg', category: 'Mucolytic',
    brand: 'Mucosolvan/Ambrox', strength: '30mg',
    safe: { pregnancy: false, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['1st trimester pregnancy'],
    caution: 'Helps loosen mucus. Take with plenty of fluids.',
    timing: 'After meal', patientNote: 'Loosens thick mucus. Drink plenty of water.',
  },
  {
    name: 'Budecort Inhaler', generic: 'Budesonide 200mcg/dose', category: 'Inhaled Corticosteroid',
    brand: 'Budecort/Pulmicort', strength: '200mcg/puff',
    safe: { pregnancy: true, renal: true, hepatic: true, elderly: true, pediatric: true },
    contraindications: [],
    caution: 'Rinse mouth after use to prevent thrush. Regular controller.',
    timing: 'Regular - twice daily', patientNote: 'Controller inhaler. Use every day. RINSE MOUTH after.',
  },

  // ── Cardiovascular ────────────────────────────────────────
  {
    name: 'Amlodipine 5mg', generic: 'Amlodipine Besylate 5mg', category: 'Calcium Channel Blocker',
    brand: 'Amdocal/Stamlo', strength: '5mg',
    safe: { pregnancy: false, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Pregnancy (2nd/3rd trimester)', 'Severe hepatic impairment'],
    caution: 'Ankle edema common. Preferred CCB in CKD.',
    timing: 'Anytime', patientNote: 'Lowers blood pressure. May cause ankle swelling.',
  },
  {
    name: 'Amlodipine 10mg', generic: 'Amlodipine Besylate 10mg', category: 'Calcium Channel Blocker',
    brand: 'Amdocal/Stamlo', strength: '10mg',
    safe: { pregnancy: false, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Pregnancy', 'Severe hepatic impairment'],
    caution: 'Higher dose — monitor for edema.',
    timing: 'Anytime', patientNote: 'Blood pressure medicine. Take daily.',
  },
  {
    name: 'Atenolol 50mg', generic: 'Atenolol 50mg', category: 'Beta Blocker',
    brand: 'Tenolol/Aten', strength: '50mg',
    safe: { pregnancy: false, renal: false, hepatic: true, elderly: false, pediatric: false },
    contraindications: ['Pregnancy', 'Asthma/COPD', 'Renal impairment', 'Heart block'],
    caution: 'AVOID in asthma. AVOID in pregnancy. Do not stop suddenly.',
    timing: 'Morning', patientNote: 'Heart/BP medicine. Never stop suddenly without doctor.',
  },
  {
    name: 'Metoprolol 50mg', generic: 'Metoprolol Succinate 50mg', category: 'Beta Blocker',
    brand: 'Betaloc', strength: '50mg',
    safe: { pregnancy: false, renal: true, hepatic: false, elderly: false, pediatric: false },
    contraindications: ['Asthma/COPD', 'Heart block', 'Pregnancy'],
    caution: 'More cardioselective than atenolol. Do not stop abruptly.',
    timing: 'Morning', patientNote: 'Heart medicine. Never stop abruptly.',
  },
  {
    name: 'Losartan 50mg', generic: 'Losartan Potassium 50mg', category: 'ARB',
    brand: 'Losaten/Cozaar', strength: '50mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Pregnancy', 'Bilateral renal artery stenosis', 'Hyperkalemia'],
    caution: 'AVOID in pregnancy. Monitor potassium and creatinine.',
    timing: 'Anytime', patientNote: 'Blood pressure medicine. Check potassium regularly.',
  },
  {
    name: 'Losartan 100mg', generic: 'Losartan Potassium 100mg', category: 'ARB',
    brand: 'Losaten/Cozaar', strength: '100mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Pregnancy', 'Hyperkalemia'],
    caution: 'Higher dose. Monitor BP and renal function.',
    timing: 'Anytime', patientNote: 'Blood pressure medicine.',
  },
  {
    name: 'Ramipril 5mg', generic: 'Ramipril 5mg', category: 'ACE Inhibitor',
    brand: 'Ramace/Tritace', strength: '5mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Pregnancy', 'Bilateral renal artery stenosis', 'Angioedema history'],
    caution: 'Dry cough common side effect. AVOID in pregnancy.',
    timing: 'Anytime', patientNote: 'BP/heart medicine. Report persistent dry cough.',
  },
  {
    name: 'Enalapril 5mg', generic: 'Enalapril Maleate 5mg', category: 'ACE Inhibitor',
    brand: 'Renitec/Enas', strength: '5mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Pregnancy', 'Angioedema history'],
    caution: 'Dry cough. Monitor renal function.',
    timing: 'Anytime', patientNote: 'Blood pressure/heart medicine.',
  },
  {
    name: 'Aspirin 75mg', generic: 'Aspirin 75mg', category: 'Antiplatelet',
    brand: 'Ecosprin/Cardiprin', strength: '75mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Pregnancy', 'Peptic ulcer', 'Bleeding disorders', 'Dengue'],
    caution: 'AVOID in dengue. Take after food.',
    timing: 'After meal', patientNote: 'Prevents blood clots. Take with food. Avoid if stomach ulcer.',
  },
  {
    name: 'Atorvastatin 20mg', generic: 'Atorvastatin Calcium 20mg', category: 'Statin',
    brand: 'Lipitor/Atorva', strength: '20mg',
    safe: { pregnancy: false, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Pregnancy', 'Active liver disease'],
    caution: 'Report muscle pain. Take at night for best effect.',
    timing: 'Night time', patientNote: 'Lowers cholesterol. Take at night. Report muscle pain.',
  },
  {
    name: 'Rosuvastatin 10mg', generic: 'Rosuvastatin Calcium 10mg', category: 'Statin',
    brand: 'Crestor/Rosuva', strength: '10mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Pregnancy', 'Active liver disease', 'Severe renal impairment'],
    caution: 'More potent statin. Evening dose preferred.',
    timing: 'Night time', patientNote: 'Lowers cholesterol. Take at night.',
  },
  {
    name: 'Furosemide 40mg', generic: 'Furosemide 40mg', category: 'Loop Diuretic',
    brand: 'Lasix', strength: '40mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: false, pediatric: false },
    contraindications: ['Anuria', 'Severe electrolyte depletion'],
    caution: 'Monitor electrolytes. Take in morning to avoid night urination.',
    timing: 'Morning', patientNote: 'Water tablet. Take in morning. Monitor potassium.',
  },

  // ── Diabetes ──────────────────────────────────────────────
  {
    name: 'Metformin 500mg', generic: 'Metformin HCl 500mg', category: 'Biguanide Antidiabetic',
    brand: 'Glucomin/Metforal', strength: '500mg',
    safe: { pregnancy: true, renal: false, hepatic: false, elderly: false, pediatric: false },
    contraindications: ['eGFR < 30', 'Hepatic impairment', 'Contrast procedure (hold 48h)'],
    caution: 'HOLD before contrast/surgery. Monitor renal function. GI side effects common initially.',
    timing: 'After meal', patientNote: 'Diabetes medicine. Take with food. Common to have stomach upset initially.',
  },
  {
    name: 'Metformin 1000mg', generic: 'Metformin HCl 1000mg', category: 'Biguanide Antidiabetic',
    brand: 'Glucomin/Metforal', strength: '1000mg',
    safe: { pregnancy: true, renal: false, hepatic: false, elderly: false, pediatric: false },
    contraindications: ['eGFR < 30', 'Hepatic impairment'],
    caution: 'Higher dose. GI effects more common.',
    timing: 'After meal', patientNote: 'Diabetes medicine. Take with food.',
  },
  {
    name: 'Gliclazide 80mg', generic: 'Gliclazide 80mg', category: 'Sulfonylurea Antidiabetic',
    brand: 'Diamicron', strength: '80mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: false, pediatric: false },
    contraindications: ['Pregnancy', 'Renal/hepatic impairment', 'Type 1 DM'],
    caution: 'Risk of hypoglycemia. Eat regular meals. Monitor blood sugar.',
    timing: 'Before meal', patientNote: 'Diabetes medicine. Eat on time — risk of low sugar.',
  },
  {
    name: 'Glibenclamide 5mg', generic: 'Glibenclamide 5mg', category: 'Sulfonylurea Antidiabetic',
    brand: 'Daonil', strength: '5mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: false, pediatric: false },
    contraindications: ['Pregnancy', 'Elderly (hypoglycemia risk)', 'Renal/hepatic impairment'],
    caution: 'High hypoglycemia risk in elderly. Prefer Gliclazide in elderly.',
    timing: 'Before meal', patientNote: 'Diabetes medicine. Eat on time. Avoid in elderly.',
  },
  {
    name: 'Sitagliptin 100mg', generic: 'Sitagliptin 100mg', category: 'DPP-4 Inhibitor',
    brand: 'Januvia/Sitagen', strength: '100mg',
    safe: { pregnancy: false, renal: false, hepatic: true, elderly: true, pediatric: false },
    contraindications: ['Pregnancy', 'eGFR < 30 (reduce dose)'],
    caution: 'Weight neutral. Reduce dose in renal impairment. Safer in elderly.',
    timing: 'Anytime', patientNote: 'Diabetes medicine. Safe for older adults.',
  },
  {
    name: 'Empagliflozin 10mg', generic: 'Empagliflozin 10mg', category: 'SGLT2 Inhibitor',
    brand: 'Jardiance', strength: '10mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['eGFR < 45', 'Pregnancy', 'Recurrent UTI'],
    caution: 'Excretes glucose in urine — stay hydrated. Good for heart/kidney protection.',
    timing: 'Morning', patientNote: 'Diabetes medicine. Drink lots of water. Good for heart.',
  },
  {
    name: 'Insulin Glargine 10 units', generic: 'Insulin Glargine (basal)', category: 'Long-Acting Insulin',
    brand: 'Lantus/Basalin', strength: '100 IU/mL',
    safe: { pregnancy: true, renal: true, hepatic: true, elderly: true, pediatric: false },
    contraindications: ['Hypoglycemia'],
    caution: 'Once daily subcutaneous. Monitor blood sugar. Do not mix.',
    timing: 'Night time', patientNote: 'Insulin injection. Inject at same time every night.',
  },
  {
    name: 'Insulin Mixtard 30/70', generic: 'Biphasic Insulin 30/70', category: 'Mixed Insulin',
    brand: 'Mixtard/Humulin 30/70', strength: '100 IU/mL',
    safe: { pregnancy: true, renal: true, hepatic: true, elderly: false, pediatric: false },
    contraindications: ['Hypoglycemia'],
    caution: 'Twice daily SC. Shake gently before use. Eat within 15 min of injection.',
    timing: 'Before meal', patientNote: 'Insulin injection. Eat within 15 min of injecting.',
  },

  // ── Thyroid ───────────────────────────────────────────────
  {
    name: 'Thyroxine 50mcg', generic: 'Levothyroxine Sodium 50mcg', category: 'Thyroid Hormone',
    brand: 'Euthyrox/Thyrox', strength: '50mcg',
    safe: { pregnancy: true, renal: true, hepatic: true, elderly: false, pediatric: false },
    contraindications: ['Untreated adrenal insufficiency', 'Thyrotoxicosis'],
    caution: 'MUST take on empty stomach 30-60 min before breakfast. Lifelong.',
    timing: 'Empty stomach', patientNote: 'Thyroid medicine. Take on EMPTY STOMACH, 30 min before breakfast. Lifelong.',
  },
  {
    name: 'Thyroxine 100mcg', generic: 'Levothyroxine Sodium 100mcg', category: 'Thyroid Hormone',
    brand: 'Euthyrox/Thyrox', strength: '100mcg',
    safe: { pregnancy: true, renal: true, hepatic: true, elderly: false, pediatric: false },
    contraindications: ['Untreated adrenal insufficiency'],
    caution: 'Higher dose. Same rules — empty stomach, same time daily.',
    timing: 'Empty stomach', patientNote: 'Thyroid medicine. Empty stomach, same time every day.',
  },

  // ── Vitamins / supplements ────────────────────────────────
  {
    name: 'Vitamin C 500mg', generic: 'Ascorbic Acid 500mg', category: 'Vitamin',
    brand: 'C-Vit/C-Plus', strength: '500mg',
    safe: { pregnancy: true, renal: false, hepatic: true, elderly: true, pediatric: true },
    contraindications: ['Renal stones (high dose)'],
    caution: 'High doses (>2g) may cause kidney stones.',
    timing: 'After meal', patientNote: 'Boosts immunity. Take with food.',
  },
  {
    name: 'Vitamin D3 1000IU', generic: 'Cholecalciferol 1000IU', category: 'Vitamin',
    brand: 'D-Sol/Devas', strength: '1000IU',
    safe: { pregnancy: true, renal: false, hepatic: true, elderly: true, pediatric: true },
    contraindications: ['Hypercalcemia'],
    caution: 'Take with fatty meal for absorption.',
    timing: 'After meal', patientNote: 'Bone health vitamin. Take with food.',
  },
  {
    name: 'Calcium + Vitamin D3', generic: 'Calcium Carbonate + Vitamin D3', category: 'Supplement',
    brand: 'Shelcal/Calcimax', strength: '500mg+250IU',
    safe: { pregnancy: true, renal: false, hepatic: true, elderly: true, pediatric: false },
    contraindications: ['Hypercalcemia', 'Renal stones'],
    caution: 'Separate from thyroid/iron tablets by 4 hours.',
    timing: 'After meal', patientNote: 'For strong bones. Do not take with thyroid medicine.',
  },
  {
    name: 'Iron + Folic Acid', generic: 'Ferrous Sulfate + Folic Acid', category: 'Hematinics',
    brand: 'Feosol/Feroflate', strength: '200mg+5mg',
    safe: { pregnancy: true, renal: true, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Hemochromatosis'],
    caution: 'May cause black stools. Separate from antacids. Vitamin C improves absorption.',
    timing: 'After meal', patientNote: 'Iron for blood. Stools may look dark — normal.',
  },
  {
    name: 'Folic Acid 5mg', generic: 'Folic Acid 5mg', category: 'Vitamin',
    brand: 'Folison', strength: '5mg',
    safe: { pregnancy: true, renal: true, hepatic: true, elderly: true, pediatric: true },
    contraindications: [],
    caution: 'Essential in pregnancy and anemia.',
    timing: 'After meal', patientNote: 'Especially important in pregnancy and anemia.',
  },
  {
    name: 'Vitamin B Complex', generic: 'Thiamine + Riboflavin + Niacinamide + B6 + B12', category: 'Vitamin',
    brand: 'Benevit/Vibact', strength: 'Standard',
    safe: { pregnancy: true, renal: true, hepatic: true, elderly: true, pediatric: true },
    contraindications: [],
    caution: 'Urine may appear bright yellow — normal.',
    timing: 'After meal', patientNote: 'B vitamins. Urine turning yellow is normal.',
  },

  // ── Antifungal / skin ─────────────────────────────────────
  {
    name: 'Fluconazole 150mg', generic: 'Fluconazole 150mg', category: 'Systemic Antifungal',
    brand: 'Flucoral/Diflucan', strength: '150mg',
    safe: { pregnancy: false, renal: false, hepatic: false, elderly: true, pediatric: false },
    contraindications: ['Pregnancy', 'QT prolongation', 'Hepatic impairment'],
    caution: 'Single dose for vaginal candidiasis.',
    timing: 'Any time', patientNote: 'Antifungal. Single dose treatment.',
  },
  {
    name: 'Clotrimazole Cream 1%', generic: 'Clotrimazole 1%', category: 'Topical Antifungal',
    brand: 'Canesten/Clobet', strength: '1%',
    safe: { pregnancy: true, renal: true, hepatic: true, elderly: true, pediatric: true },
    contraindications: [],
    caution: 'Apply thin layer twice daily. Continue 2 weeks after clearing.',
    timing: 'Apply twice daily', patientNote: 'Apply thin layer to affected area twice daily.',
  },
];

export function getMedicinesByCategory(categoryName: string): Medicine[] {
  const q = categoryName.toLowerCase();
  return MEDICINES.filter((m) => m.category.toLowerCase().includes(q));
}

export function searchMedicines(query: string, max = 8): Medicine[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  return MEDICINES.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.generic.toLowerCase().includes(q) ||
      m.brand.toLowerCase().includes(q),
  ).slice(0, max);
}

export function getMedicine(name: string): Medicine | undefined {
  if (!name) return undefined;
  const n = name.trim().toLowerCase();
  if (!n) return undefined;
  const exact = MEDICINES.find((m) => m.name.toLowerCase() === n);
  if (exact) return exact;
  return MEDICINES.find(
    (m) => m.name.toLowerCase().includes(n) || n.includes(m.name.toLowerCase().split(' ')[0]),
  );
}

/** Safety check of one medicine against the patient's risk factors. */
export function isSafeFor(med: Medicine, flags: PatientRiskFlags): MedicineWarning[] {
  const warnings: MedicineWarning[] = [];
  const ciLower = med.contraindications.map((c) => c.toLowerCase());
  if (flags.pregnancy && ciLower.some((c) => c.includes('pregnancy')))
    warnings.push({ level: 'danger', message: 'Contraindicated: pregnancy' });
  else if (flags.pregnancy && !med.safe.pregnancy)
    warnings.push({ level: 'caution', message: 'Not recommended in pregnancy' });
  if ((flags.renal || flags.ckd) && !med.safe.renal)
    warnings.push({ level: 'caution', message: 'Caution in renal impairment' });
  if (flags.hepatic && !med.safe.hepatic)
    warnings.push({ level: 'caution', message: 'Caution in hepatic impairment' });
  if (flags.elderly && !med.safe.elderly)
    warnings.push({ level: 'caution', message: 'Use with caution in elderly' });
  if (flags.pediatric && !med.safe.pediatric)
    warnings.push({ level: 'caution', message: 'Not for children' });

  const ci = ciLower;
  if (flags.asthma && ci.some((c) => c.includes('asthma')))
    warnings.push({ level: 'danger', message: 'Contraindicated: asthma' });
  if (flags.pepticUlcer && ci.some((c) => c.includes('peptic')))
    warnings.push({ level: 'danger', message: 'Contraindicated: peptic ulcer' });
  if (flags.dengue && ci.some((c) => c.includes('dengue')))
    warnings.push({ level: 'danger', message: 'DANGER: contraindicated in dengue' });
  if (flags.heartDisease && ci.some((c) => c.includes('cardiac') || c.includes('heart block')))
    warnings.push({ level: 'danger', message: 'Contraindicated: cardiac disease' });
  return warnings;
}
