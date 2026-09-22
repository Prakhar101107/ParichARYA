/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Medicine, SafetyAlert, SafetyRule } from '../types';

export const COMMON_SAFETY_RULES: SafetyRule[] = [
  {
    id: 'paracetamol_duplicate',
    trigger_keywords_a: ['paracetamol', 'calpol', 'dolo', 'crocin', 'pacimol', 'febrex', 'pyregesic', 'sumo'],
    trigger_keywords_b: ['paracetamol', 'calpol', 'dolo', 'crocin', 'pacimol', 'febrex', 'pyregesic', 'combiflam'],
    type: 'duplicate_therapy',
    title_en: 'Possible Paracetamol Overlap',
    title_hi: 'पैरासिटामोल दवा का दोहराव हो सकता है',
    description_en: 'Two medicines in this prescription appear to contain Paracetamol (e.g. Dolo, Calpol, Crocin). Taking both together may cause accidental overdose.',
    description_hi: 'पर्चे में दो दवाइयों में पैरासिटामोल होने की संभावना है। दोनों साथ लेने से अधिक खुराक हो सकती है। कृपया फार्मासिस्ट या डॉक्टर से पूछें।'
  },
  {
    id: 'nsaid_duplicate',
    trigger_keywords_a: ['combiflam', 'brufen', 'ibuprofen', 'diclofenac', 'voveran'],
    trigger_keywords_b: ['zerodol', 'aceclofenac', 'naproxen', 'etoricoxib', 'nimesulide'],
    type: 'duplicate_therapy',
    title_en: 'Duplicate Pain Relief / NSAID Medicines',
    title_hi: 'दर्द निवारक दवाइयों का दोहराव',
    description_en: 'Two strong painkiller/anti-inflammatory medicines are listed together. Taking multiple NSAIDs increases stomach irritation risk.',
    description_hi: 'दर्द की दो अलग-अलग दवाइयां एक साथ लिखी लग रही हैं। इससे पेट में जलन या गैस बढ़ सकती है।'
  },
  {
    id: 'nsaid_anticoagulant',
    trigger_keywords_a: ['aspirin', 'ecosprin', 'clopidogrel', 'clopilet', 'warfarin', 'eliquis'],
    trigger_keywords_b: ['diclofenac', 'voveran', 'brufen', 'ibuprofen', 'combiflam', 'zerodol', 'aceclofenac'],
    type: 'drug_interaction',
    title_en: 'Blood Thinner and Painkiller Interaction',
    title_hi: 'खून पतला करने वाली और दर्द की दवा का संपर्क',
    description_en: 'Painkillers (like Diclofenac or Aceclofenac) taken with blood thinners (like Ecosprin) require doctor confirmation to prevent bleeding.',
    description_hi: 'खून पतला करने वाली दवा और तेज दर्द की गोली साथ लेने से पहले डॉक्टर से पुष्टि जरूर करवाएं।'
  },
  {
    id: 'ppi_antacid_duplicate',
    trigger_keywords_a: ['pan', 'pantocid', 'pantoprazole', 'pan-d', 'pan 40'],
    trigger_keywords_b: ['omez', 'omeprazole', 'razo', 'rabeprazole', 'rabekind', 'esomeprazole', 'nexpro'],
    type: 'duplicate_therapy',
    title_en: 'Multiple Acid Reflux / Gas Medicines',
    title_hi: 'गैस / एसिडिटी की दोहरी दवा',
    description_en: 'More than one proton-pump inhibitor (gas/acidity medicine) is detected in this list. Usually only one is needed.',
    description_hi: 'पर्चे में एसिडिटी और गैस की एक से ज्यादा दवाइयां हैं। आमतौर पर केवल एक ही ली जाती है।'
  },
  {
    id: 'antibiotic_dual_macrolide_penicillin',
    trigger_keywords_a: ['azithromycin', 'azithral', 'azee', 'azithro', 'clarithromycin'],
    trigger_keywords_b: ['amoxicillin', 'augmentin', 'clavam', 'moxikind', 'ampicillin'],
    type: 'advisory',
    title_en: 'Multiple Antibiotics Prescribed',
    title_hi: 'एक से अधिक एंटीबायोटिक दवाइयां',
    description_en: 'Two different antibiotics are present. Ensure you complete courses exactly as directed by your doctor.',
    description_hi: 'दो अलग प्रकार की एंटीबायोटिक दवाएं हैं। इनके समय और कोर्स के बारे में डॉक्टर की सलाह का पूरा पालन करें।'
  },
  {
    id: 'quinolone_duplicate',
    trigger_keywords_a: ['ciprofloxacin', 'ciplox', 'norfloxacin', 'norflox'],
    trigger_keywords_b: ['levofloxacin', 'levomac', 'ofloxacin', 'zenflox', 'oflax'],
    type: 'duplicate_therapy',
    title_en: 'Fluoroquinolone Antibiotic Overlap',
    title_hi: 'एंटीबायोटिक का ओवरलैप',
    description_en: 'Two quinolone-class antibiotics appear together. Please verify whether both were intended simultaneously.',
    description_hi: 'समान वर्ग की दो एंटीबायोटिक दवाइयां दिख रही हैं। क्या दोनों साथ लेनी हैं, डॉक्टर से जांचें।'
  },
  {
    id: 'antihistamine_duplicate',
    trigger_keywords_a: ['cetirizine', 'cetzine', 'okacet', 'alerid'],
    trigger_keywords_b: ['levocetirizine', 'levocet', 'montair-lc', 'monticope', 'fexofenadine', 'allegra'],
    type: 'duplicate_therapy',
    title_en: 'Duplicate Allergy / Antihistamine Medicines',
    title_hi: 'एलर्जी और सर्दी की दोहरी दवा',
    description_en: 'Two allergy or cold medications containing antihistamines are present. This can cause excessive drowsiness.',
    description_hi: 'एलर्जी या जुकाम की दो दवाइयां साथ हैं। इनसे अधिक नींद या सुस्ती आ सकती है।'
  },
  {
    id: 'cough_syrup_duplicate',
    trigger_keywords_a: ['ascoril', 'benadryl', 'grilinctus'],
    trigger_keywords_b: ['alex', 'koflet', 'tusq', 'ambrodil', 'zedex'],
    type: 'duplicate_therapy',
    title_en: 'Multiple Cough Syrups',
    title_hi: 'खांसी के दो सिरप',
    description_en: 'Multiple cough syrups detected. Using more than one cough medicine at once is generally not advised.',
    description_hi: 'खांसी के एक से ज्यादा सिरप लिखे दिख रहे हैं। एक समय पर दोनों न पिएं, डॉक्टर से पूछें।'
  },
  {
    id: 'calcium_iron_block',
    trigger_keywords_a: ['shelcal', 'cipcal', 'calcium', 'gemcal'],
    trigger_keywords_b: ['autrin', 'orofer', 'ferium', 'iron', 'dexorange', 'folvite-mb'],
    type: 'advisory',
    title_en: 'Calcium & Iron Timing Separation',
    title_hi: 'कैल्शियम और आयरन अलग-अलग समय लें',
    description_en: 'Calcium blocks the absorption of iron. Keep at least a 2-hour gap between taking calcium and iron tablets.',
    description_hi: 'कैल्शियम और आयरन की गोली कभी एक साथ न लें। दोनों के बीच कम से कम 2 घंटे का अंतर रखें।'
  },
  {
    id: 'thyroid_calcium_iron',
    trigger_keywords_a: ['eltroxin', 'thyronorm', 'thyroxine'],
    trigger_keywords_b: ['shelcal', 'cipcal', 'calcium', 'orofer', 'iron'],
    type: 'advisory',
    title_en: 'Thyroid Medication Absorption Warning',
    title_hi: 'थायराइड दवा के साथ कैल्शियम/आयरन का अंतर',
    description_en: 'Thyroxine must be taken early morning on an empty stomach. Do not take calcium or iron within 4 hours of thyroid medicine.',
    description_hi: 'थायराइड की दवा सुबह खाली पेट लें और उसके 4 घंटे बाद तक कैल्शियम या आयरन न लें।'
  },
  {
    id: 'antacid_antibiotic_block',
    trigger_keywords_a: ['gelusil', 'digene', 'sucralfate', 'mucaine', 'polygel'],
    trigger_keywords_b: ['ciprofloxacin', 'ciplox', 'levofloxacin', 'norfloxacin', 'doxycycline', 'doxy'],
    type: 'advisory',
    title_en: 'Antacid May Reduce Antibiotic Absorption',
    title_hi: 'एंटासिड सिरप और एंटीबायोटिक में अंतर रखें',
    description_en: 'Antacid syrups (Gelusil, Digene) bond with antibiotics like Ciprofloxacin or Doxycycline, reducing their power. Keep a 2-hour gap.',
    description_hi: 'डाइजीन या जेलुसिल जैसा सिरप एंटीबायोटिक का असर कम कर सकता है। दोनों में 2 घंटे का फासला रखें।'
  },
  {
    id: 'bp_calcium_channel_blockers',
    trigger_keywords_a: ['amlodipine', 'stamlo', 'amlong'],
    trigger_keywords_b: ['cilnidipine', 'cilacar', 'nifedipine'],
    type: 'duplicate_therapy',
    title_en: 'Duplicate Blood Pressure Medicines',
    title_hi: 'ब्लड प्रेशर की समान दवाइयां',
    description_en: 'Two medicines from the same calcium-channel blocker group for BP are present. Confirm dosage with your doctor.',
    description_hi: 'बीपी की एक ही श्रेणी की दो दवाइयां दिख रही हैं। खुराक की डॉक्टर से दोबारा पुष्टि करें।'
  },
  {
    id: 'bp_arb_duplicate',
    trigger_keywords_a: ['telmisartan', 'telma', 'telpres'],
    trigger_keywords_b: ['losartan', 'losar', 'olmesartan', 'olmat', 'valsartan'],
    type: 'duplicate_therapy',
    title_en: 'Duplicate Blood Pressure (ARB) Therapy',
    title_hi: 'बीपी (ARB) दवा का दोहराव',
    description_en: 'Multiple ARB-class hypertension medicines appear. Taking both can drop blood pressure too low.',
    description_hi: 'बीपी की दो समान दवाइयां लेने से बीपी बहुत कम हो सकता है। कृपया डॉक्टर से संपर्क करें।'
  },
  {
    id: 'statin_duplicate',
    trigger_keywords_a: ['atorvastatin', 'atorva', 'atorlip', 'lipitor'],
    trigger_keywords_b: ['rosuvastatin', 'rosuvas', 'rozavel', 'crestor'],
    type: 'duplicate_therapy',
    title_en: 'Duplicate Cholesterol (Statin) Medicines',
    title_hi: 'कोलेस्ट्रॉल (स्टेटिन) की दोहरी दवा',
    description_en: 'Two statin medicines are listed. Taking both can increase muscle ache and liver strain risk.',
    description_hi: 'कोलेस्ट्रॉल कम करने की दो दवाइयां साथ न लें। डॉक्टर से पूछें कि कौन सी एक चालू रखनी है।'
  },
  {
    id: 'sedative_duplicate',
    trigger_keywords_a: ['alprazolam', 'alprax', 'restyl', 'trika'],
    trigger_keywords_b: ['clonazepam', 'zapiz', 'clonafit', 'rivotril', 'lorazepam', 'ativan'],
    type: 'duplicate_therapy',
    title_en: 'Multiple Sedative / Sleep Medications',
    title_hi: 'नींद या घबराहट की दोहरी दवा',
    description_en: 'Two medicines for anxiety/sleep are listed. Combining these can cause extreme drowsiness or slowed breathing.',
    description_hi: 'नींद या बेचैनी की दो दवाएं एक साथ लेने से अत्यधिक बेहोशी आ सकती है। बहुत सावधानी रखें।'
  },
  {
    id: 'muscle_relaxant_duplicate',
    trigger_keywords_a: ['thiocolchicoside', 'myoril'],
    trigger_keywords_b: ['chlorzoxazone', 'tizanidine', 'baclofen', 'liofen'],
    type: 'duplicate_therapy',
    title_en: 'Multiple Muscle Relaxants',
    title_hi: 'मांसपेशियों के खिंचाव की दो दवाएं',
    description_en: 'More than one muscle relaxant is listed together. This may cause excessive weakness or dizziness.',
    description_hi: 'मांसपेशी ढीली करने वाली एक से ज्यादा दवाएं हैं। इससे चक्कर या कमजोरी महसूस हो सकती है।'
  },
  {
    id: 'antidiabetic_metformin_combination',
    trigger_keywords_a: ['glycomet', 'metformin', 'gluformin'],
    trigger_keywords_b: ['janumet', 'galvus met', 'glycomet-gp', 'glizid-m'],
    type: 'advisory',
    title_en: 'Metformin Redundancy in Diabetes Combo',
    title_hi: 'शुगर की गोली में मेटफॉर्मिन का दोहराव',
    description_en: 'You have plain Metformin as well as a combination tablet that already contains Metformin. Check total daily dose.',
    description_hi: 'आपके पर्चे में अलग से मेटफॉर्मिन और मेटफॉर्मिन मिली हुई कॉम्बो गोली दोनों हैं। कुल मात्रा डॉक्टर से जांचें।'
  },
  {
    id: 'steroid_duplicate',
    trigger_keywords_a: ['prednisolone', 'wysolone', 'omnacortil'],
    trigger_keywords_b: ['dexamethasone', 'dexona', 'betamethasone', 'betnesol', 'deflazacort'],
    type: 'duplicate_therapy',
    title_en: 'Multiple Steroid Medications',
    title_hi: 'एक से अधिक स्टेरॉयड दवाइयां',
    description_en: 'Multiple corticosteroid medications are found. Steroids require precise dosing to avoid side effects.',
    description_hi: 'पर्चे में एक से ज्यादा स्टेरॉयड दवाइयां हैं। स्टेरॉयड केवल डॉक्टर के बताए अनुसार ही लें।'
  },
  {
    id: 'antispasmodic_duplicate',
    trigger_keywords_a: ['meftal-spas', 'meftal spas'],
    trigger_keywords_b: ['cyclopam', 'drotin', 'drotikind', 'spasmo-proxyvon'],
    type: 'duplicate_therapy',
    title_en: 'Multiple Stomach Cramp Medicines',
    title_hi: 'पेट दर्द और मरोड़ की दोहरी दवा',
    description_en: 'Two antispasmodic medicines for stomach cramps appear in the list. Usually only one is needed.',
    description_hi: 'पेट दर्द के लिए दो दवाइयां हैं। आम तौर पर केवल एक ही इस्तेमाल की जाती है।'
  },
  {
    id: 'antiemetic_duplicate',
    trigger_keywords_a: ['ondansetron', 'emeset', 'vomikind'],
    trigger_keywords_b: ['domperidone', 'vomistop', 'metoclopramide', 'perinorm'],
    type: 'advisory',
    title_en: 'Multiple Vomiting / Nausea Medications',
    title_hi: 'उल्टी और जी मिचलाने की दो दवाइयां',
    description_en: 'Two medications to stop nausea/vomiting are listed. Check with your doctor if both should be taken together.',
    description_hi: 'उल्टी रोकने की दो अलग दवाएं हैं। क्या दोनों एक साथ लेनी हैं, डॉक्टर से पुष्टि करें।'
  }
];

export function runSafetyCrossCheck(medicines: Medicine[]): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];
  const normalizedNames = medicines.map(m => m.drug_name.toLowerCase().trim());

  // Also check self-duplication of same drug name if entered twice
  for (let i = 0; i < medicines.length; i++) {
    for (let j = i + 1; j < medicines.length; j++) {
      const nameA = normalizedNames[i];
      const nameB = normalizedNames[j];

      // Exact or near-exact duplicate name
      if (nameA === nameB || (nameA.length > 4 && (nameA.includes(nameB) || nameB.includes(nameA)))) {
        alerts.push({
          id: `exact_dup_${medicines[i].id}_${medicines[j].id}`,
          type: 'duplicate_therapy',
          medicines_involved: [medicines[i].drug_name, medicines[j].drug_name],
          title_en: `Duplicate Entry: ${medicines[i].drug_name}`,
          title_hi: `${medicines[i].drug_name} दवा दो बार लिखी है`,
          description_en: `The medicine "${medicines[i].drug_name}" appears more than once in this prescription. Please verify with your doctor or pharmacist.`,
          description_hi: `"${medicines[i].drug_name}" दवा पर्चे में एक से अधिक बार आई है। क्या यह गलती से दो बार लिखी गई है, पुष्टि करें।`
        });
      }
    }
  }

  // Cross check with knowledge base
  for (const rule of COMMON_SAFETY_RULES) {
    const matchedA: Medicine[] = [];
    const matchedB: Medicine[] = [];

    for (let i = 0; i < medicines.length; i++) {
      const name = normalizedNames[i];
      const matchA = rule.trigger_keywords_a.some(k => name.includes(k));
      const matchB = rule.trigger_keywords_b.some(k => name.includes(k));

      if (matchA) matchedA.push(medicines[i]);
      if (matchB) matchedB.push(medicines[i]);
    }

    // Filter matches that are distinctly different medicines (or distinct IDs)
    const distinctPairs: [Medicine, Medicine][] = [];
    for (const a of matchedA) {
      for (const b of matchedB) {
        if (a.id !== b.id && !distinctPairs.some(([p1, p2]) => (p1.id === a.id && p2.id === b.id) || (p1.id === b.id && p2.id === a.id))) {
          distinctPairs.push([a, b]);
        }
      }
    }

    if (distinctPairs.length > 0) {
      const pair = distinctPairs[0];
      alerts.push({
        id: `${rule.id}_${pair[0].id}_${pair[1].id}`,
        type: rule.type,
        medicines_involved: [pair[0].drug_name, pair[1].drug_name],
        title_en: rule.title_en,
        title_hi: rule.title_hi,
        description_en: rule.description_en,
        description_hi: rule.description_hi
      });
    }
  }

  return alerts;
}
