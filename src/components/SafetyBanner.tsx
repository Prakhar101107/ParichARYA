/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertTriangle, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { SafetyAlert, AppLanguage } from '../types';

interface SafetyBannerProps {
  alerts: SafetyAlert[];
  language?: AppLanguage;
}

export default function SafetyBanner({ alerts, language = 'hi' }: SafetyBannerProps) {
  const [expanded, setExpanded] = useState(true);

  if (alerts.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-cream/90 border border-accent text-primary-dark flex items-center gap-3 text-xs font-medium shadow-xs">
        <ShieldCheck className="w-5 h-5 text-primary shrink-0" />
        <div>
          <div className={`font-bold text-primary-dark ${language === 'hi' ? 'font-devanagari' : ''}`}>
            {language === 'hi'
              ? 'सुरक्षा जांच पूर्ण — कोई प्रत्यक्ष दोहराव नहीं मिला'
              : 'Safety Cross-Check Complete — No Direct Clashes Detected'}
          </div>
          <p className={`text-[11px] text-primary/80 mt-0.5 ${language === 'hi' ? 'font-devanagari' : ''}`}>
            {language === 'hi'
              ? 'प्रचलित 35+ भारतीय दवा अंतःक्रियाओं के विरुद्ध जांच में कोई स्पष्ट टकराव नहीं दिखा।'
              : 'Verified against 35+ common Indian drug interactions and therapy duplications.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="paricharya-safety-alerts" className="p-4 rounded-2xl bg-cream border-2 border-sand text-amber-950 space-y-3 shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-sand text-primary-dark flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-5 h-5 text-[#8C4A00]" />
          </div>
          <div>
            <h3 className={`font-bold text-sm text-amber-950 ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {language === 'hi'
                ? 'सलाह: दवाइयों के तालमेल की जांच (Safety Cross-Check Advisory)'
                : 'Safety Advisory: Potential Medication Interactions / Overlap'}
            </h3>
            <p className={`text-xs text-amber-900 font-semibold mt-0.5 ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {language === 'hi'
                ? 'ये दवाइयां आपस में टकरा सकती हैं या दोहराई गई हो सकती हैं — कृपया डॉक्टर या फार्मासिस्ट से पुष्टि करें।'
                : 'These medicines may interact or overlap — please confirm with your pharmacist or doctor.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-primary-dark p-1 hover:bg-sand/60 rounded-lg transition"
          aria-label="Toggle Alert Details"
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-2 pt-2 border-t border-sand">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-3 rounded-xl bg-white/90 border border-sand text-xs space-y-1"
            >
              <div className="flex items-center gap-2">
                <span className={`font-bold text-amber-950 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                  {language === 'hi' ? alert.title_hi : alert.title_en}
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-sand text-primary-dark font-bold">
                  {alert.medicines_involved.join(' + ')}
                </span>
              </div>
              <p className="text-slate-700">
                {language === 'hi' ? alert.description_hi : alert.description_en}
              </p>
              {language === 'hi' && (
                <p className="text-[11px] text-slate-500 italic">
                  {alert.description_en}
                </p>
              )}
            </div>
          ))}

          <div className={`text-[11px] text-amber-950 bg-sand/70 p-2 rounded-lg font-medium border border-sand-dark/50 ${language === 'hi' ? 'font-devanagari' : ''}`}>
            ⚠️ <strong>{language === 'hi' ? 'महत्वपूर्ण:' : 'Important:'}</strong>{' '}
            {language === 'hi'
              ? 'अपने आप कोई दवा बंद न करें। सिर्फ अपने डॉक्टर से एक बार पूछ लें।'
              : 'Never stop or change medications on your own. Always consult your prescribing physician or pharmacist.'}
          </div>
        </div>
      )}
    </div>
  );
}
