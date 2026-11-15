import type { LegalDocument } from "./types";

export const cookiePolicy: LegalDocument = {
  slug: "cookie-policy",
  audience: "general",
  title: {
    en: "Cookie & Storage Policy",
    ro: "Politica de cookie-uri și stocare",
  },
  shortTitle: { en: "Cookies", ro: "Cookie-uri" },
  description: {
    en: "The cookies, local storage and app storage Zavoia uses, and how you accept or reject analytics cookies.",
    ro: "Cookie-urile, stocarea locală și stocarea din aplicații folosite de Zavoia, și cum acceptați sau refuzați cookie-urile de analiză.",
  },
  status: "published",
  effectiveDate: "2026-11-15",
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
            en: "Zavoia uses cookies (small files placed in your browser), browser storage (localStorage/sessionStorage) and — in the mobile applications — native app storage, including push-notification tokens. This policy covers all of these technologies together, because the law treats them the same way: storing or reading information on your device requires either strict necessity or your consent.",
            ro: "Zavoia folosește cookie-uri (fișiere mici plasate în browser), stocare în browser (localStorage/sessionStorage) și — în aplicațiile mobile — stocare nativă în aplicație, inclusiv token-uri pentru notificări push. Această politică acoperă toate aceste tehnologii împreună, pentru că legea le tratează la fel: stocarea sau citirea informațiilor pe dispozitivul dumneavoastră este permisă doar dacă este strict necesară sau dacă v-ați dat consimțământul.",
          },
        },
      ],
    },
    {
      id: "consent",
      blueprintRef: "L506/2004 art. 4",
      title: { en: "How consent works", ro: "Cum funcționează consimțământul" },
      summary: {
        en: "Analytics loads only after you accept.",
        ro: "Instrumentul de analiză se încarcă doar după ce acceptați.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "When you first visit, no analytics or advertising technology is loaded. Analytics loads only if you choose “Accept” in the cookie banner; “Reject” is offered just as prominently. You can change your choice at any time from the “Cookie settings” link in the site footer, in the account menu or in the footer of a business website — withdrawing consent is as easy as giving it, and rejecting deletes the analytics cookies already set. Your browser's settings are a useful complement — usually under privacy or site settings, you can delete cookies and stored site data or block third-party cookies — but the banner is the consent mechanism.",
            ro: "La prima vizită, nu se încarcă nicio tehnologie de analiză sau de publicitate. Instrumentul de analiză se încarcă doar dacă alegeți „Accept” în bannerul de cookie-uri; „Refuz” este oferit la fel de vizibil. Vă puteți schimba alegerea oricând din linkul „Setări cookie-uri”, aflat în subsolul site-ului, în meniul contului sau în subsolul site-ului unei afaceri — retragerea consimțământului este la fel de simplă ca acordarea lui, iar refuzul șterge cookie-urile de analiză deja plasate. Setările browserului sunt o completare utilă — de obicei în secțiunea de confidențialitate sau în setările site-urilor, puteți șterge cookie-urile și datele stocate de site-uri ori bloca cookie-urile terților — dar bannerul este mecanismul de consimțământ.",
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
            en: "These keep the service working and secure: signing you in and keeping your session, protecting against cross-site request forgery, remembering your cookie choice and delivering the notifications you allowed. They cannot be switched off, because the features they support cannot work without them. Each entry below shows the name, the type of storage, who sets it, what it does and how long it is kept.",
            ro: "Acestea mențin serviciul funcțional și sigur: autentificarea și menținerea sesiunii, protecția împotriva falsificării cererilor (CSRF), reținerea alegerii privind cookie-urile și livrarea notificărilor pe care le-ați permis. Nu pot fi dezactivate, pentru că funcțiile pe care le susțin nu pot funcționa fără ele. Fiecare intrare de mai jos arată numele, tipul de stocare, cine o plasează, ce face și cât timp este păstrată.",
          },
        },
        {
          kind: "p",
          text: { en: "On www.zavoia.com:", ro: "Pe www.zavoia.com:" },
        },
        {
          kind: "list",
          items: {
            en: [
              "zw-consent · cookie · Zavoia · remembers whether you accepted or rejected analytics · 12 months",
              "customerRefreshToken · cookie, not readable by scripts · Zavoia · keeps you signed in to your account · 1 day, renewed while you stay signed in",
              "customerCsrfToken · cookie · Zavoia · protects your account against cross-site request forgery · 1 day, renewed while you stay signed in",
              "googleOAuth · session storage · Zavoia · secures a Google sign-in while you go to Google and back · until the sign-in finishes, or you close the tab",
              "Google sign-in cookies · cookies on accounts.google.com · Google · set by Google only when you sign in with Google, under Google's privacy policy · as set by Google",
              "Apple sign-in cookies · cookies on appleid.apple.com · Apple · set by Apple only when you sign in with Apple, under Apple's privacy policy · as set by Apple",
            ],
            ro: [
              "zw-consent · cookie · Zavoia · reține dacă ați acceptat sau ați refuzat analiza · 12 luni",
              "customerRefreshToken · cookie inaccesibil scripturilor · Zavoia · vă menține autentificat în cont · 1 zi, reînnoit cât timp rămâneți autentificat",
              "customerCsrfToken · cookie · Zavoia · vă protejează contul împotriva falsificării cererilor (CSRF) · 1 zi, reînnoit cât timp rămâneți autentificat",
              "googleOAuth · stocare de sesiune · Zavoia · securizează autentificarea cu Google cât timp mergeți la Google și înapoi · până se finalizează autentificarea sau până închideți fila",
              "Cookie-uri de autentificare Google · cookie-uri pe accounts.google.com · Google · plasate de Google doar când vă autentificați cu Google, conform politicii de confidențialitate Google · cât stabilește Google",
              "Cookie-uri de autentificare Apple · cookie-uri pe appleid.apple.com · Apple · plasate de Apple doar când vă autentificați cu Apple, conform politicii de confidențialitate Apple · cât stabilește Apple",
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "On app.zavoia.com, the business dashboard:",
            ro: "Pe app.zavoia.com, panoul pentru afaceri:",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "refreshToken · cookie, not readable by scripts · Zavoia · keeps you signed in · 1 day, renewed while you stay signed in",
              "csrfToken · cookie · Zavoia · protects your account against cross-site request forgery · 1 day, renewed while you stay signed in",
              "oauthCodeProcessed, oauthLastCode, oauthRedirected, oauthContext, oauthMode, oauthReturnTo, linkContext, googleLoginNoAccount, postLinkToast, postLinkToastType · session storage · Zavoia · completes a Google sign-in or account link exactly once and shows its result · until you close the tab",
              "Google sign-in cookies · cookies on accounts.google.com · Google · as on www.zavoia.com",
              "Apple sign-in cookies · cookies on appleid.apple.com · Apple · as on www.zavoia.com",
            ],
            ro: [
              "refreshToken · cookie inaccesibil scripturilor · Zavoia · vă menține autentificat · 1 zi, reînnoit cât timp rămâneți autentificat",
              "csrfToken · cookie · Zavoia · vă protejează contul împotriva falsificării cererilor (CSRF) · 1 zi, reînnoit cât timp rămâneți autentificat",
              "oauthCodeProcessed, oauthLastCode, oauthRedirected, oauthContext, oauthMode, oauthReturnTo, linkContext, googleLoginNoAccount, postLinkToast, postLinkToastType · stocare de sesiune · Zavoia · finalizează o singură dată autentificarea sau conectarea contului cu Google și afișează rezultatul · până închideți fila",
              "Cookie-uri de autentificare Google · cookie-uri pe accounts.google.com · Google · la fel ca pe www.zavoia.com",
              "Cookie-uri de autentificare Apple · cookie-uri pe appleid.apple.com · Apple · la fel ca pe www.zavoia.com",
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "In the Zavoia and Zavoia Admin apps:",
            ro: "În aplicațiile Zavoia și Zavoia Admin:",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "Sign-in tokens · app storage · Zavoia · keep you signed in (the Zavoia app keeps them in the device's secure storage: iOS Keychain or Android Keystore) · until you sign out or delete the app",
              "Push-notification token · app storage · Zavoia, delivered through Expo (Zavoia app) or Google Firebase Cloud Messaging (Zavoia Admin app) · sends booking notifications to your device; created only after you allow notifications · until you turn notifications off or delete the app",
            ],
            ro: [
              "Token-uri de autentificare · stocare în aplicație · Zavoia · vă mențin autentificat (aplicația Zavoia le păstrează în stocarea securizată a dispozitivului: iOS Keychain sau Android Keystore) · până vă deconectați sau ștergeți aplicația",
              "Token pentru notificări push · stocare în aplicație · Zavoia, livrat prin Expo (aplicația Zavoia) sau Google Firebase Cloud Messaging (aplicația Zavoia Admin) · trimite notificări despre programări pe dispozitiv; creat doar după ce permiteți notificările · până dezactivați notificările sau ștergeți aplicația",
            ],
          },
        },
      ],
    },
    {
      id: "functional",
      title: { en: "Functional", ro: "Funcționale" },
      summary: {
        en: "Saved automatically to make the service easier to use.",
        ro: "Se salvează automat, ca serviciul să fie mai ușor de folosit.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Functional storage makes the service easier to use: it remembers things like your recent searches, the businesses you viewed, your language and display settings, and messages you closed. It is saved automatically because each item is needed for a feature you use, such as your recent searches, your language or the map. None of it is used for advertising, and you can delete it at any time by clearing your browser data or deleting the app.",
            ro: "Stocarea funcțională face serviciul mai ușor de folosit: reține, de exemplu, căutările recente, afacerile vizualizate, limba și setările de afișare și mesajele pe care le-ați închis. Se salvează automat pentru că fiecare element este necesar pentru o funcție pe care o folosiți, de exemplu căutările recente, limba sau harta. Niciun element nu este folosit pentru publicitate, iar stocarea poate fi ștearsă oricând, prin ștergerea datelor browserului sau a aplicației.",
          },
        },
        {
          kind: "p",
          text: { en: "On www.zavoia.com:", ro: "Pe www.zavoia.com:" },
        },
        {
          kind: "list",
          items: {
            en: [
              "zw-recent-searches, zw-recent-locations, zw-recent-locations-v · local storage · Zavoia · your last 6 searches and last 5 locations, so you can repeat them · until you clear your browser data",
              "zw-recent-views · local storage · Zavoia · the last 10 businesses you viewed · until you clear your browser data",
              "zv-loc-skip · local storage · Zavoia · remembers that you chose “Not now” when asked for your location · until you clear your browser data",
              "zv.auth.lastDisplayName:v1 · local storage · Zavoia · shows your name and profile photo in the header while the page loads · until you sign out",
              "mc-anno-dismissed · local storage · Zavoia · remembers that you closed a business website's announcement bar · until you clear your browser data",
              "mapbox.eventData… · local storage · Mapbox · set by the map whenever a map is shown; Mapbox uses it to count map usage · until you clear your browser data",
            ],
            ro: [
              "zw-recent-searches, zw-recent-locations, zw-recent-locations-v · stocare locală · Zavoia · ultimele 6 căutări și ultimele 5 locații, ca să le puteți repeta · până ștergeți datele browserului",
              "zw-recent-views · stocare locală · Zavoia · ultimele 10 afaceri vizualizate · până ștergeți datele browserului",
              "zv-loc-skip · stocare locală · Zavoia · reține că ați ales „Mai târziu” când vi s-a cerut locația · până ștergeți datele browserului",
              "zv.auth.lastDisplayName:v1 · stocare locală · Zavoia · afișează numele și fotografia de profil în antet cât se încarcă pagina · până vă deconectați",
              "mc-anno-dismissed · stocare locală · Zavoia · reține că ați închis bara de anunțuri a site-ului unei afaceri · până ștergeți datele browserului",
              "mapbox.eventData… · stocare locală · Mapbox · plasată de hartă de fiecare dată când este afișată o hartă; Mapbox o folosește pentru a contoriza utilizarea hărții · până ștergeți datele browserului",
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "On app.zavoia.com and in the Zavoia Admin app:",
            ro: "Pe app.zavoia.com și în aplicația Zavoia Admin:",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "zavoia.language, theme · local storage · Zavoia · your language and light or dark theme · until you clear your browser data",
              "calendar_pref_*, sidebar_state, zavoia_calendar_selected_location, zavoia_dashboard_selected_location, zavoia_marketplace_active_location, zavoia_assignments_selected_location · local storage · Zavoia · calendar view settings, the sidebar state and the location last selected on each screen · until you clear your browser data",
              "zavoia.pushPrimer.v1 · local storage · Zavoia · whether you have already seen the notifications prompt · until you clear your browser data",
              "zv_splash_played · session storage, Zavoia Admin app only · Zavoia · shows the opening animation only once each time you open the app · until you close the app",
              "zavoia:website-builder-preview-device, zavoia:business-page-section-preview, zavoia.websiteVariantCart.*, zavoia.websiteSectionCart.*, zavoia.websiteThemeAssetCart.*, zavoia.websiteCheckoutIntent.*, mc-anno-dismissed · local storage · Zavoia · Web Studio preview settings and the styles in your cart · until you clear your browser data",
            ],
            ro: [
              "zavoia.language, theme · stocare locală · Zavoia · limba și tema deschisă sau închisă · până ștergeți datele browserului",
              "calendar_pref_*, sidebar_state, zavoia_calendar_selected_location, zavoia_dashboard_selected_location, zavoia_marketplace_active_location, zavoia_assignments_selected_location · stocare locală · Zavoia · setările de afișare ale calendarului, starea barei laterale și locația selectată ultima dată pe fiecare ecran · până ștergeți datele browserului",
              "zavoia.pushPrimer.v1 · stocare locală · Zavoia · dacă ați văzut deja solicitarea pentru notificări · până ștergeți datele browserului",
              "zv_splash_played · stocare de sesiune, doar în aplicația Zavoia Admin · Zavoia · afișează animația de deschidere doar o dată la fiecare pornire a aplicației · până închideți aplicația",
              "zavoia:website-builder-preview-device, zavoia:business-page-section-preview, zavoia.websiteVariantCart.*, zavoia.websiteSectionCart.*, zavoia.websiteThemeAssetCart.*, zavoia.websiteCheckoutIntent.*, mc-anno-dismissed · stocare locală · Zavoia · setările de previzualizare din Web Studio și stilurile din coș · până ștergeți datele browserului",
            ],
          },
        },
        {
          kind: "p",
          text: { en: "In the Zavoia app:", ro: "În aplicația Zavoia:" },
        },
        {
          kind: "list",
          items: {
            en: [
              "locale-storage, location-storage, recent-searches, recently-visited-storage · app storage · Zavoia · your language, your chosen city and recent locations, your recent searches and the businesses you visited recently · until you delete the app",
              "push-registration, push-primer, push:lastHandledResponse · app storage · Zavoia · your notification registration, whether you have seen the notifications prompt, and the last notification you opened · until you delete the app",
            ],
            ro: [
              "locale-storage, location-storage, recent-searches, recently-visited-storage · stocare în aplicație · Zavoia · limba, orașul ales și locațiile recente, căutările recente și afacerile vizitate recent · până ștergeți aplicația",
              "push-registration, push-primer, push:lastHandledResponse · stocare în aplicație · Zavoia · înregistrarea pentru notificări, dacă ați văzut solicitarea pentru notificări și ultima notificare deschisă · până ștergeți aplicația",
            ],
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
            en: "The only analytics tool is Google Analytics 4 (provided by Google Ireland Limited), used on www.zavoia.com only. It loads only after you choose “Accept” in the cookie banner and measures how the website is used: the pages visited, approximate location, device and browser type, and how you arrived. It sets the cookies _ga and _ga_<ID>, which identify your browser to Google Analytics for up to 2 years; if you later choose “Reject”, they are deleted. The business dashboard and the Zavoia and Zavoia Admin apps do not include analytics tools.",
            ro: "Singurul instrument de analiză este Google Analytics 4 (furnizat de Google Ireland Limited), folosit doar pe www.zavoia.com. Se încarcă doar după ce alegeți „Accept” în bannerul de cookie-uri și măsoară modul în care este folosit site-ul: paginile vizitate, locația aproximativă, tipul de dispozitiv și de browser și modul în care ați ajuns pe site. Plasează cookie-urile _ga și _ga_<ID>, care identifică browserul dumneavoastră în Google Analytics timp de până la 2 ani; dacă alegeți ulterior „Refuz”, acestea sunt șterse. Panoul pentru afaceri și aplicațiile Zavoia și Zavoia Admin nu includ instrumente de analiză.",
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
            en: "Zavoia does not use advertising or cross-site tracking pixels. If this ever changes, we will update this policy and ask for your consent through the banner before any advertising technology loads.",
            ro: "Zavoia nu folosește pixeli de publicitate sau urmărire între site-uri. Dacă acest lucru se schimbă vreodată, vom actualiza această politică și vă vom cere consimțământul prin banner înainte ca orice tehnologie publicitară să se încarce.",
          },
        },
      ],
    },
  ],
};
