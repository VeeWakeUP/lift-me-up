/**
 * Lift Me Up — structured content collection.
 *
 * Every entry has a unique, stable ID and both translations. Because language is a
 * *view* over the same entry, switching language never changes which item is shown.
 *
 * MOTIVATION QUOTES — all original, written for this project. They are intentionally
 * unattributed ("Lift Me Up"): no famous author is invented or implied.
 *
 * BIBLE VERSES — original PARAPHRASES in English and Greek. They are NOT verbatim
 * quotations of any published translation. References follow the common modern
 * numbering (Psalms are deliberately avoided because Greek Orthodox and Protestant
 * numbering differ). Each reference below was chosen for a passage whose meaning is
 * widely and uncontroversially understood, and the paraphrases stay close to that meaning.
 */

export type Lang = 'en' | 'el';
export type Localized = Record<Lang, string>;

export type QuoteCategory =
  | 'motivation'
  | 'success'
  | 'confidence'
  | 'discipline'
  | 'growth'
  | 'hope';

export type VerseCategory =
  | 'faith'
  | 'strength'
  | 'hope'
  | 'peace'
  | 'courage'
  | 'gratitude';

export const QUOTE_CATEGORIES: QuoteCategory[] = [
  'motivation',
  'success',
  'confidence',
  'discipline',
  'growth',
  'hope',
];

export const VERSE_CATEGORIES: VerseCategory[] = [
  'faith',
  'strength',
  'hope',
  'peace',
  'courage',
  'gratitude',
];

export interface Quote {
  id: string;
  category: QuoteCategory;
  text: Localized;
  /** Which of the six poster compositions to use (0–5). */
  poster: number;
}

export type BookKey =
  | 'hebrews'
  | 'proverbs'
  | '2corinthians'
  | 'isaiah'
  | 'philippians'
  | 'jeremiah'
  | 'romans'
  | 'lamentations'
  | 'john'
  | 'joshua'
  | 'deuteronomy'
  | '1thessalonians'
  | '1chronicles'
  | 'colossians';

export const BOOK_NAMES: Record<BookKey, Localized> = {
  hebrews: { en: 'Hebrews', el: 'Προς Εβραίους' },
  proverbs: { en: 'Proverbs', el: 'Παροιμίες' },
  '2corinthians': { en: '2 Corinthians', el: 'Β΄ Κορινθίους' },
  isaiah: { en: 'Isaiah', el: 'Ησαΐας' },
  philippians: { en: 'Philippians', el: 'Προς Φιλιππησίους' },
  jeremiah: { en: 'Jeremiah', el: 'Ιερεμίας' },
  romans: { en: 'Romans', el: 'Προς Ρωμαίους' },
  lamentations: { en: 'Lamentations', el: 'Θρήνοι' },
  john: { en: 'John', el: 'Κατά Ιωάννην' },
  joshua: { en: 'Joshua', el: 'Ιησούς του Ναυή' },
  deuteronomy: { en: 'Deuteronomy', el: 'Δευτερονόμιο' },
  '1thessalonians': { en: '1 Thessalonians', el: 'Α΄ Θεσσαλονικείς' },
  '1chronicles': { en: '1 Chronicles', el: 'Α΄ Χρονικών' },
  colossians: { en: 'Colossians', el: 'Προς Κολοσσαείς' },
};

export interface Verse {
  id: string;
  category: VerseCategory;
  book: BookKey;
  chapter: number;
  /** e.g. "5-6" or "11" */
  verses: string;
  /** Original paraphrase — not a verbatim translation. */
  text: Localized;
}

/* -------------------------------------------------------------------------- */
/*  Motivational quotes — 24 originals, 4 per category                         */
/* -------------------------------------------------------------------------- */

export const QUOTES: Quote[] = [
  // Motivation
  {
    id: 'q-motivation-1',
    category: 'motivation',
    poster: 0,
    text: {
      en: 'Today is a blank page. You hold the pen.',
      el: 'Η σημερινή μέρα είναι μια λευκή σελίδα. Εσύ κρατάς το στυλό.',
    },
  },
  {
    id: 'q-motivation-2',
    category: 'motivation',
    poster: 2,
    text: {
      en: 'Momentum begins the moment you stop waiting to feel ready.',
      el: 'Η ορμή ξεκινά τη στιγμή που σταματάς να περιμένεις να νιώσεις έτοιμος.',
    },
  },
  {
    id: 'q-motivation-3',
    category: 'motivation',
    poster: 4,
    text: {
      en: 'Progress is quiet. Keep showing up anyway.',
      el: 'Η πρόοδος είναι αθόρυβη. Συνέχισε να εμφανίζεσαι.',
    },
  },
  {
    id: 'q-motivation-4',
    category: 'motivation',
    poster: 1,
    text: {
      en: 'One honest effort today beats a perfect plan tomorrow.',
      el: 'Μία ειλικρινής προσπάθεια σήμερα αξίζει περισσότερο από ένα τέλειο σχέδιο αύριο.',
    },
  },
  // Success
  {
    id: 'q-success-1',
    category: 'success',
    poster: 3,
    text: {
      en: 'Success is a habit wearing a patient smile.',
      el: 'Η επιτυχία είναι μια συνήθεια που φοράει ένα υπομονετικό χαμόγελο.',
    },
  },
  {
    id: 'q-success-2',
    category: 'success',
    poster: 5,
    text: {
      en: 'Define your own finish line, then run your own race.',
      el: 'Όρισε τη δική σου γραμμή τερματισμού και τρέξε τον δικό σου αγώνα.',
    },
  },
  {
    id: 'q-success-3',
    category: 'success',
    poster: 1,
    text: {
      en: 'Every small win is a brick. Build something you are proud of.',
      el: 'Κάθε μικρή νίκη είναι ένα τούβλο. Χτίσε κάτι που σε κάνει περήφανο.',
    },
  },
  {
    id: 'q-success-4',
    category: 'success',
    poster: 2,
    text: {
      en: 'Great results are just ordinary days, repeated on purpose.',
      el: 'Τα μεγάλα αποτελέσματα είναι απλές καθημερινές μέρες, επαναλαμβανόμενες επίτηδες.',
    },
  },
  // Confidence
  {
    id: 'q-confidence-1',
    category: 'confidence',
    poster: 0,
    text: {
      en: 'You have survived every hard day so far. That is a strong record.',
      el: 'Έχεις επιβιώσει από κάθε δύσκολη μέρα μέχρι σήμερα. Είναι ένα δυνατό ρεκόρ.',
    },
  },
  {
    id: 'q-confidence-2',
    category: 'confidence',
    poster: 3,
    text: {
      en: 'Take up space. Your voice belongs in the room.',
      el: 'Πάρε τον χώρο σου. Η φωνή σου ανήκει σε αυτό το δωμάτιο.',
    },
  },
  {
    id: 'q-confidence-3',
    category: 'confidence',
    poster: 4,
    text: {
      en: 'Confidence is built by keeping promises to yourself.',
      el: 'Η αυτοπεποίθηση χτίζεται κρατώντας τις υποσχέσεις που δίνεις στον εαυτό σου.',
    },
  },
  {
    id: 'q-confidence-4',
    category: 'confidence',
    poster: 5,
    text: {
      en: 'You can be a work in progress and proud of it at the same time.',
      el: 'Μπορείς να είσαι έργο σε εξέλιξη και ταυτόχρονα να είσαι περήφανος.',
    },
  },
  // Discipline
  {
    id: 'q-discipline-1',
    category: 'discipline',
    poster: 1,
    text: {
      en: 'Discipline is a quiet form of self-respect.',
      el: 'Η πειθαρχία είναι ένας ήσυχος τρόπος αυτοσεβασμού.',
    },
  },
  {
    id: 'q-discipline-2',
    category: 'discipline',
    poster: 2,
    text: {
      en: 'Motivation starts the engine. Routine drives the car.',
      el: 'Το κίνητρο ανάβει τη μηχανή. Η ρουτίνα οδηγεί το αυτοκίνητο.',
    },
  },
  {
    id: 'q-discipline-3',
    category: 'discipline',
    poster: 3,
    text: {
      en: 'Do it tired. Do it bored. Do it anyway. Future you will notice.',
      el: 'Κάν’ το κουρασμένος. Κάν’ το βαριεστημένος. Κάν’ το παρ’ όλα αυτά. Ο μελλοντικός σου εαυτός θα το προσέξει.',
    },
  },
  {
    id: 'q-discipline-4',
    category: 'discipline',
    poster: 0,
    text: {
      en: 'Choose the small thing you can repeat over the big thing you cannot.',
      el: 'Διάλεξε το μικρό που μπορείς να επαναλαμβάνεις, όχι το μεγάλο που δεν μπορείς.',
    },
  },
  // Growth
  {
    id: 'q-growth-1',
    category: 'growth',
    poster: 4,
    text: {
      en: 'Mistakes are just practice wearing a disguise.',
      el: 'Τα λάθη είναι απλώς εξάσκηση με μεταμφίεση.',
    },
  },
  {
    id: 'q-growth-2',
    category: 'growth',
    poster: 5,
    text: {
      en: 'Be a little braver than yesterday and a little kinder to yourself.',
      el: 'Γίνε λίγο πιο γενναίος από χθες και λίγο πιο ευγενικός με τον εαυτό σου.',
    },
  },
  {
    id: 'q-growth-3',
    category: 'growth',
    poster: 1,
    text: {
      en: 'Roots grow in the dark before anything blooms.',
      el: 'Οι ρίζες μεγαλώνουν στο σκοτάδι πριν ανθίσει οτιδήποτε.',
    },
  },
  {
    id: 'q-growth-4',
    category: 'growth',
    poster: 2,
    text: {
      en: 'Curiosity is the fastest way to become someone new.',
      el: 'Η περιέργεια είναι ο πιο γρήγορος τρόπος να γίνεις κάποιος καινούργιος.',
    },
  },
  // Hope
  {
    id: 'q-hope-1',
    category: 'hope',
    poster: 3,
    text: {
      en: 'Even the longest night has a sunrise scheduled.',
      el: 'Ακόμη και η μεγαλύτερη νύχτα έχει προγραμματισμένη ανατολή.',
    },
  },
  {
    id: 'q-hope-2',
    category: 'hope',
    poster: 0,
    text: {
      en: 'This chapter is not the whole story.',
      el: 'Αυτό το κεφάλαιο δεν είναι ολόκληρη η ιστορία.',
    },
  },
  {
    id: 'q-hope-3',
    category: 'hope',
    poster: 4,
    text: {
      en: 'Hope is planting seeds before you can see the garden.',
      el: 'Η ελπίδα είναι να φυτεύεις σπόρους πριν μπορέσεις να δεις τον κήπο.',
    },
  },
  {
    id: 'q-hope-4',
    category: 'hope',
    poster: 5,
    text: {
      en: 'Hard seasons end. Keep a small light on for what comes next.',
      el: 'Οι δύσκολες εποχές τελειώνουν. Κράτα ένα μικρό φως αναμμένο για ό,τι έρχεται.',
    },
  },
];

/* -------------------------------------------------------------------------- */
/*  Bible verse paraphrases — 18 passages, 3 per category                      */
/* -------------------------------------------------------------------------- */

export const VERSES: Verse[] = [
  // Faith
  {
    id: 'v-faith-1',
    category: 'faith',
    book: 'hebrews',
    chapter: 11,
    verses: '1',
    text: {
      en: 'Faith is a steady trust in what we hope for, and a quiet certainty about things we cannot yet see.',
      el: 'Η πίστη είναι σταθερή εμπιστοσύνη σε όσα ελπίζουμε και ήρεμη βεβαιότητα για όσα δεν βλέπουμε ακόμη.',
    },
  },
  {
    id: 'v-faith-2',
    category: 'faith',
    book: 'proverbs',
    chapter: 3,
    verses: '5-6',
    text: {
      en: 'Trust with your whole heart, and do not lean only on your own understanding. Keep God in view in everything you do, and he will make your path straight.',
      el: 'Εμπιστεύσου με όλη σου την καρδιά και μη στηρίζεσαι μόνο στη δική σου κρίση. Να έχεις τον Θεό μπροστά σου σε όλα όσα κάνεις, και εκείνος θα ισιώσει τον δρόμο σου.',
    },
  },
  {
    id: 'v-faith-3',
    category: 'faith',
    book: '2corinthians',
    chapter: 5,
    verses: '7',
    text: {
      en: 'We make our way through life guided by trust, not only by what our eyes can see.',
      el: 'Προχωρούμε στη ζωή οδηγούμενοι από την εμπιστοσύνη, όχι μόνο από όσα βλέπουν τα μάτια μας.',
    },
  },
  // Strength
  {
    id: 'v-strength-1',
    category: 'strength',
    book: 'isaiah',
    chapter: 40,
    verses: '31',
    text: {
      en: 'Those who wait on the Lord find their strength made new. They rise as though on the wings of eagles; they run and do not tire, they walk and do not grow faint.',
      el: 'Όσοι περιμένουν τον Κύριο βρίσκουν τη δύναμή τους ανανεωμένη. Υψώνονται σαν με φτερά αετού, τρέχουν χωρίς να κουράζονται, περπατούν χωρίς να λιποψυχούν.',
    },
  },
  {
    id: 'v-strength-2',
    category: 'strength',
    book: 'philippians',
    chapter: 4,
    verses: '13',
    text: {
      en: 'Whatever I face, I can find the strength for it through Christ, who gives me power.',
      el: 'Σε ό,τι κι αν αντιμετωπίσω, βρίσκω δύναμη μέσα από τον Χριστό, που με ενδυναμώνει.',
    },
  },
  {
    id: 'v-strength-3',
    category: 'strength',
    book: '2corinthians',
    chapter: 12,
    verses: '9',
    text: {
      en: 'God’s kindness is enough for you, because strength shows itself most clearly where we are weak.',
      el: 'Η χάρη του Θεού σού αρκεί, γιατί η δύναμη φανερώνεται πιο καθαρά εκεί όπου εμείς είμαστε αδύναμοι.',
    },
  },
  // Hope
  {
    id: 'v-hope-1',
    category: 'hope',
    book: 'jeremiah',
    chapter: 29,
    verses: '11',
    text: {
      en: 'I know the plans I have for you, says the Lord: plans for your good and not for harm, to give you a future and a hope.',
      el: 'Ξέρω τα σχέδια που έχω για σένα, λέει ο Κύριος: σχέδια για το καλό σου και όχι για το κακό, για να σου δώσω μέλλον και ελπίδα.',
    },
  },
  {
    id: 'v-hope-2',
    category: 'hope',
    book: 'romans',
    chapter: 15,
    verses: '13',
    text: {
      en: 'May the God of hope fill you with joy and peace as you trust him, until hope overflows within you.',
      el: 'Είθε ο Θεός της ελπίδας να σε γεμίσει χαρά και ειρήνη καθώς τον εμπιστεύεσαι, ώσπου η ελπίδα να ξεχειλίσει μέσα σου.',
    },
  },
  {
    id: 'v-hope-3',
    category: 'hope',
    book: 'lamentations',
    chapter: 3,
    verses: '22-23',
    text: {
      en: 'God’s faithful love never runs out, and his mercies never come to an end. They begin again every morning; great is his faithfulness.',
      el: 'Η πιστή αγάπη του Θεού δεν εξαντλείται και η ευσπλαχνία του δεν τελειώνει. Ξαναρχίζουν κάθε πρωί· μεγάλη είναι η πιστότητά του.',
    },
  },
  // Peace
  {
    id: 'v-peace-1',
    category: 'peace',
    book: 'john',
    chapter: 14,
    verses: '27',
    text: {
      en: 'Peace is what I leave with you; my own peace I give to you. I do not give as the world gives. Do not let your hearts be troubled or afraid.',
      el: 'Ειρήνη αφήνω σε εσάς· τη δική μου ειρήνη σας δίνω. Δεν τη δίνω όπως την δίνει ο κόσμος. Μην ταράζεται και μη φοβάται η καρδιά σας.',
    },
  },
  {
    id: 'v-peace-2',
    category: 'peace',
    book: 'philippians',
    chapter: 4,
    verses: '6-7',
    text: {
      en: 'Do not be anxious about anything. Bring every need to God with prayer and thanks, and the peace of God, beyond all understanding, will keep watch over your heart and mind.',
      el: 'Μην αγχώνεστε για τίποτα. Φέρτε κάθε ανάγκη στον Θεό με προσευχή και ευχαριστία, και η ειρήνη του Θεού, που ξεπερνά κάθε κατανόηση, θα φυλάει την καρδιά και τον νου σας.',
    },
  },
  {
    id: 'v-peace-3',
    category: 'peace',
    book: 'isaiah',
    chapter: 26,
    verses: '3',
    text: {
      en: 'You keep in steady peace the one whose mind rests on you, because that person trusts in you.',
      el: 'Φυλάς σε σταθερή ειρήνη εκείνον που ο νους του στηρίζεται σε σένα, γιατί σε εμπιστεύεται.',
    },
  },
  // Courage
  {
    id: 'v-courage-1',
    category: 'courage',
    book: 'joshua',
    chapter: 1,
    verses: '9',
    text: {
      en: 'Be strong and brave. Do not be afraid or lose heart, for the Lord your God is with you wherever you go.',
      el: 'Να είσαι δυνατός και θαρραλέος. Μη φοβάσαι και μη λυγίζεις, γιατί ο Κύριος ο Θεός σου είναι μαζί σου όπου κι αν πας.',
    },
  },
  {
    id: 'v-courage-2',
    category: 'courage',
    book: 'deuteronomy',
    chapter: 31,
    verses: '6',
    text: {
      en: 'Be strong and take courage; do not be afraid of them. The Lord your God goes with you, and he will not leave you or let you down.',
      el: 'Να είσαι δυνατός και θαρραλέος· μη τους φοβάσαι. Ο Κύριος ο Θεός σου πορεύεται μαζί σου και δεν θα σε αφήσει ούτε θα σε εγκαταλείψει.',
    },
  },
  {
    id: 'v-courage-3',
    category: 'courage',
    book: 'isaiah',
    chapter: 41,
    verses: '10',
    text: {
      en: 'Do not be afraid, for I am with you. Do not be dismayed, for I am your God. I will strengthen you and help you.',
      el: 'Μη φοβάσαι, γιατί είμαι μαζί σου. Μην αποθαρρύνεσαι, γιατί εγώ είμαι ο Θεός σου. Θα σε ενδυναμώσω και θα σε βοηθήσω.',
    },
  },
  // Gratitude
  {
    id: 'v-gratitude-1',
    category: 'gratitude',
    book: '1thessalonians',
    chapter: 5,
    verses: '16-18',
    text: {
      en: 'Rejoice always, pray without ceasing, and give thanks in every circumstance. This is what God hopes for you in Christ Jesus.',
      el: 'Χαίρεστε πάντοτε, προσεύχεστε αδιάλειπτα και ευχαριστείτε σε κάθε περίσταση. Αυτό είναι που θέλει ο Θεός για σας εν Χριστώ Ιησού.',
    },
  },
  {
    id: 'v-gratitude-2',
    category: 'gratitude',
    book: '1chronicles',
    chapter: 16,
    verses: '34',
    text: {
      en: 'Give thanks to the Lord, for he is good; his steadfast love lasts for ever.',
      el: 'Ευχαριστείτε τον Κύριο, γιατί είναι αγαθός· η σταθερή αγάπη του διαρκεί για πάντα.',
    },
  },
  {
    id: 'v-gratitude-3',
    category: 'gratitude',
    book: 'colossians',
    chapter: 3,
    verses: '15',
    text: {
      en: 'Let the peace of Christ rule in your hearts, for you were called into it as one body. And be thankful.',
      el: 'Αφήστε την ειρήνη του Χριστού να βασιλεύει στις καρδιές σας, γιατί σε αυτήν καλεστήκατε ως ένα σώμα. Και να είστε ευγνώμονες.',
    },
  },
];

export const quoteById = new Map(QUOTES.map((q) => [q.id, q]));
export const verseById = new Map(VERSES.map((v) => [v.id, v]));

export function verseReference(v: Verse, lang: Lang): string {
  return `${BOOK_NAMES[v.book][lang]} ${v.chapter}:${v.verses}`;
}
