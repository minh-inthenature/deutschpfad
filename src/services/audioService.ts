import { TextToSpeech } from '@capacitor-community/text-to-speech';
import {
  db,
  type CefrLevel,
  type ListeningDialogueLine,
  type ListeningLesson,
  type ListeningQuestion,
} from '../db/database';
import { getSavedGeminiKey, getSavedGeminiModel } from './geminiTutor';

export type PlaybackSpeed = 'normal' | 'slow';

export const NORMAL_RATE = 1.0;
export const SLOW_RATE = 0.72;

let activeHtmlAudio: HTMLAudioElement | null = null;
let playbackCancelled = false;

export const PRESET_DIALOGUES: Omit<ListeningLesson, 'id' | 'createdAt'>[] = [
  {
    cacheKey: 'preset-a0-cafe',
    title: 'Im Café · Ordering Coffee',
    level: 'A0',
    source: 'preset',
    lines: [
      {
        speaker: 'Kellner',
        de: 'Guten Tag! Was möchten Sie trinken?',
        en: 'Good day! What would you like to drink?',
      },
      {
        speaker: 'Gast',
        de: 'Ich möchte bitte einen Kaffee mit Milch.',
        en: 'I would like a coffee with milk, please.',
      },
      {
        speaker: 'Kellner',
        de: 'Gerne. Möchten Sie auch ein Stück Kuchen?',
        en: 'Gladly. Would you also like a piece of cake?',
      },
      {
        speaker: 'Gast',
        de: 'Nein, danke. Nur den Kaffee.',
        en: 'No, thank you. Just the coffee.',
      },
    ],
    questions: [
      {
        prompt: 'What does the guest order?',
        options: ['A tea with lemon', 'A coffee with milk', 'A glass of water'],
        correctIndex: 1,
      },
      {
        prompt: 'Does the guest want cake?',
        options: ['Yes, a piece of apple cake', 'No, only the coffee', 'Yes, two pieces'],
        correctIndex: 1,
      },
    ],
  },
  {
    cacheKey: 'preset-a1-bahnhof',
    title: 'Am Bahnhof · Asking Directions',
    level: 'A1',
    source: 'preset',
    lines: [
      {
        speaker: 'Anna',
        de: 'Entschuldigung, wo ist der Bahnhof?',
        en: 'Excuse me, where is the train station?',
      },
      {
        speaker: 'Passant',
        de: 'Gehen Sie hier geradeaus und dann links.',
        en: 'Go straight ahead here and then left.',
      },
      {
        speaker: 'Anna',
        de: 'Wie lange dauert das zu Fuß?',
        en: 'How long does that take on foot?',
      },
      {
        speaker: 'Passant',
        de: 'Ungefähr fünf Minuten. Es ist ganz nah.',
        en: 'About five minutes. It is very close.',
      },
    ],
    questions: [
      {
        prompt: 'Where should Anna turn after going straight?',
        options: ['Right', 'Left', 'Back'],
        correctIndex: 1,
      },
      {
        prompt: 'How long is the walk to the train station?',
        options: ['About 5 minutes', 'About 20 minutes', 'About 30 minutes'],
        correctIndex: 0,
      },
    ],
  },
  {
    cacheKey: 'preset-a1-einkauf',
    title: 'Auf dem Markt · Buying Fruit',
    level: 'A1',
    source: 'preset',
    lines: [
      {
        speaker: 'Verkäufer',
        de: 'Hallo! Was darf es heute sein?',
        en: 'Hello! What can I get you today?',
      },
      {
        speaker: 'Kunde',
        de: 'Ich hätte gern ein Kilo rote Äpfel.',
        en: 'I would like one kilo of red apples.',
      },
      {
        speaker: 'Verkäufer',
        de: 'Hier bitte. Das macht zusammen drei Euro.',
        en: 'Here you go. That comes to three euros in total.',
      },
    ],
    questions: [
      {
        prompt: 'What does the customer buy?',
        options: ['One kilo of bananas', 'One kilo of red apples', 'Two kilos of pears'],
        correctIndex: 1,
      },
      {
        prompt: 'How much do the apples cost?',
        options: ['Two euros', 'Three euros', 'Five euros'],
        correctIndex: 1,
      },
    ],
  },
];

function speakWithWebSpeechAsync(text: string, rate: number): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }
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
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}

export async function stopAudio(): Promise<void> {
  playbackCancelled = true;
  if (activeHtmlAudio) {
    try {
      activeHtmlAudio.pause();
      activeHtmlAudio.currentTime = 0;
    } catch {
      // ignore
    }
    activeHtmlAudio = null;
  }
  try {
    await TextToSpeech.stop();
  } catch {
    // ignore on web
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
  }
}

/**
 * Pronounces German text at normal (1.0) or slow (0.72) speed
 * using @capacitor-community/text-to-speech with Web Speech fallback.
 */
export async function speakDe(
  text: string,
  speed: PlaybackSpeed = 'normal',
): Promise<void> {
  const clean = text.trim();
  if (!clean) return;

  playbackCancelled = false;
  const rate = speed === 'slow' ? SLOW_RATE : NORMAL_RATE;

  try {
    await TextToSpeech.speak({
      text: clean,
      lang: 'de-DE',
      rate,
      pitch: 1.0,
      volume: 1.0,
      category: 'ambient',
    });
  } catch {
    await speakWithWebSpeechAsync(clean, rate);
  }
}

/**
 * Plays a cached base64 audio clip if available; otherwise speaks dialogue lines
 * sequentially via offline de-DE TTS.
 */
export async function playLessonAudio(
  lesson: Pick<ListeningLesson, 'lines' | 'audioBase64' | 'audioMimeType'>,
  speed: PlaybackSpeed = 'normal',
  onLineChange?: (index: number | null) => void,
): Promise<void> {
  await stopAudio();
  playbackCancelled = false;

  if (lesson.audioBase64 && lesson.audioMimeType) {
    await new Promise<void>((resolve) => {
      const src = `data:${lesson.audioMimeType};base64,${lesson.audioBase64}`;
      const audio = new Audio(src);
      audio.playbackRate = speed === 'slow' ? 0.75 : 1.0;
      activeHtmlAudio = audio;
      onLineChange?.(0);
      audio.onended = () => {
        activeHtmlAudio = null;
        onLineChange?.(null);
        resolve();
      };
      audio.onerror = () => {
        activeHtmlAudio = null;
        onLineChange?.(null);
        resolve();
      };
      void audio.play().catch(() => {
        activeHtmlAudio = null;
        onLineChange?.(null);
        resolve();
      });
    });
    return;
  }

  for (let i = 0; i < lesson.lines.length; i++) {
    if (playbackCancelled) break;
    onLineChange?.(i);
    await speakDe(lesson.lines[i].de, speed);
    if (playbackCancelled) break;
    await new Promise((r) => setTimeout(r, 260));
  }
  onLineChange?.(null);
}

/**
 * Wraps raw 16-bit PCM (24kHz mono) returned by Gemini TTS into a playable WAV base64 string.
 */
function pcmBase64ToWavBase64(pcmBase64: string, sampleRate = 24000): string {
  const binary = atob(pcmBase64);
  const pcmBytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    pcmBytes[i] = binary.charCodeAt(i);
  }

  const wavBuffer = new ArrayBuffer(44 + pcmBytes.length);
  const view = new DataView(wavBuffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + pcmBytes.length, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, pcmBytes.length, true);
  new Uint8Array(wavBuffer, 44).set(pcmBytes);

  const wavBytes = new Uint8Array(wavBuffer);
  let out = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < wavBytes.length; i += chunkSize) {
    out += String.fromCharCode(...wavBytes.subarray(i, i + chunkSize));
  }
  return btoa(out);
}

/**
 * Generates a short German dialogue + 2 MCQs + optional Gemini TTS audio,
 * caching the full result in Dexie (`listeningLessons`) for zero-token replay.
 */
export async function generateGeminiDialogueLesson(
  level: CefrLevel,
  topicHint: string = 'everyday conversation',
): Promise<ListeningLesson> {
  const apiKey = getSavedGeminiKey();
  if (!apiKey) {
    throw new Error('Configure a Gemini API key in Reference → AI Tutor to generate new dialogues.');
  }

  const model = getSavedGeminiModel();
  const prompt = `Create a short, natural German ${level} listening dialogue (3-4 lines, topic: "${topicHint}").
Return ONLY valid JSON:
{
  "title": "German Title · English Topic",
  "lines": [
    { "speaker": "Anna", "de": "...", "en": "..." }
  ],
  "questions": [
    { "prompt": "English comprehension question?", "options": ["opt A", "opt B", "opt C"], "correctIndex": 0 }
  ]
}
Keep sentences concise and natural. Exactly 2 questions, 3 options each.`;

  const textRes = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.5,
          responseMimeType: 'application/json',
        },
      }),
    },
  );

  const textData = (await textRes.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (!textRes.ok) {
    throw new Error(textData.error?.message || `Gemini request failed (${textRes.status})`);
  }

  const rawJson = textData.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
  const parsed = JSON.parse(rawJson) as {
    title: string;
    lines: ListeningDialogueLine[];
    questions: ListeningQuestion[];
  };

  let audioBase64: string | undefined;
  let audioMimeType: string | undefined;

  // Attempt token-efficient Gemini TTS synthesis and cache result in Dexie
  try {
    const scriptText = parsed.lines.map((l) => `${l.speaker}: ${l.de}`).join('\n');
    const ttsRes = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `Read this German dialogue naturally:\n${scriptText}` }],
            },
          ],
          generationConfig: {
            responseModalities: ['AUDIO'],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: 'Kore' },
              },
            },
          },
        }),
      },
    );

    if (ttsRes.ok) {
      const ttsJson = (await ttsRes.json()) as {
        candidates?: Array<{
          content?: {
            parts?: Array<{
              inlineData?: { mimeType?: string; data?: string };
            }>;
          };
        }>;
      };
      const inline = ttsJson.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (inline?.data) {
        const mime = inline.mimeType || 'audio/L16;rate=24000';
        if (mime.toLowerCase().includes('pcm') || mime.toLowerCase().includes('l16')) {
          audioBase64 = pcmBase64ToWavBase64(inline.data, 24000);
          audioMimeType = 'audio/wav';
        } else {
          audioBase64 = inline.data;
          audioMimeType = mime;
        }
      }
    }
  } catch {
    // Graceful fallback: offline de-DE TTS will read the cached dialogue lines
  }

  const lesson: ListeningLesson = {
    cacheKey: `gemini-${level.toLowerCase()}-${Date.now()}`,
    title: parsed.title,
    level,
    lines: parsed.lines,
    questions: parsed.questions.slice(0, 2),
    audioBase64,
    audioMimeType,
    source: 'gemini',
    createdAt: Date.now(),
  };

  const id = await db.listeningLessons.add(lesson);
  return { ...lesson, id };
}

export async function getAllListeningLessons(): Promise<ListeningLesson[]> {
  const cached = await db.listeningLessons.orderBy('createdAt').reverse().toArray();
  const presets: ListeningLesson[] = PRESET_DIALOGUES.map((p) => ({
    ...p,
    createdAt: 0,
  }));
  return [...cached, ...presets];
}
