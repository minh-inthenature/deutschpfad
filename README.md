# 🇩🇪 DeutschPfad (German Path)

> **Daily German · A0 to B1**  
> A mobile-first, 100% offline-ready German language learning app built with React 19, TypeScript, Tailwind CSS, Dexie.js (IndexedDB), and Capacitor Android.

![DeutschPfad Release v1.0.0](https://img.shields.io/badge/release-v1.0.0-brightgreen.svg)
![Android Ready](https://img.shields.io/badge/platform-Android%20%7C%20Web-blue.svg)
![Offline First](https://img.shields.io/badge/storage-100%25%20Offline%20Dexie.js-orange.svg)
![License](https://img.shields.io/badge/license-MIT-lightgrey.svg)

---

## ✨ Features Overview

### 1. 📚 Complete CEFR Curriculum (A0 – B1)
- **380 Core Vocabulary Entries**: Detailed entries across CEFR levels A0 (80 foundational words), A1 (100 words), A2 (100 words), and B1 (100 words).
- **Rich Linguistic Metadata**: Accurate gender color-coding (`der` blue, `die` red, `das` green), plural forms with umlaut shifts, contextual example sentences with English translations, and native German Text-to-Speech (TTS).
- **21 Interactive Milestones**: 210 structured diagnostic & practice questions across all CEFR bands, from pronunciation & umlauts to complex subordinate clauses and subjunctive moods.

### 2. ⚡ Active Fluency Drill Modes
- **Artikel & Plural Master**: 2-step card testing `der`/`die`/`das` followed by plural typing with umlaut helpers (`ä`, `ö`, `ü`, `ß`) and diff visualization.
- **Fall-Training (Case Blitz)**: Rapid cloze sentences drilling Nominative, Accusative, and Dative case inflections with immediate 1-line rule explanations.
- **Satzbau (Sentence Builder)**: Practice German syntax (V2 word order, modal verb brackets, Perfekt bracket, and *weil* verb-final clauses) using either shuffled word tiles or free typing with offline grammatical validation.
- **Recall Flip & Type/Spell**: Spaced repetition flashcards and precision spelling drills.

### 3. 🧠 Smart Mistake Notebook & Daily Focus
- **Automatic Error Tracking**: Captures incorrect responses across all drill modes into an offline Dexie.js database (`mistakeLogs`).
- **Inline Mnemonic Notes**: Attach custom memory aids directly on drill error banners.
- **Hero Spotlight Card**: Highlights your top missed word on the Home dashboard or cycles to "Today's Word" for consistent daily review.
- **Targeted Drill Queue**: Practice weak items until resolved (2 consecutive correct answers).

### 4. 📖 Hybrid Offline / Online Wörterbuch (Dictionary)
- **1,200+ Offline Vocabulary Cache**: Instant lookup for German ↔ English words, full 4-case noun declension tables, verb conjugations (Präsens, Präteritum, Perfekt), collocations, and example sentences.
- **Live Auto-Caching**: When connected to the internet, lookups query live public endpoints (Wiktionary REST & MyMemory) and automatically cache new entries into local Dexie.js for subsequent offline use.
- **One-Tap Deck Addition**: Easily add any dictionary term directly to your study deck.

---

## 📱 Android APK Installation

You can download the ready-to-install Android APK directly from the GitHub Releases:

1. Go to the [Releases](https://github.com/minh-inthenature/deutschpfad/releases/tag/v1.0.0) page.
2. Download **`DeutschPfad-v1.0.0.apk`** (or `app-debug.apk`).
3. Open the file on your Android device and confirm installation (allow installation from unknown sources if prompted).

---

## 🛠️ Tech Stack

- **Framework**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with custom warm-editorial aesthetic
- **Icons**: [Lucide React](https://lucide.dev/)
- **Local Database**: [Dexie.js v4](https://dexie.org/) (IndexedDB wrapper)
- **Mobile Runtime**: [Capacitor 8](https://capacitorjs.com/) with native Text-to-Speech plugin
- **TTS**: `@capacitor-community/text-to-speech` with browser Web Speech API fallback

---

## 🚀 Development & Local Setup

### Prerequisites
- Node.js 18+ & npm
- (Optional for Android builds) Android Studio / Android SDK (Platform 37, Build Tools 36+) and JDK 21

### Run Web Version
```bash
# Clone the repository
git clone https://github.com/minh-inthenature/deutschpfad.git
cd deutschpfad

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

### Build Android APK
```bash
# Build production web bundle and sync to Android
npm run build
npx cap sync android

# Compile debug APK
cd android
./gradlew assembleDebug   # Windows: gradlew.bat assembleDebug
```
The resulting APK is generated at `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 📄 License
MIT License. Open-source for personal German language learning and educational use.
