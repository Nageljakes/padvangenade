/* Pad van Genade — interface strings.
   Every user-visible label lives here so switching language never leaves a
   stray English word on an Afrikaans page. Content (topics, verses) is
   bilingual in the data bundle; this file is only the chrome around it. */

export const LANGS = ["af", "en"];

/* Creator credit. One definition, used by both the footer and the About page,
   so the name and the link can never drift apart. */
export const CREATOR = {
  name: "jaxtech",
  url: "https://nageljakes.github.io/jaxtechweb",
  label: {
    af: "Gemaak deur",
    en: "Created by",
  },
  blurb: {
    af: "Pad van Genade is gebou deur jaxtech vir Suid-Afrikaanse Christene wat 'n regte plek soek om te bid, te lees en hulp te vind.",
    en: "Path of Grace was built by jaxtech for South African Christians looking for a real place to read, to pray, and to find help.",
  },
};

export const STRINGS = {
  af: {
    dir: "ltr",
    locale: "af-ZA",
    htmlLang: "af",

    skipToContent: "Gaan na hoofinhoud",
    brand: "Pad van Genade",
    tagline: "’n Plek om te breek en weer op te staan.",
    mastEyebrow: "Gratis · Geen rekening · Werk sonder internet",
    mastTag:
      "Skrifte, gebed en ’n volgende stap vir elke stryd — en altyd ’n werklike weg na hulp.",
    offlineBadge: "Jy is aflyn",

    navToday: "Vandag",
    navStruggle: "Waarmee worstel jy?",
    navJournal: "My joernaal",
    navHelp: "Kry hulp",
    navShare: "Deel",
    navAbout: "Oor",

    todayVerseFor: "Vers vir vandag",
    todayIntro:
      "Lees die vers. Hou dit ’n oomblik stil. Bid as jy wil. En kies net een praktiese stap vir vandag.",
    nextVerse: "Nog ’n vers",
    backToToday: "Terug na vandag se vers",
    tellMeWhat: "Vertel my waarmee jy worstel",
    dayOf: "dag",
    streak: "Reeks",

    struggleHeading: "Kies wat die naaste aan jou voel.",
    struggleIntro:
      "Geen oordeel nie. Kies net die een wat vandag vir jou die swaarste is.",
    searchLabel: "Soek",
    searchPlaceholder: "Woede, angs, skuld, douker…",
    searchNone: "Niks gevind nie. Probeer ’n ander woord.",
    filterAll: "Alles",
    filterSaved: "Gestoor",
    savedBadge: "Gestoor",

    readAloud: "Lees hardop",
    showOther: "Wys die Engelse teks",
    whatSays: "Wat dit sê",
    prayer: "Gebed",
    step: "Vandag se stap",
    saveTopic: "Stoor",
    savedTopic: "Gestoor",
    writeHere: "Skryf hieroor in die joernaal",
    prev: "Vorige",
    next: "Volgende",
    verseOf: "Van",
    stepHelp: "Hulp wanneer jy dit doen",

    helpHeading: "Kry hulp",
    helpIntro:
      "Hierdie webwerf is ’n geestelike hulpmiddel. Dit is nie ’n plaasvervanger vir ’n dokter, sielkundige of berader nie. As jy in gevaar is, bel 112 of 10111.",
    emergencyHeading: "As jy nou onmiddellike hulp nodig het",
    helpMe: "Ek het onmiddellike hulp nodig",
    helpSomeone: "Ek maak oor iemand wat ek ken",
    helpNote: "Noodnommers is vir Suid-Afrika. Bel 112 vanaf enige foon.",
    verified: "Geverifieer",
    kindOfficial: "Amptelik",
    kindNgo: "Vrywilligersorganisasie",

    journalHeading: "My joernaal",
    journalIntro:
      "Alles bly op hierdie toestel. Niks word na ’n bediener gestuur nie, en niemand anders kan dit lees nie.",
    journalLabel: "Jou inskrywing",
    journalPlaceholder: "Skryf hier sonder oordag…",
    saveEntry: "Stoor",
    saved: "Gestoor op hierdie toestel",
    delete: "Skoonmaak",
    export: "Laai my joernaal af",
    promptsHeading: "Nie weet waar om te begin nie?",
    prompts: [
      "Wat is vandag vir my die swaarste?",
      "Wat het ek vandag reg gedoen?",
      "Vir wie moet ek vandag bid?",
      "Waar het ek hierdie week in vergewe?",
      "Wat is die een stap wat ek vandag kan neem?",
    ],
    entrySaved: "Gestoor",
    confirmDelete: "Skoonmaak hierdie inskrywing? Dit kan nie ongedaan gemaak word nie.",
    noEntries: "Nog geen inskrywings nie.",

    shareHeading: "Deel met iemand",
    shareIntro: "Soms is iemand wat saam met jou worstel wat jy self nie kan dra nie.",
    sharePrayer: "Gebedskaart", 
    shareCardVerse: "Verskaart", 
    shareCardHelp: "Hulpkaart",
    shareCopy: "Kopieer",
    shareCopied: "Gekopieer",
    shareWhatsApp: "Deel op WhatsApp",
    shareSms: "SMS",

    aboutHeading: "Oor Pad van Genade",
    aboutWhat: "Wat dit is",
    aboutSources: "Waar die Skrifte vandaan kom",
    aboutPrivacy: "Jou privaatheid",
    aboutLimits: "Wat dit nie is nie",
    aboutImages: "Beelde",
    aboutWho: "Wie het dit gemaak",
    imageBy: "Foto:",

    footerNote:
      "Pad van Genade bied Skrif, gebed en ’n praktiese stap. Dit vervang nie mediese of sielkundige hulp nie. In ’n noodgeval bel 112.",
    footerNoteEn:
      "Pad van Genade offers Scripture, prayer and a practical step. It does not replace medical or mental health care. In an emergency dial 112.",
    rights: "Vry om te gebruik en te deel.",
  },

  en: {
    dir: "ltr",
    locale: "en-ZA",
    htmlLang: "en",

    skipToContent: "Skip to main content",
    brand: "Path of Grace",
    tagline: "A place to break, and to get back up.",
    mastEyebrow: "Free · No account · Works offline",
    mastTag:
      "Scripture, prayer and a practical step for every struggle — and always a real way to get help.",
    offlineBadge: "You are offline",

    navToday: "Today",
    navStruggle: "What are you facing?",
    navJournal: "My journal",
    navHelp: "Get help",
    navShare: "Share",
    navAbout: "About",

    todayVerseFor: "Verse for today",
    todayIntro:
      "Read the verse. Sit with it a moment. Pray if you want to. Then choose just one practical step for today.",
    nextVerse: "Another verse",
    backToToday: "Back to today's verse",
    tellMeWhat: "Tell me what you are facing",
    dayOf: "day",
    streak: "Streak",

    struggleHeading: "Choose what feels closest to you.",
    struggleIntro:
      "No judgement. Pick the one that is hardest for you today.",
    searchLabel: "Search",
    searchPlaceholder: "Anger, anxiety, debt, doubt…",
    searchNone: "Nothing found. Try another word.",
    filterAll: "All",
    filterSaved: "Saved",
    savedBadge: "Saved",

    readAloud: "Read aloud",
    showOther: "Show the other text",
    whatSays: "What this says",
    prayer: "Prayer",
    step: "Today's step",
    saveTopic: "Save",
    savedTopic: "Saved",
    writeHere: "Write about this in the journal",
    prev: "Previous",
    next: "Next",
    verseOf: "of",
    stepHelp: "Help while you do this",

    helpHeading: "Get help",
    helpIntro:
      "This site is a spiritual resource. It does not replace a doctor, psychologist or counsellor. If you are in danger, dial 112 or 10111.",
    emergencyHeading: "If you need help right now",
    helpMe: "I need help right now",
    helpSomeone: "I am worried about someone I know",
    helpNote: "Numbers are for South Africa. Dial 112 from any phone.",
    verified: "Verified",
    kindOfficial: "Official",
    kindNgo: "Voluntary organisation",

    journalHeading: "My journal",
    journalIntro:
      "Everything stays on this device. Nothing is sent to a server, and nobody else can read it.",
    journalLabel: "Your entry",
    journalPlaceholder: "Write here, without editing…",
    saveEntry: "Save",
    saved: "Saved on this device",
    delete: "Delete",
    export: "Download my journal",
    promptsHeading: "Not sure where to start?",
    prompts: [
      "What is hardest for me today?",
      "What did I get right today?",
      "Who should I pray for today?",
      "Where did I go wrong this week?",
      "What is the one step I can take today?",
    ],
    entrySaved: "Saved",
    confirmDelete: "Delete this entry? This cannot be undone.",
    noEntries: "No entries yet.",

    shareHeading: "Share with someone",
    shareIntro: "Sometimes the person who can help is the one you call — and they may be struggling too.",
    sharePrayer: "Prayer card",
    shareCardVerse: "Verse card",
    shareCardHelp: "Help card",
    shareCopy: "Copy",
    shareCopied: "Copied",
    shareWhatsApp: "Share on WhatsApp",
    shareSms: "SMS",

    aboutHeading: "About Path of Grace",
    aboutWhat: "What this is",
    aboutSources: "Where the Scripture comes from",
    aboutPrivacy: "Your privacy",
    aboutLimits: "What this is not",
    aboutImages: "Images",
    aboutWho: "Who made this",
    imageBy: "Photo:",

    footerNote:
      "Path of Grace offers Scripture, prayer and a practical step. It does not replace medical or mental health care. In an emergency dial 112.",
    rights: "Free to use and share.",
  },
};

/* Prose blocks for the About page, kept here so they stay translatable. */
export const ABOUT = {
  af: {
    what: [
      "Pad van Genade is ’n hulpmiddel vir Christene wat tans hard moet worstel. Dit kies nie vir jou in nie — jy kies vir jouself, en dit is die helerede.",
      "Elke onderwerp volg dieselfde patroon: ’n Skrifpassage, ’n kort verduideliking, ’n gebed en een praktiese stap vir vandag. Die doel is nie om jou oortuig nie, maar om jou te help om die volgende, moontlike, klein stap te neem.",
      "As jy vandag net een ding doen kan, maak dit een praktiese stap en ’n gebed. Dis al genoeg.",
    ],
    privacy: [
      "Hierdie webwerf het geen bediener, geen rekening en geen analities nie.",
      "Jou joernaal, gestoorde onderwerpe en leesvordering word slegs in jou blaaier se plaaslike geheue gestoor. Dit word nooit na enige bediener gestuur nie, en ons kan dit nie sien nie.",
      "Omdat alles plaaslik is, kan jy dit ook van hier af vee. Jou private data is nooit op ons se bedieners nie.",
    ],
    limits: [
      "Hierdie webwerf is nie ’n geestelike werker, adviseur of mediese diens nie, en die plaaslike nommers kan ons nie bel nie.",
      "As jy dink aan selfbeskadiging, of jy iemand ken wat dink aan selfbeskadiging, moet jy vandag met iemand praat. Bel Lifeline op 0861 322 322 of die Suid-Afrikaanse Selfmoordkrisislyn op 0800 567 567. In ’n noodgeval bel 112.",
      "Hierdie webwerf gebruik slegs Skrifture wat vry beskikbaar is in die openbare domein. Die Skrif is God se Woord — hierdie bladsye is net ’n hulpmiddel.",
    ],
  },
  en: {
    what: [
      "Path of Grace is a resource for Christians who are having a hard time. It does not choose for you — you choose, and that is the whole point.",
      "Every topic follows the same pattern: a Scripture passage, a short explanation, a prayer, and one practical step for today. The aim is not to convince you of anything, but to help you take the next, possible, small step.",
      "If you can only do one thing today, make it one practical step and one prayer. That is enough.",
    ],
    privacy: [
      "This site has no server, no account and no analytics.",
      "Your journal, saved topics and reading history are stored only in your browser's local storage. Nothing is ever sent to a server, and we cannot see it.",
      "Because everything is local, you can clear it from here at any time. Your private data has never been on our servers.",
    ],
    limits: [
      "This site is not a pastor, counsellor or medical service, and it cannot call these numbers for you.",
      "If you are thinking of harming yourself, or you know someone who is, please talk to someone today. Call Lifeline on 0861 322 322 or the South African Suicide Crisis Helpline on 0800 567 567. In an emergency dial 112.",
      "This site uses only Scripture that is freely available in the public domain. Scripture is God's word — these pages are only a tool.",
    ],
  },
};