import { TextToSpeech } from '@capacitor-community/text-to-speech';
import type { CefrLevel, DictLevel, GermanArticle } from '../db/database';

export function getArticleStyle(article: GermanArticle): {
  badge: string;
  solid: string;
  text: string;
  border: string;
  label: string;
} {
  switch (article) {
    case 'der':
      // Cobalt blue
      return {
        badge: 'bg-blue-50 text-blue-800 border-blue-300',
        solid: 'bg-blue-700 text-white border-blue-800',
        text: 'text-blue-700',
        border: 'border-blue-300',
        label: 'der · masc.',
      };
    case 'die':
      // Crimson red
      return {
        badge: 'bg-red-50 text-red-800 border-red-300',
        solid: 'bg-red-700 text-white border-red-800',
        text: 'text-red-700',
        border: 'border-red-300',
        label: 'die · fem.',
      };
    case 'das':
      // Emerald green
      return {
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        solid: 'bg-emerald-700 text-white border-emerald-800',
        text: 'text-emerald-700',
        border: 'border-emerald-300',
        label: 'das · neut.',
      };
    default:
      return {
        badge: 'bg-stone-100 text-stone-700 border-stone-300',
        solid: 'bg-slate-700 text-white border-slate-800',
        text: 'text-slate-600',
        border: 'border-stone-300',
        label: 'verb / adj.',
      };
  }
}

export const CEFR_ORDER: Record<CefrLevel, number> = {
  A0: 0,
  A1: 1,
  A2: 2,
  B1: 3,
};

export function getLevelStyle(level: CefrLevel | DictLevel): string {
  switch (level) {
    case 'A0':
      return 'bg-teal-50 text-teal-800 border-teal-300';
    case 'A1':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    case 'A2':
      return 'bg-blue-50 text-blue-800 border-blue-300';
    case 'B1':
      return 'bg-amber-50 text-amber-900 border-amber-300';
    case 'B2':
      return 'bg-purple-50 text-purple-900 border-purple-300';
  }
}

export function formatWordWithArticle(article: GermanArticle, german: string): string {
  return article === 'none' ? german : `${article} ${german}`;
}

function speakWithWebSpeech(text: string, rate: number): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'de-DE';
    utterance.rate = rate;
    const voices = window.speechSynthesis.getVoices();
    const deVoice = voices.find((v) => v.lang.toLowerCase().startsWith('de'));
    if (deVoice) {
      utterance.voice = deVoice;
    }
    window.speechSynthesis.speak(utterance);
  } catch {
    // Gracefully ignore if browser speech synthesis is blocked or unavailable
  }
}

/**
 * Pronounces German text using @capacitor-community/text-to-speech when available,
 * with automatic fallback to window.speechSynthesis (de-DE).
 */
export async function speakGerman(text: string, rate: number = 0.92): Promise<void> {
  if (!text.trim()) return;
  try {
    await TextToSpeech.speak({
      text,
      lang: 'de-DE',
      rate,
      pitch: 1.0,
      volume: 1.0,
      category: 'ambient',
    });
  } catch {
    speakWithWebSpeech(text, rate);
  }
}
