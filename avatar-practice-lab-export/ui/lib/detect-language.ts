import { franc } from "franc-min";

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", francCode: "eng" },
  { code: "hi", name: "Hindi", francCode: "hin" },
  { code: "bn", name: "Bengali", francCode: "ben" },
  { code: "te", name: "Telugu", francCode: "tel" },
  { code: "ta", name: "Tamil", francCode: "tam" },
  { code: "mr", name: "Marathi", francCode: "mar" },
  { code: "gu", name: "Gujarati", francCode: "guj" },
  { code: "kn", name: "Kannada", francCode: "kan" },
  { code: "ml", name: "Malayalam", francCode: "mal" },
  { code: "es", name: "Spanish", francCode: "spa" },
  { code: "fr", name: "French", francCode: "fra" },
  { code: "de", name: "German", francCode: "deu" },
  { code: "it", name: "Italian", francCode: "ita" },
  { code: "pt", name: "Portuguese", francCode: "por" },
  { code: "zh", name: "Mandarin Chinese", francCode: "cmn" },
  { code: "ja", name: "Japanese", francCode: "jpn" },
  { code: "ko", name: "Korean", francCode: "kor" },
  { code: "ar", name: "Arabic", francCode: "arb" },
  { code: "ru", name: "Russian", francCode: "rus" },
  { code: "nl", name: "Dutch", francCode: "nld" },
  { code: "pl", name: "Polish", francCode: "pol" },
  { code: "tr", name: "Turkish", francCode: "tur" },
];

export interface DetectedLanguage {
  code: string;
  name: string;
  confidence: "high" | "medium" | "low";
}

export function detectLanguage(text: string): DetectedLanguage {
  if (!text || text.trim().length < 3) {
    return { code: "en", name: "English", confidence: "low" };
  }

  const francCode = franc(text.trim());
  
  if (francCode === "und") {
    return { code: "en", name: "English", confidence: "low" };
  }

  const matched = SUPPORTED_LANGUAGES.find(lang => lang.francCode === francCode);
  
  if (matched) {
    const confidence = text.trim().length >= 20 ? "high" : text.trim().length >= 10 ? "medium" : "low";
    return { code: matched.code, name: matched.name, confidence };
  }

  return { code: "en", name: "English", confidence: "low" };
}

export function getLanguageName(code: string): string {
  const lang = SUPPORTED_LANGUAGES.find(l => l.code === code);
  return lang?.name || "English";
}

export { SUPPORTED_LANGUAGES };
