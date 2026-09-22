/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Sliders, History, Volume2, ArrowRightLeft, Globe, Type, MessageSquareText } from 'lucide-react';
import { AppLanguage } from '../types';
import { getTranslations } from '../utils/translations';

interface HeaderProps {
  language: AppLanguage;
  onToggleLanguage: () => void;
  onOpenHistory: () => void;
  onOpenSettings: () => void;
  onOpenConverter: () => void;
  savedPlansCount: number;
  onResetToCapture: () => void;
  currentStep: 'capture' | 'verify' | 'careplan';
  textSize?: 'normal' | 'large' | 'xlarge';
  onCycleTextSize?: () => void;
  onOpenChat?: () => void;
}

export default function Header({
  language,
  onToggleLanguage,
  onOpenHistory,
  onOpenSettings,
  onOpenConverter,
  savedPlansCount,
  onResetToCapture,
  currentStep,
  textSize = 'normal',
  onCycleTextSize,
  onOpenChat,
}: HeaderProps) {
  const t = getTranslations(language);

  return (
    <header id="paricharya-app-header" className="sticky top-0 z-30 bg-primary text-white shadow-md">
      <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center justify-between">
        {/* Brand identity */}
        <button
          type="button"
          onClick={onResetToCapture}
          className="flex items-center gap-2 text-left group transition active:scale-98"
          title="ParichARYA Home"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-dark/90 border border-accent/50 flex items-center justify-center shadow-inner text-cream shrink-0">
            <Volume2 className="w-5 h-5 text-cream" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`font-extrabold text-lg tracking-tight text-white ${language === 'hi' ? 'font-devanagari' : ''}`}>
                {t.brand.name}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-primary-dark text-cream border border-accent/50">
                Voice Rx
              </span>
            </div>
            <p className={`text-[11px] text-cream/90 font-medium ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {t.brand.tagline}
            </p>
          </div>
        </button>

        {/* Action icons & Language Switcher */}
        <div className="flex items-center gap-1.5">
          {/* Global Language Switcher Pill */}
          <button
            type="button"
            onClick={onToggleLanguage}
            id="btn-header-language-toggle"
            aria-label="Toggle language between Hindi and English"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-primary-dark/90 border border-accent/60 hover:bg-primary-dark transition active:scale-95 text-xs font-bold shadow-xs min-h-[40px]"
            title={language === 'hi' ? 'Switch whole app to English' : 'पूरे ऐप को हिंदी में बदलें'}
          >
            <Globe className="w-3.5 h-3.5 text-sand" />
            <div className="flex items-center text-[11px] tracking-tight">
              <span className={language === 'hi' ? 'text-cream font-extrabold' : 'text-white/70 font-normal'}>
                हिन्दी
              </span>
              <span className="mx-1 text-accent/70">/</span>
              <span className={language === 'en' ? 'text-cream font-extrabold' : 'text-white/70 font-normal'}>
                EN
              </span>
            </div>
          </button>

          {/* Hindi to English Converter Button */}
          <button
            type="button"
            onClick={onOpenConverter}
            id="btn-header-converter"
            aria-label="Hindi to English Medical Converter"
            className="p-2 rounded-xl text-cream hover:text-white hover:bg-primary-dark/70 transition active:scale-95 flex items-center justify-center min-w-[40px] min-h-[40px]"
            title={language === 'hi' ? 'हिंदी ⇄ अंग्रेज़ी अनुवादक' : 'Hindi ⇄ English Translator'}
          >
            <ArrowRightLeft className="w-4 h-4 text-sand" />
          </button>

          {/* Prescription AI Chatbot Button */}
          {onOpenChat && (
            <button
              type="button"
              onClick={onOpenChat}
              id="btn-header-chat"
              aria-label={language === 'hi' ? 'पर्चा AI सहायक से पूछें' : 'Ask Prescription AI Assistant'}
              className="p-2 rounded-xl text-cream hover:text-white hover:bg-primary-dark/70 transition active:scale-95 flex items-center justify-center min-w-[40px] min-h-[40px] relative"
              title={language === 'hi' ? 'पर्चा AI सहायक (चैटबॉट)' : 'Prescription AI Assistant'}
            >
              <MessageSquareText className="w-4 h-4 text-sand" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-accent ring-2 ring-primary"></span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenHistory}
            id="btn-header-history"
            aria-label={t.nav.history}
            className="relative p-2 rounded-xl text-cream hover:text-white hover:bg-primary-dark/70 transition active:scale-95 flex items-center justify-center min-w-[40px] min-h-[40px]"
            title={t.nav.history}
          >
            <History className="w-4 h-4" />
            {savedPlansCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-sand text-primary-dark font-extrabold text-[10px] flex items-center justify-center shadow-xs">
                {savedPlansCount}
              </span>
            )}
          </button>

          {onCycleTextSize && (
            <button
              type="button"
              onClick={onCycleTextSize}
              id="btn-header-text-size"
              aria-label={`Text display size: ${textSize}. Click to change.`}
              className="px-2 py-1.5 rounded-xl bg-primary-dark/80 border border-accent/40 text-cream hover:text-white hover:bg-primary-dark transition active:scale-95 flex items-center gap-1 justify-center min-w-[38px] min-h-[40px] shadow-xs"
              title={
                language === 'hi'
                  ? `अक्षरों का आकार: ${textSize === 'xlarge' ? 'बहुत बड़ा (20px)' : textSize === 'large' ? 'बड़ा (18px)' : 'सामान्य (16px)'} — बदलने के लिए दबाएं`
                  : `Text Size: ${textSize === 'xlarge' ? 'Extra Large (20px)' : textSize === 'large' ? 'Large (18px)' : 'Normal (16px)'} — Click to cycle`
              }
            >
              <Type className="w-3.5 h-3.5 text-sand" />
              <span className="font-extrabold text-[11px] text-cream leading-none">
                {textSize === 'xlarge' ? 'A++' : textSize === 'large' ? 'A+' : 'A'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenSettings}
            id="btn-header-settings"
            aria-label={t.nav.settings}
            className="p-2 rounded-xl text-cream hover:text-white hover:bg-primary-dark/70 transition active:scale-95 flex items-center justify-center min-w-[40px] min-h-[40px]"
            title={t.nav.settings}
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-primary-dark border-t border-accent/30 px-4 py-1.5">
        <div className={`max-w-xl mx-auto flex items-center justify-between text-[11px] font-medium text-white/80 ${language === 'hi' ? 'font-devanagari' : ''}`}>
          <span className={currentStep === 'capture' ? 'text-cream font-extrabold' : 'text-white/60'}>
            {t.steps.capture}
          </span>
          <span className="text-accent/60">›</span>
          <span className={currentStep === 'verify' ? 'text-cream font-extrabold' : 'text-white/60'}>
            {t.steps.verify}
          </span>
          <span className="text-accent/60">›</span>
          <span className={currentStep === 'careplan' ? 'text-cream font-extrabold' : 'text-white/60'}>
            {t.steps.carePlan}
          </span>
        </div>
      </div>
    </header>
  );
}
