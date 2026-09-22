/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { 
  X, 
  ArrowRightLeft, 
  Volume2, 
  Copy, 
  Check, 
  Sparkles, 
  Mic, 
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { speakNarration, stopSpeaking } from '../utils/speechHelper';
import { AppLanguage } from '../types';
import { getTranslations } from '../utils/translations';

interface HindiToEnglishConverterModalProps {
  isOpen: boolean;
  onClose: () => void;
  preferredVoiceName: string | null;
  speechRate: number;
  initialText?: string;
  initialDirection?: 'hi_to_en' | 'en_to_hi';
  language?: AppLanguage;
}

const COMMON_PRESETS = [
  { label: 'दिन में 2 बार भोजन बाद', hi: 'दिन में दो बार भोजन के बाद', en: 'Take twice daily after meals (1-0-1 BD PC)' },
  { label: 'सुबह खाली पेट', hi: 'सुबह खाली पेट नाश्ते से आधा घंटा पहले', en: 'Take once daily on an empty stomach 30 mins before breakfast (1 OD BBF)' },
  { label: 'रात को सोते समय', hi: 'रात को सोने से पहले 1 गोली', en: 'Take 1 tablet at bedtime (1 HS)' },
  { label: 'ज़रूरत पड़ने पर / बुखार में', hi: 'बुखार या तेज दर्द होने पर', en: 'Take as needed when fever or pain arises (SOS / PRN)' },
  { label: 'दिन में 3 बार', hi: 'दिन में तीन बार खाने के बाद', en: 'Take three times daily after food (1-1-1 TDS PC)' },
  { label: '1 OD BBF x 5d', en: '1 tab OD BBF x 5 days', hi: '5 दिनों तक रोज़ सुबह खाली पेट नाश्ते से पहले 1 गोली लें' },
  { label: '1 BD PC x 3d', en: '1 tab BD PC x 3 days', hi: '3 दिनों तक रोज़ सुबह और रात को खाने के बाद 1 गोली लें' },
];

export default function HindiToEnglishConverterModal({
  isOpen,
  onClose,
  preferredVoiceName,
  speechRate,
  initialText = '',
  initialDirection = 'hi_to_en',
  language = 'hi',
}: HindiToEnglishConverterModalProps) {
  const t = getTranslations(language);
  const [direction, setDirection] = useState<'hi_to_en' | 'en_to_hi'>(initialDirection);
  const [inputText, setInputText] = useState(initialText);
  const [isConverting, setIsConverting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isPlayingInput, setIsPlayingInput] = useState(false);
  const [isPlayingOutput, setIsPlayingOutput] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [result, setResult] = useState<{
    converted_text: string;
    source_language: string;
    target_language: string;
    explanation: string;
    phonetic?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleToggleDirection = () => {
    stopSpeaking();
    const newDir = direction === 'hi_to_en' ? 'en_to_hi' : 'hi_to_en';
    setDirection(newDir);
    // Swap inputs if result exists
    if (result) {
      setInputText(result.converted_text);
      setResult(null);
    }
  };

  const handleConvert = async (textToConvert = inputText) => {
    const text = textToConvert.trim();
    if (!text) return;

    setIsConverting(true);
    setErrorMsg(null);
    stopSpeaking();

    try {
      const res = await fetch('/api/convert-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          direction,
        }),
      });

      if (!res.ok) {
        throw new Error(language === 'hi' ? 'रूपांतरण में समस्या आई, कृपया पुनः प्रयास करें।' : 'Conversion request failed, please try again.');
      }

      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error('Conversion error:', err);
      setErrorMsg(err.message || (language === 'hi' ? 'रूपांतरण में त्रुटि हुई' : 'Error converting text'));
    } finally {
      setIsConverting(false);
    }
  };

  const handleSelectPreset = (preset: typeof COMMON_PRESETS[0]) => {
    stopSpeaking();
    if (direction === 'hi_to_en') {
      setInputText(preset.hi);
      handleConvert(preset.hi);
    } else {
      setInputText(preset.en);
      handleConvert(preset.en);
    }
  };

  const handleCopy = () => {
    if (!result?.converted_text) return;
    navigator.clipboard.writeText(result.converted_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeakText = (text: string, isHindi: boolean, isOutput: boolean) => {
    stopSpeaking();
    if (isOutput) {
      setIsPlayingOutput(true);
      setIsPlayingInput(false);
    } else {
      setIsPlayingInput(true);
      setIsPlayingOutput(false);
    }

    speakNarration({
      text,
      rate: speechRate || 0.95,
      preferredVoiceName: isHindi ? preferredVoiceName : null,
      onStart: () => {
        if (isOutput) setIsPlayingOutput(true);
        else setIsPlayingInput(true);
      },
      onEnd: () => {
        setIsPlayingOutput(false);
        setIsPlayingInput(false);
      },
      onError: () => {
        setIsPlayingOutput(false);
        setIsPlayingInput(false);
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        id="hindi-to-english-modal"
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="bg-primary px-6 py-4 text-white flex items-center justify-between border-b border-primary-dark/30">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary-dark/80 border border-accent/40 flex items-center justify-center text-sand">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`font-bold text-base ${language === 'hi' ? 'font-devanagari' : ''}`}>
                {language === 'hi' ? 'हिंदी ⇄ अंग्रेज़ी रूपांतरण' : 'Hindi ⇄ English Translator'}
              </h3>
              <p className={`text-xs text-sand/90 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                {language === 'hi' ? 'Medical Hindi ⇄ English Prescription Translator' : 'Bilingual Clinical Translation & Shorthand Explainer'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-1.5 rounded-full hover:bg-primary-dark/70 text-sand/80 hover:text-white transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-800">
          {/* Direction Toggle Card */}
          <div className="flex items-center justify-between p-2 rounded-2xl bg-cream/80 border border-sand">
            <div className="flex items-center gap-2 px-3 py-1 font-bold text-xs text-primary-dark">
              <span className={direction === 'hi_to_en' ? 'text-primary-dark font-extrabold' : 'text-slate-500'}>
                {language === 'hi' ? 'हिंदी (Hindi)' : 'Hindi'}
              </span>
              <span className="text-primary font-bold">➔</span>
              <span className={direction === 'en_to_hi' ? 'text-primary-dark font-extrabold' : 'text-slate-500'}>
                {language === 'hi' ? 'English (अंग्रेज़ी)' : 'English'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleDirection}
              className={`px-3 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs ${language === 'hi' ? 'font-devanagari' : ''}`}
              title="Switch translation direction"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-sand" />
              <span>{language === 'hi' ? 'दिशा बदलें (Swap)' : 'Swap'}</span>
            </button>
          </div>

          {/* Quick Preset Badges */}
          <div>
            <div className={`flex items-center justify-between text-[11px] font-semibold text-slate-500 mb-1.5 ${language === 'hi' ? 'font-devanagari' : ''}`}>
              <span>{language === 'hi' ? 'अक्सर इस्तेमाल होने वाले वाक्यांश (Common Presets):' : 'Common Prescription Phrases:'}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COMMON_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-cream hover:text-primary-dark hover:border-accent/50 text-slate-700 border border-slate-200 transition ${language === 'hi' ? 'font-devanagari' : ''}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Input Box */}
          <div className="space-y-1.5">
            <label className={`text-xs font-bold text-slate-700 flex items-center justify-between ${language === 'hi' ? 'font-devanagari' : ''}`}>
              <span>
                {direction === 'hi_to_en'
                  ? (language === 'hi' ? 'हिंदी में पर्चे की बात लिखें:' : 'Enter prescription instructions in Hindi:')
                  : (language === 'hi' ? 'अंग्रेज़ी निर्देश या शॉर्टहैंड लिखें:' : 'Enter English shorthand / instructions:')}
              </span>
              <span className="text-[11px] text-slate-400 font-normal">
                {direction === 'hi_to_en'
                  ? (language === 'hi' ? 'उदा. खाली पेट सुबह 1 गोली' : 'e.g. खाली पेट सुबह 1 गोली')
                  : 'e.g. 1 tab BD PC, Pan-D 40 OD BBF'}
              </span>
            </label>
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={3}
                placeholder={
                  direction === 'hi_to_en'
                    ? (language === 'hi' ? 'यहाँ हिंदी में लिखें या ऊपर दिए गए बटनों में से चुनें...' : 'Type in Hindi or select from presets above...')
                    : (language === 'hi' ? 'Type English medical shorthand or doctor instruction...' : 'Type English medical shorthand or doctor instructions...')
                }
                className={`w-full p-3 text-sm rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent ${language === 'hi' ? 'font-devanagari' : ''}`}
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleConvert()}
              disabled={isConverting || !inputText.trim()}
              className={`flex-1 py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-sm transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${language === 'hi' ? 'font-devanagari' : ''}`}
            >
              {isConverting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{language === 'hi' ? 'रूपांतरण हो रहा है...' : 'Translating...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-sand" />
                  <span>
                    {direction === 'hi_to_en'
                      ? (language === 'hi' ? 'अंग्रेज़ी में अनुवाद करें (Convert to English)' : 'Convert to English')
                      : (language === 'hi' ? 'हिंदी में अनुवाद करें (Convert to Hindi)' : 'Convert to Hindi')}
                  </span>
                </>
              )}
            </button>

            {inputText.trim() && (
              <button
                type="button"
                onClick={() => {
                  stopSpeaking();
                  setInputText('');
                  setResult(null);
                  setErrorMsg(null);
                }}
                className={`py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs transition ${language === 'hi' ? 'font-devanagari' : ''}`}
                title="Clear input"
              >
                {language === 'hi' ? 'हटाएं (Clear)' : 'Clear'}
              </button>
            )}
          </div>

          {/* Error notice if any */}
          {errorMsg && (
            <div className={`p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 ${language === 'hi' ? 'font-devanagari' : ''}`}>
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Conversion Result Card */}
          {result && (
            <div className="p-4 rounded-2xl bg-cream/80 border border-sand space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-extrabold text-primary-dark uppercase tracking-wider flex items-center gap-1 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                  <Check className="w-4 h-4 text-primary" />
                  <span>
                    {language === 'hi'
                      ? `रूपांतरित परिणाम (${result.target_language})`
                      : `Translation Result (${result.target_language})`}
                  </span>
                </span>

                <div className="flex items-center gap-1.5">
                  {/* Speak result button */}
                  <button
                    type="button"
                    onClick={() => handleSpeakText(result.converted_text, result.target_language === 'Hindi', true)}
                    className="p-1.5 rounded-lg bg-white border border-sand hover:bg-sand/40 text-primary-dark text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
                    title="Listen to translation"
                  >
                    <Volume2 className="w-4 h-4 text-primary" />
                    <span className={`text-[11px] ${language === 'hi' ? 'font-devanagari' : ''}`}>
                      {isPlayingOutput
                        ? (language === 'hi' ? 'बोल रहा है...' : 'Speaking...')
                        : (language === 'hi' ? 'सुनें' : 'Listen')}
                    </span>
                  </button>

                  {/* Copy button */}
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="p-1.5 rounded-lg bg-white border border-sand hover:bg-sand/40 text-slate-700 text-xs font-semibold flex items-center gap-1 transition shadow-2xs"
                    title="Copy to clipboard"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-primary" />
                        <span className={`text-[11px] text-primary-dark font-bold ${language === 'hi' ? 'font-devanagari' : ''}`}>
                          {language === 'hi' ? 'कॉपी हुआ' : 'Copied'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 text-slate-600" />
                        <span className={`text-[11px] ${language === 'hi' ? 'font-devanagari' : ''}`}>
                          {language === 'hi' ? 'कॉपी' : 'Copy'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Converted Text */}
              <div className="text-base font-bold text-slate-900 leading-snug">
                {result.converted_text}
              </div>

              {/* Clinical Timing Breakdown / Explanation */}
              {result.explanation && (
                <div className={`text-xs text-slate-700 pt-2 border-t border-sand flex items-start gap-1.5 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                  <BookOpen className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>
                    <strong>{language === 'hi' ? 'डॉक्टर समय निर्देश:' : 'Clinical Timing Breakdown:'}</strong> {result.explanation}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 ${language === 'hi' ? 'font-devanagari' : ''}`}>
          <span>
            {language === 'hi'
              ? 'परिचARYA भाषा रूपांतरक — केवल समझ की सुविधा हेतु'
              : 'ParichARYA Converter — For educational comprehension only'}
          </span>
          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className={`px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition shadow-xs ${language === 'hi' ? 'font-devanagari' : ''}`}
          >
            {t.common.done}
          </button>
        </div>
      </div>
    </div>
  );
}
