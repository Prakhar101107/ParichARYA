/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Bot, MessageSquare, AlertCircle } from 'lucide-react';
import { AppSettings, CarePlan, Medicine, AppLanguage } from './types';
import Header from './components/Header';
import CaptureStep from './components/CaptureStep';
import VerificationStep from './components/VerificationStep';
import CarePlanStep from './components/CarePlanStep';
import FooterDisclaimer from './components/FooterDisclaimer';
import TermExplainerModal from './components/TermExplainerModal';
import DailyRemindersModal from './components/DailyRemindersModal';
import HistoryDrawer from './components/HistoryDrawer';
import AccessibilitySettingsModal from './components/AccessibilitySettingsModal';
import HindiToEnglishConverterModal from './components/HindiToEnglishConverterModal';
import PrescriptionChatModal from './components/PrescriptionChatModal';
import { runSafetyCrossCheck } from './data/safetyRules';
import { loadSavedPlans, savePlan, deleteSavedPlan, loadSettings, saveSettings } from './utils/storage';
import { speakNarration, stopSpeaking } from './utils/speechHelper';

export default function App() {
  const [currentStep, setCurrentStep] = useState<'capture' | 'verify' | 'careplan'>('capture');
  const [extractedMedicines, setExtractedMedicines] = useState<Medicine[]>([]);
  const [currentPlan, setCurrentPlan] = useState<CarePlan | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // Storage
  const [savedPlans, setSavedPlans] = useState<CarePlan[]>([]);
  const [settings, setSettings] = useState<AppSettings>(loadSettings());

  const appLanguage: AppLanguage = settings.language || 'hi';

  const handleToggleLanguage = () => {
    const nextLang: AppLanguage = appLanguage === 'hi' ? 'en' : 'hi';
    const updatedSettings: AppSettings = { ...settings, language: nextLang };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  // Loading states
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [extractMessage, setExtractMessage] = useState<string>(
    appLanguage === 'hi' ? 'पर्चे का विश्लेषण हो रहा है...' : 'Analyzing prescription...',
  );
  const [isGeneratingPlan, setIsGeneratingPlan] = useState<boolean>(false);

  // Modals & Drawers
  const [historyOpen, setHistoryOpen] = useState<boolean>(false);
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [termToExplain, setTermToExplain] = useState<string | null>(null);
  const [remindersOpen, setRemindersOpen] = useState<boolean>(false);
  const [converterOpen, setConverterOpen] = useState<boolean>(false);
  const [chatOpen, setChatOpen] = useState<boolean>(false);
  const [converterInitialText, setConverterInitialText] = useState<string>('');
  const [converterInitialDirection, setConverterInitialDirection] = useState<'hi_to_en' | 'en_to_hi'>('hi_to_en');

  const handleOpenConverter = (initialText = '', initialDirection: 'hi_to_en' | 'en_to_hi' = 'hi_to_en') => {
    setConverterInitialText(initialText);
    setConverterInitialDirection(initialDirection);
    setConverterOpen(true);
  };

  useEffect(() => {
    setSavedPlans(loadSavedPlans());
  }, []);

  // Synchronize text display size to document root for app-wide scaling
  useEffect(() => {
    const size = settings.textSize || 'normal';
    document.documentElement.setAttribute('data-text-size', size);
    if (size === 'large') {
      document.documentElement.style.fontSize = '18.5px';
    } else if (size === 'xlarge') {
      document.documentElement.style.fontSize = '21px';
    } else {
      document.documentElement.style.fontSize = '16px';
    }
  }, [settings.textSize]);

  // Quick 1-tap text size cycler for header shortcut
  const handleCycleTextSize = () => {
    const current = settings.textSize || 'normal';
    const nextSize: 'normal' | 'large' | 'xlarge' =
      current === 'normal'
        ? 'large'
        : current === 'large'
        ? 'xlarge'
        : 'normal';
    const updatedSettings: AppSettings = { ...settings, textSize: nextSize };
    setSettings(updatedSettings);
    saveSettings(updatedSettings);
  };

  // Update root text scaling based on accessibility setting
  const getTextSizeClass = () => {
    if (settings.textSize === 'large') return 'app-text-large';
    if (settings.textSize === 'xlarge') return 'app-text-xlarge';
    return 'app-text-normal';
  };

  // Capture flow -> Gemini Call #1
  const handleImageCaptured = async (base64Image: string, promptHint?: string) => {
    setActiveImage(base64Image);
    setIsExtracting(true);
    setExtractionError(null);
    setExtractMessage(
      appLanguage === 'hi'
        ? 'पर्चे का विश्लेषण हो रहा है...'
        : 'Analyzing prescription...',
    );

    // Progressive reassuring messages
    const timer1 = setTimeout(() => {
      setExtractMessage(
        appLanguage === 'hi'
          ? 'डॉक्टर की लिखावट और शॉर्टहैंड पढ़ी जा रही है...'
          : 'Deciphering doctor handwriting and shorthand...',
      );
    }, 2800);
    const timer2 = setTimeout(() => {
      setExtractMessage(
        appLanguage === 'hi'
          ? 'दवाइयों के नाम और खुराक की पुष्टि की जा रही है...'
          : 'Confirming medications and dosage schedules...',
      );
    }, 6000);

    try {
      const res = await fetch('/api/extract-prescription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: base64Image,
          mimeType: 'image/jpeg',
          promptHint,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to extract prescription');
      }

      const data = await res.json();
      let meds: Medicine[] = Array.isArray(data.medicines) ? data.medicines : [];

      if (meds.length === 0 && Array.isArray(data.medications)) {
        meds = data.medications.map((item: any, idx: number) => {
          const rawFood = (item.food_timing || item.food_relation || 'not_specified').toLowerCase();
          const foodNorm = ['before_food', 'after_food', 'with_food', 'empty_stomach', 'bedtime'].includes(rawFood)
            ? rawFood
            : 'not_specified';

          const conf = typeof item.confidence === 'number'
            ? Math.max(0, Math.min(1, item.confidence))
            : 0.85;

          const durationNum = item.duration
            ? parseInt(String(item.duration).replace(/\D+/g, ''), 10) || null
            : null;

          return {
            id: `med_${Date.now()}_${idx}`,
            drug_name: item.drug_name || 'Unidentified Medicine',
            form: 'tablet',
            strength: item.strength && item.strength !== 'Not specified' ? item.strength : '',
            frequency_raw: item.frequency || 'OD',
            frequency_plain: item.frequency || 'Once daily',
            food_relation: foodNorm,
            duration_days: durationNum,
            special_instructions: item.instructions_hindi || null,
            confidence: {
              name: conf,
              dose: conf,
              frequency: conf,
            },
            verified: false,
          };
        });
      }

      if (meds.length === 0) {
        throw new Error(
          appLanguage === 'hi'
            ? 'पर्चे से कोई दवाई नहीं मिल सकी। कृपया अच्छी रोशनी में सीधी तस्वीर लें।'
            : 'No medicines could be identified. Please take a clear, well-lit photo.'
        );
      }

      setExtractedMedicines(meds);
      setCurrentStep('verify');
    } catch (err: any) {
      console.error('Extraction failed:', err);
      setExtractionError(
        err.message ||
          (appLanguage === 'hi'
            ? 'पर्चा पढ़ने में त्रुटि हुई। कृपया स्पष्ट रोशनी में फोटो लें।'
            : 'Error reading prescription. Please take a photo in clear lighting.')
      );
    } finally {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsExtracting(false);
    }
  };

  // Verification flow -> Local Safety Check + Gemini Call #2 (Care Plan)
  const handleProceedToCarePlan = async () => {
    setIsGeneratingPlan(true);

    try {
      // Step 4: Run local safety cross-check
      const safetyAlerts = runSafetyCrossCheck(extractedMedicines);

      // Step 5: Gemini Call #2
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicines: extractedMedicines,
          language: appLanguage,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to generate care plan script');
      }

      const planData = await res.json();

      const newPlan: CarePlan = {
        id: `plan_${Date.now()}`,
        createdAt: new Date().toISOString(),
        thumbnailUrl: activeImage || undefined,
        medicines: extractedMedicines,
        hindi_script: planData.hindi_script || 'नमस्ते, आपकी दवाइयां तैयार हैं।',
        english_script: planData.english_script || 'Hello, here is your medication plan.',
        medicine_scripts: planData.medicine_scripts || [],
        safety_alerts: safetyAlerts,
        language: appLanguage,
      };

      // Save to localStorage
      savePlan(newPlan);
      setSavedPlans(loadSavedPlans());
      setCurrentPlan(newPlan);
      setCurrentStep('careplan');

      // Auto play if enabled in settings
      if (settings.autoPlayAfterScan) {
        const speechText = appLanguage === 'en' && newPlan.english_script ? newPlan.english_script : newPlan.hindi_script;
        setTimeout(() => {
          speakNarration({
            text: speechText,
            rate: settings.speechRate,
            preferredVoiceName: appLanguage === 'en' ? null : settings.preferredVoiceName,
          });
        }, 600);
      }
    } catch (err: any) {
      console.error('Care plan generation failed:', err);
      alert(
        appLanguage === 'hi'
          ? `केयर प्लान तैयार करने में समस्या आई: ${err.message}`
          : `Error generating care plan: ${err.message}`,
      );
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  // Language switch re-request
  const handleLanguageChange = async (lang: 'hi' | 'en' | 'simple_hi') => {
    if (!currentPlan) return;

    try {
      const res = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          medicines: currentPlan.medicines,
          language: lang,
        }),
      });

      if (res.ok) {
        const planData = await res.json();
        const updated: CarePlan = {
          ...currentPlan,
          hindi_script: planData.hindi_script || currentPlan.hindi_script,
          english_script: planData.english_script || currentPlan.english_script,
          medicine_scripts: planData.medicine_scripts || currentPlan.medicine_scripts,
          language: lang,
        };
        setCurrentPlan(updated);
        savePlan(updated);
        setSavedPlans(loadSavedPlans());
      }
    } catch (err) {
      console.warn('Language switch script reload failed:', err);
    }
  };

  const handleSelectSavedPlan = (plan: CarePlan) => {
    stopSpeaking();
    setCurrentPlan(plan);
    setExtractedMedicines(plan.medicines);
    setCurrentStep('careplan');
  };

  const handleDeletePlan = (id: string) => {
    const updated = deleteSavedPlan(id);
    setSavedPlans(updated);
    if (currentPlan?.id === id) {
      setCurrentStep('capture');
      setCurrentPlan(null);
    }
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleResetToCapture = () => {
    stopSpeaking();
    setCurrentStep('capture');
  };

  return (
    <div className={`min-h-screen flex flex-col bg-[#FAF9F4] text-slate-900 ${getTextSizeClass()}`}>
      {/* Sticky Header with navigation & progress */}
      <Header
        language={appLanguage}
        onToggleLanguage={handleToggleLanguage}
        onOpenHistory={() => setHistoryOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenConverter={() => handleOpenConverter()}
        savedPlansCount={savedPlans.length}
        onResetToCapture={handleResetToCapture}
        currentStep={currentStep}
        textSize={settings.textSize}
        onCycleTextSize={handleCycleTextSize}
        onOpenChat={() => setChatOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-xl mx-auto px-4 py-5">
        {currentStep === 'capture' && (
          <>
            {extractionError && (
              <div
                id="extraction-error-banner"
                className="mb-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 shadow-sm flex items-start gap-3 animate-in fade-in duration-200"
              >
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1 text-sm">
                  <div className="font-semibold text-red-950 mb-1">
                    {appLanguage === 'hi' ? 'पर्चे की पहचान में समस्या' : 'Prescription Extraction Issue'}
                  </div>
                  <p className="text-xs text-red-800 leading-relaxed mb-3">
                    {extractionError}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExtractionError(null)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-red-100 hover:bg-red-200 text-red-900 transition-colors"
                    >
                      {appLanguage === 'hi' ? 'हटाएं' : 'Dismiss'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setExtractionError(null);
                        setExtractedMedicines([
                          {
                            id: `med_${Date.now()}_manual`,
                            drug_name: '',
                            form: 'tablet',
                            strength: '',
                            frequency_raw: 'OD',
                            frequency_plain: appLanguage === 'hi' ? 'दिन में एक बार' : 'Once daily',
                            food_relation: 'after_food',
                            duration_days: 5,
                            special_instructions: null,
                            confidence: { name: 1.0, dose: 1.0, frequency: 1.0 },
                            verified: false,
                          },
                        ]);
                        setCurrentStep('verify');
                      }}
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-red-300 text-red-900 hover:bg-red-50 shadow-xs transition-colors"
                    >
                      {appLanguage === 'hi' ? '✍️ हाथ से दवाई दर्ज करें' : '✍️ Enter Manually'}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <CaptureStep
              onImageCaptured={handleImageCaptured}
              isLoading={isExtracting}
              loadingMessage={extractMessage}
              language={appLanguage}
            />
          </>
        )}

        {currentStep === 'verify' && (
          <VerificationStep
            medicines={extractedMedicines}
            onUpdateMedicines={setExtractedMedicines}
            onProceedToPlan={handleProceedToCarePlan}
            onRetake={() => setCurrentStep('capture')}
            isGeneratingPlan={isGeneratingPlan}
            language={appLanguage}
          />
        )}

        {currentStep === 'careplan' && currentPlan && (
          <CarePlanStep
            plan={currentPlan}
            onLanguageChange={handleLanguageChange}
            onOpenTermExplainer={(term) => setTermToExplain(term)}
            onOpenReminders={() => setRemindersOpen(true)}
            onScanNew={handleResetToCapture}
            onOpenConverter={handleOpenConverter}
            onOpenChat={() => setChatOpen(true)}
            preferredVoiceName={settings.preferredVoiceName}
            speechRate={settings.speechRate}
            language={appLanguage}
          />
        )}
      </main>

      {/* Floating Prescription AI Chatbot Action Button */}
      <div className="fixed bottom-14 right-3 sm:bottom-6 sm:right-6 z-40">
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          id="btn-floating-prescription-chat"
          className="group flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-primary hover:bg-primary-dark text-white font-bold text-xs sm:text-sm shadow-xl hover:shadow-2xl border border-accent/40 active:scale-95 transition transform duration-150"
          title={appLanguage === 'hi' ? 'पर्चा AI सहायक से सवाल पूछें' : 'Ask Prescription AI Assistant'}
        >
          <div className="w-6 h-6 rounded-full bg-cream text-primary flex items-center justify-center shrink-0">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="leading-none">
            {appLanguage === 'hi' ? 'पर्चा AI सहायक' : 'Prescription AI'}
          </span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
          </span>
        </button>
      </div>

      {/* Persistent Medical Safety Footer */}
      <FooterDisclaimer language={appLanguage} />

      {/* Modals & Drawers */}
      <HistoryDrawer
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        savedPlans={savedPlans}
        onSelectPlan={handleSelectSavedPlan}
        onDeletePlan={handleDeletePlan}
        language={appLanguage}
      />

      {settingsOpen && (
        <AccessibilitySettingsModal
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}

      {termToExplain && (
        <TermExplainerModal
          term={termToExplain}
          onClose={() => setTermToExplain(null)}
          preferredVoiceName={settings.preferredVoiceName}
          language={appLanguage}
        />
      )}

      {remindersOpen && currentPlan && (
        <DailyRemindersModal
          medicines={currentPlan.medicines}
          onClose={() => setRemindersOpen(false)}
          language={appLanguage}
        />
      )}

      <HindiToEnglishConverterModal
        isOpen={converterOpen}
        onClose={() => setConverterOpen(false)}
        preferredVoiceName={settings.preferredVoiceName}
        speechRate={settings.speechRate}
        initialText={converterInitialText}
        initialDirection={converterInitialDirection}
        language={appLanguage}
      />

      {/* Interactive Multi-Turn Prescription Chatbot Modal */}
      <PrescriptionChatModal
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        medicines={currentPlan?.medicines || extractedMedicines}
        language={appLanguage}
        preferredVoiceName={settings.preferredVoiceName}
        speechRate={settings.speechRate}
      />
    </div>
  );
}
