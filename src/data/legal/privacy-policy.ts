import type { LegalDocument } from "./types";

export const privacyPolicy: LegalDocument = {
  slug: "privacy-policy",
  audience: "general",
  title: { en: "Privacy Notice", ro: "Politica de confidențialitate" },
  shortTitle: { en: "Privacy", ro: "Confidențialitate" },
  description: {
    en: "How Zavoia processes personal data — as platform operator and as processor for businesses — including bookings, accounts, marketing and your GDPR rights.",
    ro: "Cum prelucrează Zavoia datele personale — ca operator al platformei și ca persoană împuternicită pentru afaceri — inclusiv programări, conturi, marketing și drepturile dumneavoastră GDPR.",
  },
  status: "published",
  effectiveDate: "2026-11-15",
  sections: [
    {
      id: "controller-contact",
      blueprintRef: "A10 / gate D1",
      title: {
        en: "Who is responsible and how to contact us",
        ro: "Cine este responsabil și cum ne contactați",
      },
      summary: {
        en: "The controller of the Zavoia platform and how to reach us on privacy matters.",
        ro: "Operatorul platformei Zavoia și cum ne contactați pentru aspecte de confidențialitate.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "TNT VENTURES SRL (fiscal code 48718430), identified on the Company Information page, operates the Zavoia platform and is the data controller for the processing described in this notice, except where this notice says a business on the platform is the controller. For privacy matters, contact us at support@zavoia.com.",
            ro: "TNT VENTURES SRL (CUI 48718430), identificată pe pagina Informații despre companie, operează platforma Zavoia și este operatorul de date pentru prelucrările descrise în această politică, cu excepția cazurilor în care această politică arată că o afacere de pe platformă este operatorul. Pentru aspecte de confidențialitate, contactați-ne la support@zavoia.com.",
          },
        },
      ],
    },
    {
      id: "our-roles",
      blueprintRef: "A10",
      title: {
        en: "Our role for each kind of data",
        ro: "Rolul nostru pentru fiecare tip de date",
      },
      summary: {
        en: "Controller for the platform; processor for business-entered client records.",
        ro: "Operator pentru platformă; persoană împuternicită pentru evidențele introduse de afaceri.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Zavoia as independent controller: your account and identity, marketplace bookings, reviews, favourites, notifications, security, support conversations, and operating and improving the platform.",
              "Zavoia as processor (on behalf of a business): the client records, appointment details and team schedules a business enters or manages in its own workspace — for that data, the business is the controller and this processing is governed by our Data Processing Addendum with the business. Requests about such records are routed to the business.",
              "When you book through the marketplace, your booking details also appear in the business's client records, and the business uses them as a controller in its own right, under its own privacy practices, to provide your appointment. They stay there while you have your Zavoia account; if you delete it, they are removed from the business's records too, except records the business created itself.",
            ],
            ro: [
              "Zavoia ca operator independent: contul și identitatea dumneavoastră, programările din marketplace, recenziile, favoritele, notificările, securitatea, conversațiile de asistență și operarea și îmbunătățirea platformei.",
              "Zavoia ca persoană împuternicită (în numele unei afaceri): evidențele de clienți, detaliile programărilor și programul echipei pe care o afacere le introduce sau gestionează în propriul spațiu de lucru — pentru aceste date, afacerea este operatorul, iar prelucrarea este guvernată de Acordul nostru de prelucrare a datelor cu afacerea. Cererile privind aceste evidențe sunt direcționate către afacere.",
              "Când faceți o programare prin marketplace, detaliile programării apar și în evidențele de clienți ale afacerii, iar afacerea le folosește ca operator în nume propriu, conform propriilor practici de confidențialitate, pentru a vă presta serviciul. Ele rămân acolo cât timp aveți cont Zavoia; dacă îl ștergeți, sunt eliminate și din evidențele afacerii, cu excepția celor create chiar de afacere.",
            ],
          },
        },
      ],
    },
    {
      id: "data-we-process",
      title: { en: "The data we process", ro: "Datele pe care le prelucrăm" },
      summary: {
        en: "What we collect, by category of person.",
        ro: "Ce colectăm, pe categorii de persoane.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Visitors: technical data (IP address, device and browser information), pages visited, and location: precise if you allow it in your browser or the app, otherwise approximate, estimated from your IP address.",
              "Customer accounts: name, email, phone number, profile photo, date of birth and address if you provide them; sign-in method (email or Google); your bookings, favourites, reviews, notification preferences, the devices registered for push notifications, and your support requests. Your name, email address and a password (or signing in with Google) are needed to create an account; everything else is optional. Reviews you write are public, with your first name, last-name initial and profile photo, as the Content Policy describes.",
              "Bookings: the venue, services, professional, time, price snapshot at booking, and status history.",
              "Guest support: the contact details and content you submit when you contact support without an account.",
              "Business users: workspace, role, and the professional profile information the business or the professional publishes; for business owners, also subscription and billing details, and the identification details needed for EU platform tax reporting (DAC7) — see Purposes and legal bases.",
            ],
            ro: [
              "Vizitatori: date tehnice (adresa IP, informații despre dispozitiv și browser), paginile vizitate și locația: precisă dacă o permiteți în browser sau în aplicație, altfel aproximativă, estimată după adresa IP.",
              "Conturi de client: nume, email, număr de telefon, fotografie de profil, data nașterii și adresa dacă le furnizați; metoda de autentificare (email sau Google); programările, favoritele, recenziile, preferințele de notificare, dispozitivele înregistrate pentru notificări push și solicitările de asistență. Numele, adresa de email și o parolă (sau autentificarea cu Google) sunt necesare pentru crearea contului; restul este opțional. Recenziile pe care le scrieți sunt publice și afișează prenumele, inițiala numelui de familie și fotografia de profil, după cum descrie Politica de conținut.",
              "Programări: unitatea, serviciile, profesionistul, ora, prețul înregistrat la momentul programării și istoricul stărilor.",
              "Asistență pentru vizitatori: datele de contact și conținutul trimis când contactați asistența fără cont.",
              "Utilizatori din partea afacerilor: spațiul de lucru, rolul și informațiile de profil profesional publicate de afacere sau de profesionist; pentru proprietarii de afaceri, și datele de abonament și facturare, precum și datele de identificare necesare raportării fiscale a platformelor în UE (DAC7) — vezi Scopuri și temeiuri legale.",
            ],
          },
        },
      ],
    },
    {
      id: "purposes-legal-bases",
      title: { en: "Purposes and legal bases", ro: "Scopuri și temeiuri legale" },
      summary: {
        en: "Why we process data and on what legal ground.",
        ro: "De ce prelucrăm datele și pe ce temei legal.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Running your account and the platform features you ask for — including passing your booking request to the business and keeping your booking history — performance of our contract with you, i.e. the Marketplace Customer Terms (GDPR art. 6(1)(b)). That agreement is about your use of Zavoia; it is not the service contract you agree directly with the business.",
              "Business accounts, subscriptions and invoicing — performance of our contract with the business, i.e. the Business Terms (art. 6(1)(b)).",
              "Transactional messages (booking confirmations, changes, reminders) — performance of our contract with you (the Marketplace Customer Terms).",
              "Showing businesses near you — legitimate interest (art. 6(1)(f)) in showing relevant results; we use your precise location only if you allow it, and otherwise estimate it from your IP address.",
              "Security, fraud prevention and abuse protection — legitimate interest (art. 6(1)(f)).",
              "Support and complaint handling — performance of our contract with you / legitimate interest.",
              "Legal obligations — compliance (art. 6(1)(c)), for example accounting and fiscal records.",
              "Marketing — only with your consent, per channel (art. 6(1)(a)); see the Marketing section.",
              "Website analytics (Google Analytics, on www.zavoia.com only) — only with your consent (art. 6(1)(a)), given and withdrawn in the cookie banner; see the Cookie & Storage Policy.",
              "EU platform tax reporting (DAC7) — for businesses that complete bookings through Zavoia, we record the business's identification details (name, fiscal code or, for private individuals, personal numeric code, VAT and registration numbers, date of birth, address and contact details) and the list prices of completed bookings — legal obligation (art. 6(1)(c)) under Council Directive (EU) 2021/514 (DAC7), applied in Romania through the Fiscal Procedure Code. These records are kept after account deletion for the period required by tax law.",
            ],
            ro: [
              "Funcționarea contului și a funcțiilor platformei pe care le solicitați — inclusiv transmiterea cererii de programare către afacere și păstrarea istoricului programărilor — executarea contractului nostru cu dumneavoastră, respectiv Termenii pentru clienți (art. 6(1)(b) GDPR). Acel acord privește utilizarea Zavoia; nu este contractul de servicii pe care îl încheiați direct cu afacerea.",
              "Conturile de afacere, abonamentele și facturarea — executarea contractului nostru cu afacerea, respectiv Termenii pentru afaceri (art. 6(1)(b)).",
              "Mesaje tranzacționale (confirmări de programare, modificări, mementouri) — executarea contractului nostru cu dumneavoastră (Termenii pentru clienți).",
              "Afișarea afacerilor din apropiere — interes legitim (art. 6(1)(f)) de a afișa rezultate relevante; folosim locația precisă doar dacă o permiteți, altfel o estimăm după adresa IP.",
              "Securitate, prevenirea fraudei și protecția împotriva abuzurilor — interes legitim (art. 6(1)(f)).",
              "Asistență și soluționarea reclamațiilor — executarea contractului nostru cu dumneavoastră / interes legitim.",
              "Obligații legale — conformare (art. 6(1)(c)), de exemplu evidențe contabile și fiscale.",
              "Marketing — doar cu consimțământul dumneavoastră, pe fiecare canal (art. 6(1)(a)); vezi secțiunea Marketing.",
              "Analiza site-ului (Google Analytics, doar pe www.zavoia.com) — doar cu consimțământul dumneavoastră (art. 6(1)(a)), acordat și retras din bannerul de cookie-uri; vezi Politica de cookie-uri și stocare.",
              "Raportarea fiscală a platformelor în UE (DAC7) — pentru afacerile care au programări finalizate prin Zavoia, înregistrăm datele de identificare ale afacerii (denumire, CUI sau, pentru persoanele fizice neautorizate, CNP, cod de TVA și număr de înregistrare, data nașterii, adresa și datele de contact) și prețurile de listă ale programărilor finalizate — obligație legală (art. 6(1)(c)) conform Directivei (UE) 2021/514 a Consiliului (DAC7), aplicată în România prin Codul de procedură fiscală. Aceste evidențe sunt păstrate după ștergerea contului, pe perioada impusă de legislația fiscală.",
            ],
          },
        },
      ],
    },
    {
      id: "health-related-bookings",
      blueprintRef: "A10 / gate D7",
      title: {
        en: "Bookings at health-related venues",
        ro: "Programări la unități din domeniul sănătății",
      },
      summary: {
        en: "Extra protection where a booking can reveal health information.",
        ro: "Protecție suplimentară când o programare poate dezvălui informații despre sănătate.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "A booking at a venue in the Health & Medical category — for example a dental or medical clinic, a laboratory, or a physiotherapy or psychology practice — can reveal information about your health. We process such bookings only with your explicit consent (GDPR art. 9(2)(a)), which you give by ticking the box before you confirm, and we record when you gave it. If you book for a minor in your care, you give this consent on their behalf, as their parent or legal guardian. If the business enters an appointment for you itself, for example when you book by phone, there is no tick box: we handle that appointment for the business, under its own legal basis, and we don't ask you to review it. We use this data only for the booking itself: arranging the appointment, showing it in your bookings, reminders, and the review request after a completed visit. Emails about the appointment show the business, the service and the location; SMS and app notifications show only the business and the date and time, plus the reason if the business cancels and gives one. You can withdraw your consent at any time by cancelling the booking or writing to support@zavoia.com; this doesn't affect processing that happened before.",
            ro: "O programare la o unitate din categoria Sănătate & Medical — de exemplu un cabinet stomatologic sau medical, un laborator ori un cabinet de fizioterapie sau psihologie — poate dezvălui informații despre sănătatea dumneavoastră. Prelucrăm astfel de programări doar cu consimțământul dumneavoastră explicit (art. 9(2)(a) GDPR), pe care îl dați bifând caseta înainte de confirmare, iar noi înregistrăm momentul în care l-ați dat. Dacă faceți programarea pentru un minor aflat în grija dumneavoastră, dați acest consimțământ în numele lui, în calitate de părinte sau tutore legal. Dacă afacerea introduce ea însăși o programare pentru dumneavoastră, de exemplu când vă programați telefonic, nu există casetă de bifat: gestionăm acea programare în numele afacerii, pe temeiul ei legal, și nu vă cerem o recenzie pentru ea. Folosim aceste date doar pentru programarea în sine: organizarea ei, afișarea în programările dumneavoastră, mementouri și solicitarea de evaluare după o vizită finalizată. Emailurile despre programare indică afacerea, serviciul și locația; SMS-urile și notificările din aplicație indică doar afacerea, data și ora, precum și motivul anulării, dacă afacerea îl precizează. Vă puteți retrage consimțământul oricând, anulând programarea sau scriind la support@zavoia.com; retragerea nu afectează prelucrarea efectuată înainte.",
          },
        },
      ],
    },
    {
      id: "marketing",
      blueprintRef: "B2 / gate D15",
      title: { en: "Marketing communications", ro: "Comunicări de marketing" },
      summary: {
        en: "Marketing only with prior, per-channel consent.",
        ro: "Marketing doar cu consimțământ prealabil, pe fiecare canal.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "We don't send marketing messages. If we start, we will ask for your consent first, separately for each channel (email, SMS, push), and you will be able to withdraw it from any message. Service messages — booking confirmations, changes, cancellations and reminders, and the request to review a completed appointment — are part of the service and are not marketing.",
            ro: "Nu trimitem mesaje de marketing. Dacă vom începe, vă vom cere mai întâi consimțământul, separat pentru fiecare canal (email, SMS, push), și îl veți putea retrage din orice mesaj. Mesajele de serviciu — confirmările, modificările, anulările și mementourile programărilor, precum și solicitarea de a evalua o programare finalizată — fac parte din serviciu și nu sunt marketing.",
          },
        },
      ],
    },
    {
      id: "ranking-profiling",
      blueprintRef: "B5",
      title: {
        en: "Ranking, recommendations and automated processing",
        ro: "Ierarhizare, recomandări și prelucrare automată",
      },
      summary: {
        en: "How listings are ordered and what personalization exists.",
        ro: "Cum sunt ordonate listările și ce personalizare există.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "How search results and homepage sections are ordered is explained in the Marketplace Customer Terms, under “How results are ordered”. Some orderings use your location — precise if you allow it, otherwise estimated from your IP address — to show businesses near you. Apart from the “Made with Web Studio” section on the website's homepage, payment has no influence on ranking. We do not make decisions with legal or similarly significant effects about you by purely automated means.",
            ro: "Modul în care sunt ordonate rezultatele căutării și secțiunile paginii principale este explicat în Termenii pentru clienți, la „Cum sunt ordonate rezultatele”. Unele ordonări folosesc locația dumneavoastră — precisă dacă o permiteți, altfel estimată după adresa IP — pentru a vă arăta afaceri din apropiere. În afara secțiunii „Site-uri create cu Web Studio” de pe pagina principală a site-ului, plata nu influențează ierarhizarea. Nu luăm decizii bazate exclusiv pe prelucrarea automată care produc efecte juridice asupra dumneavoastră sau vă afectează în mod similar într-o măsură semnificativă.",
          },
        },
      ],
    },
    {
      id: "sharing-vendors",
      blueprintRef: "A10",
      title: { en: "Who we share data with", ro: "Cu cine partajăm datele" },
      summary: {
        en: "Businesses you book with, and our technical vendors.",
        ro: "Afacerile la care faceți programări și furnizorii noștri tehnici.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "When you book, the business receives your booking details (name, contact, services, time) to perform the appointment. Beyond that, we share data only with the recipients below, each for a defined purpose:",
            ro: "Când faceți o programare, afacerea primește detaliile programării (nume, contact, servicii, ora) pentru a presta serviciul. Dincolo de aceasta, partajăm date doar cu destinatarii de mai jos, fiecare pentru un scop definit:",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "Hosting and infrastructure: Google Cloud Run (our API), Supabase (our database), Vercel (the website and the business dashboard), Cloudflare (network protection and content delivery — traffic to our API passes through it — and R2 media storage).",
              "Email delivery: Amazon Web Services (SES, with SNS for delivery and bounce notifications). SMS delivery: Twilio. Push notifications: Google Firebase Cloud Messaging (Zavoia Admin app), Expo (Zavoia app). App updates: Expo EAS Update.",
              "Task scheduling: Google Cloud Tasks. Sign-in with Google: Google OAuth.",
              "Maps: Mapbox (map tiles and map usage data). Place search and address lookup: MapTiler (the place names you type and the coordinates looked up). Approximate location from your IP address: ipwho.is — when precise location is not available, the home page and search use it automatically to estimate your city and show businesses near you. Website analytics, only with your consent: Google Analytics. Marketing-site content: Sanity.",
              "For business customers only — subscription payments: Stripe; invoicing: Oblio.",
              "Professional advisers, authorities where the law requires it, and — in a corporate transaction — prospective acquirers under confidentiality.",
            ],
            ro: [
              "Găzduire și infrastructură: Google Cloud Run (API-ul nostru), Supabase (baza noastră de date), Vercel (site-ul și panoul pentru afaceri), Cloudflare (protecția rețelei și livrarea conținutului — traficul către API-ul nostru trece prin rețeaua sa — și stocarea media R2).",
              "Trimiterea emailurilor: Amazon Web Services (SES, cu SNS pentru notificările de livrare și de respingere). Trimiterea SMS-urilor: Twilio. Notificări push: Google Firebase Cloud Messaging (aplicația Zavoia Admin), Expo (aplicația Zavoia). Actualizările aplicației: Expo EAS Update.",
              "Programarea sarcinilor: Google Cloud Tasks. Autentificare cu Google: Google OAuth.",
              "Hărți: Mapbox (dalele hărții și datele de utilizare a hărții). Căutarea locurilor și a adreselor: MapTiler (numele de locuri pe care le tastați și coordonatele căutate). Locație aproximativă după adresa IP: ipwho.is — când locația precisă nu este disponibilă, prima pagină și căutarea îl folosesc automat pentru a estima orașul dumneavoastră și a vă arăta afaceri din apropiere. Analiza site-ului, doar cu consimțământul dumneavoastră: Google Analytics. Conținutul site-ului de marketing: Sanity.",
              "Doar pentru afaceri — plăți de abonament: Stripe; facturare: Oblio.",
              "Consultanți profesioniști, autorități unde legea o cere și — într-o tranzacție corporativă — potențiali cumpărători, sub confidențialitate.",
            ],
          },
        },
      ],
    },
    {
      id: "international-transfers",
      title: { en: "International transfers", ro: "Transferuri internaționale" },
      summary: {
        en: "Safeguards when data leaves the EEA.",
        ro: "Garanții când datele părăsesc SEE.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Some of our vendors process data outside the European Economic Area (for example in the United States). Where that happens, transfers rely on an adequacy decision, the EU–US Data Privacy Framework for certified providers, binding corporate rules, or the 2021 EU Standard Contractual Clauses, with supplementary measures where needed. You can request details of the safeguard applying to a specific vendor.",
            ro: "Unii dintre furnizorii noștri prelucrează date în afara Spațiului Economic European (de exemplu în Statele Unite). În aceste cazuri, transferurile se bazează pe o decizie de adecvare, pe cadrul UE-SUA privind confidențialitatea datelor (EU–US Data Privacy Framework) pentru furnizorii certificați, pe reguli corporatiste obligatorii sau pe clauzele contractuale standard ale UE din 2021, cu măsuri suplimentare unde este necesar. Puteți solicita detalii despre garanția aplicabilă unui anumit furnizor.",
          },
        },
      ],
    },
    {
      id: "retention",
      title: { en: "How long we keep data", ro: "Cât timp păstrăm datele" },
      summary: {
        en: "Retention aligned with purposes and legal periods.",
        ro: "Păstrare aliniată cu scopurile și termenele legale.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "We keep personal data only as long as we need it for the purpose it was collected for. Your account data — including your bookings, favourites and reviews — is kept for as long as you have your account and is deleted straight away when you delete it, as described on the Deleting your account page. After that we keep only: invoices and payment records for subscriptions, for the period required by accounting and tax law; DAC7 records, for the period required by tax law; support requests you sent as a customer, for as long as we need them to handle the request and any later dispute about it; and database backups, for a short period until they are overwritten. A business's support requests are deleted together with the business. Technical and security logs are kept for a limited period by our hosting providers.",
            ro: "Păstrăm datele personale doar cât avem nevoie de ele pentru scopul în care au fost colectate. Datele contului — inclusiv programările, favoritele și recenziile — sunt păstrate cât timp aveți contul și sunt șterse imediat când îl ștergeți, așa cum este descris pe pagina Ștergerea contului. După aceea păstrăm doar: facturile și evidențele plăților pentru abonamente, pe perioada impusă de legislația contabilă și fiscală; evidențele DAC7, pe perioada impusă de legislația fiscală; solicitările de asistență trimise ca client, cât avem nevoie de ele pentru a rezolva solicitarea și orice dispută ulterioară legată de ea; și copiile de siguranță ale bazei de date, pentru o scurtă perioadă, până când sunt suprascrise. Solicitările de asistență ale unei afaceri sunt șterse odată cu afacerea. Jurnalele tehnice și de securitate sunt păstrate o perioadă limitată de furnizorii noștri de găzduire.",
          },
        },
      ],
    },
    {
      id: "your-rights",
      title: { en: "Your rights", ro: "Drepturile dumneavoastră" },
      summary: {
        en: "Your GDPR rights and how to exercise them.",
        ro: "Drepturile dumneavoastră GDPR și cum le exercitați.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You have the right to access your data, correct it, delete it, restrict or object to processing, receive a portable copy, and withdraw any consent (without affecting past processing). Write to support@zavoia.com or use your account settings; we respond within one month, extendable by two months for complex requests, and we will tell you if an extension is needed. Where your request concerns records controlled by a business (their client records about you), we forward it to that business and tell you we did.",
            ro: "Aveți dreptul de acces la date, rectificare, ștergere, restricționare sau opoziție la prelucrare, portabilitate și retragerea oricărui consimțământ (fără a afecta prelucrările anterioare). Scrieți la support@zavoia.com sau folosiți setările contului; răspundem în termen de o lună, prelungibil cu două luni pentru cereri complexe, și vă vom anunța dacă este necesară o prelungire. Când cererea privește evidențe controlate de o afacere (evidențele ei de client despre dumneavoastră), o transmitem acelei afaceri și vă informăm că am făcut-o.",
          },
        },
      ],
    },
    {
      id: "complaints-authority",
      title: {
        en: "Complaints and the supervisory authority",
        ro: "Plângeri și autoritatea de supraveghere",
      },
      summary: {
        en: "Internal complaints and the supervisory authority (ANSPDCP).",
        ro: "Plângeri interne și ANSPDCP.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "If you believe we handled your data incorrectly, contact us first and we will investigate and respond. You also have the right to lodge a complaint with the Romanian supervisory authority: the National Supervisory Authority for Personal Data Processing (ANSPDCP), B-dul G-ral Gheorghe Magheru 28-30, Bucharest — dataprotection.ro.",
            ro: "Dacă apreciați că v-am prelucrat datele incorect, contactați-ne mai întâi și vom investiga și răspunde. Aveți de asemenea dreptul de a depune o plângere la autoritatea de supraveghere din România: Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), B-dul G-ral Gheorghe Magheru 28-30, București — dataprotection.ro.",
          },
        },
      ],
    },
    {
      id: "changes",
      title: {
        en: "Changes to this notice",
        ro: "Modificări ale acestei politici",
      },
      summary: {
        en: "Versioned updates, notified when significant.",
        ro: "Actualizări versionate, notificate când sunt semnificative.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "We publish each version of this notice with its date. For significant changes we notify account holders through the platform or by email before the change takes effect.",
            ro: "Publicăm fiecare versiune a acestei politici cu data ei. Pentru modificări semnificative, notificăm deținătorii de cont prin platformă sau prin email înainte ca modificarea să intre în vigoare.",
          },
        },
      ],
    },
  ],
};
