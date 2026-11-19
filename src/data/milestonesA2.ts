import type { SeedMilestoneInput } from '../db/database';

export const MILESTONES_A2: SeedMilestoneInput[] = [
  // ===================== A2-01 =====================
  {
    code: 'A2-01',
    level: 'A2',
    title: 'Perfekt Tense (haben vs. sein & Partizip II)',
    orderIndex: 7,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Das Perfekt (Conversational Past Tense)

The **Perfekt** is the primary past tense in spoken German. It forms a **sentence bracket (Satzklammer)** with the conjugated auxiliary verb (\`haben\` or \`sein\`) in position 2 and the **Partizip II** at the very end of the clause.

> **Formula:** \`Subject + haben / sein (Position 2) + ... + Partizip II (End)\`

### When to Use \`haben\` vs. \`sein\`

| Auxiliary | Core Rule | Common Verbs | Example |
| --- | --- | --- | --- |
| **haben** | Most verbs, especially transitive verbs (taking an accusative object) and reflexive verbs | machen, kaufen, essen, trinken, arbeiten, schlafen | Ich **habe** ein Buch **gelesen**. |
| **sein** | Verbs of **motion** (A → B), **change of state**, plus \`sein\`, \`bleiben\`, \`passieren\`, \`werden\` | gehen, fahren, fliegen, kommen, aufstehen, einschlafen, bleiben | Wir **sind** nach Berlin **gefahren**. |

### Forming the Partizip II

| Verb Type | Pattern | Infinitive → Partizip II |
| --- | --- | --- |
| Regular (weak) | \`ge-\` + stem + \`-t\` | machen → **gemacht**, spielen → **gespielt** |
| Irregular (strong) | \`ge-\` + (changed) stem + \`-en\` | schreiben → **geschrieben**, trinken → **getrunken** |
| Separable prefix | prefix + \`-ge-\` + stem + \`-t/-en\` | einkaufen → **eingekauft**, aufstehen → **aufgestanden** |
| Inseparable prefix (\`be-, ver-, er-, ent-, zer-, ge-, miss-\`) | **no \`ge-\`** + stem + \`-t/-en\` | besuchen → **besucht**, verstehen → **verstanden** |
| Verbs ending in \`-ieren\` | **no \`ge-\`** + stem + \`-t\` | studieren → **studiert**, telefonieren → **telefoniert** |

### Quick Examples
- \`Er hat gestern lange gearbeitet.\` (He worked for a long time yesterday.)
- \`Sie ist um sieben Uhr aufgestanden.\` (She got up at seven o'clock.)
- \`Wir haben unseren Freund in München besucht.\` (We visited our friend in Munich.)`,
    questions: [
      {
        id: 'a2-01-q1',
        type: 'mcq',
        prompt: 'Choose the correct auxiliary verb: "Gestern ___ wir mit dem Zug nach Hamburg gefahren."',
        options: ['haben', 'sind', 'seid', 'waren'],
        answer: 'sind',
        explanation: '"fahren" expresses movement from one place to another, so it forms the Perfekt with "sein" ("wir sind ... gefahren").',
      },
      {
        id: 'a2-01-q2',
        type: 'mcq',
        prompt: 'What is the correct Partizip II of the inseparable verb "verstehen" (to understand)?',
        options: ['geverstanden', 'vergestanden', 'verstanden', 'versteht'],
        answer: 'verstanden',
        explanation: 'Verbs with inseparable prefixes like "ver-" never take "ge-" in the Partizip II, and "stehen" is strong → "verstanden".',
      },
      {
        id: 'a2-01-q3',
        type: 'mcq',
        prompt: 'Which verb forms the Perfekt with "sein"?',
        options: ['kaufen', 'schlafen', 'bleiben', 'telefonieren'],
        answer: 'bleiben',
        explanation: '"bleiben" (to stay) is one of the key non-motion exceptions that always uses "sein": "Ich bin zu Hause geblieben."',
      },
      {
        id: 'a2-01-q4',
        type: 'mcq',
        prompt: 'Choose the correct Partizip II of "studieren" (to study):',
        options: ['gestudiert', 'studiert', 'gestudieren', 'studierte'],
        answer: 'studiert',
        explanation: 'Verbs ending in "-ieren" never add the "ge-" prefix in the Partizip II: "studieren" → "studiert".',
      },
      {
        id: 'a2-01-q5',
        type: 'fill',
        prompt: 'Fill in the Partizip II of "einkaufen" (separable verb):',
        sentenceBefore: 'Meine Mutter hat im Supermarkt',
        sentenceAfter: '.',
        answer: 'eingekauft',
        acceptedAnswers: ['eingekauft'],
        hint: 'prefix + ge + stem + t',
        explanation: 'For separable verbs, "-ge-" goes between the prefix and the stem: "ein-" + "ge" + "kauft" = "eingekauft".',
      },
      {
        id: 'a2-01-q6',
        type: 'fill',
        prompt: 'Complete the sentence with the correct conjugated form of "haben" or "sein":',
        sentenceBefore: 'Um wie viel Uhr',
        sentenceAfter: 'du heute Morgen aufgestanden?',
        answer: 'bist',
        acceptedAnswers: ['bist'],
        hint: 'aufstehen = change of state/position (du)',
        explanation: '"aufstehen" (to get up) indicates a change of state/position, so it takes "sein" ("du bist ... aufgestanden").',
      },
      {
        id: 'a2-01-q7',
        type: 'fill',
        prompt: 'Fill in the irregular Partizip II of "trinken":',
        sentenceBefore: 'Zum Frühstück habe ich eine Tasse Kaffee',
        sentenceAfter: '.',
        answer: 'getrunken',
        acceptedAnswers: ['getrunken'],
        hint: 'ge- + stem vowel u + -en',
        explanation: '"trinken" is a strong (irregular) verb whose stem vowel changes to "u" in the Partizip II: "getrunken".',
      },
      {
        id: 'a2-01-q8',
        type: 'reorder',
        prompt: 'Arrange the words into a correct Perfekt sentence ("I read a book yesterday."):',
        words: ['gelesen.', 'habe', 'Ich', 'Buch', 'gestern', 'ein'],
        correctOrder: ['Ich', 'habe', 'gestern', 'ein', 'Buch', 'gelesen.'],
        explanation: 'The auxiliary "habe" sits in position 2 and the Partizip II "gelesen." closes the sentence bracket at the end.',
      },
      {
        id: 'a2-01-q9',
        type: 'reorder',
        prompt: 'Build the sentence ("She flew to Spain last week."):',
        words: ['geflogen.', 'nach', 'Letzte', 'ist', 'Spanien', 'Woche', 'sie'],
        correctOrder: ['Letzte', 'Woche', 'ist', 'sie', 'nach', 'Spanien', 'geflogen.'],
        explanation: 'Starting with the time phrase "Letzte Woche" puts the conjugated auxiliary "ist" in position 2, followed by "sie" and "geflogen." at the end.',
      },
      {
        id: 'a2-01-q10',
        type: 'reorder',
        prompt: 'Arrange the words ("Have you already visited the museum?"):',
        words: ['besucht?', 'das', 'Ihr', 'schon', 'habt', 'Museum'],
        correctOrder: ['Ihr', 'habt', 'das', 'Museum', 'schon', 'besucht?'],
        explanation: 'As a statement-style question or confirmation, "Ihr habt das Museum schon besucht?" places "habt" in position 2 and "besucht?" at the end.',
      },
    ],
  },

  // ===================== A2-02 =====================
  {
    code: 'A2-02',
    level: 'A2',
    title: 'Dative Case & Dative Verbs',
    orderIndex: 8,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Der Dativ (The Dative Case & Dative Verbs)

The **dative case** marks the **indirect object** (the recipient — answering *Wem?* / "to whom?"). It is also required after specific **dative verbs** and **dative prepositions** (\`aus, außer, bei, mit, nach, seit, von, zu\`).

> **Formula:** \`Subject (Nom.) + Verb + Indirect Object (Dat.) + Direct Object (Acc.)\`

### Dative Articles & Personal Pronouns

| Gender | Definite | Indefinite | Negative | Personal Pronoun (Nom → Dat) |
| --- | --- | --- | --- | --- |
| Masculine | **dem** | **einem** | **keinem** | er → **ihm** |
| Feminine | **der** | **einer** | **keiner** | sie → **ihr** |
| Neuter | **dem** | **einem** | **keinem** | es → **ihm** |
| Plural | **den** (+ \`-n\` on noun) | — | **keinen** (+ \`-n\`) | sie → **ihnen** / Sie → **Ihnen** |

Other key pronouns: \`ich → mir\`, \`du → dir\`, \`wir → uns\`, \`ihr → euch\`.

### Essential Dative Verbs

| Verb | Meaning | Example |
| --- | --- | --- |
| **helfen** | to help | Ich helfe **meinem Bruder**. |
| **danken** | to thank | Wir danken **dir** für die Hilfe. |
| **gefallen** | to please / be liked by | Das Kleid gefällt **der Kundin**. |
| **gehören** | to belong to | Wem gehört **das Buch**? Es gehört **mir**. |
| **schmecken** | to taste good to | Die Suppe schmeckt **den Kindern**. |
| **antworten** | to answer | Er antwortet **seiner Lehrerin**. |

### Quick Examples
- \`Ich schenke meinem Vater eine Uhr.\` (I give my father [Dat] a watch [Acc].)
- \`Der Film hat uns sehr gut gefallen.\` (We really liked the movie.)`,
    questions: [
      {
        id: 'a2-02-q1',
        type: 'mcq',
        prompt: 'Choose the correct dative article: "Ich helfe ___ alten Mann über die Straße."',
        options: ['der', 'den', 'dem', 'des'],
        answer: 'dem',
        explanation: '"helfen" always takes the dative case, and "Mann" is masculine (der → dem).',
      },
      {
        id: 'a2-02-q2',
        type: 'mcq',
        prompt: 'Complete the sentence: "Wie gefällt ___ meine neue Wohnung?" (to you, informal singular)',
        options: ['dich', 'dir', 'du', 'dein'],
        answer: 'dir',
        explanation: '"gefallen" requires a dative object; the dative form of "du" is "dir".',
      },
      {
        id: 'a2-02-q3',
        type: 'mcq',
        prompt: 'Which sentence uses the dative plural correctly?',
        options: [
          'Ich gebe die Kinder ein Eis.',
          'Ich gebe den Kinder ein Eis.',
          'Ich gebe den Kindern ein Eis.',
          'Ich gebe dem Kindern ein Eis.',
        ],
        answer: 'Ich gebe den Kindern ein Eis.',
        explanation: 'In the dative plural, the definite article is "den" AND the noun adds "-n" ("Kinder" → "Kindern").',
      },
      {
        id: 'a2-02-q4',
        type: 'mcq',
        prompt: 'Choose the correct pronoun: "Meine Schwester hat Geburtstag. Ich schenke ___ Blumen."',
        options: ['sie', 'ihr', 'ihm', 'ihnen'],
        answer: 'ihr',
        explanation: '"Schwester" is feminine singular, and the recipient of "schenken" is in the dative case: "sie" → "ihr".',
      },
      {
        id: 'a2-02-q5',
        type: 'fill',
        prompt: 'Fill in the dative definite article for "Freundin" (feminine):',
        sentenceBefore: 'Er antwortet',
        sentenceAfter: 'Freundin sofort auf ihre Nachricht.',
        answer: 'der',
        acceptedAnswers: ['der'],
        hint: 'Feminine definite article in dative',
        explanation: 'In the dative case, feminine "die" changes to "der" ("antworten" + dative).',
      },
      {
        id: 'a2-02-q6',
        type: 'fill',
        prompt: 'Complete with the dative form of "ich":',
        sentenceBefore: 'Die Pizza schmeckt',
        sentenceAfter: 'wirklich ausgezeichnet!',
        answer: 'mir',
        acceptedAnswers: ['mir'],
        hint: 'Dative of "ich"',
        explanation: '"schmecken" takes the dative case; "ich" becomes "mir".',
      },
      {
        id: 'a2-02-q7',
        type: 'fill',
        prompt: 'Fill in the dative indefinite article for "Kind" (neuter):',
        sentenceBefore: 'Die Lehrerin erklärt',
        sentenceAfter: 'Kind die Aufgabe.',
        answer: 'einem',
        acceptedAnswers: ['einem'],
        hint: 'Neuter indefinite article in dative',
        explanation: 'Neuter nouns take "einem" as the indefinite article in the dative case.',
      },
      {
        id: 'a2-02-q8',
        type: 'reorder',
        prompt: 'Arrange the words ("I am helping my mother in the kitchen."):',
        words: ['helfe', 'Küche.', 'Ich', 'in', 'Mutter', 'meiner', 'der'],
        correctOrder: ['Ich', 'helfe', 'meiner', 'Mutter', 'in', 'der', 'Küche.'],
        explanation: '"helfe" is in position 2, followed by the dative object "meiner Mutter" and the location "in der Küche.".',
      },
      {
        id: 'a2-02-q9',
        type: 'reorder',
        prompt: 'Build the sentence ("Does this backpack belong to you?"):',
        words: ['dir', 'Gehört', 'Rucksack?', 'dieser'],
        correctOrder: ['Gehört', 'dir', 'dieser', 'Rucksack?'],
        explanation: 'In a yes/no question, the verb "Gehört" starts the sentence, followed by the dative pronoun "dir" and the nominative subject "dieser Rucksack?".',
      },
      {
        id: 'a2-02-q10',
        type: 'reorder',
        prompt: 'Arrange the words ("We thank you [formal] for the invitation."):',
        words: ['die', 'Wir', 'Ihnen', 'Einladung.', 'danken', 'für'],
        correctOrder: ['Wir', 'danken', 'Ihnen', 'für', 'die', 'Einladung.'],
        explanation: '"danken" takes the dative pronoun "Ihnen" (formal you), followed by "für die Einladung.".',
      },
    ],
  },

  // ===================== A2-03 =====================
  {
    code: 'A2-03',
    level: 'A2',
    title: 'Two-Way Prepositions (Wechselpräpositionen)',
    orderIndex: 9,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Wechselpräpositionen (Two-Way Prepositions)

Nine spatial prepositions can take **either Accusative or Dative**, depending on whether the sentence expresses **direction/movement to a destination** (*Wohin?*) or a **static location** (*Wo?*).

> **Formula:** \`Wohin? (Movement / Direction) → Accusative\` | \`Wo? (Static Location) → Dative\`

### The 9 Two-Way Prepositions
\`an\` (at/on vertical), \`auf\` (on horizontal), \`hinter\` (behind), \`in\` (in/into), \`neben\` (next to), \`über\` (over/above), \`unter\` (under), \`vor\` (in front of), \`zwischen\` (between)

### Paired Action vs. Position Verbs

| Movement (Wohin? + Accusative) | Static Position (Wo? + Dative) | Example Pair |
| --- | --- | --- |
| **stellen** (put upright) | **stehen** (stand) | Ich stelle die Vase **auf den** Tisch. / Die Vase steht **auf dem** Tisch. |
| **legen** (lay flat) | **liegen** (lie) | Er legt das Buch **in die** Tasche. / Das Buch liegt **in der** Tasche. |
| **setzen** (set/seat) | **sitzen** (sit) | Sie setzt sich **auf den** Stuhl. / Sie sitzt **auf dem** Stuhl. |
| **hängen** (hang — regular) | **hängen** (be hanging — irregular) | Ich hänge das Bild **an die** Wand. / Das Bild hängt **an der** Wand. |

### Common Contractions
- Accusative: \`in + das = ins\`, \`an + das = ans\`, \`auf + das = aufs\`
- Dative: \`in + dem = im\`, \`an + dem = am\``,
    questions: [
      {
        id: 'a2-03-q1',
        type: 'mcq',
        prompt: 'Choose the right case: "Ich lege mein Handy auf ___ Tisch." (der Tisch)',
        options: ['dem', 'den', 'der', 'das'],
        answer: 'den',
        explanation: '"legen" indicates movement to a destination (Wohin?), so "auf" takes the accusative: masculine "der" → "den".',
      },
      {
        id: 'a2-03-q2',
        type: 'mcq',
        prompt: 'Choose the right case: "Das Handy liegt jetzt auf ___ Tisch." (der Tisch)',
        options: ['den', 'dem', 'der', 'das'],
        answer: 'dem',
        explanation: '"liegen" describes a static position (Wo?), so "auf" takes the dative: masculine "der" → "dem".',
      },
      {
        id: 'a2-03-q3',
        type: 'mcq',
        prompt: 'Complete the sentence: "Am Samstag gehen wir ___ Kino." (das Kino)',
        options: ['im', 'ins', 'in dem', 'in den'],
        answer: 'ins',
        explanation: '"gehen" expresses direction (Wohin?), requiring accusative neuter: "in + das" contracts to "ins".',
      },
      {
        id: 'a2-03-q4',
        type: 'mcq',
        prompt: 'Which verb correctly matches a static location? "Die Lampe ___ neben dem Sofa."',
        options: ['stellt', 'steht', 'legt', 'setzt'],
        answer: 'steht',
        explanation: 'Because "neben dem Sofa" is dative (static location, Wo?), we use the intransitive position verb "steht".',
      },
      {
        id: 'a2-03-q5',
        type: 'fill',
        prompt: 'Fill in the correct definite article for "Wand" (feminine, direction):',
        sentenceBefore: 'Wir hängen das neue Poster an',
        sentenceAfter: 'Wand.',
        answer: 'die',
        acceptedAnswers: ['die'],
        hint: 'Wohin? → Accusative feminine',
        explanation: 'Hanging a poster onto the wall answers "Wohin?" (accusative). Feminine accusative is "die".',
      },
      {
        id: 'a2-03-q6',
        type: 'fill',
        prompt: 'Fill in the correct definite article for "Stuhl" (masculine, static location):',
        sentenceBefore: 'Die Katze schläft unter',
        sentenceAfter: 'Stuhl.',
        answer: 'dem',
        acceptedAnswers: ['dem'],
        hint: 'Wo? → Dative masculine',
        explanation: '"schlafen" describes where the cat is (Wo? → dative). Masculine dative definite article is "dem".',
      },
      {
        id: 'a2-03-q7',
        type: 'fill',
        prompt: 'Fill in the contraction for "in + dem" (static location, der Park):',
        sentenceBefore: 'Bei schönem Wetter sitzen wir gern',
        sentenceAfter: 'Park.',
        answer: 'im',
        acceptedAnswers: ['im', 'in dem'],
        hint: 'Contraction of "in dem"',
        explanation: '"sitzen" answers "Wo?" (dative). "in + dem" normally contracts to "im".',
      },
      {
        id: 'a2-03-q8',
        type: 'reorder',
        prompt: 'Arrange the words ("She puts the milk into the fridge."):',
        words: ['stellt', 'den', 'in', 'Sie', 'Kühlschrank.', 'die', 'Milch'],
        correctOrder: ['Sie', 'stellt', 'die', 'Milch', 'in', 'den', 'Kühlschrank.'],
        explanation: '"stellt" (movement) takes the direct object "die Milch" and the accusative prepositional phrase "in den Kühlschrank.".',
      },
      {
        id: 'a2-03-q9',
        type: 'reorder',
        prompt: 'Build the sentence ("The pharmacy is between the bank and the post office."):',
        words: ['und', 'der', 'liegt', 'Die', 'Bank', 'Apotheke', 'Post.', 'zwischen', 'der'],
        correctOrder: ['Die', 'Apotheke', 'liegt', 'zwischen', 'der', 'Bank', 'und', 'der', 'Post.'],
        explanation: 'Static location ("liegt") triggers dative for both feminine nouns: "zwischen der Bank und der Post.".',
      },
      {
        id: 'a2-03-q10',
        type: 'reorder',
        prompt: 'Arrange the words ("The keys are lying on the bed."):',
        words: ['dem', 'liegen', 'Die', 'Bett.', 'auf', 'Schlüssel'],
        correctOrder: ['Die', 'Schlüssel', 'liegen', 'auf', 'dem', 'Bett.'],
        explanation: '"liegen" describes a static position (Wo?), so "auf" takes dative neuter "dem Bett.".',
      },
    ],
  },

  // ===================== A2-04 =====================
  {
    code: 'A2-04',
    level: 'A2',
    title: 'Subordinate Clauses (weil, dass, wenn, ob)',
    orderIndex: 10,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Nebensätze (Subordinate Clauses)

Subordinating conjunctions like **weil** (because), **dass** (that), **wenn** (when/if), and **ob** (whether/if) introduce a **Nebensatz** (subordinate clause). Always separate the main clause and subordinate clause with a **comma**, and send the **conjugated verb to the very end** of the subordinate clause.

> **Formula:** \`Main Clause, + Conjunction + Subject + ... + Conjugated Verb (End).\`

### Key Subordinating Conjunctions

| Conjunction | Meaning | Usage | Example |
| --- | --- | --- | --- |
| **weil** | because | Gives a reason | Ich bleibe zu Hause, **weil** ich krank **bin**. |
| **dass** | that | Reports thoughts, facts, or speech | Ich weiß, **dass** er heute **kommt**. |
| **wenn** | when / if | Conditions or repeated events | **Wenn** es regnet, **nehme** ich einen Schirm. |
| **ob** | whether / if | Indirect yes/no questions | Sie fragt, **ob** du Zeit **hast**. |

### Verb-Comma-Verb Rule (Subordinate Clause First)
When the subordinate clause comes **first**, it occupies Position 1 of the entire sentence — so the main clause must begin immediately with its conjugated verb:
- \`Weil ich müde bin, gehe ich früh ins Bett.\` (Note the **verb, verb** pair across the comma!)

### With Modal Verbs or Perfekt
The **conjugated** verb (modal or auxiliary) goes **last**, right after the infinitive or Partizip II:
- \`..., weil ich morgen arbeiten muss.\`
- \`..., dass er den Zug verpasst hat.\``,
    questions: [
      {
        id: 'a2-04-q1',
        type: 'mcq',
        prompt: 'Choose the grammatically correct sentence:',
        options: [
          'Ich lerne Deutsch, weil ich arbeite in Berlin.',
          'Ich lerne Deutsch, weil ich in Berlin arbeite.',
          'Ich lerne Deutsch weil in Berlin ich arbeite.',
          'Ich lerne Deutsch, weil arbeite ich in Berlin.',
        ],
        answer: 'Ich lerne Deutsch, weil ich in Berlin arbeite.',
        explanation: 'After "weil", there is a comma and the conjugated verb ("arbeite") moves to the end of the clause.',
      },
      {
        id: 'a2-04-q2',
        type: 'mcq',
        prompt: 'Which conjunction introduces an indirect yes/no question? "Ich weiß nicht, ___ der Laden noch geöffnet ist."',
        options: ['dass', 'weil', 'ob', 'wenn'],
        answer: 'ob',
        explanation: 'Use "ob" (whether/if) for indirect yes/no questions ("Is the store still open?").',
      },
      {
        id: 'a2-04-q3',
        type: 'mcq',
        prompt: 'Complete the sentence starting with a Nebensatz: "Wenn ich morgen Zeit habe, ___."',
        options: [
          'ich besuche dich',
          'besuche ich dich',
          'dich besuche ich',
          'ich dich besuche',
        ],
        answer: 'besuche ich dich',
        explanation: 'When the subordinate clause stands in position 1, the main clause starts immediately with its conjugated verb ("besuche ich dich").',
      },
      {
        id: 'a2-04-q4',
        type: 'mcq',
        prompt: 'Choose the correct verb order in Perfekt inside a "weil"-clause: "Er ist müde, weil er wenig ___."',
        options: ['hat geschlafen', 'geschlafen hat', 'schläft hat', 'hat schläft'],
        answer: 'geschlafen hat',
        explanation: 'In a subordinate clause, the conjugated auxiliary ("hat") goes to the very end, after the Partizip II ("geschlafen").',
      },
      {
        id: 'a2-04-q5',
        type: 'fill',
        prompt: 'Fill in the conjunction meaning "that":',
        sentenceBefore: 'Ich hoffe,',
        sentenceAfter: 'du die Prüfung bestehst.',
        answer: 'dass',
        acceptedAnswers: ['dass'],
        hint: 'Subordinating conjunction for statements/hopes',
        explanation: '"dass" (with double s) connects a main clause like "Ich hoffe" to a dependent statement.',
      },
      {
        id: 'a2-04-q6',
        type: 'fill',
        prompt: 'Fill in the conjunction meaning "because":',
        sentenceBefore: 'Wir fahren nicht ans Meer,',
        sentenceAfter: 'das Wetter zu kalt ist.',
        answer: 'weil',
        acceptedAnswers: ['weil'],
        hint: 'Gives a reason',
        explanation: '"weil" introduces a reason and sends "ist" to the end of the clause.',
      },
      {
        id: 'a2-04-q7',
        type: 'fill',
        prompt: 'Fill in the conjunction meaning "if / whenever":',
        sentenceBefore: '',
        sentenceAfter: 'es schneit, bauen die Kinder einen Schneemann.',
        answer: 'Wenn',
        acceptedAnswers: ['Wenn', 'wenn'],
        hint: 'Condition or repeated event',
        explanation: '"Wenn" is used for conditions and repeated events ("Whenever it snows...").',
      },
      {
        id: 'a2-04-q8',
        type: 'reorder',
        prompt: 'Arrange the words ("I think that he speaks German very well."):',
        words: ['dass', 'spricht.', 'Ich', 'Deutsch', 'er', 'denke,', 'sehr', 'gut'],
        correctOrder: ['Ich', 'denke,', 'dass', 'er', 'sehr', 'gut', 'Deutsch', 'spricht.'],
        explanation: 'In the "dass"-clause, the subject "er" follows "dass" and the conjugated verb "spricht." goes to the very end.',
      },
      {
        id: 'a2-04-q9',
        type: 'reorder',
        prompt: 'Build the sentence ("Because she has to work, she cannot come."):',
        words: ['kann', 'arbeiten', 'muss,', 'Weil', 'sie', 'nicht', 'kommen.', 'sie'],
        correctOrder: ['Weil', 'sie', 'arbeiten', 'muss,', 'kann', 'sie', 'nicht', 'kommen.'],
        explanation: 'The modal "muss," ends the "Weil"-clause, and the main clause begins immediately with its conjugated modal "kann" (verb-comma-verb).',
      },
      {
        id: 'a2-04-q10',
        type: 'reorder',
        prompt: 'Arrange the words ("Can you tell me whether the train arrives on time?"):',
        words: ['der', 'ob', 'mir', 'sagen,', 'Zug', 'pünktlich', 'Kannst', 'du', 'ankommt?'],
        correctOrder: ['Kannst', 'du', 'mir', 'sagen,', 'ob', 'der', 'Zug', 'pünktlich', 'ankommt?'],
        explanation: 'In the "ob"-clause, separable "ankommen" stays together as one conjugated word at the end: "ankommt?".',
      },
    ],
  },

  // ===================== A2-05 =====================
  {
    code: 'A2-05',
    level: 'A2',
    title: 'Präteritum of sein/haben/Modals & Reflexive Verbs',
    orderIndex: 11,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Präteritum (sein, haben, Modals) & Reflexive Verben

Even in spoken German, **\`sein\`**, **\`haben\`**, and **modal verbs** are almost always used in the **Präteritum** (simple past) instead of the Perfekt.

> **Formula:** \`ich / er / sie / es\` have **identical** Präteritum forms with **no ending** (e.g., \`ich war / er war\`, \`ich musste / sie musste\`).

### Präteritum of \`sein\`, \`haben\`, and Modal Verbs

| Pronoun | sein | haben | können | müssen | wollen | dürfen |
| --- | --- | --- | --- | --- | --- | --- |
| ich | **war** | **hatte** | **konnte** | **musste** | **wollte** | **durfte** |
| du | warst | hattest | konntest | musstest | wolltest | durftest |
| er/sie/es | **war** | **hatte** | **konnte** | **musste** | **wollte** | **durfte** |
| wir | waren | hatten | konnten | mussten | wollten | durften |
| ihr | wart | hattet | konntet | musstet | wolltet | durftet |
| sie/Sie | waren | hatten | konnten | mussten | wollten | durften |

Notice that modal verbs **drop their umlaut** in the Präteritum (\`können → konnte\`, \`müssen → musste\`, \`dürfen → durfte\`).

### Reflexive Verbs & Pronouns

Reflexive verbs pair with a reflexive pronoun referring back to the subject (\`sich freuen\`, \`sich duschen\`, \`sich beeilen\`, \`sich interessieren für\`).

| Subject | Accusative Reflexive | Dative Reflexive (when another Acc. object exists) |
| --- | --- | --- |
| ich | **mich** | **mir** |
| du | **dich** | **dir** |
| er / sie / es | **sich** | **sich** |
| wir | **uns** | **uns** |
| ihr | **euch** | **euch** |
| sie / Sie | **sich** | **sich** |

- \`Ich wasche mich.\` (Accusative — no second object)
- \`Ich wasche mir die Hände.\` (Dative — \`die Hände\` is the accusative object)`,
    questions: [
      {
        id: 'a2-05-q1',
        type: 'mcq',
        prompt: 'Choose the correct Präteritum form: "Gestern ___ ich leider keine Zeit."',
        options: ['habe', 'hatte', 'hattest', 'war'],
        answer: 'hatte',
        explanation: 'The Präteritum of "haben" for "ich" is "hatte".',
      },
      {
        id: 'a2-05-q2',
        type: 'mcq',
        prompt: 'Choose the correct Präteritum modal: "Als Kind ___ er nicht lange aufbleiben." (was allowed to)',
        options: ['dürfte', 'durfte', 'darf', 'durften'],
        answer: 'durfte',
        explanation: 'Modal verbs lose their umlaut in the Präteritum: "dürfen" → "er durfte" ("dürfte" is Konjunktiv II).',
      },
      {
        id: 'a2-05-q3',
        type: 'mcq',
        prompt: 'Select the correct reflexive pronoun: "Wir freuen ___ sehr auf den Urlaub."',
        options: ['sich', 'euch', 'uns', 'mich'],
        answer: 'uns',
        explanation: 'For the subject "wir", the reflexive pronoun is "uns".',
      },
      {
        id: 'a2-05-q4',
        type: 'mcq',
        prompt: 'Why is "mir" used in "Ich putze mir die Zähne"?',
        options: [
          '"putzen" is always a dative verb',
          '"die Zähne" is already the accusative object, so the reflexive pronoun takes dative',
          '"mir" is the accusative reflexive pronoun for "ich"',
          'Plural nouns always force dative reflexive pronouns',
        ],
        answer: '"die Zähne" is already the accusative object, so the reflexive pronoun takes dative',
        explanation: 'When a reflexive verb has a separate accusative object ("die Zähne"), the reflexive pronoun shifts to dative ("mir" / "dir").',
      },
      {
        id: 'a2-05-q5',
        type: 'fill',
        prompt: 'Fill in the Präteritum of "sein" for "ihr":',
        sentenceBefore: 'Wo',
        sentenceAfter: 'ihr am Wochenende?',
        answer: 'wart',
        acceptedAnswers: ['wart'],
        hint: 'Präteritum of sein (ihr)',
        explanation: 'The "ihr" Präteritum form of "sein" is "wart".',
      },
      {
        id: 'a2-05-q6',
        type: 'fill',
        prompt: 'Fill in the Präteritum of "müssen" for "ich":',
        sentenceBefore: 'Gestern',
        sentenceAfter: 'ich bis 20 Uhr im Büro bleiben.',
        answer: 'musste',
        acceptedAnswers: ['musste'],
        hint: 'Drop the umlaut from müssen',
        explanation: '"müssen" drops its umlaut in the Präteritum: "ich musste".',
      },
      {
        id: 'a2-05-q7',
        type: 'fill',
        prompt: 'Fill in the accusative reflexive pronoun for "du":',
        sentenceBefore: 'Interessierst du',
        sentenceAfter: 'für Geschichte?',
        answer: 'dich',
        acceptedAnswers: ['dich'],
        hint: 'Accusative reflexive pronoun for du',
        explanation: '"sich interessieren für" takes an accusative reflexive pronoun; for "du" that is "dich".',
      },
      {
        id: 'a2-05-q8',
        type: 'reorder',
        prompt: 'Arrange the words ("I could not sleep last night."):',
        words: ['schlafen.', 'konnte', 'Letzte', 'nicht', 'Nacht', 'ich'],
        correctOrder: ['Letzte', 'Nacht', 'konnte', 'ich', 'nicht', 'schlafen.'],
        explanation: 'The Präteritum modal "konnte" takes position 2 and the infinitive "schlafen." closes the sentence at the end.',
      },
      {
        id: 'a2-05-q9',
        type: 'reorder',
        prompt: 'Build the sentence ("He always hurries in the morning."):',
        words: ['Morgen', 'Er', 'immer.', 'sich', 'am', 'beeilt'],
        correctOrder: ['Er', 'beeilt', 'sich', 'am', 'Morgen', 'immer.'],
        explanation: 'The reflexive pronoun "sich" follows directly after the conjugated verb "beeilt".',
      },
      {
        id: 'a2-05-q10',
        type: 'reorder',
        prompt: 'Arrange the words ("She wanted to buy a new bicycle."):',
        words: ['Fahrrad', 'wollte', 'Sie', 'neues', 'ein', 'kaufen.'],
        correctOrder: ['Sie', 'wollte', 'ein', 'neues', 'Fahrrad', 'kaufen.'],
        explanation: 'Präteritum "wollte" is in position 2, with the object "ein neues Fahrrad" in the middle and infinitive "kaufen." at the end.',
      },
    ],
  },

  // ===================== A2-06 =====================
  {
    code: 'A2-06',
    level: 'A2',
    title: 'Comparative, Superlative & Adjective Endings',
    orderIndex: 12,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Komparativ, Superlativ & Adjektivdeklination

### 1. Comparing with Comparative & Superlative

> **Formula:** Equal: \`so + adjective + wie\` | Unequal: \`adjective + -er + als\` | Superlative: \`am + adjective + -(e)sten\`

| Positive | Comparative (\`-er\`) | Superlative (\`am ...-sten\`) | Notes |
| --- | --- | --- | --- |
| schnell | schneller | am schnellsten | Regular |
| alt / groß / kalt | **ä**lter / gr**ö**ßer / k**ä**lter | am **ä**ltesten / am gr**ö**ßten / am k**ä**ltesten | Short 1-syllable a/o/u → umlaut |
| gut | **besser** | **am besten** | Irregular |
| viel | **mehr** | **am meisten** | Irregular |
| gern | **lieber** | **am liebsten** | Irregular |

### 2. Attributive Adjective Endings (Before a Noun)

When an adjective stands **before a noun**, it takes an ending based on the article, gender, and case.

| Case | Masc. (der / ein) | Fem. (die / eine) | Neut. (das / ein) | Plural (die / keine) |
| --- | --- | --- | --- | --- |
| **Nominative** | der alt**e** / ein alt**er** | die alt**e** / eine alt**e** | das alt**e** / ein alt**es** | die alt**en** / keine alt**en** |
| **Accusative** | den alt**en** / einen alt**en** | die alt**e** / eine alt**e** | das alt**e** / ein alt**es** | die alt**en** / keine alt**en** |
| **Dative** | dem alt**en** / einem alt**en** | der alt**en** / einer alt**en** | dem alt**en** / einem alt**en** | den alt**en** / keinen alt**en** |

- **Shortcut:** After **all dative articles** and **all plural articles** (\`die / keine / meine\`), the adjective ending is **always \`-en\`**!
- After \`ein / kein / mein\` in nominative/accusative where the article lacks a gender marker, the adjective shows the gender: \`ein gut**er** Freund\`, \`ein neu**es** Auto\`.`,
    questions: [
      {
        id: 'a2-06-q1',
        type: 'mcq',
        prompt: 'Choose the correct comparison: "Der Zug ist schneller ___ das Auto."',
        options: ['wie', 'als', 'so', 'denn'],
        answer: 'als',
        explanation: 'Use "als" (than) after a comparative adjective ("schneller als"), and "wie" for equal comparisons ("so schnell wie").',
      },
      {
        id: 'a2-06-q2',
        type: 'mcq',
        prompt: 'What is the irregular comparative of "gern" (gladly)? "Ich trinke ___ Tee als Kaffee."',
        options: ['gerner', 'besser', 'lieber', 'mehr'],
        answer: 'lieber',
        explanation: '"gern" has irregular comparison forms: "gern – lieber – am liebsten".',
      },
      {
        id: 'a2-06-q3',
        type: 'mcq',
        prompt: 'Choose the right adjective ending: "Ich kaufe ein ___ Hemd." (das Hemd, neuter accusative)',
        options: ['weiß', 'weiße', 'weißer', 'weißes'],
        answer: 'weißes',
        explanation: 'After "ein" (which has no gender marker), a neuter nominative/accusative adjective takes "-es": "ein weißes Hemd".',
      },
      {
        id: 'a2-06-q4',
        type: 'mcq',
        prompt: 'Choose the right adjective ending: "Wir wohnen in einer ___ Stadt." (die Stadt, feminine dative)',
        options: ['große', 'großer', 'großen', 'großes'],
        answer: 'großen',
        explanation: 'After any dative article ("dem", "der", "den", "einem", "einer"), the adjective ending is always "-en".',
      },
      {
        id: 'a2-06-q5',
        type: 'fill',
        prompt: 'Fill in the irregular superlative of "gut":',
        sentenceBefore: 'Dieser Kuchen schmeckt am',
        sentenceAfter: '!',
        answer: 'besten',
        acceptedAnswers: ['besten'],
        hint: 'gut – besser – am ...',
        explanation: '"gut" has the irregular superlative "am besten".',
      },
      {
        id: 'a2-06-q6',
        type: 'fill',
        prompt: 'Fill in the comparative of "alt" (watch the umlaut!):',
        sentenceBefore: 'Mein Bruder ist drei Jahre',
        sentenceAfter: 'als ich.',
        answer: 'älter',
        acceptedAnswers: ['älter'],
        hint: 'a → ä + -er',
        explanation: 'Short one-syllable adjectives with a/o/u usually take an umlaut in the comparative: "alt" → "älter".',
      },
      {
        id: 'a2-06-q7',
        type: 'fill',
        prompt: 'Fill in the adjective with the correct ending for "freundlich" (der Lehrer, masc. nom. after "ein"):',
        sentenceBefore: 'Herr Weber ist ein sehr',
        sentenceAfter: 'Lehrer.',
        answer: 'freundlicher',
        acceptedAnswers: ['freundlicher'],
        hint: 'Masculine nominative after "ein" → -er',
        explanation: 'Because "ein" does not show masculine gender in the nominative, the adjective takes "-er": "ein freundlicher Lehrer".',
      },
      {
        id: 'a2-06-q8',
        type: 'reorder',
        prompt: 'Arrange the words ("Berlin is just as interesting as Vienna."):',
        words: ['interessant', 'Berlin', 'so', 'ist', 'Wien.', 'wie'],
        correctOrder: ['Berlin', 'ist', 'so', 'interessant', 'wie', 'Wien.'],
        explanation: 'Equal comparisons use the frame "so + adjective + wie": "so interessant wie Wien.".',
      },
      {
        id: 'a2-06-q9',
        type: 'reorder',
        prompt: 'Build the sentence ("She is wearing the red jacket today."):',
        words: ['trägt', 'rote', 'heute', 'Sie', 'Jacke.', 'die'],
        correctOrder: ['Sie', 'trägt', 'heute', 'die', 'rote', 'Jacke.'],
        explanation: 'Feminine accusative after definite "die" takes the ending "-e": "die rote Jacke.".',
      },
      {
        id: 'a2-06-q10',
        type: 'reorder',
        prompt: 'Arrange the words ("In summer I like eating ice cream best."):',
        words: ['esse', 'Sommer', 'liebsten', 'Im', 'ich', 'am', 'Eis.'],
        correctOrder: ['Im', 'Sommer', 'esse', 'ich', 'am', 'liebsten', 'Eis.'],
        explanation: '"Im Sommer" takes position 1, "esse" position 2, followed by "ich am liebsten Eis.".',
      },
    ],
  },
];
