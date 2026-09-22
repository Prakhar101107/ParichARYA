/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Bot,
  User,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Sparkles,
  Copy,
  Check,
  RotateCcw,
  Pill,
  Clock,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Medicine, AppLanguage, ChatMessage } from '../types';
import { speakNarration, stopSpeaking } from '../utils/speechHelper';

interface PrescriptionChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  medicines?: Medicine[];
  language?: AppLanguage;
  preferredVoiceName?: string | null;
  speechRate?: number;
}

export default function PrescriptionChatModal({
  isOpen,
  onClose,
  medicines = [],
  language = 'hi',
  preferredVoiceName = null,
  speechRate = 0.95,
}: PrescriptionChatModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [showMedContext, setShowMedContext] = useState(false);
  const [chatLang, setChatLang] = useState<AppLanguage>(language);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize welcome message when modal opens or medicines change
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const isHi = chatLang === 'hi';
      let welcomeContent = '';

      if (medicines.length > 0) {
        const medNames = medicines.map((m) => m.drug_name).join(', ');
        welcomeContent = isHi
          ? `नमस्ते! मैं आपका परिचर्या AI पर्चा सहायक हूँ।\n\nमुझे आपके पर्चे की **${medicines.length} दवाइयों** (${medNames}) की पूरी जानकारी है।\n\nआप मुझसे किसी भी दवा के लेने का सही समय, खाली पेट या खाने के बाद का नियम, खुराक छूट जाने पर क्या करें, या परहेज के बारे में पूछ सकते हैं।`
          : `Hello! I am your ParichARYA Prescription Assistant.\n\nI have loaded your prescription with **${medicines.length} medicines** (${medNames}).\n\nFeel free to ask me when and how to take each medicine, empty stomach vs after food rules, missed dose guidance, or precautions.`;
      } else {
        welcomeContent = isHi
          ? `नमस्ते! मैं आपका परिचर्या AI पर्चा सहायक हूँ।\n\nआप मुझसे डॉक्टर के पर्चे की लिखावट, संक्षेप (OD, BD, TDS, BBF), दवाइयों के समय, या किसी भी सामान्य दवा के बारे में पूछ सकते हैं।`
          : `Hello! I am your ParichARYA Prescription Assistant.\n\nYou can ask me questions about medical shorthand (OD, BD, TDS, BBF), medicine schedules, or any prescription questions.`;
      }

      setMessages([
        {
          id: `msg_welcome_${Date.now()}`,
          role: 'model',
          content: welcomeContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  }, [isOpen, medicines, chatLang]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up speech on unmount or close
  useEffect(() => {
    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    stopSpeaking();
    setSpeakingMessageId(null);

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/prescription-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          medicines,
          language: chatLang,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const reply = data.reply || (chatLang === 'hi' ? 'क्षमा करें, उत्तर प्राप्त नहीं हो सका।' : 'Sorry, could not generate reply.');

      const botMsg: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        role: 'model',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackMsg: ChatMessage = {
        id: `msg_bot_err_${Date.now()}`,
        role: 'model',
        content:
          chatLang === 'hi'
            ? 'दवाइयों के बारे में: अपनी दवाएं डॉक्टर के निर्देशानुसार समय पर लें। खाली पेट वाली दवाएं (जैसे Pan-D/एंटी-एसिड) सुबह नाश्ते से 30 मिनट पहले पानी के साथ लें। दर्द की दवाएं खाने के बाद लें। अधिक जानकारी के लिए अपने डॉक्टर या फार्मासिस्ट से संपर्क करें।'
            : 'Regarding your medicines: Please take each medicine on schedule as advised by your doctor. Empty-stomach medicines (like antacids) should be taken 30 mins before breakfast. Pain relievers must be taken after food. Consult your pharmacist for urgent queries.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Text-To-Speech for bot message
  const handleToggleSpeak = (msgId: string, content: string) => {
    if (speakingMessageId === msgId) {
      stopSpeaking();
      setSpeakingMessageId(null);
      return;
    }

    stopSpeaking();
    setSpeakingMessageId(msgId);

    // Clean markdown stars before speaking
    const cleanedText = content.replace(/\*\*/g, '').replace(/###/g, '');

    speakNarration({
      text: cleanedText,
      rate: speechRate,
      preferredVoiceName,
      onEnd: () => setSpeakingMessageId(null),
      onError: () => setSpeakingMessageId(null),
    });
  };

  // Copy message to clipboard
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Clear chat
  const handleResetChat = () => {
    stopSpeaking();
    setSpeakingMessageId(null);
    setMessages([]);
  };

  // Speech Recognition (Microphone voice typing in Hindi / English)
  const handleToggleVoiceInput = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    setSpeechError(null);
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(chatLang === 'hi' ? 'माइक इस ब्राउज़र में समर्थित नहीं है।' : 'Voice recognition not supported in this browser.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = chatLang === 'hi' ? 'hi-IN' : 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText((prev) => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error !== 'no-speech') {
          setSpeechError(chatLang === 'hi' ? 'माइक से आवाज नहीं मिली।' : 'Microphone input error.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setIsListening(false);
    }
  };

  // Quick prompt questions
  const quickQuestions = chatLang === 'hi'
    ? [
        '🕒 यह दवाएं कब और कैसे लेनी हैं?',
        '🥣 खाली पेट कौन सी दवा लेनी है?',
        '❓ अगर कोई खुराक छूट जाए तो क्या करें?',
        '🚫 इसके साथ क्या परहेज रखना है?',
        '⚠️ क्या कोई साइड इफेक्ट्स हो सकते हैं?',
      ]
    : [
        '🕒 What is the exact schedule for these medicines?',
        '🥣 Which medicine must be taken on an empty stomach?',
        '❓ What should I do if I miss a dose?',
        '🚫 Are there any food or dietary restrictions?',
        '⚠️ What common side effects should I watch for?',
      ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="prescription-chat-modal"
        className="bg-white rounded-3xl max-w-xl w-full h-[90vh] sm:h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-primary text-white px-4 py-3 sm:px-5 sm:py-3.5 flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-cream border border-accent/40 text-primary-dark flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-cream leading-tight">
                  {chatLang === 'hi' ? 'परिचर्या पर्चा सहायक' : 'Prescription Assistant'}
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-accent/30 text-sand border border-accent/40">
                  Gemini AI
                </span>
              </div>
              <p className="text-[11px] text-white/80 leading-tight">
                {medicines.length > 0
                  ? chatLang === 'hi'
                    ? `${medicines.length} दवाइयां पर्चे से कनेक्टेड`
                    : `${medicines.length} prescribed medicines in context`
                  : chatLang === 'hi'
                  ? 'पर्चे से संबंधित सवाल पूछें'
                  : 'Ask prescription & dosage questions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language toggle within chat */}
            <button
              type="button"
              onClick={() => setChatLang(chatLang === 'hi' ? 'en' : 'hi')}
              className="px-2 py-1 rounded-xl bg-primary-dark/80 hover:bg-primary-dark text-xs font-bold text-cream border border-accent/40 transition"
              title="Toggle Hindi/English"
            >
              {chatLang === 'hi' ? 'EN' : 'हिन्दी'}
            </button>

            {/* Clear conversation */}
            <button
              type="button"
              onClick={handleResetChat}
              className="p-2 text-white/80 hover:text-white hover:bg-primary-dark/70 rounded-xl transition"
              title={chatLang === 'hi' ? 'बातचीत रीसेट करें' : 'Reset chat'}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close button */}
            <button
              type="button"
              onClick={() => {
                stopSpeaking();
                onClose();
              }}
              className="p-2 text-white/80 hover:text-white hover:bg-primary-dark/70 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Prescription Context Banner (Collapsible) */}
        {medicines.length > 0 && (
          <div className="bg-cream/70 border-b border-sand px-4 py-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowMedContext(!showMedContext)}
              className="w-full flex items-center justify-between text-xs font-bold text-primary-dark text-left"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Pill className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">
                  {chatLang === 'hi' ? 'सक्रिय पर्चा संदर्भ:' : 'Active Prescription Context:'}{' '}
                  <span className="font-semibold text-slate-700">
                    {medicines.map((m) => m.drug_name).join(', ')}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] text-primary shrink-0 ml-2 font-medium">
                <span>{showMedContext ? (chatLang === 'hi' ? 'छिपाएं' : 'Hide') : (chatLang === 'hi' ? 'दवाएं देखें' : 'View meds')}</span>
                {showMedContext ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </div>
            </button>

            {/* Expanded medicines snapshot */}
            {showMedContext && (
              <div className="mt-2.5 pt-2 border-t border-sand/60 grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                {medicines.map((med, idx) => (
                  <div
                    key={med.id || idx}
                    className="p-2 rounded-xl bg-white border border-sand/80 text-[11px] space-y-0.5"
                  >
                    <div className="font-bold text-slate-800 flex items-center justify-between">
                      <span>{med.drug_name}</span>
                      <span className="text-primary font-mono text-[10px]">{med.strength || med.form}</span>
                    </div>
                    <div className="text-slate-600 flex items-center gap-2">
                      <span>{med.frequency_plain}</span>
                      <span className="text-accent/80 font-bold">•</span>
                      <span className="text-primary-dark font-medium capitalize">
                        {med.food_relation ? med.food_relation.replace('_', ' ') : 'with food'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#FAF9F4]">
          {messages.map((msg) => {
            const isBot = msg.role === 'model';
            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isBot ? 'items-start' : 'items-end justify-end'}`}
              >
                {isBot && (
                  <div className="w-8 h-8 rounded-xl bg-cream border border-accent/40 text-primary flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-2xl p-3.5 shadow-xs space-y-1.5 ${
                    isBot
                      ? 'bg-white border border-slate-200 text-slate-800'
                      : 'bg-primary text-white ml-auto'
                  }`}
                >
                  {/* Message sender header & timestamp */}
                  <div className="flex items-center justify-between gap-2 text-[10px] opacity-75">
                    <span className="font-semibold">
                      {isBot ? (chatLang === 'hi' ? 'परिचर्या AI' : 'ParichARYA AI') : (chatLang === 'hi' ? 'आप' : 'You')}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message body with clean paragraph splitting */}
                  <div className="text-sm leading-relaxed whitespace-pre-line space-y-1.5">
                    {msg.content.split('\n\n').map((para, pIdx) => {
                      // Format bold **text** cleanly
                      const formatted = para.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return (
                            <strong key={i} className={isBot ? 'text-primary-dark font-bold' : 'text-cream font-bold'}>
                              {part.slice(2, -2)}
                            </strong>
                          );
                        }
                        return part;
                      });

                      return <p key={pIdx}>{formatted}</p>;
                    })}
                  </div>

                  {/* Bot Message Action Buttons (TTS, Copy) */}
                  {isBot && (
                    <div className="pt-1.5 mt-1 border-t border-slate-100 flex items-center justify-between text-slate-500">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleSpeak(msg.id, msg.content)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition ${
                            speakingMessageId === msg.id
                              ? 'bg-primary text-white'
                              : 'bg-cream/60 hover:bg-cream text-primary-dark'
                          }`}
                          title="Read aloud"
                        >
                          {speakingMessageId === msg.id ? (
                            <>
                              <VolumeX className="w-3.5 h-3.5 animate-pulse" />
                              <span>{chatLang === 'hi' ? 'रोकें' : 'Stop'}</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>{chatLang === 'hi' ? 'सुनें' : 'Listen'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        className="p-1 hover:text-slate-800 rounded transition"
                        title="Copy message"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-primary" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {!isBot && (
                  <div className="w-7 h-7 rounded-xl bg-primary-dark text-sand flex items-center justify-center shrink-0 shadow-2xs mb-0.5">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-cream border border-accent/40 text-primary flex items-center justify-center shrink-0 shadow-2xs">
                <Bot className="w-4 h-4 text-primary animate-pulse" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span>{chatLang === 'hi' ? 'पर्चे का विश्लेषण हो रहा है...' : 'Analyzing your prescription...'}</span>
                </div>
                <div className="flex items-center gap-1 pt-1">
                  <div className="w-2 h-2 rounded-full bg-primary/70 animate-bounce"></div>
                  <div className="w-2 h-2 rounded-full bg-primary/70 animate-bounce [animation-delay:0.2s]"></div>
                  <div className="w-2 h-2 rounded-full bg-primary/70 animate-bounce [animation-delay:0.4s]"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="bg-white border-t border-slate-100 px-3 py-2 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(q)}
                disabled={isLoading}
                className="whitespace-nowrap px-2.5 py-1.5 rounded-xl bg-cream/70 hover:bg-cream border border-sand text-primary-dark font-medium text-xs transition active:scale-95 shrink-0 disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Speech Error Banner */}
        {speechError && (
          <div className="bg-sand/60 px-4 py-1.5 text-xs text-amber-900 border-t border-sand flex items-center justify-between">
            <span>{speechError}</span>
            <button
              type="button"
              onClick={() => setSpeechError(null)}
              className="text-xs font-bold underline ml-2"
            >
              OK
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Mic voice dictation button */}
            <button
              type="button"
              onClick={handleToggleVoiceInput}
              aria-label={isListening ? 'Stop listening' : 'Start voice input'}
              className={`p-2.5 rounded-2xl transition active:scale-95 flex items-center justify-center shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-cream text-primary hover:bg-sand/80 border border-sand'
              }`}
              title={
                isListening
                  ? chatLang === 'hi' ? 'बोलना बंद करें' : 'Stop recording'
                  : chatLang === 'hi' ? 'माइक से सवाल बोलें' : 'Speak your question'
              }
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text input */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isListening
                  ? chatLang === 'hi' ? 'सुन रहा हूँ... बोलिए...' : 'Listening... please speak...'
                  : chatLang === 'hi'
                  ? 'पर्चे या दवा के बारे में सवाल लिखें...'
                  : 'Ask any question about your prescription...'
              }
              disabled={isLoading}
              className="flex-1 py-2.5 px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:ring-2 focus:ring-primary/40 focus:bg-white text-slate-800 placeholder:text-slate-400"
            />

            {/* Send button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="p-2.5 bg-primary hover:bg-primary-dark disabled:opacity-40 text-white rounded-2xl shadow-xs transition active:scale-95 shrink-0 flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Tiny safety footer */}
          <div className="mt-2 text-center text-[10px] text-slate-400 leading-tight">
            {chatLang === 'hi'
              ? 'परिचर्या AI सहायता केवल शैक्षणिक मार्गदर्शन के लिए है। किसी भी गंभीर लक्षण पर तुरंत डॉक्टर से परामर्श लें।'
              : 'ParichARYA AI is for educational guidance based on your prescription. Always consult your doctor for medical decisions.'}
          </div>
        </div>
      </div>
    </div>
  );
}
