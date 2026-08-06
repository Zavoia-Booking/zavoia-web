import type { LegalDocument } from "./types";

export const cookiePolicy: LegalDocument = {
  slug: "cookie-policy",
  audience: "general",
  title: {
    en: "Cookie & Storage Notice",
    ro: "Politica de cookie-uri și stocare",
  },
  shortTitle: { en: "Cookies", ro: "Cookie-uri" },
  description: {
    en: "The cookies, local storage and app storage Zavoia uses, and how you give and withdraw consent for each category.",
    ro: "Cookie-urile, stocarea locală și stocarea din aplicații folosite de Zavoia, și cum acordați și retrageți consimțământul pentru fiecare categorie.",
  },
  status: "draft",
  sections: [
    {
      id: "what-we-use",
      blueprintRef: "doc 9 / gate D14",
      title: { en: "What we use", ro: "Ce folosim" },
      summary: {
        en: "Cookies, browser storage and native app storage.",
        ro: "Cookie-uri, stocare în browser și stocare în aplicațiile native.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Zavoia uses cookies (small files placed in your browser), browser storage (localStorage/sessionStorage) and — in the mobile applications — native app storage, including push-notification tokens. This notice covers all of these technologies together, because the law treats them the same way: storing or reading information on your device requires either strict necessity or your consent.",
            ro: "Zavoia folosește cookie-uri (fișiere mici plasate în browser), stocare în browser (localStorage/sessionStorage) și — în aplicațiile mobile — stocare nativă în aplicație, inclusiv token-uri pentru notificări push. Această politică acoperă toate aceste tehnologii împreună, pentru că legea le tratează la fel: stocarea sau citirea informațiilor pe dispozitivul dumneavoastră necesită fie necesitate strictă, fie consimțământul dumneavoastră.",
          },
        },
        {
          kind: "note",
          text: {
            en: "GATE D14 (blueprint): the exact inventory below must be produced by a runtime audit of the DEPLOYED website and apps (not the repository) before publication. Do not publish this page with placeholder tables.",
            ro: "GATE D14 (blueprint): inventarul exact de mai jos trebuie stabilit printr-un audit al site-ului și aplicațiilor EFECTIV PUBLICATE (nu al codului sursă) înainte de publicare. Nu publicați această pagină cu tabele necompletate.",
          },
        },
      ],
    },
    {
      id: "consent",
      blueprintRef: "L506/2004 art. 4",
      title: { en: "How consent works", ro: "Cum funcționează consimțământul" },
      summary: {
        en: "Non-essential categories load only after you consent.",
        ro: "Categoriile neesențiale se încarcă doar după consimțământ.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "When you first visit, only strictly necessary storage is active. Everything else loads only if you agree in the consent banner, per category. You can change your mind at any time from the cookie settings link in the footer — withdrawing consent is as easy as giving it. Your browser's cookie controls are a useful complement, but the banner is the consent mechanism.",
            ro: "La prima vizită, este activă doar stocarea strict necesară. Restul se încarcă doar dacă sunteți de acord în bannerul de consimțământ, pe fiecare categorie. Vă puteți răzgândi oricând din linkul de setări cookie din subsol — retragerea consimțământului este la fel de simplă ca acordarea lui. Controalele din browser sunt o completare utilă, dar bannerul este mecanismul de consimțământ.",
          },
        },
        {
          kind: "note",
          text: {
            en: "IMPL: a consent banner with per-category choices and a persistent settings link does not currently exist and must be built before this notice can be published. Romanian law (Legea 506/2004 art. 4) has no UK-style exemption for analytics — analytics without consent is unlawful.",
            ro: "IMPL: un banner de consimțământ cu opțiuni pe categorii și un link permanent de setări nu există în prezent și trebuie construit înainte ca această politică să poată fi publicată. Legea română (Legea 506/2004 art. 4) nu are o excepție de tip britanic pentru analiză — analiza fără consimțământ este ilegală.",
          },
        },
      ],
    },
    {
      id: "strictly-necessary",
      title: { en: "Strictly necessary", ro: "Strict necesare" },
      summary: {
        en: "Essential storage that needs no consent.",
        ro: "Stocare esențială care nu necesită consimțământ.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "These keep the service working and secure: signing you in and keeping your session, protecting against cross-site request forgery, load balancing and bot protection. They cannot be switched off, because the Site does not function without them.",
            ro: "Acestea mențin serviciul funcțional și sigur: autentificarea și menținerea sesiunii, protecția împotriva falsificării cererilor (CSRF), echilibrarea încărcării și protecția anti-bot. Nu pot fi dezactivate, pentru că Site-ul nu funcționează fără ele.",
          },
        },
        {
          kind: "note",
          text: {
            en: "Insert here the audited table: name · provider · purpose · lifetime, for each necessary cookie/storage key (expected: auth/session tokens, CSRF, Cloudflare, Google OAuth cookies during sign-in — to be confirmed by the D14 runtime audit).",
            ro: "Inserați aici tabelul auditat: nume · furnizor · scop · durată, pentru fiecare cookie/cheie de stocare necesară (estimat: token-uri de autentificare/sesiune, CSRF, Cloudflare, cookie-uri Google OAuth la autentificare — de confirmat prin auditul D14).",
          },
        },
      ],
    },
    {
      id: "functional",
      title: { en: "Functional", ro: "Funcționale" },
      summary: {
        en: "Preferences that improve your experience.",
        ro: "Preferințe care vă îmbunătățesc experiența.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Functional storage remembers choices such as your language (Romanian/English) and interface preferences. These are used only to honour your choices and have realistic lifetimes.",
            ro: "Stocarea funcțională reține alegeri precum limba (română/engleză) și preferințele de interfață. Acestea sunt folosite doar pentru a vă respecta alegerile și au durate de viață rezonabile.",
          },
        },
        {
          kind: "note",
          text: {
            en: "Insert the audited table for functional keys (expected: locale preference; recently-viewed items if stored client-side — to be confirmed by the D14 audit).",
            ro: "Inserați tabelul auditat pentru cheile funcționale (estimat: preferința de limbă; elemente vizualizate recent, dacă sunt stocate pe client — de confirmat prin auditul D14).",
          },
        },
      ],
    },
    {
      id: "analytics",
      title: { en: "Analytics", ro: "Analiză" },
      summary: {
        en: "Measurement, only with consent.",
        ro: "Măsurare, doar cu consimțământ.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "If analytics tools are active on the Site, they load only after you consent to the analytics category, and this section lists each tool, what it measures and how long its identifiers live.",
            ro: "Dacă pe Site sunt active instrumente de analiză, acestea se încarcă doar după ce consimțiți la categoria de analiză, iar această secțiune listează fiecare instrument, ce măsoară și cât trăiesc identificatorii săi.",
          },
        },
        {
          kind: "note",
          text: {
            en: "The D14 runtime audit must establish which analytics (if any) are actually deployed on the production site and apps. List only what is real; if none, state 'no analytics tools are currently used'.",
            ro: "Auditul D14 trebuie să stabilească ce instrumente de analiză (dacă există) sunt efectiv folosite pe site-ul și aplicațiile de producție. Listați doar ce este real; dacă nu există, declarați „în prezent nu folosim instrumente de analiză”.",
          },
        },
      ],
    },
    {
      id: "advertising",
      title: { en: "Advertising", ro: "Publicitate" },
      summary: {
        en: "Current status: none.",
        ro: "Situația actuală: nu folosim.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Zavoia does not use advertising or cross-site tracking pixels. If this ever changes, we will update this notice and ask for your consent through the banner before any advertising technology loads.",
            ro: "Zavoia nu folosește pixeli de publicitate sau urmărire între site-uri. Dacă acest lucru se schimbă vreodată, vom actualiza această politică și vă vom cere consimțământul prin banner înainte ca orice tehnologie publicitară să se încarce.",
          },
        },
        {
          kind: "note",
          text: {
            en: "Statement based on the July 2026 capabilities audit (no ad pixels found in code). Confirm against the D14 runtime audit before publication.",
            ro: "Afirmație bazată pe auditul de capabilități din iulie 2026 (niciun pixel publicitar găsit în cod). Confirmați prin auditul D14 înainte de publicare.",
          },
        },
      ],
    },
  ],
};
