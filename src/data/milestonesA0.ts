import type { SeedMilestoneInput } from '../db/database';

export const MILESTONES_A0: SeedMilestoneInput[] = [
  // ===================== A0-01 =====================
  {
    code: 'A0-01',
    level: 'A0',
    title: 'Alphabet, Umlauts & Sounds',
    orderIndex: 1,
    isUnlocked: true,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Alphabet, Umlauts & Key German Sounds

German uses the same 26 letters as English, plus **four extra characters**: three **Umlauts** (\`ä\`, \`ö\`, \`ü\`) and the **Eszett** (\`ß\`). The good news is that German spelling is very consistent—once you learn a few key letter combinations, you can pronounce almost any word you see.

> **Formula:** \`ei\` = "eye" (*mein*) vs. \`ie\` = "ee" (*vier*) — remember to pronounce the **second** vowel in English!

### The 4 Special Characters

| Character | Name | Sound Guide | Keyboard Fallback | Example |
| --- | --- | --- | --- | --- |
| **ä / Ä** | A-Umlaut | like "e" in *bed* or "ai" in *air* | \`ae\` | der Apfel → die Äpfel |
| **ö / Ö** | O-Umlaut | say "ay" with rounded lips | \`oe\` | schön (beautiful) |
| **ü / Ü** | U-Umlaut | say "ee" with rounded lips | \`ue\` | fünf (five), Tür (door) |
| **ß** | Eszett / scharfes S | sharp "ss" after long vowels & diphthongs | \`ss\` | die Straße (street), groß (big) |

### Essential Letter Combinations

| Letters | Sound | Example | Meaning |
| --- | --- | --- | --- |
| **ei** | "eye" | eins, mein | one, my |
| **ie** | long "ee" | vier, wie | four, how |
| **eu / äu** | "oy" (as in *boy*) | Euro, Häuser | Euro, houses |
| **sch** | "sh" (as in *shoe*) | die Schule | school |
| **sp / st** (at start) | "shp" / "sht" | sprechen, die Straße | to speak, street |
| **w** | English "v" | das Wasser, wie | water, how |
| **v** | usually English "f" | der Vater, vier | father, four |
| **z** | "ts" (as in *cats*) | die Zeit, zwei | time, two |
| **j** | English "y" (as in *yes*) | ja, das Jahr | yes, year |

### Examples
- \`Ich lerne das Alphabet.\` (I am learning the alphabet.)
- \`Wie schreibt man das?\` (How do you spell that?)
- \`Das Wasser ist kalt.\` (The water is cold.)`,
    questions: [
      {
        id: 'a0-01-q1',
        type: 'mcq',
        prompt: 'How is the vowel pair "ei" pronounced in German words like "eins" and "mein"?',
        options: [
          'Like "eye" in English',
          'Like "ee" in "see"',
          'Like "ay" in "say"',
          'Like "oy" in "boy"',
        ],
        answer: 'Like "eye" in English',
        explanation: 'In German, "ei" always sounds like English "eye" (e.g., "eins", "mein"), whereas "ie" sounds like "ee".',
      },
      {
        id: 'a0-01-q2',
        type: 'mcq',
        prompt: 'How is the German letter "w" pronounced in "Wasser" (water) and "wie" (how)?',
        options: ['Like English "v"', 'Like English "w"', 'Like English "f"', 'It is silent'],
        answer: 'Like English "v"',
        explanation: 'German "w" is always pronounced like an English "v", while German "v" usually sounds like "f".',
      },
      {
        id: 'a0-01-q3',
        type: 'mcq',
        prompt: 'Which special German character represents a sharp "ss" sound after long vowels (e.g., in "Straße")?',
        options: ['ß (Eszett)', 'ä (A-Umlaut)', 'ü (U-Umlaut)', 'z'],
        answer: 'ß (Eszett)',
        explanation: 'The Eszett ("ß") makes a sharp, voiceless "ss" sound after long vowels and diphthongs, as in "Straße" and "groß".',
      },
      {
        id: 'a0-01-q4',
        type: 'mcq',
        prompt: 'How is the German letter "z" pronounced in "Zeit" (time) and "zwei" (two)?',
        options: [
          'Like "ts" in "cats"',
          'Like "z" in "zoo"',
          'Like "s" in "sun"',
          'Like "sh" in "shoe"',
        ],
        answer: 'Like "ts" in "cats"',
        explanation: 'German "z" is always pronounced "ts", as in "Zeit" (ts-eye-t) and "zwei" (ts-v-eye).',
      },
      {
        id: 'a0-01-q5',
        type: 'fill',
        prompt: 'Type the standard two-letter fallback spelling for the umlaut "ü" when a German keyboard is unavailable:',
        sentenceBefore: 'ü →',
        sentenceAfter: '',
        answer: 'ue',
        acceptedAnswers: ['ue', 'UE'],
        hint: 'Add "e" after the base vowel',
        explanation: 'When umlauts cannot be typed, German replaces ä → ae, ö → oe, and ü → ue.',
      },
      {
        id: 'a0-01-q6',
        type: 'fill',
        prompt: 'Complete the German word for "street" with the Eszett (or its two-letter fallback):',
        sentenceBefore: 'Die Stra',
        sentenceAfter: 'e ist lang.',
        answer: 'ß',
        acceptedAnswers: ['ß', 'ss'],
        hint: 'Eszett (ß) after a long "a"',
        explanation: '"Straße" is spelled with "ß" after the long "a" vowel ("ss" is the standard fallback if ß is unavailable).',
      },
      {
        id: 'a0-01-q7',
        type: 'fill',
        prompt: 'Fill in the vowel pair ("ei" or "ie") to complete the German number "four" (pronounced "feer"):',
        sentenceBefore: 'v',
        sentenceAfter: 'r',
        answer: 'ie',
        acceptedAnswers: ['ie'],
        hint: '"ie" sounds like English "ee"',
        explanation: '"vier" uses "ie" to produce the long "ee" sound ("feer").',
      },
      {
        id: 'a0-01-q8',
        type: 'reorder',
        prompt: 'Arrange the words to form: "I am learning the alphabet."',
        words: ['das', 'lerne', 'Alphabet.', 'Ich'],
        correctOrder: ['Ich', 'lerne', 'das', 'Alphabet.'],
        explanation: 'Subject "Ich" comes first, followed by the verb "lerne" and the object "das Alphabet.".',
      },
      {
        id: 'a0-01-q9',
        type: 'reorder',
        prompt: 'Arrange the words to form: "How do you spell that?"',
        words: ['schreibt', 'das?', 'man', 'Wie'],
        correctOrder: ['Wie', 'schreibt', 'man', 'das?'],
        explanation: 'In a W-question, the question word "Wie" comes first, followed immediately by the verb "schreibt", then "man das?".',
      },
      {
        id: 'a0-01-q10',
        type: 'reorder',
        prompt: 'Arrange the words to form: "The water is cold."',
        words: ['kalt.', 'Wasser', 'ist', 'Das'],
        correctOrder: ['Das', 'Wasser', 'ist', 'kalt.'],
        explanation: '"Das Wasser" is the subject, followed by the conjugated verb "ist" and the adjective "kalt.".',
      },
    ],
  },

  // ===================== A0-02 =====================
  {
    code: 'A0-02',
    level: 'A0',
    title: 'Greetings, Pronouns & sein/haben',
    orderIndex: 2,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Greetings, Personal Pronouns & sein / haben

To start your very first conversations in German, you only need a handful of **greetings**, the **personal pronouns**, and the two most important verbs in the language: **\`sein\`** (to be) and **\`haben\`** (to have).

> **Formula:** Pronoun + conjugated \`sein\` / \`haben\` → *Ich **bin** Anna.* / *Ich **habe** Zeit.*

### Everyday Greetings & Goodbyes

| German | English | Register |
| --- | --- | --- |
| **Hallo!** | Hello! / Hi! | Informal / Everyday |
| **Guten Morgen!** | Good morning! | Polite / Formal |
| **Guten Tag!** | Good day! / Hello! | Polite / Formal |
| **Guten Abend!** | Good evening! | Polite / Formal |
| **Tschüss!** | Bye! | Informal |
| **Auf Wiedersehen!** | Goodbye! | Formal |
| **Danke / Bitte** | Thank you / Please (or You're welcome) | All situations |

### Personal Pronouns + sein & haben

| Pronoun | English | sein (to be) | haben (to have) |
| --- | --- | --- | --- |
| **ich** | I | **bin** | **habe** |
| **du** | you (informal singular) | **bist** | **hast** |
| **er / sie / es** | he / she / it | **ist** | **hat** |
| **wir** | we | **sind** | **haben** |
| **ihr** | you all (informal plural) | **seid** | **habt** |
| **sie / Sie** | they / you (formal) | **sind** | **haben** |

> **Tip:** Use **\`du\`** with friends, family, and children. Use capitalized **\`Sie\`** with strangers, teachers, and in professional settings.

### Examples
- \`Hallo, ich bin Anna.\` (Hello, I am Anna.)
- \`Guten Tag! Wie geht es Ihnen?\` (Good day! How are you? — formal)
- \`Hast du ein Buch?\` (Do you have a book?)
- \`Wir sind heute hier.\` (We are here today.)`,
    questions: [
      {
        id: 'a0-02-q1',
        type: 'mcq',
        prompt: 'Which German greeting is used in the morning?',
        options: ['Guten Morgen', 'Gute Nacht', 'Tschüss', 'Auf Wiedersehen'],
        answer: 'Guten Morgen',
        explanation: '"Guten Morgen" means "Good morning". "Gute Nacht" is used when going to sleep, and "Tschüss" / "Auf Wiedersehen" mean goodbye.',
      },
      {
        id: 'a0-02-q2',
        type: 'mcq',
        prompt: 'Which pronoun do you use to address a stranger, teacher, or boss formally?',
        options: ['Sie', 'du', 'ihr', 'er'],
        answer: 'Sie',
        explanation: 'Capitalized "Sie" is the formal "you" in German (for both one person and multiple people).',
      },
      {
        id: 'a0-02-q3',
        type: 'mcq',
        prompt: 'Choose the correct form of "sein": "Du ___ sehr freundlich."',
        options: ['bist', 'bin', 'ist', 'sind'],
        answer: 'bist',
        explanation: 'With "du" (informal singular you), "sein" conjugates to "bist" ("Du bist").',
      },
      {
        id: 'a0-02-q4',
        type: 'mcq',
        prompt: 'Choose the correct form of "haben": "Er ___ einen Hund."',
        options: ['hat', 'habe', 'hast', 'haben'],
        answer: 'hat',
        explanation: 'With "er / sie / es" (he / she / it), "haben" conjugates to "hat" ("Er hat").',
      },
      {
        id: 'a0-02-q5',
        type: 'fill',
        prompt: 'Complete the sentence with the correct form of "sein" (to be):',
        sentenceBefore: 'Ich',
        sentenceAfter: 'aus Deutschland.',
        answer: 'bin',
        acceptedAnswers: ['bin'],
        hint: '1st person singular of "sein"',
        explanation: '"ich" always pairs with "bin": "Ich bin aus Deutschland." (I am from Germany.)',
      },
      {
        id: 'a0-02-q6',
        type: 'fill',
        prompt: 'Complete the sentence with the correct form of "haben" (to have):',
        sentenceBefore: 'Wir',
        sentenceAfter: 'heute Zeit.',
        answer: 'haben',
        acceptedAnswers: ['haben'],
        hint: '1st person plural of "haben"',
        explanation: '"wir" takes the infinitive-like plural form "haben": "Wir haben heute Zeit."',
      },
      {
        id: 'a0-02-q7',
        type: 'fill',
        prompt: 'Complete the sentence with the correct form of "sein" for "she":',
        sentenceBefore: 'Sie',
        sentenceAfter: 'meine Freundin.',
        answer: 'ist',
        acceptedAnswers: ['ist'],
        hint: '3rd person singular of "sein" (she is)',
        explanation: 'For "sie" (she), "sein" conjugates to "ist": "Sie ist meine Freundin."',
      },
      {
        id: 'a0-02-q8',
        type: 'reorder',
        prompt: 'Arrange the words to form: "Hello, I am Anna."',
        words: ['bin', 'Anna.', 'Hallo,', 'ich'],
        correctOrder: ['Hallo,', 'ich', 'bin', 'Anna.'],
        explanation: 'Start with the greeting "Hallo,", then the subject "ich", the verb "bin", and the name "Anna.".',
      },
      {
        id: 'a0-02-q9',
        type: 'reorder',
        prompt: 'Arrange the words to form: "Do you have a book?"',
        words: ['Buch?', 'du', 'ein', 'Hast'],
        correctOrder: ['Hast', 'du', 'ein', 'Buch?'],
        explanation: 'In a yes/no question, the conjugated verb "Hast" comes first, followed by the subject "du" and "ein Buch?".',
      },
      {
        id: 'a0-02-q10',
        type: 'reorder',
        prompt: 'Arrange the words to form: "We are here today."',
        words: ['heute', 'sind', 'hier.', 'Wir'],
        correctOrder: ['Wir', 'sind', 'heute', 'hier.'],
        explanation: 'Subject "Wir" is in Position 1, verb "sind" in Position 2, followed by time ("heute") and place ("hier.").',
      },
    ],
  },

  // ===================== A0-03 =====================
  {
    code: 'A0-03',
    level: 'A0',
    title: 'Basic Nouns, der/die/das & V2 Word Order',
    orderIndex: 3,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Basic Nouns, der / die / das & V2 Word Order

Two golden rules unlock German sentence building right from day one:
1. **Every German noun is ALWAYS capitalized** (\`der Tisch\`, \`die Katze\`, \`das Buch\`), and belongs to one of three genders: **\`der\`** (masculine), **\`die\`** (feminine), or **\`das\`** (neuter). Always learn each noun together with its article!
2. **V2 (Verb-Second) Word Order:** In every standard German statement, the **conjugated verb always stands in Position 2**—even when the sentence starts with a time or place word instead of the subject.

> **Formula:** Position 1 (Subject *or* Time/Place) + **Position 2 (Conjugated Verb)** + Rest → *Ich **lerne** Deutsch.* / *Heute **lerne** ich Deutsch.*

### The Three Articles & Starter Nouns

| Article | Gender | Starter Examples | Meaning |
| --- | --- | --- | --- |
| **der** | Masculine | der Mann, der Tisch, der Kaffee | the man, the table, the coffee |
| **die** | Feminine | die Frau, die Katze, die Lampe | the woman, the cat, the lamp |
| **das** | Neuter | das Kind, das Buch, das Haus | the child, the book, the house |
| **die** | Plural (all genders) | die Bücher, die Kinder | the books, the children |

### V2 Word Order in Action

| Position 1 | Position 2 (**Verb**) | Position 3 | Rest |
| --- | --- | --- | --- |
| Ich | **lerne** | heute | Deutsch. |
| Heute | **lerne** | ich | Deutsch. |
| Morgen | **komme** | ich | nach Berlin. |

Notice that when \`Heute\` or \`Morgen\` takes Position 1, the verb stays locked in **Position 2**, and the subject (\`ich\`) slides right behind it into Position 3!

### Examples
- \`Der Tisch ist neu.\` (The table is new.)
- \`Die Frau trinkt Kaffee.\` (The woman drinks coffee.)
- \`Das Kind liest ein Buch.\` (The child reads a book.)
- \`Heute lerne ich Deutsch.\` (Today I am learning German.)`,
    questions: [
      {
        id: 'a0-03-q1',
        type: 'mcq',
        prompt: 'Which writing rule applies to ALL German nouns?',
        options: [
          'They are always capitalized',
          'They are only capitalized at the start of a sentence',
          'They never use articles',
          'They always end in "-e"',
        ],
        answer: 'They are always capitalized',
        explanation: 'Every German noun begins with a capital letter regardless of its position in the sentence (e.g., "Ich lese ein Buch.").',
      },
      {
        id: 'a0-03-q2',
        type: 'mcq',
        prompt: 'Which definite article belongs to the neuter noun "Buch" (book)?',
        options: ['das', 'der', 'die', 'den'],
        answer: 'das',
        explanation: '"Buch" is a neuter noun, so its definite article is "das" ("das Buch").',
      },
      {
        id: 'a0-03-q3',
        type: 'mcq',
        prompt: 'In a standard German statement, which position does the conjugated verb ALWAYS take?',
        options: [
          'Position 2',
          'Position 1',
          'The very end of the sentence',
          'Position 3',
        ],
        answer: 'Position 2',
        explanation: 'German statements follow the V2 (Verb-Second) rule: the conjugated verb always occupies Position 2.',
      },
      {
        id: 'a0-03-q4',
        type: 'mcq',
        prompt: 'Which sentence follows correct German V2 word order?',
        options: [
          'Heute lerne ich Deutsch.',
          'Heute ich lerne Deutsch.',
          'Ich Deutsch lerne heute.',
          'Lerne ich heute Deutsch.',
        ],
        answer: 'Heute lerne ich Deutsch.',
        explanation: 'When "Heute" is in Position 1, the verb "lerne" must stay in Position 2 and the subject "ich" moves to Position 3.',
      },
      {
        id: 'a0-03-q5',
        type: 'fill',
        prompt: 'Fill in the masculine definite article for "Tisch" (table):',
        sentenceBefore: '',
        sentenceAfter: 'Tisch ist neu.',
        answer: 'Der',
        acceptedAnswers: ['Der', 'der'],
        hint: 'Masculine definite article',
        explanation: '"Tisch" is masculine ("der Tisch"), so the sentence begins with "Der".',
      },
      {
        id: 'a0-03-q6',
        type: 'fill',
        prompt: 'Fill in the feminine definite article for "Katze" (cat):',
        sentenceBefore: '',
        sentenceAfter: 'Katze schläft.',
        answer: 'Die',
        acceptedAnswers: ['Die', 'die'],
        hint: 'Feminine definite article',
        explanation: '"Katze" is feminine ("die Katze"), so it takes the definite article "Die".',
      },
      {
        id: 'a0-03-q7',
        type: 'fill',
        prompt: 'Keep the verb in Position 2 when starting with "Morgen" (verb: "kommen", subject: "ich"):',
        sentenceBefore: 'Morgen',
        sentenceAfter: 'ich nach Berlin.',
        answer: 'komme',
        acceptedAnswers: ['komme'],
        hint: 'Conjugated form of "kommen" for "ich"',
        explanation: 'With "Morgen" in Position 1, the conjugated verb "komme" stands in Position 2 right before "ich".',
      },
      {
        id: 'a0-03-q8',
        type: 'reorder',
        prompt: 'Arrange the words to form: "The child reads a book."',
        words: ['liest', 'ein', 'Kind', 'Buch.', 'Das'],
        correctOrder: ['Das', 'Kind', 'liest', 'ein', 'Buch.'],
        explanation: '"Das Kind" (subject) is in Position 1, "liest" (verb) is in Position 2, and "ein Buch." is the object.',
      },
      {
        id: 'a0-03-q9',
        type: 'reorder',
        prompt: 'Arrange the words using V2 word order: "Today I am learning German."',
        words: ['Deutsch.', 'ich', 'Heute', 'lerne'],
        correctOrder: ['Heute', 'lerne', 'ich', 'Deutsch.'],
        explanation: 'With "Heute" in Position 1, the verb "lerne" stays in Position 2, followed by the subject "ich" and "Deutsch.".',
      },
      {
        id: 'a0-03-q10',
        type: 'reorder',
        prompt: 'Arrange the words to form: "The woman drinks coffee."',
        words: ['Kaffee.', 'trinkt', 'Frau', 'Die'],
        correctOrder: ['Die', 'Frau', 'trinkt', 'Kaffee.'],
        explanation: '"Die Frau" is the subject in Position 1, "trinkt" is the verb in Position 2, and "Kaffee." is the object.',
      },
    ],
  },
];
