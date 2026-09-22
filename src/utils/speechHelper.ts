/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface VoiceInfo {
  voice: SpeechSynthesisVoice | null;
  label: string;
  isHindiNative: boolean;
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

export function selectBestVoice(preferredName?: string | null): VoiceInfo {
  const voices = getAvailableVoices();
  if (voices.length === 0) {
    return {
      voice: null,
      label: 'Default system speaker',
      isHindiNative: false,
    };
  }

  // 1. Check user preferred voice name if provided
  if (preferredName) {
    const matched = voices.find((v) => v.name === preferredName);
    if (matched) {
      const isHi = matched.lang.toLowerCase().startsWith('hi');
      return {
        voice: matched,
        label: `${matched.name} (${matched.lang})`,
        isHindiNative: isHi,
      };
    }
  }

  // 2. Look for native Hindi voices (hi-IN, hi)
  const hindiVoice = voices.find(
    (v) =>
      v.lang.toLowerCase().includes('hi-in') ||
      v.lang.toLowerCase().startsWith('hi') ||
      v.name.toLowerCase().includes('hindi') ||
      v.name.toLowerCase().includes('lekhak') ||
      v.name.toLowerCase().includes('neerja'),
  );

  if (hindiVoice) {
    return {
      voice: hindiVoice,
      label: `${hindiVoice.name} (Hindi/हिंदी)`,
      isHindiNative: true,
    };
  }

  // 3. Look for Indian English voice as cultural fallback (en-IN)
  const indianEnglishVoice = voices.find(
    (v) => v.lang.toLowerCase().includes('en-in') || v.name.toLowerCase().includes('india'),
  );
  if (indianEnglishVoice) {
    return {
      voice: indianEnglishVoice,
      label: `${indianEnglishVoice.name} (Indian Accent)`,
      isHindiNative: false,
    };
  }

  // 4. Fallback to default voice
  const defaultVoice = voices.find((v) => v.default) || voices[0];
  return {
    voice: defaultVoice,
    label: `${defaultVoice.name} (${defaultVoice.lang})`,
    isHindiNative: false,
  };
}

let activeUtterance: SpeechSynthesisUtterance | null = null;

export function stopSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    activeUtterance = null;
  }
}

export function pauseSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.pause();
  }
}

export function resumeSpeaking(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.resume();
  }
}

export function speakNarration({
  text,
  rate = 0.95,
  pitch = 1.0,
  preferredVoiceName = null,
  onStart,
  onEnd,
  onError,
}: {
  text: string;
  rate?: number;
  pitch?: number;
  preferredVoiceName?: string | null;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.(new Error('Speech synthesis is not supported on this browser'));
    return;
  }

  stopSpeaking();

  const voiceInfo = selectBestVoice(preferredVoiceName);
  const utterance = new SpeechSynthesisUtterance(text);

  if (voiceInfo.voice) {
    utterance.voice = voiceInfo.voice;
    utterance.lang = voiceInfo.voice.lang;
  } else {
    utterance.lang = 'hi-IN';
  }

  utterance.rate = rate;
  utterance.pitch = pitch;

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    activeUtterance = null;
    onEnd?.();
  };

  utterance.onerror = (e) => {
    activeUtterance = null;
    onError?.(e);
  };

  activeUtterance = utterance;
  window.speechSynthesis.speak(utterance);
}
