/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Plus, 
  Trash2, 
  ArrowRight, 
  RotateCcw, 
  Clock, 
  Pill, 
  Utensils, 
  Calendar,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import { FoodRelation, Medicine, MedicineForm, AppLanguage } from '../types';
import { getTranslations } from '../utils/translations';

interface VerificationStepProps {
  medicines: Medicine[];
  onUpdateMedicines: (updated: Medicine[]) => void;
  onProceedToPlan: () => void;
  onRetake: () => void;
  isGeneratingPlan: boolean;
  language?: AppLanguage;
}

const CONFIDENCE_THRESHOLD = 0.75;

export default function VerificationStep({
  medicines,
  onUpdateMedicines,
  onProceedToPlan,
  onRetake,
  isGeneratingPlan,
  language = 'hi',
}: VerificationStepProps) {
  const t = getTranslations(language);
  const [editingMedId, setEditingMedId] = useState<string | null>(null);

  // Check which medicines have fields with low confidence
  const getFlaggedFields = (med: Medicine): string[] => {
    const flags: string[] = [];
    if (med.confidence.name < CONFIDENCE_THRESHOLD) flags.push('name');
    if (med.confidence.dose < CONFIDENCE_THRESHOLD) flags.push('dose');
    if (med.confidence.frequency < CONFIDENCE_THRESHOLD) flags.push('frequency');
    return flags;
  };

  // An item needs confirmation if it has low confidence fields and hasn't been verified or edited yet
  const needsConfirmation = (med: Medicine): boolean => {
    if (med.verified || med.userEdited) return false;
    const flags = getFlaggedFields(med);
    return flags.length > 0;
  };

  const pendingConfirmationCount = medicines.filter(needsConfirmation).length;
  const canProceed = pendingConfirmationCount === 0 && medicines.length > 0;

  const handleConfirmSingleMed = (id: string) => {
    const updated = medicines.map((m) => {
      if (m.id === id) {
        return { ...m, verified: true };
      }
      return m;
    });
    onUpdateMedicines(updated);
  };

  const handleUpdateSingleMed = (id: string, partial: Partial<Medicine>) => {
    const updated = medicines.map((m) => {
      if (m.id === id) {
        return { ...m, ...partial, verified: true, userEdited: true };
      }
      return m;
    });
    onUpdateMedicines(updated);
  };

  const handleDeleteMed = (id: string) => {
    const updated = medicines.filter((m) => m.id !== id);
    onUpdateMedicines(updated);
  };

  const handleAddNewMed = () => {
    const newMed: Medicine = {
      id: `med_${Date.now()}_custom`,
      drug_name: 'New Medicine (दवाई का नाम)',
      form: 'tablet',
      strength: '500mg',
      frequency_raw: 'OD',
      frequency_plain: 'Once daily (दिन में एक बार)',
      food_relation: 'after_food',
      duration_days: 5,
      special_instructions: null,
      confidence: { name: 1.0, dose: 1.0, frequency: 1.0 },
      verified: true,
      userEdited: true,
    };
    onUpdateMedicines([...medicines, newMed]);
    setEditingMedId(newMed.id);
  };

  return (
    <div id="paricharya-verification-container" className="space-y-6">
      {/* Safety Gate Warning Header */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cream border border-accent/50 text-primary flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className={`text-base font-bold text-slate-900 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                {t.verify.title}
              </h2>
              <p className={`text-xs text-slate-500 mt-0.5 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                {t.verify.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onRetake}
            className="text-xs text-slate-500 hover:text-primary flex items-center gap-1 shrink-0 p-1.5 rounded-lg hover:bg-cream/60 transition"
            title="Scan Again"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className={language === 'hi' ? 'font-devanagari' : ''}>{t.verify.scanAgain}</span>
          </button>
        </div>

        {/* Status Pill Badge */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {pendingConfirmationCount > 0 ? (
            <div className="flex items-center gap-2 text-amber-950 font-medium bg-cream border border-sand px-3 py-1.5 rounded-xl w-full shadow-xs">
              <AlertTriangle className="w-4 h-4 text-[#8C4A00] shrink-0" />
              <span className={language === 'hi' ? 'font-devanagari' : ''}>
                <strong>{pendingConfirmationCount}</strong> {t.verify.pendingReview}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-primary-dark font-medium bg-cream border border-accent px-3 py-1.5 rounded-xl w-full shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
              <span className={language === 'hi' ? 'font-devanagari' : ''}>{t.verify.allConfirmed}</span>
            </div>
          )}
        </div>
      </div>

      {/* Medication Cards List */}
      <div className="space-y-3">
        {medicines.map((med, index) => {
          const isFlagged = needsConfirmation(med);
          const isEditing = editingMedId === med.id;
          const flags = getFlaggedFields(med);

          return (
            <div
              key={med.id}
              className={`bg-white rounded-2xl p-4 transition shadow-xs border ${
                isFlagged
                  ? 'border-sand-dark bg-cream/30 ring-2 ring-sand'
                  : med.verified
                  ? 'border-accent/80'
                  : 'border-slate-200'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-cream border border-accent/40 text-primary font-bold flex items-center justify-center text-xs">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-slate-900 tracking-tight">
                        {med.drug_name}
                      </span>
                      {med.strength && (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-sand/50 text-primary-dark">
                          {med.strength}
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 capitalize">
                      {med.form} • {med.frequency_raw} ({med.frequency_plain})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setEditingMedId(isEditing ? null : med.id)}
                    className="p-1.5 text-slate-500 hover:text-primary hover:bg-cream rounded-lg transition"
                    title={language === 'hi' ? 'दवा संपादित करें' : 'Edit Medicine'}
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMed(med.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title={language === 'hi' ? 'दवा हटाएं' : 'Delete Medicine'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Confidence badges or Flag notification */}
              {isFlagged ? (
                <div className="mt-3 p-2.5 rounded-xl bg-sand/60 border border-sand text-amber-950 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 font-medium">
                    <AlertTriangle className="w-4 h-4 text-[#8C4A00] shrink-0" />
                    <span className={language === 'hi' ? 'font-devanagari' : ''}>
                      {language === 'hi' ? (
                        <>
                          कृपया पुष्टि करें: {flags.includes('name') && 'नाम '}{flags.includes('dose') && 'मात्रा '}{flags.includes('frequency') && 'समय/खुराक '}
                          (संदेहजनक लिखावट)
                        </>
                      ) : (
                        <>
                          Please verify: {flags.includes('name') && 'Name '}{flags.includes('dose') && 'Dose '}{flags.includes('frequency') && 'Frequency '}
                          (unclear handwriting)
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleConfirmSingleMed(med.id)}
                    className="py-1 px-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold text-[11px] transition active:scale-95 shrink-0"
                  >
                    {t.verify.confirmButton}
                  </button>
                </div>
              ) : (
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2">
                  <div className={`flex items-center gap-3 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                    <span>
                      {language === 'hi' ? 'भोजन:' : 'Food:'}{' '}
                      {med.food_relation === 'before_food'
                        ? (language === 'hi' ? 'खाने से पहले' : 'Before food')
                        : med.food_relation === 'after_food'
                        ? (language === 'hi' ? 'खाने के बाद' : 'After food')
                        : med.food_relation === 'empty_stomach'
                        ? (language === 'hi' ? 'खाली पेट' : 'Empty stomach')
                        : (language === 'hi' ? 'साधारण' : 'Standard')}
                    </span>
                    {med.duration_days && (
                      <span>
                        {language === 'hi' ? 'अवधि:' : 'Duration:'} {med.duration_days} {language === 'hi' ? 'दिन' : 'days'}
                      </span>
                    )}
                  </div>
                  <span className="text-primary font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                    {language === 'hi' ? 'सत्यापित' : 'Verified'}
                  </span>
                </div>
              )}

              {/* Expandable Quick Edit Panel */}
              {isEditing && (
                <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-3 bg-cream/40 p-3 rounded-xl border border-sand">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        {language === 'hi' ? 'दवाई का नाम (Drug Name)' : 'Drug Name'}
                      </label>
                      <input
                        type="text"
                        value={med.drug_name}
                        onChange={(e) => handleUpdateSingleMed(med.id, { drug_name: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        {language === 'hi' ? 'मात्रा/शक्ति (Strength, e.g. 500mg)' : 'Strength (e.g. 500mg)'}
                      </label>
                      <input
                        type="text"
                        value={med.strength}
                        onChange={(e) => handleUpdateSingleMed(med.id, { strength: e.target.value })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        {language === 'hi' ? 'रूप (Form)' : 'Form'}
                      </label>
                      <select
                        value={med.form}
                        onChange={(e) => handleUpdateSingleMed(med.id, { form: e.target.value as MedicineForm })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="tablet">{language === 'hi' ? 'Tablet (गोली)' : 'Tablet'}</option>
                        <option value="capsule">{language === 'hi' ? 'Capsule (कैप्सूल)' : 'Capsule'}</option>
                        <option value="syrup">{language === 'hi' ? 'Syrup (सिरप)' : 'Syrup'}</option>
                        <option value="injection">Injection</option>
                        <option value="drops">{language === 'hi' ? 'Drops (बूंदें)' : 'Drops'}</option>
                        <option value="ointment">{language === 'hi' ? 'Ointment (मरहम)' : 'Ointment'}</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        {language === 'hi' ? 'समय/आवृत्ति (Frequency)' : 'Frequency'}
                      </label>
                      <select
                        value={med.frequency_raw}
                        onChange={(e) => {
                          const raw = e.target.value;
                          let plain = 'Once a day';
                          if (raw === 'BD') plain = 'Twice a day (दिन में 2 बार)';
                          if (raw === 'TDS') plain = 'Three times a day (दिन में 3 बार)';
                          if (raw === 'QID') plain = 'Four times a day';
                          if (raw === 'HS') plain = 'At bedtime (रात को सोते समय)';
                          if (raw === 'SOS') plain = 'As needed (जरूरत पड़ने पर)';
                          handleUpdateSingleMed(med.id, { frequency_raw: raw, frequency_plain: plain });
                        }}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="OD">OD — {language === 'hi' ? 'दिन में 1 बार' : 'Once daily'}</option>
                        <option value="BD">BD — {language === 'hi' ? 'दिन में 2 बार' : 'Twice daily'}</option>
                        <option value="TDS">TDS — {language === 'hi' ? 'दिन में 3 बार' : 'Thrice daily'}</option>
                        <option value="HS">HS — {language === 'hi' ? 'रात को सोते समय' : 'Bedtime'}</option>
                        <option value="SOS">SOS — {language === 'hi' ? 'जरूरत पड़ने पर' : 'As needed'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                        {language === 'hi' ? 'भोजन संबंध (Food Timing)' : 'Food Timing'}
                      </label>
                      <select
                        value={med.food_relation}
                        onChange={(e) => handleUpdateSingleMed(med.id, { food_relation: e.target.value as FoodRelation })}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                      >
                        <option value="after_food">{language === 'hi' ? 'खाने के बाद (After food)' : 'After food'}</option>
                        <option value="before_food">{language === 'hi' ? 'खाने से पहले (Before food)' : 'Before food'}</option>
                        <option value="empty_stomach">{language === 'hi' ? 'खाली पेट (Empty stomach)' : 'Empty stomach'}</option>
                        <option value="with_food">{language === 'hi' ? 'खाने के साथ (With food)' : 'With food'}</option>
                        <option value="bedtime">{language === 'hi' ? 'सोते समय (Bedtime)' : 'Bedtime'}</option>
                        <option value="not_specified">{language === 'hi' ? 'उल्लेख नहीं' : 'Not specified'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        handleConfirmSingleMed(med.id);
                        setEditingMedId(null);
                      }}
                      className="py-1.5 px-3 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-xs transition"
                    >
                      {language === 'hi' ? 'सहेजें और पुष्टि करें ✓' : 'Save & Confirm ✓'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Missing Medicine Button */}
      <button
        type="button"
        onClick={handleAddNewMed}
        className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-accent/80 text-primary font-bold text-xs hover:border-primary hover:bg-cream/40 transition flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4 text-primary" />
        <span className={language === 'hi' ? 'font-devanagari' : ''}>{t.verify.addMedicine}</span>
      </button>

      {/* Continue Action Button (Mandatory Gate Enforcement) */}
      <div className="sticky bottom-4 z-20 pt-2">
        <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg border border-slate-200 space-y-2">
          {!canProceed && (
            <p className={`text-[11px] text-amber-900 text-center font-semibold ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {t.verify.needConfirmationBanner}
            </p>
          )}

          <button
            type="button"
            onClick={onProceedToPlan}
            disabled={!canProceed || isGeneratingPlan}
            id="btn-confirm-all"
            className="w-full py-4 px-6 rounded-xl bg-primary hover:bg-primary-dark disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold text-base shadow-md active:scale-98 transition flex items-center justify-center gap-2 min-h-[52px]"
          >
            {isGeneratingPlan ? (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div>
                <span className={language === 'hi' ? 'font-devanagari' : ''}>{t.verify.generatingAudio}</span>
              </>
            ) : (
              <>
                <span className={language === 'hi' ? 'font-devanagari' : ''}>{t.verify.confirmAndListen}</span>
                <ArrowRight className="w-5 h-5 text-sand" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
