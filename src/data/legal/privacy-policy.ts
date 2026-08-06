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
  status: "draft",
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
            en: "The company identified on the Company Information page operates the Zavoia platform and is the data controller for the processing described in this notice, except where this notice says a business on the platform is the controller. For privacy matters, contact us at [privacy email].",
            ro: "Societatea identificată pe pagina Informații despre companie operează platforma Zavoia și este operatorul de date pentru prelucrările descrise în această politică, cu excepția cazurilor în care această politică arată că o afacere de pe platformă este operatorul. Pentru aspecte de confidențialitate, contactați-ne la [email confidențialitate].",
          },
        },
        {
          kind: "note",
          text: {
            en: "GATES: entity details (D1) and privacy contact address pending. DPO designation must be decided: bookings at health-related venues may amount to large-scale processing of art. 9 data, which would make a DPO mandatory (GDPR art. 37) — counsel question.",
            ro: "GATE-uri: datele entității (D1) și adresa de contact pentru confidențialitate sunt în curs. Desemnarea unui DPO trebuie decisă: programările la unități din domeniul sănătății pot constitui prelucrare pe scară largă de date art. 9, ceea ce ar face DPO-ul obligatoriu (art. 37 GDPR) — întrebare pentru avocați.",
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
              "Zavoia as processor (on behalf of a business): client records and appointment details a business enters or manages in its own workspace — for that data, the business is the controller and this processing is governed by our Data Processing Addendum with the business. Requests about such records are routed to the business.",
              "When you book through the marketplace, your booking details become part of the business's client records too — from that point the business is an independent controller of its copy, under its own privacy practices.",
            ],
            ro: [
              "Zavoia ca operator independent: contul și identitatea dumneavoastră, programările din marketplace, recenziile, favoritele, notificările, securitatea, conversațiile de asistență și operarea și îmbunătățirea platformei.",
              "Zavoia ca persoană împuternicită (în numele unei afaceri): evidențele de clienți și detaliile programărilor pe care o afacere le introduce sau gestionează în propriul spațiu de lucru — pentru aceste date, afacerea este operatorul, iar prelucrarea este guvernată de Acordul nostru de prelucrare a datelor cu afacerea. Cererile privind aceste evidențe sunt direcționate către afacere.",
              "Când faceți o programare prin marketplace, detaliile programării devin și parte din evidențele de clienți ale afacerii — din acel moment, afacerea este operator independent al copiei sale, conform propriilor practici de confidențialitate.",
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
              "Visitors: technical data (IP address, device and browser information), pages visited, and approximate location if you use location-based search.",
              "Customer accounts: name, email, phone number, profile photo, date of birth and address if you provide them; sign-in method (email or Google); your bookings, favourites, reviews and notification preferences.",
              "Bookings: the venue, services, professional, time, price snapshot at booking, and status history.",
              "Guest support: the contact details and content you submit when you contact support without an account.",
              "Business users: workspace, role, and the professional profile information the business or the professional publishes.",
            ],
            ro: [
              "Vizitatori: date tehnice (adresa IP, informații despre dispozitiv și browser), paginile vizitate și locația aproximativă dacă folosiți căutarea pe bază de locație.",
              "Conturi de client: nume, email, număr de telefon, fotografie de profil, data nașterii și adresa dacă le furnizați; metoda de autentificare (email sau Google); programările, favoritele, recenziile și preferințele de notificare.",
              "Programări: unitatea, serviciile, profesionistul, ora, prețul înregistrat la momentul programării și istoricul stărilor.",
              "Asistență pentru vizitatori: datele de contact și conținutul trimis când contactați asistența fără cont.",
              "Utilizatori business: spațiul de lucru, rolul și informațiile de profil profesional publicate de afacere sau de profesionist.",
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
              "Transactional messages (booking confirmations, changes, reminders) — performance of our contract with you (the Marketplace Customer Terms).",
              "Security, fraud prevention and abuse protection — legitimate interest (art. 6(1)(f)).",
              "Support and complaint handling — performance of our contract with you / legitimate interest.",
              "Legal obligations — compliance (art. 6(1)(c)), for example accounting and fiscal records.",
              "Marketing — only with your consent, per channel (art. 6(1)(a)); see the Marketing section.",
              "Product analytics and improvement — [legal basis to be finalised with the D5 purpose map: legitimate interest with opt-out, or consent].",
            ],
            ro: [
              "Funcționarea contului și a funcțiilor platformei pe care le solicitați — inclusiv transmiterea cererii de programare către afacere și păstrarea istoricului programărilor — executarea contractului nostru cu dumneavoastră, respectiv Termenii pentru clienți (art. 6(1)(b) GDPR). Acel acord privește utilizarea Zavoia; nu este contractul de servicii pe care îl încheiați direct cu afacerea.",
              "Mesaje tranzacționale (confirmări de programare, modificări, memento-uri) — executarea contractului nostru cu dumneavoastră (Termenii pentru clienți).",
              "Securitate, prevenirea fraudei și protecția împotriva abuzurilor — interes legitim (art. 6(1)(f)).",
              "Asistență și soluționarea reclamațiilor — executarea contractului nostru cu dumneavoastră / interes legitim.",
              "Obligații legale — conformare (art. 6(1)(c)), de exemplu evidențe contabile și fiscale.",
              "Marketing — doar cu consimțământul dumneavoastră, pe fiecare canal (art. 6(1)(a)); vezi secțiunea Marketing.",
              "Analiza și îmbunătățirea produsului — [temei de finalizat odată cu harta scopurilor D5: interes legitim cu drept de opoziție, sau consimțământ].",
            ],
          },
        },
        {
          kind: "note",
          text: {
            en: "GATE D5 (blueprint B2): the account's classification (and the analytics/personalization legal bases) requires the purpose-by-purpose data map before this section can be finalised. GATE D12: DAC7 platform reporting is deliberately NOT listed as a legal-obligation purpose — the decisions doc records it as an unresolved tax classification; add it (with CNP/CUI collection) only if the tax memo confirms Zavoia is a reporting platform operator.",
            ro: "GATE D5 (blueprint B2): clasificarea contului (și temeiurile pentru analiză/personalizare) necesită harta scopurilor de prelucrare înainte ca această secțiune să poată fi finalizată. GATE D12: raportarea DAC7 a platformei NU este listată deliberat ca scop de obligație legală — documentul de decizii o înregistrează ca o clasificare fiscală nerezolvată; adăugați-o (cu colectarea CNP/CUI) doar dacă memo-ul fiscal confirmă că Zavoia este operator de platformă cu obligație de raportare.",
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
            en: "A booking at certain venues — for example medical, dental, psychology, physiotherapy or laboratory practices — can by itself suggest information about your health. We treat such booking data with heightened protection: access is limited to what is needed to operate your booking, and notification and email content is being reviewed under our health-data assessment so the venue type is not needlessly exposed.",
            ro: "O programare la anumite unități — de exemplu cabinete medicale, stomatologice, de psihologie, fizioterapie sau laboratoare — poate sugera, prin ea însăși, informații despre sănătatea dumneavoastră. Tratăm aceste date de programare cu protecție sporită: accesul este limitat la ce este necesar pentru operarea programării, iar conținutul notificărilor și al emailurilor este în curs de revizuire în cadrul evaluării noastre privind datele de sănătate, pentru ca tipul unității să nu fie expus inutil.",
          },
        },
        {
          kind: "note",
          text: {
            en: "GATE D7 (blueprint — the largest special-category exposure): the dedicated art. 9 assessment (legal basis, staff access scoping, retention, deletion, notification content) is not yet done. This section's final text depends on it; do not publish before the assessment concludes.",
            ro: "GATE D7 (blueprint — cea mai mare expunere la categorii speciale): evaluarea dedicată art. 9 (temei legal, limitarea accesului personalului, păstrare, ștergere, conținutul notificărilor) nu este încă realizată. Textul final al acestei secțiuni depinde de ea; nu publicați înainte de finalizarea evaluării.",
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
            en: "We send marketing messages only if you opted in, separately for each channel (email, SMS, push). You can withdraw consent at any time from your notification settings or the unsubscribe link in each message. Transactional messages — booking confirmations, changes and cancellations — are part of the service and are not affected by marketing preferences.",
            ro: "Trimitem mesaje de marketing doar dacă v-ați exprimat acordul, separat pentru fiecare canal (email, SMS, push). Puteți retrage consimțământul oricând din setările de notificări sau din linkul de dezabonare din fiecare mesaj. Mesajele tranzacționale — confirmări, modificări și anulări de programări — fac parte din serviciu și nu sunt afectate de preferințele de marketing.",
          },
        },
        {
          kind: "note",
          text: {
            en: "IMPL + GATE D15: marketing preference defaults are currently stored as true in the product and must be flipped, and already-stored rows need a re-consent/migration strategy before any marketing sender is built. This text describes the compliant target state.",
            ro: "IMPL + GATE D15: valorile implicite ale preferințelor de marketing sunt în prezent true în produs și trebuie inversate, iar înregistrările existente necesită o strategie de re-consimțământ/migrare înainte de a construi orice sistem de trimitere. Acest text descrie starea țintă conformă.",
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
            en: "Search results are ordered by relevance to your query, distance, rating and recency, with labelled fallback orderings when few results match. Homepage and category sections use their own orderings (for example newest first, or by review count or rating), shown on each section. Payment has no influence on ranking. We do not make decisions with legal or similarly significant effects about you by purely automated means.",
            ro: "Rezultatele căutării sunt ordonate după relevanța față de căutare, distanță, rating și recență, cu ordonări de rezervă etichetate când puține rezultate se potrivesc. Pagina principală și secțiunile de categorii folosesc propriile ordonări (de exemplu cele mai noi, după numărul de recenzii sau după rating), afișate pe fiecare secțiune. Plata nu influențează ierarhizarea. Nu luăm decizii cu efecte juridice sau similar semnificative despre dumneavoastră prin mijloace exclusiv automate.",
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
            en: "When you book, the business receives your booking details (name, contact, services, time) to perform the appointment. Beyond that, we share data only with the service providers that run the platform, each engaged for a defined purpose:",
            ro: "Când faceți o programare, afacerea primește detaliile programării (nume, contact, servicii, ora) pentru a presta serviciul. Dincolo de aceasta, partajăm date doar cu furnizorii de servicii care susțin platforma, fiecare pentru un scop definit:",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "Infrastructure and content delivery: Cloudflare (including R2 media storage), AWS.",
              "Email delivery: AWS SES. SMS delivery: Twilio. Push notifications: Firebase (business apps), Expo (consumer app).",
              "Task scheduling: Google Cloud Tasks. Sign-in with Google: Google OAuth.",
              "Maps and location: Mapbox. Marketing-site content: Sanity.",
              "For business customers only — subscription payments: Stripe; invoicing: Oblio.",
              "Professional advisers, authorities where the law requires it, and — in a corporate transaction — prospective acquirers under confidentiality.",
            ],
            ro: [
              "Infrastructură și livrarea conținutului: Cloudflare (inclusiv stocarea media R2), AWS.",
              "Trimiterea emailurilor: AWS SES. Trimiterea SMS-urilor: Twilio. Notificări push: Firebase (aplicațiile business), Expo (aplicația pentru clienți).",
              "Programarea sarcinilor: Google Cloud Tasks. Autentificare cu Google: Google OAuth.",
              "Hărți și locație: Mapbox. Conținutul site-ului de marketing: Sanity.",
              "Doar pentru clienții business — plăți de abonament: Stripe; facturare: Oblio.",
              "Consultanți profesioniști, autorități unde legea o cere și — într-o tranzacție corporativă — potențiali cumpărători, sub confidențialitate.",
            ],
          },
        },
        {
          kind: "note",
          text: {
            en: "Per blueprint A10, each vendor's role (processor vs independent controller) must be classified per service and the verified list published — vendors are not automatically sub-processors. The list above reflects the July 2026 capabilities audit; re-verify at publication.",
            ro: "Conform blueprint A10, rolul fiecărui furnizor (persoană împuternicită vs operator independent) trebuie clasificat per serviciu, iar lista verificată publicată — furnizorii nu sunt automat subîmputerniciți. Lista de mai sus reflectă auditul de capabilități din iulie 2026; reverificați la publicare.",
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
            en: "Some of our vendors process data outside the European Economic Area (for example in the United States). Where that happens, transfers rely on an adequacy decision, the EU–US Data Privacy Framework for certified providers, or the 2021 EU Standard Contractual Clauses, with supplementary measures where needed. You can request details of the safeguard applying to a specific vendor.",
            ro: "Unii dintre furnizorii noștri prelucrează date în afara Spațiului Economic European (de exemplu în Statele Unite). În aceste cazuri, transferurile se bazează pe o decizie de adecvare, pe cadrul EU–US Data Privacy Framework pentru furnizorii certificați sau pe Clauzele Contractuale Standard UE din 2021, cu măsuri suplimentare unde este necesar. Puteți solicita detalii despre garanția aplicabilă unui anumit furnizor.",
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
            en: "We keep personal data only as long as needed for the purpose it was collected for, then delete or anonymize it. Indicatively: account data for the life of the account; booking records [period — align with the 3-year general limitation period and fiscal obligations]; support conversations [period]; security logs [period]. When you delete your account, your profile is removed; [what happens to reviews and booking history — decision pending].",
            ro: "Păstrăm datele personale doar cât este necesar scopului pentru care au fost colectate, apoi le ștergem sau le anonimizăm. Orientativ: datele contului pe durata contului; evidențele programărilor [perioadă — de aliniat cu termenul general de prescripție de 3 ani și obligațiile fiscale]; conversațiile de asistență [perioadă]; jurnalele de securitate [perioadă]. Când vă ștergeți contul, profilul este eliminat; [ce se întâmplă cu recenziile și istoricul programărilor — decizie în curs].",
          },
        },
        {
          kind: "note",
          text: {
            en: "The concrete retention schedule (per category) and the review-persistence-after-deletion policy are business decisions not yet made — complete before publication.",
            ro: "Calendarul concret de păstrare (pe categorii) și politica privind păstrarea recenziilor după ștergerea contului sunt decizii de business încă neluate — de finalizat înainte de publicare.",
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
            en: "You have the right to access your data, correct it, delete it, restrict or object to processing, receive a portable copy, and withdraw any consent (without affecting past processing). Write to [privacy email] or use your account settings; we respond within one month, extendable by two months for complex requests, and we will tell you if an extension is needed. Where your request concerns records controlled by a business (their client records about you), we forward it to that business and tell you we did.",
            ro: "Aveți dreptul de acces la date, rectificare, ștergere, restricționare sau opoziție la prelucrare, portabilitate și retragerea oricărui consimțământ (fără a afecta prelucrările anterioare). Scrieți la [email confidențialitate] sau folosiți setările contului; răspundem în termen de o lună, prelungibil cu două luni pentru cereri complexe, și vă vom anunța dacă este necesară o prelungire. Când cererea privește evidențe controlate de o afacere (evidențele ei de client despre dumneavoastră), o transmitem acelei afaceri și vă informăm că am făcut-o.",
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
        en: "Internal complaints and ANSPDCP.",
        ro: "Plângeri interne și ANSPDCP.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "If you believe we handled your data incorrectly, contact us first and we will investigate and respond. You also have the right to lodge a complaint with the Romanian supervisory authority: Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP), B-dul G-ral Gheorghe Magheru 28-30, Bucharest — dataprotection.ro.",
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
