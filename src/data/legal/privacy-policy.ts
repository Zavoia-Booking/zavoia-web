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
            en: "TNT VENTURES SRL (CUI 48718430), identified on the Company Information page, operates the Zavoia platform and is the data controller for the processing described in this notice, except where this notice says a business on the platform is the controller. For privacy matters, contact us at support@zavoia.com.",
            ro: "TNT VENTURES SRL (CUI 48718430), identificată pe pagina Informații despre companie, operează platforma Zavoia și este operatorul de date pentru prelucrările descrise în această politică, cu excepția cazurilor în care această politică arată că o afacere de pe platformă este operatorul. Pentru aspecte de confidențialitate, contactați-ne la support@zavoia.com.",
          },
        },
        {
          kind: "note",
          text: {
            en: "GATES (updated 11 Nov 2026): entity confirmed as TNT VENTURES SRL, CUI 48718430, privacy contact support@zavoia.com; the remaining company details (Trade Register number, registered office) go on the Company Information page. Still open: DPO designation — bookings at health-related venues may amount to large-scale processing of art. 9 data, which would make a DPO mandatory (GDPR art. 37), and processing CNPs for DAC7 on legitimate interest (rather than a legal obligation) would also require one (Legea 190/2018 art. 4) — counsel question.",
            ro: "GATE-uri (actualizat 11 nov. 2026): entitatea confirmată este TNT VENTURES SRL, CUI 48718430, iar contactul pentru confidențialitate este support@zavoia.com; restul datelor societății (numărul de înregistrare la Registrul Comerțului, sediul social) se completează pe pagina Informații despre companie. Rămâne deschis: desemnarea unui DPO — programările la unități din domeniul sănătății pot constitui prelucrare pe scară largă de date art. 9, ceea ce ar face DPO-ul obligatoriu (art. 37 GDPR), iar prelucrarea CNP-urilor pentru DAC7 pe temei de interes legitim (și nu de obligație legală) ar impune, de asemenea, un DPO (Legea 190/2018 art. 4) — întrebare pentru avocați.",
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
              "Website analytics (Google Analytics, on www.zavoia.com only) — only with your consent (art. 6(1)(a)), given and withdrawn in the cookie banner; see the Cookie & Storage Notice.",
              "EU platform tax reporting (DAC7) — for businesses that complete bookings through Zavoia, we record the business's identification details (name, CUI or, for individuals, CNP, VAT and registration numbers, date of birth, address and contact details) and the list prices of completed bookings — [legal basis to be confirmed by the tax memo: legal obligation (art. 6(1)(c)) if Zavoia is a reporting platform operator]. These records are kept after account deletion for the period required by tax law.",
            ],
            ro: [
              "Funcționarea contului și a funcțiilor platformei pe care le solicitați — inclusiv transmiterea cererii de programare către afacere și păstrarea istoricului programărilor — executarea contractului nostru cu dumneavoastră, respectiv Termenii pentru clienți (art. 6(1)(b) GDPR). Acel acord privește utilizarea Zavoia; nu este contractul de servicii pe care îl încheiați direct cu afacerea.",
              "Mesaje tranzacționale (confirmări de programare, modificări, memento-uri) — executarea contractului nostru cu dumneavoastră (Termenii pentru clienți).",
              "Securitate, prevenirea fraudei și protecția împotriva abuzurilor — interes legitim (art. 6(1)(f)).",
              "Asistență și soluționarea reclamațiilor — executarea contractului nostru cu dumneavoastră / interes legitim.",
              "Obligații legale — conformare (art. 6(1)(c)), de exemplu evidențe contabile și fiscale.",
              "Marketing — doar cu consimțământul dumneavoastră, pe fiecare canal (art. 6(1)(a)); vezi secțiunea Marketing.",
              "Analiza site-ului (Google Analytics, doar pe www.zavoia.com) — doar cu consimțământul dumneavoastră (art. 6(1)(a)), acordat și retras din bannerul de cookie-uri; vezi Politica de cookie-uri și stocare.",
              "Raportarea fiscală a platformelor în UE (DAC7) — pentru afacerile care au programări finalizate prin Zavoia, înregistrăm datele de identificare ale afacerii (denumire, CUI sau, pentru persoane fizice, CNP, cod de TVA și număr de înregistrare, data nașterii, adresa și datele de contact) și prețurile de listă ale programărilor finalizate — [temei legal de confirmat prin memo-ul fiscal: obligație legală (art. 6(1)(c)) dacă Zavoia este operator de platformă cu obligație de raportare]. Aceste evidențe sunt păstrate după ștergerea contului, pe perioada impusă de legislația fiscală.",
            ],
          },
        },
        {
          kind: "note",
          text: {
            en: "GATE D5 (blueprint B2): the account's classification and any personalisation legal basis still need the purpose-by-purpose data map. The analytics item now states the real setup (GA4 on the website only, consent-gated). GATE D12 (re-verified 11 Nov 2026): the DAC7 item was added because the processing already runs whatever the tax memo concludes — since 6 Aug 2026 the API records every completed marketplace booking (one row per service) and a yearly seller snapshot, including CNP and date of birth when the owner provides them, and keeps both after account deletion (dac7.service.ts). The memo must settle the bracketed basis. If Zavoia is not a reporting platform operator, counsel must confirm another basis or stop collecting — Legea 190/2018 art. 4 restricts CNP processing on legitimate interest. Also add the DAC7 data to “The data we process” and the tax-law period to the retention section.",
            ro: "GATE D5 (blueprint B2): clasificarea contului și orice temei pentru personalizare necesită în continuare harta scopurilor de prelucrare. Punctul despre analiză descrie acum configurația reală (GA4 doar pe site, condiționat de consimțământ). GATE D12 (re-verificat 11 nov. 2026): punctul DAC7 a fost adăugat pentru că prelucrarea are deja loc, indiferent de concluzia memo-ului fiscal — din 6 aug. 2026, API-ul înregistrează fiecare programare finalizată din marketplace (un rând per serviciu) și un instantaneu anual al vânzătorului, inclusiv CNP și data nașterii când proprietarul le furnizează, și le păstrează pe ambele după ștergerea contului (dac7.service.ts). Memo-ul trebuie să stabilească temeiul dintre paranteze. Dacă Zavoia nu este operator de platformă cu obligație de raportare, avocații trebuie să confirme alt temei sau colectarea trebuie oprită — Legea 190/2018 art. 4 restricționează prelucrarea CNP pe temei de interes legitim. Adăugați de asemenea datele DAC7 în „Datele pe care le prelucrăm” și termenul fiscal în secțiunea de păstrare.",
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
            en: "Depending on the search, results are ordered by how closely a business name matches what you typed, by distance from you, or by rating and how recently the business joined; when nothing matches, labelled recommendations are shown instead. Homepage sections use their own orderings — random, by distance, rotating daily, or by rating. The homepage section “Made with Web Studio” shows only businesses whose plan includes a published website (currently Plus); apart from that section, payment has no influence on ranking. The full description is in the Marketplace Provider Terms. We do not make decisions with legal or similarly significant effects about you by purely automated means.",
            ro: "În funcție de căutare, rezultatele sunt ordonate după cât de bine se potrivește numele unei afaceri cu ce ați tastat, după distanța față de dumneavoastră sau după rating și cât de recent s-a înscris afacerea; când nimic nu corespunde, sunt afișate în schimb recomandări etichetate. Secțiunile paginii principale folosesc propriile ordonări — aleatorie, după distanță, cu rotire zilnică sau după rating. Secțiunea „Site-uri create cu Web Studio” de pe pagina principală afișează doar afacerile al căror plan include un site publicat (în prezent Plus); în afara acestei secțiuni, plata nu influențează ierarhizarea. Descrierea completă se află în Termenii pentru furnizorii din marketplace. Nu luăm decizii cu efecte juridice sau similar semnificative despre dumneavoastră prin mijloace exclusiv automate.",
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
              "Hosting and infrastructure: Google Cloud Run (our API), Supabase (our database), Vercel (the website and the business dashboard), Cloudflare (network, content delivery and R2 media storage).",
              "Email delivery: Amazon Web Services (SES, with SNS for delivery and bounce notifications). SMS delivery: Twilio. Push notifications: Google Firebase Cloud Messaging (Zavoia Admin app), Expo (Zavoia app). App updates: Expo EAS Update.",
              "Task scheduling: Google Cloud Tasks. Sign-in with Google: Google OAuth.",
              "Maps: Mapbox (map tiles and map usage data). Place search and address lookup: MapTiler (the place names you type and the coordinates looked up). Approximate location from your IP address: ipwho.is — used only to centre the map on your city when you have not granted precise location. Fonts on business websites and in the Web Studio: Google Fonts (your browser loads them from Google's servers). Website analytics, only with your consent: Google Analytics. Marketing-site content: Sanity.",
              "For business customers only — subscription payments: Stripe; invoicing: Oblio.",
              "Professional advisers, authorities where the law requires it, and — in a corporate transaction — prospective acquirers under confidentiality.",
            ],
            ro: [
              "Găzduire și infrastructură: Google Cloud Run (API-ul nostru), Supabase (baza noastră de date), Vercel (site-ul și panoul pentru afaceri), Cloudflare (rețea, livrarea conținutului și stocarea media R2).",
              "Trimiterea emailurilor: Amazon Web Services (SES, cu SNS pentru notificările de livrare și de respingere). Trimiterea SMS-urilor: Twilio. Notificări push: Google Firebase Cloud Messaging (aplicația Zavoia Admin), Expo (aplicația Zavoia). Actualizările aplicației: Expo EAS Update.",
              "Programarea sarcinilor: Google Cloud Tasks. Autentificare cu Google: Google OAuth.",
              "Hărți: Mapbox (dalele hărții și datele de utilizare a hărții). Căutarea locurilor și a adreselor: MapTiler (numele de locuri pe care le tastați și coordonatele căutate). Locație aproximativă după adresa IP: ipwho.is — folosită doar pentru a centra harta pe orașul dumneavoastră când nu ați acordat acces la locația precisă. Fonturi pe site-urile afacerilor și în Web Studio: Google Fonts (browserul le încarcă de pe serverele Google). Analiza site-ului, doar cu consimțământul dumneavoastră: Google Analytics. Conținutul site-ului de marketing: Sanity.",
              "Doar pentru clienții business — plăți de abonament: Stripe; facturare: Oblio.",
              "Consultanți profesioniști, autorități unde legea o cere și — într-o tranzacție corporativă — potențiali cumpărători, sub confidențialitate.",
            ],
          },
        },
        {
          kind: "note",
          text: {
            en: "Vendor list re-verified against the code on 11 Nov 2026: added Cloud Run, Supabase, Vercel, Google Analytics, Google Fonts, Expo EAS Update and AWS SNS; “AWS” as storage was wrong (media is on Cloudflare R2; AWS is used only for SES, SNS and STS credentials). Still open per blueprint A10: classify each vendor's role (processor vs independent controller) per service before publishing — vendors are not automatically sub-processors. SendGrid and amqplib are installed in admin-api but never used; keep them off this list, or remove them.",
            ro: "Lista furnizorilor re-verificată în cod pe 11 nov. 2026: au fost adăugați Cloud Run, Supabase, Vercel, Google Analytics, Google Fonts, Expo EAS Update și AWS SNS; „AWS” pentru stocare era greșit (fișierele media sunt pe Cloudflare R2; AWS este folosit doar pentru SES, SNS și credențiale STS). Rămâne deschis, conform blueprint A10: clasificați rolul fiecărui furnizor (persoană împuternicită vs operator independent) pentru fiecare serviciu înainte de publicare — furnizorii nu sunt automat subîmputerniciți. SendGrid și amqplib sunt instalate în admin-api, dar nu sunt folosite niciodată; nu le adăugați pe listă sau eliminați-le.",
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
            en: "The concrete retention schedule (per category) and the review-persistence-after-deletion policy are business decisions not yet made — complete before publication. Note (11 Nov 2026): account deletion today hard-deletes a customer's bookings and reviews, and the published account-deletion page says so — the decision here must match that, or the code and that page must change.",
            ro: "Calendarul concret de păstrare (pe categorii) și politica privind păstrarea recenziilor după ștergerea contului sunt decizii de business încă neluate — de finalizat înainte de publicare. Notă (11 nov. 2026): ștergerea contului elimină astăzi definitiv programările și recenziile clientului, iar pagina publicată despre ștergerea contului spune acest lucru — decizia de aici trebuie să corespundă, altfel trebuie schimbate codul și acea pagină.",
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
