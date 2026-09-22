/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ShieldAlert } from 'lucide-react';
import { AppLanguage } from '../types';
import { getTranslations } from '../utils/translations';

interface FooterDisclaimerProps {
  language?: AppLanguage;
}

export default function FooterDisclaimer({ language = 'hi' }: FooterDisclaimerProps) {
  const t = getTranslations(language);

  return (
    <footer id="paricharya-footer" className="mt-auto border-t border-sand/80 bg-white/80 backdrop-blur-xs py-3 px-4 text-center">
      <div className="max-w-lg mx-auto flex items-center justify-center gap-2 text-xs text-slate-500 font-medium">
        <ShieldAlert className="w-4 h-4 text-primary shrink-0" />
        <p className={language === 'hi' ? 'font-devanagari' : ''}>
          {language === 'hi' ? (
            <>
              <span className="font-semibold text-slate-700">परिचARYA</span> केवल आपके पर्चे को समझाने में सहायता करती है, यह डॉक्टर या फार्मासिस्ट का विकल्प नहीं है।
            </>
          ) : (
            <>
              <span className="font-semibold text-slate-700">ParichARYA</span> explains your prescription, it does not replace your doctor or pharmacist.
            </>
          )}
        </p>
      </div>
      <p className={`text-[11px] text-slate-400 mt-0.5 ${language === 'hi' ? 'font-devanagari' : ''}`}>
        {t.footer.copyright}
      </p>
    </footer>
  );
}
