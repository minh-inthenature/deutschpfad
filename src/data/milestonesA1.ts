import type { SeedMilestoneInput } from '../db/database';

export const MILESTONES_A1: SeedMilestoneInput[] = [
  // ===================== A1-01 =====================
  {
    code: 'A1-01',
    level: 'A1',
    title: 'Articles, Gender & Nominative',
    orderIndex: 1,
    isUnlocked: true,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Articles, Gender & Nominative Case

Every German noun has one of three grammatical genders: **masculine** (\`der\`), **feminine** (\`die\`), or **neuter** (\`das\`). The **Nominative case** is used for the **subject** of a sentence (who or what performs the action) and after linking verbs like \`sein\` (to be) and \`werden\` (to become).

> **Formula:** Subject (Nominative) + \`sein\` / Verb + Predicate Noun (Nominative) → *Der Mann ist ein Lehrer.*

| Gender | Definite (the) | Indefinite (a/an) | Negative (no) | Example |
| --- | --- | --- | --- | --- |
| Masculine | **der** | **ein** | **kein** | der Tisch, ein Apfel |
| Feminine | **die** | **eine** | **keine** | die Wohnung, eine Lampe |
| Neuter | **das** | **ein** | **kein** | das Buch, ein Haus |
| Plural | **die** | — | **keine** | die Bücher, keine Äpfel |

### Reliable Noun Ending Clues
- **der (masculine):** days, months, seasons (\`der Montag\`), endings \`-er\`, \`-ig\`, \`-ling\`, \`-ismus\`
- **die (feminine):** endings \`-ung\`, \`-heit\`, \`-keit\`, \`-schaft\`, \`-tät\`, \`-ion\`, and most \`-e\` nouns (\`die Schule\`)
- **das (neuter):** endings \`-chen\`, \`-lein\`, \`-ment\`, \`-um\`, and infinitives used as nouns (\`das Essen\`)

### Examples
- \`Das Haus ist groß.\` (The house is big.)
- \`Die Zeitung liegt auf dem Tisch.\` (The newspaper is on the table.)
- \`Das ist ein Apfel, keine Birne.\` (That is an apple, not a pear.)`,
    questions: [
      {
        id: 'a1-01-q1',
        type: 'mcq',
        prompt: 'Which definite article belongs to "Wohnung" (apartment)?',
        options: ['der', 'die', 'das', 'den'],
        answer: 'die',
        explanation: 'All German nouns ending in "-ung" are feminine, so "Wohnung" takes "die".',
      },
      {
        id: 'a1-01-q2',
        type: 'mcq',
        prompt: 'Choose the correct indefinite article: "Das ist ___ Buch."',
        options: ['ein', 'eine', 'einen', 'der'],
        answer: 'ein',
        explanation: '"Buch" is neuter ("das Buch"), and neuter nouns take the nominative indefinite article "ein".',
      },
      {
        id: 'a1-01-q3',
        type: 'mcq',
        prompt: 'Which definite article is used for ALL plural nouns in the nominative case?',
        options: ['der', 'die', 'das', 'ein'],
        answer: 'die',
        explanation: 'In the nominative case, all plural nouns use "die" regardless of their singular gender.',
      },
      {
        id: 'a1-01-q4',
        type: 'mcq',
        prompt: 'Based on its ending, which article belongs to "Mädchen" (girl)?',
        options: ['der', 'die', 'das', 'eine'],
        answer: 'das',
        explanation: 'Diminutive nouns ending in "-chen" or "-lein" are always grammatically neuter ("das Mädchen").',
      },
      {
        id: 'a1-01-q5',
        type: 'fill',
        prompt: 'Complete the nominative sentence with the definite article for "Apfel" (masculine):',
        sentenceBefore: '',
        sentenceAfter: 'Apfel ist sehr süß.',
        answer: 'Der',
        acceptedAnswers: ['Der', 'der'],
        hint: 'Masculine nominative definite article',
        explanation: '"Apfel" is masculine ("der Apfel"), so as the subject in the nominative case it takes "Der".',
      },
      {
        id: 'a1-01-q6',
        type: 'fill',
        prompt: 'Fill in the nominative indefinite article for "Stadt" (feminine):',
        sentenceBefore: 'Berlin ist',
        sentenceAfter: 'große Stadt.',
        answer: 'eine',
        acceptedAnswers: ['eine'],
        hint: 'Feminine indefinite article',
        explanation: 'After "sein" ("ist"), the predicate noun stays in the nominative case. Feminine "Stadt" takes "eine".',
      },
      {
        id: 'a1-01-q7',
        type: 'fill',
        prompt: 'Fill in the negative article for "Familie" (feminine):',
        sentenceBefore: 'Das ist',
        sentenceAfter: 'kleine Familie.',
        answer: 'keine',
        acceptedAnswers: ['keine'],
        hint: 'Feminine form of "kein"',
        explanation: 'Feminine nouns in the nominative case take the negative article "keine".',
      },
      {
        id: 'a1-01-q8',
        type: 'reorder',
        prompt: 'Arrange the words to form: "The house is big."',
        words: ['groß.', 'Das', 'ist', 'Haus'],
        correctOrder: ['Das', 'Haus', 'ist', 'groß.'],
        explanation: 'The nominative subject "Das Haus" comes first, followed by the conjugated verb "ist" and the adjective "groß.".',
      },
      {
        id: 'a1-01-q9',
        type: 'reorder',
        prompt: 'Arrange the words to form: "The books are interesting."',
        words: ['interessant.', 'sind', 'Bücher', 'Die'],
        correctOrder: ['Die', 'Bücher', 'sind', 'interessant.'],
        explanation: 'Plural nouns take "Die" in the nominative case and pair with the plural verb "sind".',
      },
      {
        id: 'a1-01-q10',
        type: 'reorder',
        prompt: 'Arrange the words to form: "That is a good teacher."',
        words: ['Lehrer.', 'ist', 'ein', 'Das', 'guter'],
        correctOrder: ['Das', 'ist', 'ein', 'guter', 'Lehrer.'],
        explanation: 'The demonstrative subject "Das" is followed by "ist" and the masculine nominative predicate "ein guter Lehrer.".',
      },
    ],
  },

  // ===================== A1-02 =====================
  {
    code: 'A1-02',
    level: 'A1',
    title: 'Present Tense & Stem-Changing Verbs',
    orderIndex: 2,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Present Tense (Präsens) & Stem-Changing Verbs

German uses the **Präsens** for both current actions ("I learn / I am learning") and near-future plans. Regular verbs remove \`-en\` from the infinitive to find the **stem** (e.g., \`lernen\` → \`lern-\`) and add personal endings.

> **Formula:** Verb Stem + Personal Ending (\`-e, -st, -t, -en, -t, -en\`). Stem vowel changes ONLY occur in **du** and **er/sie/es**!

| Pronoun | Ending | lernen (regular) | sprechen (e → i) | fahren (a → ä) | sein / haben |
| --- | --- | --- | --- | --- | --- |
| ich | **-e** | lerne | spreche | fahre | bin / habe |
| du | **-st** | lernst | **sprichst** | **fährst** | bist / hast |
| er / sie / es | **-t** | lernt | **spricht** | **fährt** | ist / hat |
| wir | **-en** | lernen | sprechen | fahren | sind / haben |
| ihr | **-t** | lernt | sprecht | fahrt | seid / habt |
| sie / Sie | **-en** | lernen | sprechen | fahren | sind / haben |

### Common Stem-Change Patterns (du & er/sie/es only)
- **e → i:** \`sprechen\` (sprichst), \`essen\` (isst), \`geben\` (gibt), \`helfen\` (hilft)
- **e → ie:** \`lesen\` (liest), \`sehen\` (sieht)
- **a → ä:** \`fahren\` (fährt), \`schlafen\` (schläft), \`laufen\` (läuft)
- **Extra \`-e-\`:** Stems ending in \`-t\` or \`-d\` (e.g., \`arbeiten\`) add \`-e-\` before \`-st\` and \`-t\`: \`du arbeitest\`, \`er arbeitet\`.

### Examples
- \`Du sprichst sehr gut Deutsch.\` (You speak German very well.)
- \`Er fährt morgen nach München.\` (He is driving to Munich tomorrow.)
- \`Ihr lest gern Bücher.\` (You all like reading books — no stem change in \`ihr\`!)`,
    questions: [
      {
        id: 'a1-02-q1',
        type: 'mcq',
        prompt: 'Choose the correct form of "sprechen": "Du ___ sehr gut Deutsch."',
        options: ['spreche', 'sprichst', 'sprecht', 'sprechen'],
        answer: 'sprichst',
        explanation: '"sprechen" is a stem-changing verb (e → i) in the "du" and "er/sie/es" forms: "du sprichst".',
      },
      {
        id: 'a1-02-q2',
        type: 'mcq',
        prompt: 'Which conjugation of "fahren" (to drive) is correct for "er"?',
        options: ['er fahrt', 'er fährt', 'er fahren', 'er fährst'],
        answer: 'er fährt',
        explanation: '"fahren" changes its stem vowel from "a" to "ä" in the "du" and "er/sie/es" forms: "er fährt".',
      },
      {
        id: 'a1-02-q3',
        type: 'mcq',
        prompt: 'Choose the correct form of "lesen" for "ihr" (you all): "Ihr ___ die Zeitung."',
        options: ['liest', 'lesst', 'lest', 'lesen'],
        answer: 'lest',
        explanation: 'Stem vowel changes NEVER apply to "ihr" (you plural). The regular ending "-t" is added to the stem "les-": "ihr lest".',
      },
      {
        id: 'a1-02-q4',
        type: 'mcq',
        prompt: 'Choose the correct form of "arbeiten" (to work): "Meine Mutter ___ im Krankenhaus."',
        options: ['arbeitt', 'arbeitet', 'arbeitst', 'arbeiten'],
        answer: 'arbeitet',
        explanation: 'Because the stem "arbeit-" ends in "-t", an extra "-e-" is inserted before the "-t" ending for easier pronunciation: "arbeitet".',
      },
      {
        id: 'a1-02-q5',
        type: 'fill',
        prompt: 'Conjugate "sehen" (e → ie) in the present tense:',
        sentenceBefore: 'Maria',
        sentenceAfter: 'einen guten Film.',
        answer: 'sieht',
        acceptedAnswers: ['sieht'],
        hint: 'er/sie/es form of "sehen"',
        explanation: '"sehen" changes its stem vowel from "e" to "ie" in the third-person singular: "Maria sieht".',
      },
      {
        id: 'a1-02-q6',
        type: 'fill',
        prompt: 'Conjugate "haben" (to have) for "du":',
        sentenceBefore: '',
        sentenceAfter: 'du heute Zeit?',
        answer: 'Hast',
        acceptedAnswers: ['Hast', 'hast'],
        hint: 'Irregular "du" form of "haben"',
        explanation: '"haben" drops the "b" in the "du" and "er/sie/es" forms: "du hast", "er hat".',
      },
      {
        id: 'a1-02-q7',
        type: 'fill',
        prompt: 'Conjugate "schlafen" (a → ä) for "er":',
        sentenceBefore: 'Das Kind',
        sentenceAfter: 'schon seit acht Uhr.',
        answer: 'schläft',
        acceptedAnswers: ['schläft'],
        hint: 'a → ä stem change + -t',
        explanation: '"schlafen" takes an umlaut (a → ä) in the third-person singular: "Das Kind schläft".',
      },
      {
        id: 'a1-02-q8',
        type: 'reorder',
        prompt: 'Arrange the words to form: "We are learning German today."',
        words: ['Deutsch.', 'Wir', 'heute', 'lernen'],
        correctOrder: ['Wir', 'lernen', 'heute', 'Deutsch.'],
        explanation: 'With "Wir", the verb takes the "-en" ending ("lernen") and sits in position 2.',
      },
      {
        id: 'a1-02-q9',
        type: 'reorder',
        prompt: 'Arrange the words to form: "He often eats an apple."',
        words: ['oft', 'isst', 'Apfel.', 'Er', 'einen'],
        correctOrder: ['Er', 'isst', 'oft', 'einen', 'Apfel.'],
        explanation: '"essen" changes e → i in the "er" form ("isst") and occupies position 2 after the subject "Er".',
      },
      {
        id: 'a1-02-q10',
        type: 'reorder',
        prompt: 'Arrange the words to form: "Are you (singular) tired today?"',
        words: ['heute', 'Bist', 'müde?', 'du'],
        correctOrder: ['Bist', 'du', 'heute', 'müde?'],
        explanation: 'In a yes/no question, the conjugated verb "Bist" (from "sein") comes first, followed by the subject "du".',
      },
    ],
  },

  // ===================== A1-03 =====================
  {
    code: 'A1-03',
    level: 'A1',
    title: 'V2 Word Order & W-Questions',
    orderIndex: 3,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## V2 Word Order & W-Questions

In German main statements and W-questions, the **conjugated verb is ALWAYS in Position 2** (the **V2 rule**). Position 1 can hold the subject, a time expression, a place, or a W-question word — if something other than the subject is in Position 1, the **subject moves directly after the verb** (inversion).

> **Formula:**
> - Statement: \`[Position 1: Subject / Time / Place]\` + **Verb (Pos. 2)** + \`[Subject if inverted]\` + Rest
> - W-Question: \`[W-Word (Pos. 1)]\` + **Verb (Pos. 2)** + \`Subject\` + Rest?
> - Yes/No Question: **Verb (Pos. 1)** + \`Subject\` + Rest?

| Sentence Type | Position 1 | Position 2 (Verb) | Position 3 | Rest |
| --- | --- | --- | --- | --- |
| Normal statement | Ich | **lerne** | heute | Deutsch. |
| Inverted statement | Heute | **lerne** | ich | Deutsch. |
| W-Question | Wo | **wohnst** | du | jetzt? |
| Yes/No Question | — | **Wohnst** (Pos. 1) | du | in Berlin? |

### Essential W-Question Words
| W-Word | Meaning | Example |
| --- | --- | --- |
| **Wer?** | Who? | \`Wer ist das?\` |
| **Was?** | What? | \`Was machst du?\` |
| **Wo?** | Where? (location) | \`Wo wohnst du?\` |
| **Wohin?** | Where to? (direction) | \`Wohin fährst du?\` |
| **Woher?** | Where from? (origin) | \`Woher kommst du?\` |
| **Wann?** | When? | \`Wann beginnt der Kurs?\` |
| **Warum?** | Why? | \`Warum lernst du Deutsch?\` |
| **Wie?** | How? | \`Wie heißt du?\` |`,
    questions: [
      {
        id: 'a1-03-q1',
        type: 'mcq',
        prompt: 'Which sentence follows the German V2 word order rule correctly?',
        options: [
          'Morgen ich fahre nach Hamburg.',
          'Morgen fahre ich nach Hamburg.',
          'Ich morgen fahre nach Hamburg.',
          'Fahre morgen ich nach Hamburg.',
        ],
        answer: 'Morgen fahre ich nach Hamburg.',
        explanation: 'When "Morgen" occupies Position 1, the conjugated verb "fahre" must remain in Position 2, pushing the subject "ich" to Position 3.',
      },
      {
        id: 'a1-03-q2',
        type: 'mcq',
        prompt: 'Which W-question word asks about someone\'s origin ("Where do you come from?")?',
        options: ['Wo', 'Wohin', 'Woher', 'Wann'],
        answer: 'Woher',
        explanation: '"Woher" means "where from" (origin), whereas "Wo" asks about static location and "Wohin" asks about destination.',
      },
      {
        id: 'a1-03-q3',
        type: 'mcq',
        prompt: 'Where does the conjugated verb go in a German Yes/No question?',
        options: ['Position 1', 'Position 2', 'At the very end', 'After the object'],
        answer: 'Position 1',
        explanation: 'Yes/No questions ("Entscheidungsfragen") have no W-word, so the conjugated verb moves to Position 1: "Kommst du heute?"',
      },
      {
        id: 'a1-03-q4',
        type: 'mcq',
        prompt: 'Choose the right W-word: "___ fährst du am Wochenende?" — "Nach Wien."',
        options: ['Wo', 'Woher', 'Wohin', 'Wer'],
        answer: 'Wohin',
        explanation: 'Because the answer expresses direction/destination ("Nach Wien"), the question requires "Wohin" (Where to?).',
      },
      {
        id: 'a1-03-q5',
        type: 'fill',
        prompt: 'Fill in the correct W-question word for "When":',
        sentenceBefore: '',
        sentenceAfter: 'beginnt der Deutschkurs?',
        answer: 'Wann',
        acceptedAnswers: ['Wann', 'wann'],
        hint: 'Question word for time ("When")',
        explanation: '"Wann" asks about a point in time: "Wann beginnt der Deutschkurs?" (When does the German course start?).',
      },
      {
        id: 'a1-03-q6',
        type: 'fill',
        prompt: 'Complete the inverted V2 sentence with the verb "gehen" (to go):',
        sentenceBefore: 'Am Abend',
        sentenceAfter: 'wir ins Kino.',
        answer: 'gehen',
        acceptedAnswers: ['gehen'],
        hint: 'Verb in Position 2 for "wir"',
        explanation: '"Am Abend" is Position 1 as a single time phrase, so the conjugated verb "gehen" (for "wir") goes directly in Position 2.',
      },
      {
        id: 'a1-03-q7',
        type: 'fill',
        prompt: 'Fill in the W-question word for "Why":',
        sentenceBefore: '',
        sentenceAfter: 'lernst du Deutsch?',
        answer: 'Warum',
        acceptedAnswers: ['Warum', 'warum'],
        hint: 'Question word asking for a reason',
        explanation: '"Warum" means "Why" and sits in Position 1, followed immediately by the verb "lernst" in Position 2.',
      },
      {
        id: 'a1-03-q8',
        type: 'reorder',
        prompt: 'Arrange the words to form an inverted V2 sentence: "Today I am working at home."',
        words: ['ich', 'zu', 'Heute', 'arbeite', 'Hause.'],
        correctOrder: ['Heute', 'arbeite', 'ich', 'zu', 'Hause.'],
        explanation: 'With "Heute" in Position 1, the verb "arbeite" stays in Position 2 and the subject "ich" comes immediately after it.',
      },
      {
        id: 'a1-03-q9',
        type: 'reorder',
        prompt: 'Arrange the words to form the W-question: "Where do you come from?"',
        words: ['kommst', 'du?', 'Woher'],
        correctOrder: ['Woher', 'kommst', 'du?'],
        explanation: 'In a W-question, the W-word ("Woher") is in Position 1, the verb ("kommst") is in Position 2, and the subject ("du") is in Position 3.',
      },
      {
        id: 'a1-03-q10',
        type: 'reorder',
        prompt: 'Arrange the words to form the Yes/No question: "Do you speak English?"',
        words: ['du', 'Englisch?', 'Sprichst'],
        correctOrder: ['Sprichst', 'du', 'Englisch?'],
        explanation: 'Yes/No questions start with the conjugated verb ("Sprichst") in Position 1, followed by the subject ("du") and the object.',
      },
    ],
  },

  // ===================== A1-04 =====================
  {
    code: 'A1-04',
    level: 'A1',
    title: 'Accusative Case & Personal Pronouns',
    orderIndex: 4,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Accusative Case (Akkusativ) & Personal Pronouns

The **Accusative case** marks the **direct object** of a sentence — the person or thing directly receiving the action of a transitive verb (e.g., \`haben\`, \`kaufen\`, \`sehen\`, \`essen\`, \`trinken\`, \`suchen\`, \`brauchen\`).

> **Formula:** Only **masculine** articles change in the Accusative: \`der → den\`, \`ein → einen\`, \`kein → keinen\`. Feminine, neuter, and plural stay identical to Nominative!

| Gender | Nominative | Accusative | Example (Accusative) |
| --- | --- | --- | --- |
| **Masculine** | der / ein / kein | **den / einen / keinen** | Ich kaufe **den** Tisch / **einen** Apfel. |
| Feminine | die / eine / keine | die / eine / keine | Ich sehe **die** Frau / **eine** Lampe. |
| Neuter | das / ein / kein | das / ein / kein | Ich lese **das** Buch / **ein** Buch. |
| Plural | die / — / keine | die / — / keine | Ich habe **keine** Bücher. |

### Personal Pronouns: Nominative vs. Accusative
| Nominative | ich | du | er | sie | es | wir | ihr | sie / Sie |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Accusative** | **mich** | **dich** | **ihn** | **sie** | **es** | **uns** | **euch** | **sie / Sie** |

### Accusative Prepositions (always + Akkusativ)
Memorize **FUDGO**: \`für\` (for), \`um\` (around/at), \`durch\` (through), \`gegen\` (against), \`ohne\` (without).
- \`Das Geschenk ist für dich.\` (The gift is for you.)
- \`Ich trinke Kaffee ohne Zucker.\` (I drink coffee without sugar.)`,
    questions: [
      {
        id: 'a1-04-q1',
        type: 'mcq',
        prompt: 'Choose the correct accusative article for "Kaffee" (masculine): "Ich trinke ___ Kaffee."',
        options: ['der', 'den', 'das', 'die'],
        answer: 'den',
        explanation: '"Kaffee" is masculine ("der Kaffee") and acts as the direct object of "trinke", so it changes to "den" in the accusative.',
      },
      {
        id: 'a1-04-q2',
        type: 'mcq',
        prompt: 'Choose the correct indefinite article for "Auto" (neuter): "Wir kaufen ___ Auto."',
        options: ['ein', 'einen', 'eine', 'den'],
        answer: 'ein',
        explanation: '"Auto" is neuter ("das Auto"). Neuter articles do not change in the accusative case, so it stays "ein".',
      },
      {
        id: 'a1-04-q3',
        type: 'mcq',
        prompt: 'Replace "den Film" (masculine) with an accusative pronoun: "Ich finde ___ sehr gut."',
        options: ['er', 'ihn', 'ihm', 'es'],
        answer: 'ihn',
        explanation: 'The accusative personal pronoun for a masculine noun ("der Film") is "ihn".',
      },
      {
        id: 'a1-04-q4',
        type: 'mcq',
        prompt: 'Choose the correct pronoun after "für": "Das Geschenk ist für ___ (you, informal singular)."',
        options: ['du', 'dir', 'dich', 'dein'],
        answer: 'dich',
        explanation: 'The preposition "für" always requires the accusative case. The accusative form of "du" is "dich".',
      },
      {
        id: 'a1-04-q5',
        type: 'fill',
        prompt: 'Fill in the accusative indefinite article for "Bruder" (masculine):',
        sentenceBefore: 'Ich habe',
        sentenceAfter: 'Bruder.',
        answer: 'einen',
        acceptedAnswers: ['einen'],
        hint: 'Masculine accusative form of "ein"',
        explanation: '"haben" takes a direct object in the accusative case. Masculine "ein" becomes "einen".',
      },
      {
        id: 'a1-04-q6',
        type: 'fill',
        prompt: 'Fill in the accusative pronoun for "ich" (me):',
        sentenceBefore: 'Siehst du',
        sentenceAfter: '?',
        answer: 'mich',
        acceptedAnswers: ['mich'],
        hint: 'Accusative form of "ich"',
        explanation: '"sehen" takes a direct object in the accusative case. The accusative form of "ich" is "mich".',
      },
      {
        id: 'a1-04-q7',
        type: 'fill',
        prompt: 'Fill in the accusative preposition meaning "without":',
        sentenceBefore: 'Ich trinke den Tee',
        sentenceAfter: 'Zucker.',
        answer: 'ohne',
        acceptedAnswers: ['ohne'],
        hint: 'FUDGO preposition meaning "without"',
        explanation: '"ohne" means "without" and always takes the accusative case.',
      },
      {
        id: 'a1-04-q8',
        type: 'reorder',
        prompt: 'Arrange the words to form: "I am looking for the key."',
        words: ['Schlüssel.', 'suche', 'den', 'Ich'],
        correctOrder: ['Ich', 'suche', 'den', 'Schlüssel.'],
        explanation: '"suchen" takes an accusative direct object: masculine "der Schlüssel" becomes "den Schlüssel".',
      },
      {
        id: 'a1-04-q9',
        type: 'reorder',
        prompt: 'Arrange the words to form: "He visits us tomorrow."',
        words: ['uns', 'besucht', 'morgen.', 'Er'],
        correctOrder: ['Er', 'besucht', 'uns', 'morgen.'],
        explanation: 'The accusative pronoun "uns" (us) follows the conjugated verb "besucht".',
      },
      {
        id: 'a1-04-q10',
        type: 'reorder',
        prompt: 'Arrange the words to form: "We need a new table."',
        words: ['einen', 'brauchen', 'Tisch.', 'Wir', 'neuen'],
        correctOrder: ['Wir', 'brauchen', 'einen', 'neuen', 'Tisch.'],
        explanation: '"brauchen" takes the accusative case; masculine "Tisch" takes "einen neuen Tisch.".',
      },
    ],
  },

  // ===================== A1-05 =====================
  {
    code: 'A1-05',
    level: 'A1',
    title: 'Negation (nicht vs. kein) & Possessives',
    orderIndex: 5,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Negation (\`nicht\` vs. \`kein\`) & Possessive Articles

German has two main ways to negate a sentence: **\`kein\`** (not a / no) and **\`nicht\`** (not).

> **Formula:**
> - Use **\`kein-\`** to negate a noun with an **indefinite article** (\`ein/eine\`) or **no article**: *Ich habe **keinen** Hund.*
> - Use **\`nicht\`** to negate **verbs, adjectives, adverbs, definite nouns (\`der/die/das\`), and possessives (\`mein\`)**: *Das ist **nicht** mein Buch.*

| What you negate | Negator | Example |
| --- | --- | --- |
| Noun with \`ein\` / no article | **kein / keine / keinen** | \`Ich trinke keinen Kaffee.\` / \`Ich habe keine Zeit.\` |
| Whole sentence / verb | **nicht** (near the end) | \`Er arbeitet heute nicht.\` |
| Adjective / adverb | **nicht** (directly before it) | \`Das Wetter ist nicht gut.\` |
| Definite noun / possessive | **nicht** (directly before it) | \`Das ist nicht mein Auto.\` |

### Possessive Articles (Follow \`ein/kein\` Endings!)
| Pronoun | Possessive Stem | Masc. Nom. | Masc. Acc. | Fem. / Plural | Neuter |
| --- | --- | --- | --- | --- | --- |
| ich | **mein-** | mein | mein**en** | mein**e** | mein |
| du | **dein-** | dein | dein**en** | dein**e** | dein |
| er / es | **sein-** | sein | sein**en** | sein**e** | sein |
| sie (she) | **ihr-** | ihr | ihr**en** | ihr**e** | ihr |
| wir | **unser-** | unser | unser**en** | unser**e** | unser |
| ihr | **euer-** | euer | eur**en** | eur**e** | euer |
| sie / Sie | **ihr- / Ihr-** | ihr / Ihr | ihr**en** / Ihr**en** | ihr**e** / Ihr**e** | ihr / Ihr |`,
    questions: [
      {
        id: 'a1-05-q1',
        type: 'mcq',
        prompt: 'Choose the right negation: "Ich habe ___ Hunger." (Hunger = masculine, no article)',
        options: ['nicht', 'kein', 'keinen', 'keine'],
        answer: 'keinen',
        explanation: 'Nouns without an article are negated with "kein". Because "Hunger" is masculine and the direct object of "haben", it takes accusative "keinen".',
      },
      {
        id: 'a1-05-q2',
        type: 'mcq',
        prompt: 'Choose the right negation: "Das Buch ist ___ teuer."',
        options: ['nicht', 'kein', 'keine', 'keinen'],
        answer: 'nicht',
        explanation: 'Adjectives like "teuer" (expensive) are always negated with "nicht" placed directly before the adjective.',
      },
      {
        id: 'a1-05-q3',
        type: 'mcq',
        prompt: 'Choose the correct possessive article: "Anna liebt ___ Hund." (Hund = masculine)',
        options: ['ihr', 'ihre', 'ihren', 'seinen'],
        answer: 'ihren',
        explanation: '"Anna" corresponds to "sie" (her → "ihr-"). Because "Hund" is masculine in the accusative case, it takes "-en": "ihren Hund".',
      },
      {
        id: 'a1-05-q4',
        type: 'mcq',
        prompt: 'Choose the right negation: "Das ist ___ mein Schlüssel."',
        options: ['kein', 'keinen', 'nicht', 'keine'],
        answer: 'nicht',
        explanation: 'You never combine "kein" with a possessive article ("mein"). Negate a noun with a possessive using "nicht".',
      },
      {
        id: 'a1-05-q5',
        type: 'fill',
        prompt: 'Fill in the correct negative article for "Zeit" (feminine):',
        sentenceBefore: 'Tut mir leid, ich habe heute',
        sentenceAfter: 'Zeit.',
        answer: 'keine',
        acceptedAnswers: ['keine'],
        hint: 'Feminine accusative form of "kein"',
        explanation: '"Zeit" is feminine and has no article here, so it is negated with "keine".',
      },
      {
        id: 'a1-05-q6',
        type: 'fill',
        prompt: 'Fill in the possessive article for "du" (your) with "Tasche" (feminine):',
        sentenceBefore: 'Wo ist',
        sentenceAfter: 'Tasche?',
        answer: 'deine',
        acceptedAnswers: ['deine'],
        hint: 'Feminine nominative form of "dein-"',
        explanation: '"Tasche" is feminine ("die Tasche"), so the possessive "dein-" takes the feminine ending "-e": "deine".',
      },
      {
        id: 'a1-05-q7',
        type: 'fill',
        prompt: 'Fill in the possessive article for "wir" (our) with "Haus" (neuter):',
        sentenceBefore: 'Das ist',
        sentenceAfter: 'Haus.',
        answer: 'unser',
        acceptedAnswers: ['unser'],
        hint: 'Neuter nominative form of "unser-"',
        explanation: '"Haus" is neuter ("das Haus"), so the nominative possessive takes no extra ending: "unser Haus".',
      },
      {
        id: 'a1-05-q8',
        type: 'reorder',
        prompt: 'Arrange the words to form: "He does not come today."',
        words: ['nicht.', 'kommt', 'heute', 'Er'],
        correctOrder: ['Er', 'kommt', 'heute', 'nicht.'],
        explanation: 'When negating the entire sentence/verb, "nicht" goes at the end after the time adverb "heute".',
      },
      {
        id: 'a1-05-q9',
        type: 'reorder',
        prompt: 'Arrange the words to form: "I am visiting my brother."',
        words: ['meinen', 'besuche', 'Bruder.', 'Ich'],
        correctOrder: ['Ich', 'besuche', 'meinen', 'Bruder.'],
        explanation: '"Bruder" is masculine and the direct object of "besuche", so "mein-" takes the accusative "-en" ending: "meinen Bruder.".',
      },
      {
        id: 'a1-05-q10',
        type: 'reorder',
        prompt: 'Arrange the words to form: "We do not have a car."',
        words: ['Auto.', 'haben', 'kein', 'Wir'],
        correctOrder: ['Wir', 'haben', 'kein', 'Auto.'],
        explanation: '"Auto" is neuter ("das Auto"), so the accusative negative article is "kein".',
      },
    ],
  },

  // ===================== A1-06 =====================
  {
    code: 'A1-06',
    level: 'A1',
    title: 'Separable Verbs & Modal Verbs (Present)',
    orderIndex: 6,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Separable Verbs & Modal Verbs (Satzklammer)

Both **separable verbs** and **modal verbs** create the famous German **sentence bracket (*Satzklammer*)**: one part of the verb stands in **Position 2**, and the second part goes to the **very end** of the clause.

> **Formula:**
> - Separable Verb: \`Subject\` + **Conjugated Stem (Pos. 2)** + Middle + **Prefix (End)** → *Ich **stehe** um 7 Uhr **auf**.*
> - Modal Verb: \`Subject\` + **Conjugated Modal (Pos. 2)** + Middle + **Infinitive (End)** → *Ich **kann** gut Deutsch **sprechen**.*

### Common Separable Prefixes
\`ab-\`, \`an-\`, \`auf-\`, \`aus-\`, \`ein-\`, \`fern-\`, \`mit-\`, \`vor-\`, \`zu-\`, \`zurück-\`
- \`aufstehen\` → \`Ich stehe früh auf.\` (I get up early.)
- \`einkaufen\` → \`Wir kaufen im Supermarkt ein.\` (We shop at the supermarket.)

### Modal Verbs in the Present Tense
Notice that **ich** and **er/sie/es** have **identical forms** (no \`-e\` or \`-t\` ending!):

| Pronoun | können (can) | müssen (must) | wollen (want) | dürfen (may) | sollen (should) | möchten (would like) |
| --- | --- | --- | --- | --- | --- | --- |
| ich | **kann** | **muss** | **will** | **darf** | **soll** | **möchte** |
| du | kannst | musst | willst | darfst | sollst | möchtest |
| er / sie / es | **kann** | **muss** | **will** | **darf** | **soll** | **möchte** |
| wir / sie / Sie | können | müssen | wollen | dürfen | sollen | möchten |
| ihr | könnt | müsst | wollt | dürft | sollt | möchtet |

> **Tip:** When a **separable verb** is used with a **modal verb**, it stays **together as an infinitive at the end**: \`Ich muss früh aufstehen.\``,
    questions: [
      {
        id: 'a1-06-q1',
        type: 'mcq',
        prompt: 'Which sentence correctly uses the separable verb "aufstehen" (to get up)?',
        options: [
          'Ich aufstehe um sieben Uhr.',
          'Ich stehe auf um sieben Uhr.',
          'Ich stehe um sieben Uhr auf.',
          'Aufstehe ich um sieben Uhr.',
        ],
        answer: 'Ich stehe um sieben Uhr auf.',
        explanation: 'In a main clause, the conjugated stem "stehe" stays in Position 2 and the separable prefix "auf" moves to the very end.',
      },
      {
        id: 'a1-06-q2',
        type: 'mcq',
        prompt: 'Choose the correct modal verb form: "Er ___ sehr gut Gitarre spielen."',
        options: ['kanst', 'kann', 'kannt', 'können'],
        answer: 'kann',
        explanation: 'In the present tense, modal verbs have no "-t" ending in the "er/sie/es" form (identical to "ich"): "er kann".',
      },
      {
        id: 'a1-06-q3',
        type: 'mcq',
        prompt: 'Which modal verb expresses permission ("May I sit here?")?',
        options: ['müssen', 'dürfen', 'sollen', 'wollen'],
        answer: 'dürfen',
        explanation: '"dürfen" expresses permission ("Darf ich hier sitzen?"), while "müssen" expresses necessity and "wollen" expresses desire.',
      },
      {
        id: 'a1-06-q4',
        type: 'mcq',
        prompt: 'Choose the correct combination of a modal verb and a separable verb ("einkaufen"):',
        options: [
          'Ich muss heute kaufen ein.',
          'Ich muss heute ein kaufen.',
          'Ich muss heute einkaufen.',
          'Ich einkaufe muss heute.',
        ],
        answer: 'Ich muss heute einkaufen.',
        explanation: 'With a modal verb, the separable verb stays together as a single infinitive ("einkaufen") at the very end of the sentence.',
      },
      {
        id: 'a1-06-q5',
        type: 'fill',
        prompt: 'Complete the sentence with the separable prefix of "anrufen" (to call on the phone):',
        sentenceBefore: 'Ich rufe dich morgen',
        sentenceAfter: '.',
        answer: 'an',
        acceptedAnswers: ['an'],
        hint: 'Separable prefix of "anrufen"',
        explanation: '"anrufen" splits into "rufe" (Position 2) and its prefix "an" at the end of the clause.',
      },
      {
        id: 'a1-06-q6',
        type: 'fill',
        prompt: 'Conjugate the modal verb "müssen" for "ich":',
        sentenceBefore: 'Ich',
        sentenceAfter: 'heute viel arbeiten.',
        answer: 'muss',
        acceptedAnswers: ['muss'],
        hint: '"ich" form of "müssen" (no umlaut)',
        explanation: 'The singular forms of "müssen" lose the umlaut and "ich" takes no ending: "ich muss".',
      },
      {
        id: 'a1-06-q7',
        type: 'fill',
        prompt: 'Conjugate the modal verb "wollen" for "du":',
        sentenceBefore: 'Was',
        sentenceAfter: 'du am Wochenende machen?',
        answer: 'willst',
        acceptedAnswers: ['willst'],
        hint: '"du" form of "wollen" (o → i)',
        explanation: '"wollen" changes its stem vowel to "i" in the singular: "ich will, du willst, er will".',
      },
      {
        id: 'a1-06-q8',
        type: 'reorder',
        prompt: 'Arrange the words to form: "The train arrives at 8 o\'clock." (ankommen)',
        words: ['Uhr', 'an.', 'Der', 'acht', 'Zug', 'kommt', 'um'],
        correctOrder: ['Der', 'Zug', 'kommt', 'um', 'acht', 'Uhr', 'an.'],
        explanation: 'The separable verb "ankommen" places "kommt" in Position 2 and the prefix "an." at the very end.',
      },
      {
        id: 'a1-06-q9',
        type: 'reorder',
        prompt: 'Arrange the words to form: "We would like to drink a coffee."',
        words: ['trinken.', 'einen', 'Wir', 'Kaffee', 'möchten'],
        correctOrder: ['Wir', 'möchten', 'einen', 'Kaffee', 'trinken.'],
        explanation: 'The modal verb "möchten" sits in Position 2, forming a bracket with the infinitive "trinken." at the end.',
      },
      {
        id: 'a1-06-q10',
        type: 'reorder',
        prompt: 'Arrange the words to form: "You must not park here."',
        words: ['hier', 'nicht', 'parken.', 'darfst', 'Du'],
        correctOrder: ['Du', 'darfst', 'hier', 'nicht', 'parken.'],
        explanation: '"nicht dürfen" means "must not / may not". "darfst" goes in Position 2 and the infinitive "parken." goes at the end.',
      },
    ],
  },
];
