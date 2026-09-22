/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { X, Sliders, Type, Volume2, ShieldAlert, Check, Globe } from 'lucide-react';
import { AppSettings, AppLanguage } from '../types';
import { getAvailableVoices } from '../utils/speechHelper';
import { getTranslations } from '../utils/translations';

interface AccessibilitySettingsModalProps {
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onClose: () => void;
}

export default function AccessibilitySettingsModal({
  settings,
  onSaveSettings,
  onClose,
}: AccessibilitySettingsModalProps) {
  const [current, setCurrent] = useState<AppSettings>(settings);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  const t = getTranslations(current.language || 'hi');

  useEffect(() => {
    const list = getAvailableVoices();
    setVoices(list);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
    }
  }, []);

  // Live update root font size as user selects options in the modal
  useEffect(() => {
    const size = current.textSize || 'normal';
    document.documentElement.setAttribute('data-text-size', size);
    if (size === 'large') {
      document.documentElement.style.fontSize = '18.5px';
    } else if (size === 'xlarge') {
      document.documentElement.style.fontSize = '21px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
  }, [current.textSize]);

  const handleCancel = () => {
    // Revert to original settings if canceled
    const originalSize = settings.textSize || 'normal';
    document.documentElement.setAttribute('data-text-size', originalSize);
    if (originalSize === 'large') {
      document.documentElement.style.fontSize = '18.5px';
    } else if (originalSize === 'xlarge') {
      document.documentElement.style.fontSize = '21px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
    onClose();
  };

  const handleSave = () => {
    onSaveSettings(current);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cream border border-accent/40 text-primary flex items-center justify-center shadow-xs">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <span className={`text-[11px] font-bold text-primary uppercase tracking-wider ${current.language === 'hi' ? 'font-devanagari' : ''}`}>
                {t.settings.subtitle}
              </span>
              <h3 className={`text-lg font-bold text-slate-900 ${current.language === 'hi' ? 'font-devanagari' : ''}`}>
                {t.settings.title}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-cream/50 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. App Language Selector */}
        <div className="space-y-2 p-3.5 rounded-2xl bg-cream/70 border border-sand">
          <label className={`text-xs font-bold text-primary-dark flex items-center gap-2 ${current.language === 'hi' ? 'font-devanagari' : ''}`}>
            <Globe className="w-4 h-4 text-primary" />
            <span>{t.settings.appLanguageLabel}</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'hi' as AppLanguage, label: 'हिन्दी (Hindi)', desc: 'देवनागरी लिपि' },
              { id: 'en' as AppLanguage, label: 'English', desc: 'Medical English' },
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => setCurrent({ ...current, language: lang.id })}
                className={`py-2.5 px-3 rounded-xl text-left border transition ${
                  current.language === lang.id
                    ? 'border-primary bg-white text-primary-dark font-bold ring-2 ring-accent/40 shadow-xs'
                    : 'border-sand bg-white/80 text-slate-700 hover:bg-white'
                }`}
              >
                <div className="text-xs font-bold">{lang.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{lang.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Text Size Selector */}
        <div className="space-y-2">
          <label className={`text-xs font-bold text-slate-800 flex items-center gap-2 ${current.language === 'hi' ? 'font-devanagari' : ''}`}>
            <Type className="w-4 h-4 text-primary" />
            <span>{t.settings.textSizeLabel}</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'normal', label: t.settings.sizeNormal, sample: '16px' },
              { id: 'large', label: t.settings.sizeLarge, sample: '18.5px' },
              { id: 'xlarge', label: t.settings.sizeXLarge, sample: '21px' },
            ].map((size) => (
              <button
                key={size.id}
                type="button"
                onClick={() => setCurrent({ ...current, textSize: size.id as any })}
                className={`py-2.5 px-2 rounded-xl text-center border transition ${
                  current.textSize === size.id
                    ? 'border-primary bg-cream text-primary-dark font-bold ring-2 ring-accent/30'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="text-xs">{size.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{size.sample}</div>
              </button>
            ))}
          </div>

          {/* Live sample preview box */}
          <div className="p-3 rounded-2xl bg-cream/70 border border-sand space-y-1 mt-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span className={current.language === 'hi' ? 'font-devanagari' : ''}>
                {current.language === 'hi' ? 'नमूना पूर्वावलोकन (Live Preview):' : 'Live Text Preview:'}
              </span>
              <span className="text-primary font-mono font-bold text-[11px]">
                {current.textSize === 'xlarge' ? '21px (Extra Large)' : current.textSize === 'large' ? '18.5px (Large)' : '16px (Normal)'}
              </span>
            </div>
            <p className={`font-semibold text-primary-dark text-sm leading-snug ${current.language === 'hi' ? 'font-devanagari' : ''}`}>
              {current.language === 'hi'
                ? 'पैरासिटामोल 650mg: दिन में दो बार, खाना खाने के बाद 1 गोली।'
                : 'Paracetamol 650mg: Twice daily, 1 tablet after meals.'}
            </p>
          </div>
        </div>

        {/* 3. Speech Rate Control */}
        <div className="space-y-2">
          <label className={`text-xs font-bold text-slate-800 flex items-center gap-2 ${current.language === 'hi' ? 'font-devanagari' : ''}`}>
            <Volume2 className="w-4 h-4 text-primary" />
            <span>{t.settings.speechRateLabel} ({current.speechRate}x)</span>
          </label>
          <input
            type="range"
            min="0.7"
            max="1.3"
            step="0.1"
            value={current.speechRate}
            onChange={(e) => setCurrent({ ...current, speechRate: parseFloat(e.target.value) })}
            className="w-full accent-primary cursor-pointer"
          />
          <div className={`flex justify-between text-[11px] text-slate-500 ${current.language === 'hi' ? 'font-devanagari' : ''}`}>
            <span>{t.settings.rateSlow}</span>
            <span>{t.settings.rateNormal}</span>
            <span>{t.settings.rateFast}</span>
          </div>
        </div>

        {/* 4. Preferred Voice Dropdown */}
        {voices.length > 0 && (
          <div className="space-y-1.5">
            <label className={`text-xs font-bold text-slate-800 block ${current.language === 'hi' ? 'font-devanagari' : ''}`}>
              {t.settings.voiceSelectLabel}
            </label>
            <select
              value={current.preferredVoiceName || ''}
              onChange={(e) => setCurrent({ ...current, preferredVoiceName: e.target.value || null })}
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs bg-white text-slate-800"
            >
              <option value="">{t.settings.voiceDefault}</option>
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* 5. Auto Read Aloud Toggle */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold text-slate-800 ${current.language === 'hi' ? 'font-devanagari' : ''}`}>
              {t.settings.autoPlayLabel}
            </span>
            <input
              type="checkbox"
              id="toggle-auto-read"
              checked={current.autoPlayAfterScan}
              onChange={(e) => setCurrent({ ...current, autoPlayAfterScan: e.target.checked })}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
          </div>

          {current.autoPlayAfterScan && (
            <div className={`p-2.5 rounded-xl bg-sand/50 border border-sand text-[11px] text-amber-950 flex items-start gap-2 ${current.language === 'hi' ? 'font-devanagari' : ''}`}>
              <ShieldAlert className="w-4 h-4 text-[#8C4A00] shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Check prescription with family or pharmacist for total safety.
              </span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition"
          >
            {current.language === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{t.settings.btnClose}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
