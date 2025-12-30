import { useState, useEffect, useCallback, useRef } from "react";
import { Mic, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

const getWebSpeechLanguageCode = (lang: string): string => {
  const languageMap: Record<string, string> = {
    en: "en-US",
    es: "es-ES",
    fr: "fr-FR",
    de: "de-DE",
    it: "it-IT",
    pt: "pt-BR",
    zh: "zh-CN",
    ja: "ja-JP",
    ko: "ko-KR",
    hi: "hi-IN",
    ar: "ar-SA",
    ru: "ru-RU",
    nl: "nl-NL",
    pl: "pl-PL",
    tr: "tr-TR",
    bn: "bn-IN",
    te: "te-IN",
    ta: "ta-IN",
    mr: "mr-IN",
    gu: "gu-IN",
    kn: "kn-IN",
    ml: "ml-IN",
  };
  return languageMap[lang] || "en-US";
};

const QUICK_LANGUAGES = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "hi", name: "हिंदी", flag: "🇮🇳" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
];

const MORE_LANGUAGES = [
  { code: "bn", name: "বাংলা", flag: "🇮🇳" },
  { code: "te", name: "తెలుగు", flag: "🇮🇳" },
  { code: "ta", name: "தமிழ்", flag: "🇮🇳" },
  { code: "mr", name: "मराठी", flag: "🇮🇳" },
  { code: "gu", name: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", name: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "ml", name: "മലയാളം", flag: "🇮🇳" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "nl", name: "Nederlands", flag: "🇳🇱" },
  { code: "pl", name: "Polski", flag: "🇵🇱" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
];

const ALL_LANGUAGES = [...QUICK_LANGUAGES, ...MORE_LANGUAGES];

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  language?: string;
}

export function VoiceInput({ onTranscript, className, disabled = false, placeholder = "Tap to speak", language = "en" }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = getWebSpeechLanguageCode(language);

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      if (!isMountedRef.current) return;
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        }
      }
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (isMountedRef.current) setIsListening(false);
    };

    recognitionInstance.onend = () => {
      if (isMountedRef.current) setIsListening(false);
    };

    recognitionRef.current = recognitionInstance;
  }, [onTranscript, language]);

  const toggleListening = useCallback(() => {
    if (!recognitionRef.current || disabled) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Failed to start speech recognition:", error);
      }
    }
  }, [isListening, disabled]);

  if (!isSupported) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={toggleListening}
      disabled={disabled}
      className={cn(
        "flex items-center justify-center p-2 rounded-lg transition-all",
        isListening 
          ? "bg-brand-accent text-white animate-pulse" 
          : "bg-brand-light/20 text-brand-dark/60 hover:bg-brand-light/40 hover:text-brand-dark",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      title={isListening ? "Stop recording" : placeholder}
    >
      <Mic className="w-4 h-4" />
    </button>
  );
}

interface VoiceInputFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  label?: string;
  language?: string;
  onLanguageChange?: (lang: string) => void;
  showLanguagePicker?: boolean;
}

export function VoiceInputField({ 
  value, 
  onChange, 
  placeholder, 
  className, 
  multiline = false, 
  rows = 3,
  disabled = false,
  label,
  language = "en",
  onLanguageChange,
  showLanguagePicker = true
}: VoiceInputFieldProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [showMoreLanguages, setShowMoreLanguages] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isMountedRef = useRef(true);
  const languageRef = useRef(selectedLanguage);
  
  useEffect(() => {
    valueRef.current = value;
  }, [value]);
  
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    setSelectedLanguage(language);
    languageRef.current = language;
  }, [language]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        recognitionRef.current = null;
      }
    };
  }, []);

  const createRecognition = useCallback((lang: string) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return null;
    }

    const recognitionInstance = new SpeechRecognition();
    recognitionInstance.continuous = true;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = getWebSpeechLanguageCode(lang);

    recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
      if (!isMountedRef.current) return;
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        }
      }
      if (finalTranscript.trim()) {
        const currentValue = valueRef.current;
        onChangeRef.current(currentValue ? currentValue + " " + finalTranscript.trim() : finalTranscript.trim());
      }
    };

    recognitionInstance.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      if (isMountedRef.current) setIsListening(false);
    };

    recognitionInstance.onend = () => {
      if (isMountedRef.current) setIsListening(false);
    };

    return recognitionInstance;
  }, []);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  const startListening = useCallback(() => {
    if (disabled) return;
    
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    
    const newRecognition = createRecognition(languageRef.current);
    if (!newRecognition) return;
    
    recognitionRef.current = newRecognition;
    
    try {
      newRecognition.start();
      setIsListening(true);
    } catch (error) {
      console.error("Failed to start speech recognition:", error);
    }
  }, [disabled, createRecognition]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const handleMicClick = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleLanguageSelect = useCallback((langCode: string) => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setSelectedLanguage(langCode);
    languageRef.current = langCode;
    onLanguageChange?.(langCode);
    setShowPicker(false);
    setShowMoreLanguages(false);
  }, [onLanguageChange]);

  const currentLanguageInfo = ALL_LANGUAGES.find(l => l.code === selectedLanguage) || QUICK_LANGUAGES[0];
  
  const openLanguagePicker = useCallback(() => {
    if (isListening) {
      stopListening();
    }
    setShowPicker(true);
    setShowMoreLanguages(false);
  }, [isListening, stopListening]);

  const inputClasses = cn(
    "w-full px-3 py-2 pr-16 border border-brand-light/30 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none",
    isListening && "ring-2 ring-brand-accent border-brand-accent",
    className
  );

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-brand-dark mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={inputClasses}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClasses}
          />
        )}
        
        {showLanguagePicker && (
          <div className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1",
            multiline && "top-3 translate-y-0"
          )}>
            <button
              type="button"
              onClick={openLanguagePicker}
              disabled={disabled}
              className={cn(
                "p-1 rounded text-sm transition-all",
                "text-brand-dark/50 hover:text-brand-dark hover:bg-brand-light/20",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              title={`Language: ${currentLanguageInfo.name} - click to change`}
            >
              <span className="text-base">{currentLanguageInfo.flag}</span>
            </button>
            {isSupported && (
              <button
                type="button"
                onClick={handleMicClick}
                disabled={disabled}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  isListening 
                    ? "bg-brand-accent text-white animate-pulse" 
                    : "text-brand-dark/40 hover:text-brand-dark hover:bg-brand-light/20",
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                title={isListening ? "Stop recording" : "Speak to type"}
              >
                <Mic className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        
        {!showLanguagePicker && isSupported && (
          <button
            type="button"
            onClick={handleMicClick}
            disabled={disabled}
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md transition-all",
              isListening 
                ? "bg-brand-accent text-white animate-pulse" 
                : "text-brand-dark/40 hover:text-brand-dark hover:bg-brand-light/20",
              disabled && "opacity-50 cursor-not-allowed",
              multiline && "top-3 translate-y-0"
            )}
            title={isListening ? "Stop recording" : "Speak to type"}
          >
            <Mic className="w-4 h-4" />
          </button>
        )}

        {showPicker && (
          <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-xl shadow-lg border border-brand-light/30 p-3 w-72 sm:w-80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-brand-dark">Select language</span>
              <button 
                onClick={() => setShowPicker(false)}
                className="p-1 text-brand-dark/40 hover:text-brand-dark rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              {QUICK_LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageSelect(lang.code)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg border transition-all text-left",
                    selectedLanguage === lang.code
                      ? "border-brand-primary bg-brand-primary/10"
                      : "border-brand-light/30 hover:border-brand-primary hover:bg-brand-primary/5"
                  )}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium text-brand-dark">{lang.name}</span>
                </button>
              ))}
            </div>

            {!showMoreLanguages ? (
              <button
                onClick={() => setShowMoreLanguages(true)}
                className="w-full mt-2 py-2 text-sm text-brand-primary hover:text-brand-primary/80 transition-colors"
              >
                More languages...
              </button>
            ) : (
              <div className="mt-3 pt-3 border-t border-brand-light/20">
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {MORE_LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSelect(lang.code)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-left",
                        selectedLanguage === lang.code
                          ? "border-brand-primary bg-brand-primary/10"
                          : "border-brand-light/30 hover:border-brand-primary hover:bg-brand-primary/5"
                      )}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span className="text-xs font-medium text-brand-dark truncate">{lang.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      {isListening && (
        <p className="text-xs text-brand-accent mt-1 flex items-center gap-1">
          <span className="inline-block w-2 h-2 bg-brand-accent rounded-full animate-pulse" />
          Listening in {currentLanguageInfo.name}...
        </p>
      )}
    </div>
  );
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}
