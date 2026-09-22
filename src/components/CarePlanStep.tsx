/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  Sun, 
  Moon, 
  Utensils, 
  UtensilsCrossed, 
  Clock, 
  Sparkles, 
  Bookmark, 
  Bell, 
  Share2, 
  HelpCircle, 
  Languages, 
  Pill as PillIcon,
  CheckCircle2,
  Calendar,
  ArrowRightLeft,
  Copy,
  Check,
  MessageSquareText,
  Bot
} from 'lucide-react';
import { CarePlan, Medicine, AppLanguage } from '../types';
import SafetyBanner from './SafetyBanner';
import { speakNarration, stopSpeaking, selectBestVoice } from '../utils/speechHelper';
import { getTranslations } from '../utils/translations';

interface CarePlanStepProps {
  plan: CarePlan;
  onLanguageChange: (lang: 'hi' | 'en' | 'simple_hi') => Promise<void>;
  onOpenTermExplainer: (term: string) => void;
  onOpenReminders: () => void;
  onScanNew: () => void;
  onOpenConverter: (initialText?: string, initialDirection?: 'hi_to_en' | 'en_to_hi') => void;
  onOpenChat?: () => void;
  preferredVoiceName: string | null;
  speechRate: number;
  language?: AppLanguage;
}

export default function CarePlanStep({
  plan,
  onLanguageChange,
  onOpenTermExplainer,
  onOpenReminders,
  onScanNew,
  onOpenConverter,
  onOpenChat,
  preferredVoiceName,
  speechRate,
  language = 'hi',
}: CarePlanStepProps) {
  const t = getTranslations(language);
  const [isPlayingFull, setIsPlayingFull] = useState(false);
  const [playingMedId, setPlayingMedId] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'hi' | 'en' | 'simple_hi'>(plan.language || 'hi');
  const [currentRate, setCurrentRate] = useState<number>(speechRate || 0.95);
  const [voiceLabel, setVoiceLabel] = useState<string>('');
  const [isHindiNativeVoice, setIsHindiNativeVoice] = useState<boolean>(true);
  const [isSavedBadge, setIsSavedBadge] = useState<boolean>(true);
  const [viewTranscript, setViewTranscript] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'visual' | 'bilingual'>('visual');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    // Detect active voice
    const info = selectBestVoice(preferredVoiceName);
    setVoiceLabel(info.label);
    setIsHindiNativeVoice(info.isHindiNative);

    return () => {
      stopSpeaking();
    };
  }, [preferredVoiceName]);

  const activeScript =
    selectedLanguage === 'en'
      ? plan.english_script
      : plan.hindi_script;

  const handleTogglePlayFull = () => {
    if (isPlayingFull) {
      stopSpeaking();
      setIsPlayingFull(false);
      setPlayingMedId(null);
    } else {
      stopSpeaking();
      setPlayingMedId(null);
      setIsPlayingFull(true);

      speakNarration({
        text: activeScript,
        rate: currentRate,
        preferredVoiceName,
        onStart: () => setIsPlayingFull(true),
        onEnd: () => setIsPlayingFull(false),
        onError: () => setIsPlayingFull(false),
      });
    }
  };

  const handlePlaySingleMedicine = (med: Medicine) => {
    stopSpeaking();
    setIsPlayingFull(false);

    // Find custom line if generated, or build fallback
    const matchedLine = plan.medicine_scripts?.find(
      (ms) => ms.drug_name.toLowerCase() === med.drug_name.toLowerCase(),
    );

    let textToSpeak = '';
    if (selectedLanguage === 'en') {
      textToSpeak = matchedLine?.english_line || `${med.drug_name}: Take ${med.frequency_plain} ${med.food_relation}.`;
    } else {
      textToSpeak = matchedLine?.hindi_line || `${med.drug_name}: यह दवाई ${med.frequency_plain} ${med.food_relation === 'after_food' ? 'खाने के बाद' : 'खाली पेट'} लेनी है।`;
    }

    setPlayingMedId(med.id);
    speakNarration({
      text: textToSpeak,
      rate: currentRate,
      preferredVoiceName,
      onStart: () => setPlayingMedId(med.id),
      onEnd: () => setPlayingMedId(null),
      onError: () => setPlayingMedId(null),
    });
  };

  const handleLanguageSelect = async (lang: 'hi' | 'en' | 'simple_hi') => {
    setSelectedLanguage(lang);
    stopSpeaking();
    setIsPlayingFull(false);
    setPlayingMedId(null);
    await onLanguageChange(lang);
  };

  // Helper to deduce times of day from shorthand for low-literacy icons
  const parseTimesOfDay = (freqRaw: string) => {
    const raw = freqRaw.toUpperCase();
    const isMorning = raw.includes('OD') || raw.includes('BD') || raw.includes('TDS') || raw.includes('QID') || raw.includes('BBF') || raw.startsWith('1-');
    const isAfternoon = raw.includes('TDS') || raw.includes('QID') || raw.includes('-1-');
    const isNight = raw.includes('BD') || raw.includes('TDS') || raw.includes('QID') || raw.includes('HS') || raw.endsWith('-1');

    return { isMorning, isAfternoon, isNight };
  };

  return (
    <div id="paricharya-care-plan" className="space-y-6">
      {/* Safety Cross-Check Banner */}
      <SafetyBanner alerts={plan.safety_alerts || []} language={language} />

      {/* Main Audio Player Card */}
      <div className="bg-gradient-to-br from-primary via-primary to-primary-dark rounded-3xl p-6 text-white shadow-xl border border-accent/40 relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-accent/20 blur-2xl pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-dark/80 border border-accent/40 text-cream text-xs font-semibold">
              <Volume2 className="w-3.5 h-3.5 text-sand" />
              <span className={language === 'hi' ? 'font-devanagari' : ''}>{t.carePlan.title}</span>
            </div>
            <h2 className={`text-xl font-bold tracking-tight text-white ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {isPlayingFull ? t.carePlan.playingFull : t.carePlan.readyToListen}
            </h2>
            <p className={`text-xs text-cream/90 max-w-sm ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {t.carePlan.audioSubtitle}
            </p>
          </div>

          {/* Big Accessible Play Button */}
          <button
            type="button"
            onClick={handleTogglePlayFull}
            id="btn-play-full-audio"
            aria-label={isPlayingFull ? 'Pause Spoken Care Plan' : 'Play Spoken Care Plan'}
            className="w-20 h-20 rounded-full bg-cream hover:bg-sand text-primary-dark flex items-center justify-center shadow-xl active:scale-95 transition transform shrink-0 min-w-[70px] min-h-[70px] border border-sand"
          >
            {isPlayingFull ? (
              <Pause className="w-10 h-10 fill-current" />
            ) : (
              <Play className="w-10 h-10 fill-current ml-1" />
            )}
          </button>
        </div>

        {/* Audio status and speed controls */}
        <div className="mt-5 pt-4 border-t border-accent/30 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Voice indicator badge */}
          <div className="flex items-center gap-2 text-cream/90">
            <span className={`w-2 h-2 rounded-full ${isPlayingFull ? 'bg-accent animate-ping' : 'bg-sand'}`}></span>
            <span className="truncate max-w-[200px]" title={voiceLabel}>
              {language === 'hi'
                ? `आवाज़: ${isHindiNativeVoice ? 'हिंदी (Native Hindi Voice)' : voiceLabel}`
                : `Voice: ${voiceLabel || 'Speech Synthesizer'}`}
            </span>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center gap-1 bg-primary-dark/90 p-1 rounded-xl border border-accent/40">
            <span className={`text-[11px] text-cream px-1 ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {t.carePlan.speed}
            </span>
            {[
              { label: language === 'hi' ? '0.8x धीमा' : '0.8x Slow', rate: 0.8 },
              { label: language === 'hi' ? '1.0x सामान्य' : '1.0x Normal', rate: 1.0 },
              { label: language === 'hi' ? '1.2x तेज़' : '1.2x Fast', rate: 1.2 },
            ].map((spd) => (
              <button
                key={spd.rate}
                type="button"
                onClick={() => {
                  setCurrentRate(spd.rate);
                  if (isPlayingFull) {
                    stopSpeaking();
                    setIsPlayingFull(false);
                  }
                }}
                className={`px-2 py-1 rounded-lg text-[11px] font-bold transition ${
                  currentRate === spd.rate
                    ? 'bg-cream text-primary-dark shadow-xs'
                    : 'text-cream/80 hover:bg-primary'
                }`}
              >
                {spd.label}
              </button>
            ))}
          </div>
        </div>

        {/* Language switcher bar */}
        <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-accent/30">
          <div className="flex items-center gap-1 text-[11px] text-cream">
            <Languages className="w-3.5 h-3.5 text-sand" />
            <span className={language === 'hi' ? 'font-devanagari' : ''}>{t.carePlan.chooseLanguage}:</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleLanguageSelect('hi')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                selectedLanguage === 'hi'
                  ? 'bg-cream text-primary-dark shadow-xs'
                  : 'bg-primary-dark/80 text-cream hover:bg-primary'
              }`}
            >
              {t.carePlan.standardHindi}
            </button>
            <button
              type="button"
              onClick={() => handleLanguageSelect('simple_hi')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                selectedLanguage === 'simple_hi'
                  ? 'bg-cream text-primary-dark shadow-xs'
                  : 'bg-primary-dark/80 text-cream hover:bg-primary'
              }`}
            >
              {t.carePlan.simpleHindi}
            </button>
            <button
              type="button"
              onClick={() => handleLanguageSelect('en')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                selectedLanguage === 'en'
                  ? 'bg-cream text-primary-dark shadow-xs'
                  : 'bg-primary-dark/80 text-cream hover:bg-primary'
              }`}
            >
              {t.carePlan.english}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Hindi ⇄ English Converter Shortcut Banner */}
      <div className="bg-cream/90 rounded-2xl p-3.5 border border-sand flex items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary text-cream flex items-center justify-center shrink-0 shadow-xs">
            <ArrowRightLeft className="w-4 h-4 text-sand" />
          </div>
          <div>
            <h4 className={`text-xs font-bold text-primary-dark ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {language === 'hi'
                ? 'हिंदी ⇄ अंग्रेज़ी रूपांतरण (Hindi ⇄ English Translator)'
                : 'Hindi ⇄ English Medical Translator'}
            </h4>
            <p className={`text-[11px] text-primary/80 ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {language === 'hi'
                ? 'पर्चे के किसी भी शब्द, संकेत या वाक्य का तुरंत सटीक अनुवाद देखें'
                : 'Look up medical abbreviations, prescription terms & dosages in Hindi or English'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenConverter()}
          id="btn-open-converter-from-plan"
          className="px-3 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-sand" />
          <span className={language === 'hi' ? 'font-devanagari' : ''}>{t.carePlan.openTranslator}</span>
        </button>
      </div>

      {/* Interactive Prescription AI Chatbot Banner */}
      {onOpenChat && (
        <div className="bg-gradient-to-r from-primary/10 via-cream to-accent/20 rounded-2xl p-3.5 border border-accent/40 flex items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary text-cream flex items-center justify-center shrink-0 shadow-xs">
              <Bot className="w-5 h-5 text-sand" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className={`text-xs font-bold text-primary-dark ${language === 'hi' ? 'font-devanagari' : ''}`}>
                  {language === 'hi' ? 'परिचर्या AI पर्चा सहायक' : 'Prescription AI Companion'}
                </h4>
                <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-primary text-cream">
                  AI Chat
                </span>
              </div>
              <p className={`text-[11px] text-slate-700 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                {language === 'hi'
                  ? 'दवा कब लेनी है, खाली पेट या खाने के बाद, खुराक छूटने पर क्या करें — तुरंत पूछें'
                  : 'Ask about dosages, empty-stomach rules, missed doses, and precautions'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenChat}
            id="btn-open-chat-from-plan"
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-xs active:scale-95"
          >
            <MessageSquareText className="w-3.5 h-3.5 text-sand" />
            <span className={language === 'hi' ? 'font-devanagari' : ''}>
              {language === 'hi' ? 'सवाल पूछें' : 'Ask AI'}
            </span>
          </button>
        </div>
      )}

      {/* Spoken Narration Transcript Box (Toggleable & Comparative) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewTranscript(!viewTranscript)}
            className={`flex items-center gap-2 text-xs font-bold text-primary hover:text-primary-dark ${language === 'hi' ? 'font-devanagari' : ''}`}
          >
            <span>{viewTranscript ? t.carePlan.hideTranscript : t.carePlan.readTranscript}</span>
          </button>
          <span className={`text-[11px] text-slate-500 ${language === 'hi' ? 'font-devanagari' : ''}`}>
            {language === 'hi' ? 'हिंदी देवनागरी एवं English' : 'Hindi & English Dual Script'}
          </span>
        </div>

        {viewTranscript && (
          <div className="mt-3 space-y-3 pt-2 border-t border-slate-100">
            {/* Hindi Narration Box */}
            <div className="p-3.5 rounded-xl bg-cream/80 border border-sand text-slate-900 text-sm leading-relaxed font-devanagari space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-primary-dark">
                <span className="flex items-center gap-1">
                  <span>🇮🇳 हिंदी बोली (Hindi Audio Script)</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    speakNarration({
                      text: plan.hindi_script,
                      rate: currentRate,
                      preferredVoiceName,
                    });
                  }}
                  className="px-2 py-0.5 rounded-md bg-white border border-sand text-primary-dark hover:bg-sand/40 flex items-center gap-1 text-[11px]"
                >
                  <Volume2 className="w-3 h-3 text-primary" />
                  <span>{t.carePlan.listen}</span>
                </button>
              </div>
              <p>{plan.hindi_script}</p>
            </div>

            {/* English Narration Box */}
            <div className="p-3.5 rounded-xl bg-sand/30 border border-sand text-slate-800 text-sm leading-relaxed space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>🇬🇧 English Translation (अंग्रेज़ी रूपांतरण)</span>
                <button
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    speakNarration({
                      text: plan.english_script,
                      rate: currentRate,
                      preferredVoiceName: null,
                    });
                  }}
                  className="px-2 py-0.5 rounded-md bg-white border border-sand text-slate-800 hover:bg-sand/40 flex items-center gap-1 text-[11px]"
                >
                  <Volume2 className="w-3 h-3 text-primary" />
                  <span>{t.carePlan.listen}</span>
                </button>
              </div>
              <p>{plan.english_script}</p>
            </div>
          </div>
        )}
      </div>

      {/* View Switcher Tabs: Visual Schedule vs Bilingual Hindi-English Comparison */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 p-1 bg-sand/40 rounded-2xl border border-sand">
          <button
            type="button"
            onClick={() => setActiveTab('visual')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${language === 'hi' ? 'font-devanagari' : ''} ${
              activeTab === 'visual'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-700 hover:text-primary'
            }`}
          >
            <span>{t.carePlan.visualSchedule}</span>
            <span className="text-[10px] text-cream font-normal hidden sm:inline">(Visual)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bilingual')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${language === 'hi' ? 'font-devanagari' : ''} ${
              activeTab === 'bilingual'
                ? 'bg-primary text-white shadow-xs'
                : 'text-slate-700 hover:text-primary'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{t.carePlan.bilingualConversion}</span>
            <span className="text-[10px] text-sand font-normal hidden sm:inline">(Bilingual)</span>
          </button>
        </div>

        <span className={`text-xs font-bold px-2.5 py-1 rounded-full bg-cream text-primary-dark border border-accent/40 ${language === 'hi' ? 'font-devanagari' : ''}`}>
          {plan.medicines.length} {t.carePlan.medicineCountSuffix}
        </span>
      </div>

      {/* Tab 2: Bilingual Hindi to English Conversion Cards */}
      {activeTab === 'bilingual' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className={`p-3 bg-cream/90 rounded-2xl border border-sand text-xs text-amber-950 flex items-center justify-between ${language === 'hi' ? 'font-devanagari' : ''}`}>
            <span>
              {language === 'hi'
                ? 'दवाई के प्रत्येक निर्देश का हिंदी एवं अंग्रेज़ी समानांतर अनुवाद नीचे देखें:'
                : 'View parallel Hindi and English instructions for each prescribed medicine below:'}
            </span>
            <button
              type="button"
              onClick={() => onOpenConverter()}
              className="font-bold underline text-primary hover:text-primary-dark"
            >
              {language === 'hi' ? 'कस्टम वाक्य अनुवाद करें' : 'Translate Custom Phrase'}
            </button>
          </div>

          {plan.medicines.map((med, index) => {
            const matchedLine = plan.medicine_scripts?.find(
              (ms) => ms.drug_name.toLowerCase() === med.drug_name.toLowerCase(),
            );
            const hindiText = matchedLine?.hindi_line || `${med.drug_name}: यह दवाई ${med.frequency_plain} ${med.food_relation === 'after_food' ? 'खाने के बाद' : 'खाली पेट'} लेनी है।`;
            const englishText = matchedLine?.english_line || `Take ${med.drug_name} (${med.form}) ${med.frequency_plain}, ${med.food_relation.replace('_', ' ')}.`;

            return (
              <div
                key={med.id}
                className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 hover:border-accent space-y-4 transition"
              >
                {/* Header: Name, Doctor Shorthand */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-cream border border-accent/40 text-primary font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-base text-slate-900">
                      {med.drug_name}
                    </h4>
                    {med.strength && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sand/60 text-primary-dark">
                        {med.strength}
                      </span>
                    )}
                  </div>

                  {/* Doctor Shorthand Badge */}
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-xl bg-cream text-primary-dark border border-sand">
                    {med.frequency_raw} • {med.food_relation === 'before_food' || med.food_relation === 'empty_stomach' ? 'AC/BBF' : 'PC'}
                  </span>
                </div>

                {/* Parallel Translation Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Hindi Box */}
                  <div className="p-3.5 rounded-2xl bg-cream/80 border border-accent/40 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-primary-dark font-devanagari">
                      <span>🇮🇳 {t.carePlan.hindiInstructions}</span>
                      <button
                        type="button"
                        onClick={() => {
                          stopSpeaking();
                          speakNarration({
                            text: hindiText,
                            rate: currentRate,
                            preferredVoiceName,
                          });
                        }}
                        className="px-2 py-1 rounded-lg bg-primary text-white text-[11px] font-semibold flex items-center gap-1 hover:bg-primary-dark transition shadow-2xs"
                      >
                        <Volume2 className="w-3 h-3 text-sand" />
                        <span>{t.carePlan.listen}</span>
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 font-devanagari leading-snug">
                      {hindiText}
                    </p>
                  </div>

                  {/* English Box */}
                  <div className="p-3.5 rounded-2xl bg-sand/35 border border-sand space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>🇬🇧 {t.carePlan.englishConversion}</span>
                      <button
                        type="button"
                        onClick={() => {
                          stopSpeaking();
                          speakNarration({
                            text: englishText,
                            rate: currentRate,
                            preferredVoiceName: null,
                          });
                        }}
                        className="px-2 py-1 rounded-lg bg-primary text-white text-[11px] font-semibold flex items-center gap-1 hover:bg-primary-dark transition shadow-2xs"
                      >
                        <Volume2 className="w-3 h-3 text-sand" />
                        <span>{t.carePlan.listen}</span>
                      </button>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {englishText}
                    </p>
                  </div>
                </div>

                {/* Action Bar: Open in Converter & Copy */}
                <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onOpenConverter(hindiText, 'hi_to_en')}
                    className={`text-primary hover:text-primary-dark font-semibold flex items-center gap-1 ${language === 'hi' ? 'font-devanagari' : ''}`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>{t.carePlan.checkOrEditTranslator}</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenTermExplainer(med.drug_name)}
                      className={`text-slate-500 hover:text-primary-dark font-medium ${language === 'hi' ? 'font-devanagari' : ''}`}
                    >
                      {t.carePlan.drugInfo}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const copyText = `${med.drug_name}: ${hindiText} | ${englishText}`;
                        navigator.clipboard.writeText(copyText);
                        setCopiedIndex(index);
                        setTimeout(() => setCopiedIndex(null), 2000);
                      }}
                      className={`p-1 rounded-md text-slate-500 hover:text-slate-800 flex items-center gap-1 ${language === 'hi' ? 'font-devanagari' : ''}`}
                      title="Copy translation"
                    >
                      {copiedIndex === index ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-primary" />
                          <span className="text-primary font-bold">{t.carePlan.copied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{t.carePlan.copy}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 1: Visual Low-Literacy Schedule Cards Per Medicine */}
      {activeTab === 'visual' && (
      <div className="space-y-4">
        {plan.medicines.map((med, index) => {
          const { isMorning, isAfternoon, isNight } = parseTimesOfDay(med.frequency_raw);
          const isPlayingThis = playingMedId === med.id;
          const isBeforeFood = med.food_relation === 'before_food' || med.food_relation === 'empty_stomach';

          return (
            <div
              key={med.id}
              className={`bg-white rounded-3xl p-5 shadow-sm border transition-all ${
                isPlayingThis
                  ? 'border-accent ring-2 ring-accent/40 bg-cream/30'
                  : 'border-slate-200 hover:border-accent'
              }`}
            >
              {/* Top Row: Name, Form & Per-Medicine Audio Replay Button */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-cream border border-accent/40 text-primary font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-lg text-slate-900 tracking-tight">
                      {med.drug_name}
                    </h4>
                    {med.strength && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sand/60 text-primary-dark">
                        {med.strength}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className={`capitalize font-medium text-primary ${language === 'hi' ? 'font-devanagari' : ''}`}>
                      {med.form === 'tablet'
                        ? (language === 'hi' ? 'गोली (Tablet)' : 'Tablet')
                        : med.form === 'capsule'
                        ? (language === 'hi' ? 'कैप्सूल (Capsule)' : 'Capsule')
                        : med.form === 'syrup'
                        ? (language === 'hi' ? 'सिरप (Syrup)' : 'Syrup')
                        : med.form}
                    </span>
                    {med.duration_days && (
                      <span className={`flex items-center gap-1 text-slate-600 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                        • {language === 'hi' ? `${med.duration_days} दिनों तक` : `For ${med.duration_days} days`}
                      </span>
                    )}
                  </div>
                </div>

                {/* Per-Medicine Audio Replay Button (Single tap voice!) */}
                <button
                  type="button"
                  onClick={() => handlePlaySingleMedicine(med)}
                  id={`btn-replay-med-${index}`}
                  className={`p-3 rounded-2xl flex items-center gap-2 transition active:scale-95 shadow-xs shrink-0 min-h-[44px] ${
                    isPlayingThis
                      ? 'bg-primary text-white font-bold animate-pulse'
                      : 'bg-cream hover:bg-sand text-primary-dark border border-accent/40 font-semibold'
                  }`}
                  title="Replay this medicine"
                >
                  <Volume2 className={`w-5 h-5 ${isPlayingThis ? 'text-sand' : 'text-primary'}`} />
                  <span className={`text-xs hidden sm:inline ${language === 'hi' ? 'font-devanagari' : ''}`}>
                    {isPlayingThis ? t.carePlan.playingThis : t.carePlan.replayThis}
                  </span>
                </button>
              </div>

              {/* Visual Icon Grid (Purely Graphic Visual Schedule for Low-Literacy) */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* 1. Morning Time Badge */}
                <div
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center border ${
                    isMorning
                      ? 'bg-cream border-accent/70 text-primary-dark shadow-2xs'
                      : 'bg-slate-50 border-slate-200/60 text-slate-400 opacity-60'
                  }`}
                >
                  <Sun className={`w-7 h-7 ${isMorning ? 'text-primary' : 'text-slate-400'}`} />
                  <span className={`text-xs font-bold mt-1 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                    {t.carePlan.morning}
                  </span>
                  <span className="text-[10px] font-medium">Morning</span>
                  <span className={`text-xs font-extrabold mt-0.5 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                    {isMorning ? t.carePlan.oneDose : t.carePlan.noDose}
                  </span>
                </div>

                {/* 2. Afternoon Time Badge */}
                <div
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center border ${
                    isAfternoon
                      ? 'bg-sand/50 border-sand text-amber-950 shadow-2xs'
                      : 'bg-slate-50 border-slate-200/60 text-slate-400 opacity-60'
                  }`}
                >
                  <Sun className={`w-7 h-7 ${isAfternoon ? 'text-[#8C4A00]' : 'text-slate-400'}`} />
                  <span className={`text-xs font-bold mt-1 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                    {t.carePlan.afternoon}
                  </span>
                  <span className="text-[10px] font-medium">Afternoon</span>
                  <span className={`text-xs font-extrabold mt-0.5 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                    {isAfternoon ? t.carePlan.oneDose : t.carePlan.noDose}
                  </span>
                </div>

                {/* 3. Night Time Badge */}
                <div
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center border ${
                    isNight
                      ? 'bg-sand-dark/20 border-sand-dark/40 text-slate-900 shadow-2xs'
                      : 'bg-slate-50 border-slate-200/60 text-slate-400 opacity-60'
                  }`}
                >
                  <Moon className={`w-7 h-7 ${isNight ? 'text-primary-dark' : 'text-slate-400'}`} />
                  <span className={`text-xs font-bold mt-1 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                    {t.carePlan.night}
                  </span>
                  <span className="text-[10px] font-medium">Night / Bedtime</span>
                  <span className={`text-xs font-extrabold mt-0.5 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                    {isNight ? t.carePlan.oneDose : t.carePlan.noDose}
                  </span>
                </div>

                {/* 4. Food Timing Badge (Plate with cutlery vs Crossed Plate) */}
                <div
                  className={`p-3 rounded-2xl flex flex-col items-center justify-center text-center border ${
                    isBeforeFood
                      ? 'bg-sand/60 border-sand-dark/50 text-amber-950 shadow-2xs'
                      : 'bg-cream border-accent/70 text-primary-dark shadow-2xs'
                  }`}
                >
                  {isBeforeFood ? (
                    <UtensilsCrossed className="w-7 h-7 text-[#8C4A00]" />
                  ) : (
                    <Utensils className="w-7 h-7 text-primary" />
                  )}
                  <span className={`text-xs font-bold mt-1 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                    {isBeforeFood ? t.carePlan.emptyStomach : t.carePlan.afterFood}
                  </span>
                  <span className="text-[10px] font-medium">
                    {isBeforeFood ? t.carePlan.beforeFoodAc : t.carePlan.afterFoodPc}
                  </span>
                  <span className={`text-xs font-extrabold mt-0.5 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                    {isBeforeFood ? t.carePlan.beforeBreakfast : t.carePlan.afterMeal}
                  </span>
                </div>
              </div>

              {/* Visual Pill Icons Counter */}
              <div className="mt-3 p-3 rounded-xl bg-cream/30 border border-sand flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className={`text-slate-600 font-medium ${language === 'hi' ? 'font-devanagari' : ''}`}>
                    {t.carePlan.dosageQty}:
                  </span>
                  <div className="flex items-center gap-1 text-primary">
                    {med.form === 'syrup' ? (
                      <span className="font-bold text-xs bg-sand/70 text-primary-dark px-2 py-0.5 rounded">
                        🥄 {language === 'hi' ? '1 चम्मच / 10 मिलीलीटर' : '1 Spoon / 10 ml'}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <PillIcon className="w-5 h-5 text-primary fill-accent/40" />
                        <span className={`font-bold text-slate-800 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                          {language === 'hi'
                            ? `1 ${med.form === 'capsule' ? 'कैप्सूल' : 'गोली'} प्रति समय`
                            : `1 ${med.form === 'capsule' ? 'Capsule' : 'Tablet'} per dose`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* "Explain this term" Tap-to-ask feature */}
                <button
                  type="button"
                  onClick={() => onOpenTermExplainer(med.drug_name)}
                  className={`text-primary hover:text-primary-dark font-semibold text-xs flex items-center gap-1 hover:underline ${language === 'hi' ? 'font-devanagari' : ''}`}
                >
                  <HelpCircle className="w-4 h-4 text-primary" />
                  <span>{t.carePlan.whatIsThisFor}</span>
                </button>
              </div>

              {/* Special doctor note if present */}
              {med.special_instructions && (
                <div className={`mt-2 text-xs text-amber-950 bg-sand/40 p-2 rounded-lg border border-sand ${language === 'hi' ? 'font-devanagari' : ''}`}>
                  <strong>{t.carePlan.specialAdvice}:</strong> {med.special_instructions}
                </div>
              )}
            </div>
          );
        })}
      </div>
      )}

      {/* Floating Action Buttons for Reminders & History */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onOpenReminders}
            id="btn-open-reminders"
            className="w-full sm:flex-1 py-3.5 px-4 rounded-2xl bg-cream hover:bg-sand text-primary-dark font-bold text-sm border border-sand transition flex items-center justify-center gap-2 min-h-[48px] shadow-xs"
          >
            <Bell className="w-5 h-5 text-primary" />
            <span className={language === 'hi' ? 'font-devanagari' : ''}>{t.carePlan.remindersButton}</span>
          </button>

          <button
            type="button"
            onClick={onScanNew}
            id="btn-scan-another"
            className="w-full sm:w-auto py-3.5 px-5 rounded-2xl bg-primary hover:bg-primary-dark text-white font-bold text-sm transition flex items-center justify-center gap-2 min-h-[48px] shadow-xs"
          >
            <RotateCcw className="w-4 h-4 text-sand" />
            <span className={language === 'hi' ? 'font-devanagari' : ''}>{t.carePlan.scanAnother}</span>
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 text-xs text-primary-dark pt-1">
          <CheckCircle2 className="w-4 h-4 text-primary" />
          <span className={`font-medium ${language === 'hi' ? 'font-devanagari' : ''}`}>
            {t.carePlan.savedNote}
          </span>
        </div>
      </div>
    </div>
  );
}
