import type { SeedMilestoneInput } from '../db/database';

export const MILESTONES_B1: SeedMilestoneInput[] = [
  // ===================== B1-01 =====================
  {
    code: 'B1-01',
    level: 'B1',
    title: 'Konjunktiv II (Polite Requests, Advice & Wishes)',
    orderIndex: 13,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Konjunktiv II: Polite Requests, Advice & Wishes

**Konjunktiv II** is used for polite requests, giving advice, and talking about unreal wishes or hypothetical situations. For most verbs, German uses **würde + infinitive**, while **haben**, **sein**, and **modal verbs** use their own short Konjunktiv II forms.

| Pronoun | werden | haben | sein | können | sollen | müssen |
| --- | --- | --- | --- | --- | --- | --- |
| ich | **würde** | **hätte** | **wäre** | **könnte** | **sollte** | **müsste** |
| du | **würdest** | **hättest** | **wärest** | **könntest** | **solltest** | **müsstest** |
| er / sie / es | **würde** | **hätte** | **wäre** | **könnte** | **sollte** | **müsste** |
| wir | **würden** | **hätten** | **wären** | **könnten** | **sollten** | **müssten** |
| ihr | **würdet** | **hättet** | **wäret** | **könntet** | **solltet** | **müsstet** |
| sie / Sie | **würden** | **hätten** | **wären** | **könnten** | **sollten** | **müssten** |

> **Formula:** Subject + **würde / Modal (Konjunktiv II)** (Pos. 2) + ... + **Infinitive** (end)

> **Formula:** **Wenn** + Subject + ... + **Konjunktiv II verb (end)**, + **Konjunktiv II verb (Pos. 2)** + Subject + ...

### Key Uses & Examples
- **Polite requests:** \`Könnten Sie mir bitte helfen?\` (Could you please help me?)
- **Advice (\`sollten\`):** \`Du solltest mehr schlafen.\` (You should sleep more.)
- **Unreal wishes:** \`Wenn ich mehr Zeit hätte, würde ich öfter reisen.\` (If I had more time, I would travel more often.)`,
    questions: [
      {
        id: 'b1-01-q1',
        type: 'mcq',
        prompt: 'Choose the most polite request: "___ Sie mir bitte das Fenster öffnen?"',
        options: ['Könnten', 'Können', 'Konnten', 'Sollen'],
        answer: 'Könnten',
        explanation: '"Könnten Sie ...?" is the Konjunktiv II form of "können" and is the standard polite way to make a request.',
      },
      {
        id: 'b1-01-q2',
        type: 'mcq',
        prompt: 'Give advice: "Du hast hohes Fieber. Du ___ sofort zum Arzt gehen."',
        options: ['solltest', 'wärest', 'hättest', 'würdest'],
        answer: 'solltest',
        explanation: 'Konjunktiv II of "sollen" ("du solltest") is used to give friendly advice ("you should").',
      },
      {
        id: 'b1-01-q3',
        type: 'fill',
        prompt: 'Complete the wish with the Konjunktiv II form of "haben":',
        sentenceBefore: 'Ich',
        sentenceAfter: 'gern mehr Freizeit im Sommer.',
        answer: 'hätte',
        acceptedAnswers: ['hätte'],
        hint: 'ich + haben in Konjunktiv II',
        explanation: 'With "haben", we use the direct Konjunktiv II form "ich hätte" rather than "würde haben".',
      },
      {
        id: 'b1-01-q4',
        type: 'mcq',
        prompt: 'Complete the unreal condition: "Wenn das Wetter besser ___, würden wir wandern gehen."',
        options: ['wäre', 'würde', 'hätte', 'war'],
        answer: 'wäre',
        explanation: 'The Konjunktiv II of "sein" for "es / das Wetter" is "wäre".',
      },
      {
        id: 'b1-01-q5',
        type: 'reorder',
        prompt: 'Build the sentence ("I would like to travel to Japan."):',
        words: ['reisen.', 'Ich', 'nach', 'würde', 'Japan', 'gern'],
        correctOrder: ['Ich', 'würde', 'gern', 'nach', 'Japan', 'reisen.'],
        explanation: 'In main clauses, "würde" sits in position 2 and the infinitive "reisen" goes to the very end.',
      },
      {
        id: 'b1-01-q6',
        type: 'fill',
        prompt: 'Complete the polite restaurant request with the Konjunktiv II of "werden" (wir):',
        sentenceBefore: 'Wir',
        sentenceAfter: 'gern einen Tisch für vier Personen reservieren.',
        answer: 'würden',
        acceptedAnswers: ['würden'],
        hint: 'wir + werden in Konjunktiv II',
        explanation: '"Wir würden gern ... reservieren" is the natural polite structure for making a reservation.',
      },
      {
        id: 'b1-01-q7',
        type: 'mcq',
        prompt: 'Which clause is the most natural German for "If I were rich"?',
        options: [
          'Wenn ich reich wäre',
          'Wenn ich reich würde sein',
          'Wenn ich reich bin',
          'Wenn ich reich hätte',
        ],
        answer: 'Wenn ich reich wäre',
        explanation: 'Always use the direct Konjunktiv II form "wäre" instead of "würde sein".',
      },
      {
        id: 'b1-01-q8',
        type: 'reorder',
        prompt: 'Form a polite question ("Could you please help me?"):',
        words: ['mir', 'helfen?', 'du', 'Könntest', 'bitte'],
        correctOrder: ['Könntest', 'du', 'mir', 'bitte', 'helfen?'],
        explanation: 'In a yes/no question, the Konjunktiv II modal "Könntest" comes first, followed by the subject "du", and the infinitive "helfen" at the end.',
      },
      {
        id: 'b1-01-q9',
        type: 'fill',
        prompt: 'Fill in the Konjunktiv II form of "müssen" (er):',
        sentenceBefore: 'Er',
        sentenceAfter: 'früher aufstehen, um den ersten Zug zu erreichen.',
        answer: 'müsste',
        acceptedAnswers: ['müsste'],
        hint: 'er + müssen in Konjunktiv II (with umlaut)',
        explanation: 'The Konjunktiv II of "müssen" takes an umlaut: "er müsste" ("he would have to").',
      },
      {
        id: 'b1-01-q10',
        type: 'reorder',
        prompt: 'Build the conditional sentence ("If it were warmer, we would swim."):',
        words: ['würden', 'es', 'wärmer', 'Wenn', 'wäre,', 'schwimmen.', 'wir'],
        correctOrder: ['Wenn', 'es', 'wärmer', 'wäre,', 'würden', 'wir', 'schwimmen.'],
        explanation: 'In the "Wenn" clause, "wäre" goes to the end. The main clause starts immediately with the conjugated verb "würden" (verb-comma-verb).',
      },
    ],
  },

  // ===================== B1-02 =====================
  {
    code: 'B1-02',
    level: 'B1',
    title: 'Relative Clauses (Nominative, Accusative & Dative)',
    orderIndex: 14,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Relativsätze (Relative Clauses)

A **relative clause** gives extra information about a noun. The relative pronoun gets its **gender and number** from the noun it refers to, and its **case** from its role inside the relative clause.

| Case | Masculine | Feminine | Neuter | Plural |
| --- | --- | --- | --- | --- |
| **Nominative** (subject) | **der** | **die** | **das** | **die** |
| **Accusative** (direct object) | **den** | **die** | **das** | **die** |
| **Dative** (indirect / prep.) | **dem** | **der** | **dem** | **denen** |

> **Formula:** Noun + **,** + (**Preposition** +) **Relative Pronoun** + ... + **Conjugated Verb (end)**

### Watch Out For
- **Dative plural** is **denen** (not *den*): \`Die Freunde, mit denen ich reise.\`
- Relative clauses are always separated by **commas** and send the conjugated verb to the **end**.
- If the verb in the relative clause requires a preposition, place it **before** the relative pronoun: \`Die Stadt, in der ich wohne.\``,
    questions: [
      {
        id: 'b1-02-q1',
        type: 'mcq',
        prompt: 'Choose the correct relative pronoun: "Das ist der Kollege, ___ mir immer hilft."',
        options: ['der', 'den', 'dem', 'die'],
        answer: 'der',
        explanation: '"Der Kollege" is masculine, and it acts as the subject (nominative) of "hilft", so the pronoun is "der".',
      },
      {
        id: 'b1-02-q2',
        type: 'mcq',
        prompt: 'Choose the correct relative pronoun: "Der Film, ___ wir gestern gesehen haben, war spannend."',
        options: ['den', 'der', 'dem', 'das'],
        answer: 'den',
        explanation: '"Der Film" is masculine, and "wir" is the subject of the relative clause; "Film" is the direct object (accusative), so we use "den".',
      },
      {
        id: 'b1-02-q3',
        type: 'fill',
        prompt: 'Fill in the dative relative pronoun for "die Frau":',
        sentenceBefore: 'Die Frau,',
        sentenceAfter: 'ich das Buch gegeben habe, ist meine Nachbarin.',
        answer: 'der',
        acceptedAnswers: ['der'],
        hint: 'Feminine dative relative pronoun',
        explanation: '"geben" takes a dative recipient. The feminine dative relative pronoun is "der".',
      },
      {
        id: 'b1-02-q4',
        type: 'mcq',
        prompt: 'Choose the plural dative relative pronoun: "Das sind die Freunde, mit ___ ich im Urlaub war."',
        options: ['denen', 'den', 'die', 'dem'],
        answer: 'denen',
        explanation: '"mit" requires the dative case, and the dative plural relative pronoun is always "denen".',
      },
      {
        id: 'b1-02-q5',
        type: 'reorder',
        prompt: 'Build the sentence ("This is the city in which I live."):',
        words: ['Stadt,', 'Das', 'wohne.', 'die', 'in', 'ist', 'ich', 'der'],
        correctOrder: ['Das', 'ist', 'die', 'Stadt,', 'in', 'der', 'ich', 'wohne.'],
        explanation: 'The preposition "in" precedes the feminine dative relative pronoun "der", and "wohne" goes to the end.',
      },
      {
        id: 'b1-02-q6',
        type: 'fill',
        prompt: 'Fill in the relative pronoun for "das Auto":',
        sentenceBefore: 'Das Auto,',
        sentenceAfter: 'mein Bruder gekauft hat, ist elektrisch.',
        answer: 'das',
        acceptedAnswers: ['das'],
        hint: 'Neuter accusative relative pronoun',
        explanation: '"Das Auto" is neuter, and it is the accusative object of "gekauft hat", so the relative pronoun is "das".',
      },
      {
        id: 'b1-02-q7',
        type: 'mcq',
        prompt: 'Choose the correct pronoun: "Der Zug, mit ___ wir fahren, hat zehn Minuten Verspätung."',
        options: ['dem', 'den', 'der', 'denen'],
        answer: 'dem',
        explanation: '"Der Zug" is masculine, and "mit" always takes the dative case, giving "mit dem".',
      },
      {
        id: 'b1-02-q8',
        type: 'reorder',
        prompt: 'Build the sentence ("I know the doctor who helped you."):',
        words: ['Arzt,', 'kenne', 'hat.', 'Ich', 'dir', 'den', 'geholfen', 'der'],
        correctOrder: ['Ich', 'kenne', 'den', 'Arzt,', 'der', 'dir', 'geholfen', 'hat.'],
        explanation: '"den Arzt" is accusative in the main clause, but nominative ("der") as the subject of the relative clause; "hat" goes to the end.',
      },
      {
        id: 'b1-02-q9',
        type: 'fill',
        prompt: 'Fill in the relative pronoun for "die Aufgaben" (plural):',
        sentenceBefore: 'Die Aufgaben,',
        sentenceAfter: 'wir heute machen müssen, sind ziemlich leicht.',
        answer: 'die',
        acceptedAnswers: ['die'],
        hint: 'Plural accusative relative pronoun',
        explanation: 'For plural nouns in the accusative case, the relative pronoun is "die".',
      },
      {
        id: 'b1-02-q10',
        type: 'reorder',
        prompt: 'Build the sentence ("The colleague with whom I work is nice."):',
        words: ['mit', 'Die', 'nett.', 'arbeite,', 'Kollegin,', 'der', 'ist', 'ich'],
        correctOrder: ['Die', 'Kollegin,', 'mit', 'der', 'ich', 'arbeite,', 'ist', 'nett.'],
        explanation: 'The embedded relative clause ", mit der ich arbeite," is enclosed in commas, followed by the main verb "ist".',
      },
    ],
  },

  // ===================== B1-03 =====================
  {
    code: 'B1-03',
    level: 'B1',
    title: 'Passive Voice (Präsens, Präteritum & Modals)',
    orderIndex: 15,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Passiv (Passive Voice: Präsens, Präteritum & Modals)

Use the **passive voice** when the action or result is more important than who performs it. German forms the process passive (**Vorgangspassiv**) with the auxiliary **werden** + **Partizip II**.

| Tense / Structure | Auxiliary | Example |
| --- | --- | --- |
| **Präsens Passiv** | **wird / werden** + Partizip II | \`Das Haus wird renoviert.\` |
| **Präteritum Passiv** | **wurde / wurden** + Partizip II | \`Die Brücke wurde 1998 gebaut.\` |
| **Modal + Passiv** | **Modalverb** + Partizip II + **werden** | \`Das Formular muss ausgefüllt werden.\` |

> **Formula (Präsens / Präteritum):** Subject + **wird / wurde** (Pos. 2) + ... + **Partizip II** (end)

> **Formula (Modal Passive):** Subject + **Modal Verb** (Pos. 2) + ... + **Partizip II + werden** (end)

### Naming the Agent or Cause
- **von + Dative** for a **person or institution**: \`Der Brief wird von der Sekretärin geschrieben.\`
- **durch + Accusative** for a **cause, force, or means**: \`Die Straße wurde durch den Sturm blockiert.\``,
    questions: [
      {
        id: 'b1-03-q1',
        type: 'mcq',
        prompt: 'Complete the present passive sentence: "Das alte Haus ___ gerade renoviert."',
        options: ['wird', 'wurde', 'werden', 'ist'],
        answer: 'wird',
        explanation: 'Present passive for a singular subject ("Das alte Haus") uses "wird" + Partizip II ("renoviert").',
      },
      {
        id: 'b1-03-q2',
        type: 'mcq',
        prompt: 'Complete the past passive sentence: "Die Briefe ___ gestern verschickt."',
        options: ['wurden', 'wurde', 'werden', 'wird'],
        answer: 'wurden',
        explanation: 'Past passive (Präteritum Passiv) for a plural subject ("Die Briefe") uses "wurden" + Partizip II.',
      },
      {
        id: 'b1-03-q3',
        type: 'fill',
        prompt: 'Fill in the present passive auxiliary (plural):',
        sentenceBefore: 'In dieser Bäckerei',
        sentenceAfter: 'jeden Morgen frische Brötchen gebacken.',
        answer: 'werden',
        acceptedAnswers: ['werden'],
        hint: 'Plural present form of werden',
        explanation: 'The subject is plural ("frische Brötchen"), so the present passive auxiliary is "werden".',
      },
      {
        id: 'b1-03-q4',
        type: 'mcq',
        prompt: 'Choose the correct preposition for a person (agent): "Der Patient wird ___ der Ärztin untersucht."',
        options: ['von', 'durch', 'mit', 'bei'],
        answer: 'von',
        explanation: 'When naming a person who performs the action in the passive voice, German uses "von + Dative".',
      },
      {
        id: 'b1-03-q5',
        type: 'reorder',
        prompt: 'Build the passive sentence ("The window is opened every morning."):',
        words: ['geöffnet.', 'Fenster', 'jeden', 'Das', 'wird', 'Morgen'],
        correctOrder: ['Das', 'Fenster', 'wird', 'jeden', 'Morgen', 'geöffnet.'],
        explanation: 'The auxiliary "wird" occupies position 2 and the past participle "geöffnet" goes to the end.',
      },
      {
        id: 'b1-03-q6',
        type: 'fill',
        prompt: 'Fill in the Präteritum passive auxiliary (singular):',
        sentenceBefore: 'Diese Brücke',
        sentenceAfter: 'im Jahr 1998 gebaut.',
        answer: 'wurde',
        acceptedAnswers: ['wurde'],
        hint: 'Singular Präteritum of werden',
        explanation: 'For a singular subject ("Diese Brücke") in the past passive, use "wurde" + Partizip II.',
      },
      {
        id: 'b1-03-q7',
        type: 'mcq',
        prompt: 'Complete the modal passive sentence: "Das Formular muss bis Freitag ___."',
        options: [
          'ausgefüllt werden',
          'ausfüllen werden',
          'werden ausgefüllt',
          'ausgefüllt wird',
        ],
        answer: 'ausgefüllt werden',
        explanation: 'With a modal verb, the passive ends with "Partizip II + werden" in infinitive form.',
      },
      {
        id: 'b1-03-q8',
        type: 'fill',
        prompt: 'Complete the modal passive sentence with the final auxiliary:',
        sentenceBefore: 'In diesem Raum darf nicht geraucht',
        sentenceAfter: '.',
        answer: 'werden',
        acceptedAnswers: ['werden'],
        hint: 'Infinitive passive auxiliary',
        explanation: 'Modal passive always ends with Partizip II + the infinitive "werden".',
      },
      {
        id: 'b1-03-q9',
        type: 'mcq',
        prompt: 'Choose the preposition for a natural cause: "Viele Bäume wurden ___ den Sturm zerstört."',
        options: ['durch', 'von', 'mit', 'aus'],
        answer: 'durch',
        explanation: 'Use "durch + Accusative" to express an impersonal cause, force, or means.',
      },
      {
        id: 'b1-03-q10',
        type: 'reorder',
        prompt: 'Build the modal passive sentence ("The contract must be signed today."):',
        words: ['muss', 'werden.', 'Der', 'heute', 'unterschrieben', 'Vertrag'],
        correctOrder: ['Der', 'Vertrag', 'muss', 'heute', 'unterschrieben', 'werden.'],
        explanation: 'The modal verb "muss" is in position 2, and "unterschrieben werden" forms the passive bracket at the end.',
      },
    ],
  },

  // ===================== B1-04 =====================
  {
    code: 'B1-04',
    level: 'B1',
    title: 'Infinitive Clauses (zu, um ... zu, ohne ... zu, anstatt ... zu)',
    orderIndex: 16,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Infinitivsätze mit zu (Infinitive Clauses)

When both clauses share the **same subject**, German often connects them with an infinitive clause using **zu + Infinitive** at the end.

| Structure | Meaning | Example |
| --- | --- | --- |
| **... zu + Inf.** | to do something | \`Ich versuche, pünktlich zu kommen.\` |
| **um ... zu + Inf.** | in order to (purpose) | \`Sie lernt Deutsch, um in Wien zu studieren.\` |
| **ohne ... zu + Inf.** | without doing | \`Er ging weg, ohne ein Wort zu sagen.\` |
| **anstatt ... zu + Inf.** | instead of doing | \`Anstatt zu lernen, schaut er fern.\` |

> **Formula:** Main Clause + **,** + (**um / ohne / anstatt**) + ... + **zu + Infinitive** (end)

### Separable Verbs & Exceptions
- With **separable verbs**, **zu** goes **between** the prefix and stem as one word: \`aufstehen\` → \`aufzustehen\`, \`einkaufen\` → \`einzukaufen\`.
- Do **not** use \`zu\` after modal verbs (\`können\`, \`müssen\`, etc.) or verbs like \`gehen\`, \`fahren\`, \`bleiben\`, \`sehen\`, \`hören\`, and \`lassen\`.
- If the two clauses have **different subjects**, use **damit** instead of \`um ... zu\`.`,
    questions: [
      {
        id: 'b1-04-q1',
        type: 'mcq',
        prompt: 'Choose the correct separable infinitive form: "Ich habe vergessen, das Licht ___."',
        options: ['auszumachen', 'zu ausmachen', 'ausmachen zu', 'gemacht zu'],
        answer: 'auszumachen',
        explanation: 'For separable verbs like "ausmachen", "zu" is inserted between the prefix and the stem as a single word: "auszumachen".',
      },
      {
        id: 'b1-04-q2',
        type: 'mcq',
        prompt: 'Express purpose: "Sie lernt intensiv Deutsch, ___ in Berlin zu studieren."',
        options: ['um', 'ohne', 'anstatt', 'damit'],
        answer: 'um',
        explanation: 'When both clauses have the same subject ("sie"), express purpose ("in order to") with "um ... zu".',
      },
      {
        id: 'b1-04-q3',
        type: 'fill',
        prompt: 'Insert the "zu + infinitive" form of the separable verb "aufstehen":',
        sentenceBefore: 'Er versucht, jeden Morgen um sechs Uhr',
        sentenceAfter: '.',
        answer: 'aufzustehen',
        acceptedAnswers: ['aufzustehen'],
        hint: 'Prefix + zu + stem (one word)',
        explanation: '"aufstehen" is separable, so "zu" sits between "auf" and "stehen": "aufzustehen".',
      },
      {
        id: 'b1-04-q4',
        type: 'mcq',
        prompt: 'Complete the sentence: "Er verließ das Zimmer, ___ ein Wort zu sagen."',
        options: ['ohne', 'um', 'anstatt', 'weil'],
        answer: 'ohne',
        explanation: '"ohne ... zu + Infinitive" means "without ...-ing".',
      },
      {
        id: 'b1-04-q5',
        type: 'reorder',
        prompt: 'Build the sentence ("I am going to Munich in order to visit friends."):',
        words: ['besuchen.', 'Ich', 'um', 'nach', 'fahre', 'Freunde', 'zu', 'München,'],
        correctOrder: ['Ich', 'fahre', 'nach', 'München,', 'um', 'Freunde', 'zu', 'besuchen.'],
        explanation: 'The purpose clause starts with "um" after the comma and ends with "zu besuchen".',
      },
      {
        id: 'b1-04-q6',
        type: 'fill',
        prompt: 'Fill in the connector meaning "Instead of":',
        sentenceBefore: '',
        sentenceAfter: 'für die Prüfung zu lernen, spielt er Videospiele.',
        answer: 'Anstatt',
        acceptedAnswers: ['Anstatt', 'Statt'],
        hint: 'Connector paired with "... zu" meaning "instead of"',
        explanation: '"Anstatt ... zu" (or "Statt ... zu") expresses doing one thing instead of another.',
      },
      {
        id: 'b1-04-q7',
        type: 'mcq',
        prompt: 'Which sentence is grammatically correct (remember when NOT to use "zu")?',
        options: [
          'Wir können heute Abend ins Kino gehen.',
          'Wir können heute Abend ins Kino zu gehen.',
          'Ich bleibe heute im Bett zu liegen.',
          'Sie geht am Samstag im Park zu joggen.',
        ],
        answer: 'Wir können heute Abend ins Kino gehen.',
        explanation: 'Modal verbs ("können") and verbs like "bleiben" and "gehen" take a bare infinitive without "zu".',
      },
      {
        id: 'b1-04-q8',
        type: 'reorder',
        prompt: 'Build the sentence ("It is important to drink enough water."):',
        words: ['trinken.', 'Es', 'genug', 'wichtig,', 'zu', 'ist', 'Wasser'],
        correctOrder: ['Es', 'ist', 'wichtig,', 'genug', 'Wasser', 'zu', 'trinken.'],
        explanation: 'After "Es ist wichtig,", the infinitive clause places "zu trinken" at the very end.',
      },
      {
        id: 'b1-04-q9',
        type: 'fill',
        prompt: 'Complete with "zu + infinitive" of "arbeiten":',
        sentenceBefore: 'Ich habe heute keine Lust, lange',
        sentenceAfter: '.',
        answer: 'zu arbeiten',
        acceptedAnswers: ['zu arbeiten'],
        hint: 'Two words: zu + infinitive',
        explanation: 'Non-separable verbs like "arbeiten" place "zu" as a separate word directly before the infinitive: "zu arbeiten".',
      },
      {
        id: 'b1-04-q10',
        type: 'reorder',
        prompt: 'Build the sentence ("She left without saying goodbye."):',
        words: ['ohne', 'Sie', 'verabschieden.', 'weg,', 'zu', 'sich', 'ging'],
        correctOrder: ['Sie', 'ging', 'weg,', 'ohne', 'sich', 'zu', 'verabschieden.'],
        explanation: '"ohne ... zu" encloses the reflexive pronoun "sich" and puts "zu verabschieden" at the end.',
      },
    ],
  },

  // ===================== B1-05 =====================
  {
    code: 'B1-05',
    level: 'B1',
    title: 'Two-Part Connectors & obwohl / trotzdem',
    orderIndex: 17,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Zweiteilige Konnektoren & obwohl / trotzdem

**Two-part connectors** link parallel ideas with clear nuance, while **obwohl** and **trotzdem** express contrast with very different word order.

| Connector | Meaning | Example |
| --- | --- | --- |
| **sowohl ... als auch** | both ... and | \`Sie spricht sowohl Deutsch als auch Englisch.\` |
| **nicht nur ... sondern auch** | not only ... but also | \`Er kocht nicht nur gut, sondern auch schnell.\` |
| **weder ... noch** | neither ... nor | \`Ich trinke weder Kaffee noch Tee.\` |
| **entweder ... oder** | either ... or | \`Wir fahren entweder mit dem Zug oder mit dem Bus.\` |
| **zwar ... aber** | admittedly / indeed ... but | \`Die Wohnung ist zwar klein, aber sehr hell.\` |

> **Formula (obwohl — subordinate):** **Obwohl** + Subject + ... + **Verb (end)**, **Verb (Pos. 2)** + Subject + ...

> **Formula (trotzdem — adverb):** Main Clause. **Trotzdem** + **Verb (Pos. 2)** + Subject + ...

### Contrast Pair Example
- \`Obwohl es stark regnet, gehen wir spazieren.\` (*obwohl* sends \`regnet\` to the end)
- \`Es regnet stark. Trotzdem gehen wir spazieren.\` (*trotzdem* takes Position 1, so \`gehen\` stays in Position 2)`,
    questions: [
      {
        id: 'b1-05-q1',
        type: 'mcq',
        prompt: 'Choose the connector for "neither ... nor": "Er trinkt ___ Kaffee ___ Tee."',
        options: ['weder ... noch', 'sowohl ... als auch', 'entweder ... oder', 'zwar ... aber'],
        answer: 'weder ... noch',
        explanation: '"weder ... noch" means "neither ... nor" and already negates the sentence (do not add "nicht" or "kein").',
      },
      {
        id: 'b1-05-q2',
        type: 'mcq',
        prompt: 'Choose the connector for "both ... and": "Sie spricht ___ Deutsch ___ Spanisch."',
        options: ['sowohl ... als auch', 'weder ... noch', 'entweder ... oder', 'zwar ... aber'],
        answer: 'sowohl ... als auch',
        explanation: '"sowohl ... als auch" links two equal elements with the meaning "both ... and".',
      },
      {
        id: 'b1-05-q3',
        type: 'fill',
        prompt: 'Fill in the subordinating conjunction meaning "Although":',
        sentenceBefore: '',
        sentenceAfter: 'es stark regnet, gehen wir heute spazieren.',
        answer: 'Obwohl',
        acceptedAnswers: ['Obwohl'],
        hint: 'Sends the verb "regnet" to the end',
        explanation: '"Obwohl" ("although") is a subordinating conjunction, which is why "regnet" appears at the end of the clause.',
      },
      {
        id: 'b1-05-q4',
        type: 'mcq',
        prompt: 'Choose the correct word order after "Trotzdem": "Es regnet stark. Trotzdem ___."',
        options: [
          'gehen wir spazieren',
          'wir gehen spazieren',
          'wir spazieren gehen',
          'spazieren wir gehen',
        ],
        answer: 'gehen wir spazieren',
        explanation: '"Trotzdem" is a conjunctive adverb occupying position 1, so the conjugated verb "gehen" must follow immediately in position 2.',
      },
      {
        id: 'b1-05-q5',
        type: 'reorder',
        prompt: 'Build the sentence ("Although it is cold, we are going for a walk."):',
        words: ['spazieren.', 'kalt', 'Obwohl', 'gehen', 'es', 'ist,', 'wir'],
        correctOrder: ['Obwohl', 'es', 'kalt', 'ist,', 'gehen', 'wir', 'spazieren.'],
        explanation: '"Obwohl" sends "ist" to the end of the subordinate clause; the main clause starts immediately with "gehen" (verb-comma-verb).',
      },
      {
        id: 'b1-05-q6',
        type: 'fill',
        prompt: 'Complete the second half of "entweder ... ___":',
        sentenceBefore: 'Wir fahren entweder mit dem Zug',
        sentenceAfter: 'mit dem Bus.',
        answer: 'oder',
        acceptedAnswers: ['oder'],
        hint: '"either ... or"',
        explanation: '"entweder" is always paired with "oder" to present two alternatives.',
      },
      {
        id: 'b1-05-q7',
        type: 'mcq',
        prompt: 'Express a concession ("admittedly ... but"): "Die Wohnung ist ___ klein, ___ sie ist sehr hell."',
        options: ['zwar ... aber', 'weder ... noch', 'entweder ... oder', 'sowohl ... als auch'],
        answer: 'zwar ... aber',
        explanation: '"zwar ... aber" concedes one point ("small") and contrasts it with a positive or opposing point ("very bright").',
      },
      {
        id: 'b1-05-q8',
        type: 'fill',
        prompt: 'Fill in the adverb meaning "nevertheless" (note the verb in Pos. 2 after it):',
        sentenceBefore: 'Ich hatte wenig Zeit,',
        sentenceAfter: 'habe ich den Kuchen gebacken.',
        answer: 'trotzdem',
        acceptedAnswers: ['trotzdem'],
        hint: 'Contrast adverb followed directly by "habe"',
        explanation: '"trotzdem" ("nevertheless / still") triggers inversion: "trotzdem habe ich ...".',
      },
      {
        id: 'b1-05-q9',
        type: 'mcq',
        prompt: 'Complete the connector: "Das Hotel ist nicht nur günstig, ___ sehr zentral."',
        options: ['sondern auch', 'als auch', 'oder auch', 'noch'],
        answer: 'sondern auch',
        explanation: '"nicht nur" is always paired with "sondern auch" ("not only ... but also").',
      },
      {
        id: 'b1-05-q10',
        type: 'reorder',
        prompt: 'Build the sentence ("It is raining, nevertheless we are riding bikes."):',
        words: ['wir', 'trotzdem', 'Fahrrad.', 'Es', 'fahren', 'regnet,'],
        correctOrder: ['Es', 'regnet,', 'trotzdem', 'fahren', 'wir', 'Fahrrad.'],
        explanation: 'After "trotzdem", the verb "fahren" comes immediately before the subject "wir".',
      },
    ],
  },

  // ===================== B1-06 =====================
  {
    code: 'B1-06',
    level: 'B1',
    title: 'Genitive Case & Verbs with Fixed Prepositions',
    orderIndex: 18,
    isUnlocked: false,
    bestScore: 0,
    completed: false,
    ruleMarkdown: `## Genitiv & Verben mit festen Präpositionen

The **Genitive case** expresses possession and follows key B1 prepositions (**wegen**, **trotz**, **während**, **statt**). Masculine and neuter singular nouns usually add **-s** or **-es**.

| Gender / Number | Definite Article | Indefinite Article | Noun Ending | Example |
| --- | --- | --- | --- | --- |
| **Masculine** | **des** | **eines** | **-(e)s** | \`trotz des Regens\` |
| **Feminine** | **der** | **einer** | — | \`während der Reise\` |
| **Neuter** | **des** | **eines** | **-(e)s** | \`wegen des Wetters\` |
| **Plural** | **der** | — | — | \`statt der Blumen\` |

> **Formula (Genitive Prepositions):** **wegen / trotz / während / statt** + **des (+ -(e)s) / der** + Noun

### Common Verbs with Fixed Prepositions
| Verb + Preposition | Case | Example |
| --- | --- | --- |
| **warten auf** | Akkusativ | \`Ich warte auf den Bus.\` |
| **sich freuen auf / über** | Akkusativ | \`auf\` = future, \`über\` = present/past |
| **sich interessieren für** | Akkusativ | \`Sie interessiert sich für Kunst.\` |
| **denken an** | Akkusativ | \`Er denkt oft an seinen Urlaub.\` |
| **teilnehmen an** | Dativ | \`Wir nehmen an dem Kurs teil.\` |

> **Formula (da- / wo- Compounds for things):** **wo(r)-** + Prep (question) → **da(r)-** + Prep (answer), e.g., \`Worauf wartest du? — Ich warte darauf.\``,
    questions: [
      {
        id: 'b1-06-q1',
        type: 'mcq',
        prompt: 'Choose the genitive preposition meaning "Because of": "___ des schlechten Wetters bleiben wir zu Hause."',
        options: ['Wegen', 'Trotz', 'Während', 'Statt'],
        answer: 'Wegen',
        explanation: '"wegen + Genitive" means "because of" ("Wegen des schlechten Wetters").',
      },
      {
        id: 'b1-06-q2',
        type: 'mcq',
        prompt: 'Choose the genitive article for "die Reise" (feminine): "Während ___ Reise haben wir viele Fotos gemacht."',
        options: ['der', 'des', 'die', 'den'],
        answer: 'der',
        explanation: 'Feminine nouns take "der" in the genitive case ("während der Reise") with no extra noun ending.',
      },
      {
        id: 'b1-06-q3',
        type: 'fill',
        prompt: 'Fill in the genitive form of "Vater" (masculine):',
        sentenceBefore: 'Das ist das neue Auto meines',
        sentenceAfter: '.',
        answer: 'Vaters',
        acceptedAnswers: ['Vaters'],
        hint: 'Add the masculine genitive noun ending',
        explanation: 'Masculine and neuter nouns add "-s" (or "-es") in the genitive singular: "meines Vaters".',
      },
      {
        id: 'b1-06-q4',
        type: 'mcq',
        prompt: 'Choose the fixed preposition: "Ich interessiere mich sehr ___ moderne Kunst."',
        options: ['für', 'auf', 'über', 'an'],
        answer: 'für',
        explanation: 'The verb "sich interessieren" always takes the fixed preposition "für + Accusative".',
      },
      {
        id: 'b1-06-q5',
        type: 'reorder',
        prompt: 'Build the sentence ("Despite the rain, we are going hiking today."):',
        words: ['wandern.', 'des', 'gehen', 'Trotz', 'heute', 'Regens', 'wir'],
        correctOrder: ['Trotz', 'des', 'Regens', 'gehen', 'wir', 'heute', 'wandern.'],
        explanation: '"Trotz des Regens" occupies position 1, followed immediately by the verb "gehen" in position 2.',
      },
      {
        id: 'b1-06-q6',
        type: 'fill',
        prompt: 'Fill in the fixed preposition for "warten":',
        sentenceBefore: 'Wir warten schon seit zwanzig Minuten',
        sentenceAfter: 'den Bus.',
        answer: 'auf',
        acceptedAnswers: ['auf'],
        hint: 'warten + ___ + Akkusativ',
        explanation: '"warten auf + Accusative" means "to wait for".',
      },
      {
        id: 'b1-06-q7',
        type: 'mcq',
        prompt: 'Choose the right preposition for a future event: "Sie freut sich schon sehr ___ ihren Urlaub nächsten Monat."',
        options: ['auf', 'über', 'für', 'von'],
        answer: 'auf',
        explanation: 'Use "sich freuen auf" when looking forward to something in the future; use "sich freuen über" for something happening now or in the past.',
      },
      {
        id: 'b1-06-q8',
        type: 'reorder',
        prompt: 'Build the sentence ("I often think of my vacation."):',
        words: ['meinen', 'denke', 'Urlaub.', 'an', 'Ich', 'oft'],
        correctOrder: ['Ich', 'denke', 'oft', 'an', 'meinen', 'Urlaub.'],
        explanation: '"denken an + Accusative" keeps "denke" in position 2 and puts the prepositional object "an meinen Urlaub" after the adverb "oft".',
      },
      {
        id: 'b1-06-q9',
        type: 'fill',
        prompt: 'Ask about a thing using "wo(r)- + auf" ("What are you waiting for?"):',
        sentenceBefore: '',
        sentenceAfter: 'wartest du?',
        answer: 'Worauf',
        acceptedAnswers: ['Worauf'],
        hint: 'wo + r + auf (since "auf" starts with a vowel)',
        explanation: 'When a preposition starts with a vowel ("auf"), insert "-r-" between "wo-" and the preposition: "Worauf wartest du?".',
      },
      {
        id: 'b1-06-q10',
        type: 'reorder',
        prompt: 'Build the sentence ("He is taking part in the course on Monday."):',
        words: ['teil.', 'am', 'Kurs', 'Er', 'an', 'Montag', 'dem', 'nimmt'],
        correctOrder: ['Er', 'nimmt', 'am', 'Montag', 'an', 'dem', 'Kurs', 'teil.'],
        explanation: '"teilnehmen an + Dative" is a separable verb: "nimmt" sits in position 2 and "teil" goes to the very end.',
      },
    ],
  },
];
