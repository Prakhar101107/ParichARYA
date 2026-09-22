/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { X, Bell, Sun, Moon, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { Medicine, AppLanguage } from '../types';
import { getTranslations } from '../utils/translations';

interface DailyRemindersModalProps {
  medicines: Medicine[];
  onClose: () => void;
  language?: AppLanguage;
}

export default function DailyRemindersModal({ medicines, onClose, language = 'hi' }: DailyRemindersModalProps) {
  const t = getTranslations(language);
  const [notificationState, setNotificationState] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported',
  );
  const [testAlertSent, setTestAlertSent] = useState<boolean>(false);

  const requestPermission = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const res = await Notification.requestPermission();
      setNotificationState(res);
      if (res === 'granted') {
        triggerSampleAlert(
          language === 'hi' ? 'ParichARYA रिमाइंडर्स सक्रिय!' : 'ParichARYA Reminders Enabled!',
          language === 'hi' ? 'सुबह और शाम की दवाइयों की सूचना यहां आएगी।' : 'Morning and evening dose notifications will appear here.',
        );
      }
    }
  };

  const triggerSampleAlert = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
      });
      setTestAlertSent(true);
      setTimeout(() => setTestAlertSent(false), 4000);
    } else {
      // Fallback in-app toast
      setTestAlertSent(true);
      setTimeout(() => setTestAlertSent(false), 4000);
    }
  };

  // Group medicines by time slots
  const morningMeds = medicines.filter((m) => {
    const raw = m.frequency_raw.toUpperCase();
    return raw.includes('OD') || raw.includes('BD') || raw.includes('TDS') || raw.includes('QID') || raw.includes('BBF') || raw.startsWith('1-');
  });

  const noonMeds = medicines.filter((m) => {
    const raw = m.frequency_raw.toUpperCase();
    return raw.includes('TDS') || raw.includes('QID') || raw.includes('-1-');
  });

  const nightMeds = medicines.filter((m) => {
    const raw = m.frequency_raw.toUpperCase();
    return raw.includes('BD') || raw.includes('TDS') || raw.includes('QID') || raw.includes('HS') || raw.endsWith('-1');
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cream border border-accent/40 text-primary flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <span className={`text-[11px] font-bold text-primary uppercase tracking-wider ${language === 'hi' ? 'font-devanagari' : ''}`}>
                {t.reminders.title}
              </span>
              <h3 className={`text-lg font-bold text-slate-900 ${language === 'hi' ? 'font-devanagari' : ''}`}>
                {t.reminders.subtitle}
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-cream/50 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prototype Alert Notice */}
        <div className="p-3 rounded-2xl bg-cream/40 border border-sand text-xs text-slate-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className={`leading-relaxed ${language === 'hi' ? 'font-devanagari' : ''}`}>
            {language === 'hi' ? (
              <>
                <strong>सूचना:</strong> यह एक प्रोटोटाइप सहायक रिमाइंडर है, प्रमाणित मेडिकल अलार्म नहीं। हमेशा घड़ी देखकर समय पर दवा लें।
              </>
            ) : (
              <>
                <strong>Notice:</strong> This is a supportive schedule guide, not a certified medical device. Always consult your actual watch or clock.
              </>
            )}
          </p>
        </div>

        {/* Browser Notification Permission Button */}
        <div className="p-3.5 rounded-2xl bg-cream/80 border border-sand flex items-center justify-between gap-3 shadow-xs">
          <div className="text-xs">
            <div className={`font-bold text-primary-dark ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {t.reminders.notifications}
            </div>
            <p className={`text-primary/90 text-[11px] ${language === 'hi' ? 'font-devanagari' : ''}`}>
              {notificationState === 'granted'
                ? t.reminders.enabled
                : t.reminders.enableDesc}
            </p>
          </div>

          {notificationState !== 'granted' ? (
            <button
              type="button"
              onClick={requestPermission}
              className={`py-1.5 px-3 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs shadow-xs transition active:scale-95 shrink-0 ${language === 'hi' ? 'font-devanagari' : ''}`}
            >
              {t.reminders.allow}
            </button>
          ) : (
            <button
              type="button"
              onClick={() =>
                triggerSampleAlert(
                  language === 'hi' ? 'दवाई का समय हो गया!' : 'Medication Time!',
                  language === 'hi'
                    ? `सुबह की दवाइयां लेने का समय: ${morningMeds.map((m) => m.drug_name).join(', ')}`
                    : `Time for morning medicines: ${morningMeds.map((m) => m.drug_name).join(', ')}`,
                )
              }
              className={`py-1.5 px-3 rounded-xl bg-sand hover:bg-sand-dark text-primary-dark font-bold text-xs shadow-xs transition active:scale-95 shrink-0 ${language === 'hi' ? 'font-devanagari' : ''}`}
            >
              {t.reminders.testAlert}
            </button>
          )}
        </div>

        {testAlertSent && (
          <div className="p-2.5 rounded-xl bg-cream border border-accent text-primary-dark text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className={language === 'hi' ? 'font-devanagari' : ''}>
              {language === 'hi' ? 'परीक्षण अलर्ट भेजा गया: "दवाई का समय हो गया!"' : 'Test notification sent: "Medication Time!"'}
            </span>
          </div>
        )}

        {/* Schedule Slots */}
        <div className="space-y-3 pt-1">
          {/* Morning Slot */}
          <div className="p-4 rounded-2xl border border-accent/40 bg-cream/50 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-primary-dark">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-primary" />
                <span className={`text-sm ${language === 'hi' ? 'font-devanagari' : ''}`}>
                  {language === 'hi' ? 'सुबह की दवाइयां (Morning)' : 'Morning Medicines'}
                </span>
              </div>
              <span className="bg-sand/60 text-primary-dark px-2 py-0.5 rounded-md font-mono text-[11px]">
                08:00 AM
              </span>
            </div>
            {morningMeds.length > 0 ? (
              <div className="space-y-1.5">
                {morningMeds.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2 rounded-xl bg-white border border-accent/30 text-xs flex items-center justify-between ${language === 'hi' ? 'font-devanagari' : ''}`}
                  >
                    <span className="font-bold text-slate-800">{m.drug_name}</span>
                    <span className="text-slate-500 text-[11px]">
                      {m.food_relation === 'before_food' || m.food_relation === 'empty_stomach'
                        ? (language === 'hi' ? 'नाश्ते से पहले (खाली पेट)' : 'Before Breakfast (Empty stomach)')
                        : (language === 'hi' ? 'नाश्ते के बाद' : 'After Breakfast')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {language === 'hi' ? 'सुबह कोई दवाई नहीं है' : 'No morning medicines'}
              </p>
            )}
          </div>

          {/* Afternoon Slot */}
          <div className="p-4 rounded-2xl border border-sand bg-sand/30 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-amber-950">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#8C4A00]" />
                <span className={`text-sm ${language === 'hi' ? 'font-devanagari' : ''}`}>
                  {language === 'hi' ? 'दोपहर की दवाइयां (Afternoon)' : 'Afternoon Medicines'}
                </span>
              </div>
              <span className="bg-sand text-amber-950 px-2 py-0.5 rounded-md font-mono text-[11px]">
                01:30 PM
              </span>
            </div>
            {noonMeds.length > 0 ? (
              <div className="space-y-1.5">
                {noonMeds.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2 rounded-xl bg-white border border-sand/80 text-xs flex items-center justify-between ${language === 'hi' ? 'font-devanagari' : ''}`}
                  >
                    <span className="font-bold text-slate-800">{m.drug_name}</span>
                    <span className="text-slate-500 text-[11px]">
                      {language === 'hi' ? 'दोपहर के खाने के बाद' : 'After Lunch'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {language === 'hi' ? 'दोपहर कोई दवाई नहीं है' : 'No afternoon medicines'}
              </p>
            )}
          </div>

          {/* Night Slot */}
          <div className="p-4 rounded-2xl border border-sand-dark/40 bg-sand-dark/15 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-900">
              <div className="flex items-center gap-2">
                <Moon className="w-4 h-4 text-primary-dark" />
                <span className={`text-sm ${language === 'hi' ? 'font-devanagari' : ''}`}>
                  {language === 'hi' ? 'रात की दवाइयां (Night / Bedtime)' : 'Night / Bedtime Medicines'}
                </span>
              </div>
              <span className="bg-sand-dark/30 text-slate-900 px-2 py-0.5 rounded-md font-mono text-[11px]">
                08:30 PM
              </span>
            </div>
            {nightMeds.length > 0 ? (
              <div className="space-y-1.5">
                {nightMeds.map((m) => (
                  <div
                    key={m.id}
                    className={`p-2 rounded-xl bg-white border border-sand-dark/30 text-xs flex items-center justify-between ${language === 'hi' ? 'font-devanagari' : ''}`}
                  >
                    <span className="font-bold text-slate-800">{m.drug_name}</span>
                    <span className="text-slate-500 text-[11px]">
                      {m.frequency_raw === 'HS'
                        ? (language === 'hi' ? 'सोने से ठीक पहले' : 'Right before bed')
                        : (language === 'hi' ? 'रात के खाने के बाद' : 'After Dinner')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {language === 'hi' ? 'रात कोई दवाई नहीं है' : 'No night medicines'}
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className={`w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-bold text-xs transition shadow-xs ${language === 'hi' ? 'font-devanagari' : ''}`}
        >
          {t.common.done}
        </button>
      </div>
    </div>
  );
}
