/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Play, Trash2, Calendar, FileText, ChevronRight, Clock } from 'lucide-react';
import { CarePlan, AppLanguage } from '../types';
import { getTranslations } from '../utils/translations';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedPlans: CarePlan[];
  onSelectPlan: (plan: CarePlan) => void;
  onDeletePlan: (id: string) => void;
  language?: AppLanguage;
}

export default function HistoryDrawer({
  isOpen,
  onClose,
  savedPlans,
  onSelectPlan,
  onDeletePlan,
  language = 'hi',
}: HistoryDrawerProps) {
  if (!isOpen) return null;
  const t = getTranslations(language);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-primary-dark/30 flex items-center justify-between bg-primary text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sand" />
            <div>
              <h3 className={`font-bold text-base ${language === 'hi' ? 'font-devanagari' : ''}`}>{t.history.title}</h3>
              <p className={`text-[11px] text-sand/90 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                {savedPlans.length} {t.history.savedCountSuffix}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-sand/80 hover:text-white hover:bg-primary-dark rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedPlans.length === 0 ? (
            <div className="py-16 text-center space-y-3 text-slate-400">
              <FileText className="w-12 h-12 mx-auto stroke-1 text-slate-300" />
              <p className={`text-sm font-medium text-slate-600 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                {t.history.empty}
              </p>
              <p className={`text-xs text-slate-400 max-w-xs mx-auto ${language === 'hi' ? 'font-devanagari' : ''}`}>
                {t.history.emptyDesc}
              </p>
            </div>
          ) : (
            savedPlans.map((plan) => {
              const medNames = plan.medicines.map((m) => m.drug_name).slice(0, 3).join(', ');
              const remaining = plan.medicines.length > 3 ? ` +${plan.medicines.length - 3}` : '';
              const dateStr = new Date(plan.createdAt).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={plan.id}
                  className="p-4 rounded-2xl border border-slate-200 hover:border-accent bg-white hover:bg-cream/20 transition shadow-xs space-y-2 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div
                      className="cursor-pointer flex-1"
                      onClick={() => {
                        onSelectPlan(plan);
                        onClose();
                      }}
                    >
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{dateStr}</span>
                        <span className={`text-primary-dark bg-cream border border-sand px-1.5 py-0.2 rounded font-semibold ${language === 'hi' ? 'font-devanagari' : ''}`}>
                          {plan.medicines.length} {t.carePlan.medicineCountSuffix}
                        </span>
                      </div>
                      <h4 className={`font-bold text-sm text-slate-900 mt-1 line-clamp-1 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                        {medNames}{remaining}
                      </h4>
                      <p className={`text-xs text-slate-500 line-clamp-2 mt-0.5 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                        {language === 'hi' ? plan.hindi_script.slice(0, 90) : (plan.english_script || plan.hindi_script).slice(0, 90)}...
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => onDeletePlan(plan.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Delete prescription"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectPlan(plan);
                        onClose();
                      }}
                      className={`text-xs font-bold text-primary hover:text-primary-dark flex items-center gap-1 ${language === 'hi' ? 'font-devanagari' : ''}`}
                    >
                      <Play className="w-3.5 h-3.5 fill-primary" />
                      <span>{t.history.listenNow}</span>
                    </button>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary transition" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
          <p className={`text-[11px] text-slate-500 ${language === 'hi' ? 'font-devanagari' : ''}`}>
            {t.history.privacyNote}
          </p>
        </div>
      </div>
    </div>
  );
}
