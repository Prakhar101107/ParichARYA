/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { X, Volume2, Sparkles, BookOpen, AlertCircle } from 'lucide-react';
import { speakNarration, stopSpeaking } from '../utils/speechHelper';
import { AppLanguage } from '../types';
import { getTranslations } from '../utils/translations';

interface TermExplainerModalProps {
  term: string | null;
  onClose: () => void;
  preferredVoiceName: string | null;
  language?: AppLanguage;
}

export default function TermExplainerModal({
  term,
  onClose,
  preferredVoiceName,
  language = 'hi',
}: TermExplainerModalProps) {
  const t = getTranslations(language);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<{ hindi: string; english: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (!term) return;

    let isCancelled = false;
    setLoading(true);
    setError(null);
    setExplanation(null);

    const fetchExplanation = async () => {
      try {
        const res = await fetch('/api/explain-term', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ term }),
        });

        if (!res.ok) throw new Error('Failed to fetch explanation');
        const data = await res.json();
        if (!isCancelled) {
          setExplanation(data);
        }
      } catch (err: any) {
        if (!isCancelled) {
          // Graceful local fallback for popular Indian medicines if network blips
          const termLower = term.toLowerCase();
          let hi = `${term} आमतौर पर डॉक्टर द्वारा बीमारी के लक्षणों को कम करने के लिए दी जाती है।`;
          let en = `${term} is generally prescribed by physicians to address related clinical symptoms.`;

          if (termLower.includes('calpol') || termLower.includes('paracetamol') || termLower.includes('dolo')) {
            hi = 'पैरासिटामोल बुखार कम करने और सिरदर्द या बदन दर्द में आराम देने वाली आम दवा है।';
            en = 'Paracetamol is an antipyretic and analgesic commonly used for fever, headaches, and mild body aches.';
          } else if (termLower.includes('azithro') || termLower.includes('azithral')) {
            hi = 'एज़िथ्रोमाइसिन एक एंटीबायोटिक दवा है जो फेफड़ों, गले और कान के बैक्टीरिया जनित संक्रमण को ठीक करती है।';
            en = 'Azithromycin is a macrolide antibiotic commonly used for respiratory tract, throat, and bacterial infections.';
          } else if (termLower.includes('pan') || termLower.includes('omez') || termLower.includes('pantoprazole')) {
            hi = 'यह दवा पेट में बनने वाले तेज़ाब और एसिडिटी को कम करने के लिए खाली पेट दी जाती है।';
            en = 'This is a proton pump inhibitor that reduces stomach acid production to treat gastritis and heartburn.';
          }

          setExplanation({ hindi: hi, english: en });
        }
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchExplanation();

    return () => {
      isCancelled = true;
      stopSpeaking();
    };
  }, [term]);

  if (!term) return null;

  const handleSpeak = () => {
    if (!explanation) return;
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      const isEnglish = language === 'en';
      speakNarration({
        text: isEnglish ? explanation.english : explanation.hindi,
        preferredVoiceName: isEnglish ? null : preferredVoiceName,
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cream border border-accent/40 text-primary flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className={`text-[11px] font-bold text-primary uppercase tracking-wider ${language === 'hi' ? 'font-devanagari' : ''}`}>
                {t.explainer.title}
              </span>
              <h3 className="text-lg font-bold text-slate-900">{term}</h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-cream/50 rounded-xl transition min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-8 h-8 rounded-full border-3 border-primary border-t-transparent animate-spin mx-auto"></div>
            <p className={`text-xs text-slate-500 ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {language === 'hi'
                ? `${term} के बारे में सरल जानकारी तैयार हो रही है...`
                : `Fetching educational summary for ${term}...`}
            </p>
          </div>
        ) : explanation ? (
          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-cream/80 border border-sand text-primary-dark space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold text-primary-dark ${language === 'hi' ? 'font-devanagari' : ''}`}>
                  {language === 'hi' ? 'हिंदी विवरण:' : 'Hindi Description:'}
                </span>
                <button
                  type="button"
                  onClick={handleSpeak}
                  className="px-2.5 py-1 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition active:scale-95"
                >
                  <Volume2 className="w-3.5 h-3.5 text-sand" />
                  <span className={language === 'hi' ? 'font-devanagari' : ''}>
                    {isSpeaking ? (language === 'hi' ? 'रुकें' : 'Stop') : (language === 'hi' ? 'बोलकर सुनें' : 'Listen')}
                  </span>
                </button>
              </div>
              <p className="text-sm font-medium font-devanagari leading-relaxed">
                {explanation.hindi}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-sand/30 border border-sand text-xs text-slate-700 space-y-1">
              <span className="font-semibold text-slate-500 text-[11px]">English:</span>
              <p className="leading-relaxed">{explanation.english}</p>
            </div>

            {/* Disclaimer */}
            <div className={`flex items-start gap-2 p-2.5 rounded-xl bg-sand/40 border border-sand text-[11px] text-amber-950 ${language === 'hi' ? 'font-devanagari' : ''}`}>
              <AlertCircle className="w-4 h-4 text-[#8C4A00] shrink-0 mt-0.5" />
              <p>
                {language === 'hi'
                  ? 'यह केवल सामान्य जानकारी के लिए है। किसी भी बीमारी में दवा का इस्तेमाल केवल डॉक्टर के निर्देशानुसार करें।'
                  : 'For general educational purposes only. Always consult your prescribing doctor or pharmacist before making medication decisions.'}
              </p>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className={`w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition shadow-xs ${language === 'hi' ? 'font-devanagari' : ''}`}
        >
          {t.common.close}
        </button>
      </div>
    </div>
  );
}
