import type { LegalDocument } from "./types";

export const customerTerms: LegalDocument = {
  slug: "customer-terms",
  audience: "customer",
  title: {
    en: "Marketplace Customer Terms",
    ro: "Termeni pentru clienți (Marketplace)",
  },
  shortTitle: { en: "Customer terms", ro: "Termeni clienți" },
  description: {
    en: "The terms for discovering businesses and booking appointments on Zavoia — your account, bookings, prices, reviews and your consumer rights.",
    ro: "Termenii pentru descoperirea afacerilor și programarea serviciilor pe Zavoia — contul, programările, prețurile, recenziile și drepturile dumneavoastră de consumator.",
  },
  status: "published",
  effectiveDate: "2026-11-15",
  sections: [
    {
      id: "roles",
      blueprintRef: "B1",
      title: {
        en: "Who we are and what Zavoia does",
        ro: "Cine suntem și ce face Zavoia",
      },
      summary: {
        en: "Zavoia operates the platform; services are provided by independent businesses.",
        ro: "Zavoia operează platforma; serviciile sunt prestate de afaceri independente.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Zavoia (operated by the company on the Company Information page) runs a platform where independent businesses present their services and you can book appointments with them. Zavoia is not the provider of those services. If and when a service contract is concluded, it is between you and the business — Zavoia is not a party to it.",
            ro: "Zavoia (operată de societatea de pe pagina Informații despre companie) administrează o platformă unde afaceri independente își prezintă serviciile și unde puteți face programări la acestea. Zavoia nu este prestatorul acelor servicii. Dacă și când se încheie un contract de servicii, acesta este între dumneavoastră și afacere — Zavoia nu este parte la el.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Zavoia never handles your money. There is no payment step on the platform: we do not collect payments, we do not store card details, and we never charge you anything. Any payment for a service happens directly between you and the business, normally at the venue, by the payment methods the business accepts.",
            ro: "Zavoia nu vă gestionează niciodată banii. Nu există o etapă de plată pe platformă: nu încasăm plăți, nu stocăm date de card și nu vă percepem niciodată nimic. Orice plată pentru un serviciu are loc direct între dumneavoastră și afacere, de regulă la sediul acesteia, prin metodele de plată acceptate de afacere.",
          },
        },
      ],
    },
    {
      id: "your-account",
      blueprintRef: "B2",
      title: { en: "Your account", ro: "Contul dumneavoastră" },
      summary: {
        en: "The customer account is free.",
        ro: "Contul de client este gratuit.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "The customer account is free and gives you bookings, booking history, saved places and reviews. Booking requires an account. You expressly accept these terms by ticking the box when you create your account — or, if you already use Zavoia as a business user, when you add the customer role to that account — including the sections on account restrictions, liability, governing law and courts. You can delete your account at any time from your account settings; what is deleted and what is kept is described on the Deleting your account page.",
            ro: "Contul de client este gratuit și vă oferă programări, istoricul programărilor, locuri salvate și recenzii. Programarea necesită un cont. Acceptați în mod expres acești termeni bifând căsuța la crearea contului — sau, dacă folosiți deja Zavoia în cadrul unei afaceri, la adăugarea rolului de client acelui cont — inclusiv secțiunile privind restricțiile de cont, răspunderea, legea aplicabilă și instanțele competente. Vă puteți șterge contul oricând din setările contului; ce se șterge și ce se păstrează este descris pe pagina Ștergerea contului.",
          },
        },
      ],
    },
    {
      id: "bookings",
      blueprintRef: "B3",
      title: { en: "What a booking means", ro: "Ce înseamnă o programare" },
      summary: {
        en: "A booking reserves a time slot; the service happens at the venue.",
        ro: "O programare rezervă un interval orar; serviciul are loc la sediu.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "When you book, you reserve a time slot with the business for the selected services. “Confirmed” means the business accepted the slot in its calendar. Before submitting a booking you can review and correct your selection. To receive the service, attend the venue at the booked time; the service — and payment — happen there, directly with the business.",
            ro: "Când faceți o programare, rezervați un interval orar la afacere pentru serviciile selectate. „Confirmată” înseamnă că afacerea a acceptat intervalul în calendarul său. Înainte de a trimite programarea, puteți verifica și corecta selecția. Pentru a beneficia de serviciu, prezentați-vă la sediu la ora programată; serviciul — și plata — au loc acolo, direct cu afacerea.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Booking through Zavoia does not oblige you to pay anything through the platform. Zavoia will never charge you a fee or damages in connection with a booking, and the businesses on Zavoia have agreed not to ask you for deposits, cancellation fees, no-show charges or damages for a booking made through Zavoia. Please cancel in time if you cannot attend, so the slot can be offered to someone else — see the Booking & Cancellation Policy.",
            ro: "Programarea prin Zavoia nu vă obligă să plătiți nimic prin platformă. Zavoia nu vă va percepe niciodată taxe sau despăgubiri în legătură cu o programare, iar afacerile de pe Zavoia s-au angajat să nu vă ceară avans, taxe de anulare, taxe de neprezentare sau despăgubiri pentru o programare făcută prin Zavoia. Vă rugăm să anulați din timp dacă nu puteți ajunge, pentru ca intervalul să poată fi oferit altcuiva — vezi Politica de programări și anulări.",
          },
        },
      ],
    },
    {
      id: "prices",
      blueprintRef: "B3(c)",
      title: { en: "Prices", ro: "Prețuri" },
      summary: {
        en: "The price shown at booking is the provider's listed price, recorded with your booking.",
        ro: "Prețul afișat la programare este prețul listat de furnizor, înregistrat cu programarea.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Prices on Zavoia are set by each business. When you book, the listed price of each selected service is recorded with your booking; under our provider terms, the business must honour that price for those services if it provides them. Anything additional you choose to buy at the venue (extra services, products) is agreed there, between you and the business.",
            ro: "Prețurile de pe Zavoia sunt stabilite de fiecare afacere. Când faceți o programare, prețul listat al fiecărui serviciu selectat este înregistrat cu programarea; conform termenilor noștri pentru furnizori, afacerea trebuie să onoreze acel preț pentru acele servicii, dacă le prestează. Orice alegeți suplimentar la fața locului (servicii extra, produse) se convine acolo, între dumneavoastră și afacere.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Zavoia does not issue receipts or invoices for services — the business does, according to its legal obligations.",
            ro: "Zavoia nu emite bonuri sau facturi pentru servicii — afacerea le emite, conform obligațiilor sale legale.",
          },
        },
      ],
    },
    {
      id: "providers",
      blueprintRef: "B4 / OUG 34 art. 6¹",
      title: { en: "The businesses on Zavoia", ro: "Afacerile de pe Zavoia" },
      summary: {
        en: "Who the providers are and how responsibilities split.",
        ro: "Cine sunt furnizorii și cum se împart responsabilitățile.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Every listing shows the identity of the business providing the services. Businesses offering services on Zavoia act as professionals (traders), so you benefit from consumer-protection law in your relationship with them.",
            ro: "Fiecare listare arată identitatea afacerii care prestează serviciile. Afacerile care oferă servicii pe Zavoia acționează în calitate de profesioniști (comercianți), astfel că beneficiați de legislația de protecție a consumatorilor în relația cu acestea.",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "The business is responsible for: its listing and price accuracy, its qualifications and authorizations, performing the services with professional diligence, its own hygiene/regulatory compliance, and issuing fiscal receipts.",
              "Zavoia is responsible for: operating the platform, displaying listings and bookings accurately, and the platform duties described in these terms.",
            ],
            ro: [
              "Afacerea răspunde pentru: acuratețea listării și a prețurilor, calificările și autorizațiile sale, prestarea serviciilor cu diligență profesională, propria conformitate igienico-sanitară și de reglementare, și emiterea bonurilor fiscale.",
              "Zavoia răspunde pentru: operarea platformei, afișarea corectă a listărilor și programărilor, și obligațiile de platformă descrise în acești termeni.",
            ],
          },
        },
      ],
    },
    {
      id: "ranking",
      blueprintRef: "B5",
      title: {
        en: "How results are ordered",
        ro: "Cum sunt ordonate rezultatele",
      },
      summary: {
        en: "The main ranking parameters, per surface.",
        ro: "Parametrii principali de ierarhizare, pe fiecare secțiune.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Search with typed text: venues whose name or category matches your text are ordered by how closely the venue's name matches it, then by distance from you (or by rating when we don't know your location). Matching businesses are also listed separately, in alphabetical order.",
              "Lists without typed text — search results, the map, and the category pages for each city — are ordered by distance when we know your location; otherwise by rating, with venues without reviews last, then newest first. You can re-sort what you see by Closest, Top rated or Newest.",
              "Suggestions shown while you type follow the same order. If your text matches nothing, the suggestions show other venues instead, by rating and then newest first. A search that finds nothing shows no results; we don't fill it with other venues.",
              "Homepage: “In your city” shows venues within about 50 km in a random order that changes between visits; “Near you” shows venues within about 20 km, nearest first; “Brands” are ordered by rating, then by number of reviews.",
              "On the website's homepage, “Made with Web Studio” shows businesses that have published a Zavoia website, most recently published first. Publishing a website requires a Zavoia plan that includes it (currently Plus), so only those businesses appear there.",
              "Why this order: a typed name shows most clearly what the customer is looking for, so the match comes first; services are provided in person, so distance comes next; when the customer's location is not known, rating is the best guide we have — venues without reviews come after rated ones so that ratings are compared fairly, and newer venues come first among equals so that they are not overlooked. “In your city” is shown in random order so that every nearby venue gets seen.",
              "Apart from the “Made with Web Studio” section, payment does not influence ranking: businesses cannot pay to rank higher, and there are no sponsored placements.",
            ],
            ro: [
              "Căutare cu text tastat: unitățile al căror nume sau categorie se potrivește cu textul dumneavoastră sunt ordonate după cât de bine se potrivește numele unității, apoi după distanța față de dumneavoastră (sau după rating, când nu vă cunoaștem locația). Afacerile care se potrivesc sunt afișate și separat, în ordine alfabetică.",
              "Listele fără text tastat — rezultatele căutării, harta și paginile de categorie ale fiecărui oraș — sunt ordonate după distanță când vă cunoaștem locația; altfel după rating, cu unitățile fără recenzii la final, apoi cele mai noi primele. Puteți reordona ce vedeți după Cele mai apropiate, Cele mai apreciate sau Cele mai noi.",
              "Sugestiile afișate în timp ce tastați urmează aceeași ordine. Dacă textul nu se potrivește cu nimic, sugestiile afișează în schimb alte unități, după rating și apoi cele mai noi primele. O căutare fără rezultate rămâne goală; nu o completăm cu alte unități.",
              "Pagina principală: „În orașul tău” afișează unități pe o rază de aproximativ 50 km, într-o ordine aleatorie care se schimbă de la o vizită la alta; „Lângă tine” (în aplicație, „Aproape de tine”) afișează unități pe o rază de aproximativ 20 km, cele mai apropiate primele; „Branduri” sunt ordonate după rating, apoi după numărul de recenzii.",
              "Pe pagina principală a site-ului, secțiunea „Site-uri create cu Web Studio” afișează afacerile care au publicat un site Zavoia, cele publicate cel mai recent primele. Publicarea unui site necesită un plan Zavoia care o include (în prezent Plus), așa că doar aceste afaceri apar acolo.",
              "De ce această ordine: numele tastat arată cel mai clar ce caută clientul, așa că potrivirea vine prima; serviciile se prestează la fața locului, așa că urmează distanța; când locația clientului nu este cunoscută, ratingul este cel mai bun reper pe care îl avem — unitățile fără recenzii vin după cele cu rating, ca ratingurile să fie comparate corect, iar la egalitate cele mai noi vin primele, ca să nu rămână nevăzute. „În orașul tău” este afișat în ordine aleatorie, ca fiecare unitate din apropiere să fie văzută.",
              "În afara secțiunii „Site-uri create cu Web Studio”, plata nu influențează ierarhizarea: afacerile nu pot plăti pentru poziții mai bune și nu există plasări sponsorizate.",
            ],
          },
        },
      ],
    },
    {
      id: "cancellations",
      blueprintRef: "B7",
      title: {
        en: "Cancelling and rescheduling",
        ro: "Anulare și reprogramare",
      },
      summary: {
        en: "Business-set rules; no cancellation or no-show fees.",
        ro: "Reguli stabilite de afacere; fără taxe de anulare sau de neprezentare.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Each business decides whether you can cancel or reschedule through Zavoia and how much notice you must give; you see its rules before you book. The rules that apply are the business's settings at the time you cancel or reschedule. Up to the notice deadline you can cancel or reschedule online, free of charge; after it, or if the business doesn't allow online changes, contact the venue directly. Neither Zavoia nor the business charges cancellation or no-show fees for bookings made through Zavoia. Details in the Booking & Cancellation Policy.",
            ro: "Fiecare afacere decide dacă puteți anula sau reprograma prin Zavoia și cu cât timp înainte trebuie să o faceți; vedeți regulile ei înainte de a face programarea. Se aplică setările afacerii din momentul în care anulați sau reprogramați. Până la termenul de preaviz puteți anula sau reprograma online, gratuit; după acesta, sau dacă afacerea nu permite modificări online, contactați direct unitatea. Nici Zavoia, nici afacerea nu percep taxe de anulare sau de neprezentare pentru programările făcute prin Zavoia. Detalii în Politica de programări și anulări.",
          },
        },
      ],
    },
    {
      id: "health-information",
      blueprintRef: "gate D7",
      title: {
        en: "Health and suitability information",
        ro: "Informații de sănătate și compatibilitate",
      },
      summary: {
        en: "Tell the provider what they need to know to perform the service safely.",
        ro: "Comunicați furnizorului ce trebuie să știe pentru a presta serviciul în siguranță.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Some services (for example treatments involving skin contact, products or physical manipulation) may be unsuitable if you have allergies, medical conditions or other special circumstances. Please tell the business about anything relevant before your appointment, by contacting the venue — its contact details are on its listing. Such information is for the business performing your service; how Zavoia protects health-related data is described in the Privacy Notice.",
            ro: "Unele servicii (de exemplu tratamente care implică contact cu pielea, produse sau manipulare fizică) pot fi nepotrivite dacă aveți alergii, afecțiuni medicale sau alte circumstanțe speciale. Vă rugăm să informați afacerea despre orice este relevant înainte de programare, contactând unitatea — datele ei de contact sunt pe listare. Aceste informații sunt destinate afacerii care vă prestează serviciul; modul în care Zavoia protejează datele legate de sănătate este descris în Politica de confidențialitate.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Zavoia is a booking service, not a medical or emergency service, and nothing on Zavoia is medical advice. In an emergency, call 112 — the emergency number in Romania and throughout the European Union.",
            ro: "Zavoia este un serviciu de programări, nu un serviciu medical sau de urgență, iar nimic din Zavoia nu constituie sfat medical. În caz de urgență, sunați la 112 — numărul de urgență din România și din întreaga Uniune Europeană.",
          },
        },
      ],
    },
    {
      id: "reviews",
      blueprintRef: "B6",
      title: { en: "Reviews", ro: "Recenzii" },
      summary: {
        en: "Review after your appointment; rules in the Content Policy.",
        ro: "Lăsați recenzii după programare; regulile sunt în Politica de conținut.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You can review the venue and the professional once the business marks your appointment as completed — whether you booked it through Zavoia or the business booked it for you in Zavoia. Reviews must reflect your genuine experience. Who can review, how verification works, prohibited content and how moderation decisions are made and appealed are set out in the Reviews, Content & Moderation Policy.",
            ro: "Puteți lăsa o recenzie unității și profesionistului după ce afacerea marchează programarea ca finalizată — fie că ați făcut-o prin Zavoia, fie că afacerea a făcut-o pentru dumneavoastră în Zavoia. Recenziile trebuie să reflecte experiența dumneavoastră reală. Cine poate lăsa recenzii, cum funcționează verificarea, conținutul interzis și cum se iau și se contestă deciziile de moderare sunt stabilite în Politica de recenzii, conținut și moderare.",
          },
        },
      ],
    },
    {
      id: "restrictions",
      blueprintRef: "A9 / ToS §12",
      title: { en: "Account restrictions", ro: "Restricții de cont" },
      summary: {
        en: "When booking access can be restricted, and your rights.",
        ro: "Când accesul la programări poate fi restricționat și drepturile dumneavoastră.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "We may restrict or suspend a customer account for: repeated no-shows or abusive cancellation patterns (for example, repeatedly booking and then cancelling at the last minute, or booking several slots you don't intend to keep), abusive or threatening behaviour toward businesses or staff, fraudulent activity, or serious or repeated breaches of these terms. If we restrict your account, we tell you the reasons and how to appeal our decision.",
            ro: "Putem restricționa sau suspenda un cont de client pentru: neprezentări repetate sau tipare abuzive de anulare (de exemplu, programări făcute și anulate în mod repetat în ultimul moment ori mai multe programări pe care nu intenționați să le onorați), comportament abuziv sau amenințător față de afaceri sau personal, activitate frauduloasă, ori încălcări grave sau repetate ale acestor termeni. Dacă vă restricționăm contul, vă comunicăm motivele și modalitatea de a contesta decizia.",
          },
        },
      ],
    },
    {
      id: "liability",
      blueprintRef: "B8",
      title: { en: "Liability", ro: "Răspundere" },
      summary: {
        en: "Zavoia answers for the platform; providers answer for services.",
        ro: "Zavoia răspunde pentru platformă; furnizorii răspund pentru servicii.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Zavoia is responsible for operating the platform with professional diligence. The businesses are responsible for the services they provide, including their quality, safety and legality. We are not liable for the performance or non-performance of a service by a business — your remedies for the service are against the business, and consumer law protects you in that relationship.",
            ro: "Zavoia răspunde pentru operarea platformei cu diligență profesională. Afacerile răspund pentru serviciile pe care le prestează, inclusiv pentru calitatea, siguranța și legalitatea lor. Nu răspundem pentru prestarea sau neprestarea unui serviciu de către o afacere — pentru serviciu vă puteți îndrepta împotriva afacerii, iar legislația de protecție a consumatorilor vă protejează în acea relație.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Nothing in these terms excludes liability that cannot be excluded under Romanian law (including for intent or gross negligence) or limits your mandatory consumer rights.",
            ro: "Nimic din acești termeni nu exclude răspunderea care nu poate fi exclusă conform legii române (inclusiv pentru intenție sau culpă gravă) și nu limitează drepturile dumneavoastră imperative de consumator.",
          },
        },
      ],
    },
    {
      id: "complaints",
      blueprintRef: "B9",
      title: { en: "Help and complaints", ro: "Ajutor și reclamații" },
      summary: {
        en: "Provider first for service issues; Zavoia for platform issues; then ANPC or alternative dispute resolution.",
        ro: "Mai întâi furnizorul pentru servicii; Zavoia pentru platformă; apoi ANPC/SAL.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Issues with a service (quality, behaviour, pricing at the venue): raise them with the business first — it is responsible for the service and best placed to resolve them. You can also reflect your experience in a review.",
              "Issues with the platform (bookings not working, account problems, content): contact Zavoia support through the Help Centre.",
              "If a complaint to us is not resolved to your satisfaction, you can contact the National Authority for Consumer Protection (ANPC, anpc.ro) or use ANPC's alternative dispute resolution service (reclamatiisal.anpc.ro).",
            ],
            ro: [
              "Probleme cu un serviciu (calitate, comportament, prețuri la sediu): adresați-le mai întâi afacerii — ea răspunde de serviciu și este cea mai în măsură să le rezolve. Puteți reflecta experiența și într-o recenzie.",
              "Probleme cu platforma (programări nefuncționale, probleme de cont, conținut): contactați asistența Zavoia prin Centrul de ajutor.",
              "Dacă o reclamație adresată nouă nu este soluționată satisfăcător, vă puteți adresa ANPC (anpc.ro) sau puteți folosi mecanismul SAL de soluționare alternativă a litigiilor (reclamatiisal.anpc.ro).",
            ],
          },
        },
      ],
    },
    {
      id: "changes-law",
      blueprintRef: "B13 / B14",
      title: {
        en: "Changes, law and language",
        ro: "Modificări, lege și limbă",
      },
      summary: {
        en: "Versioned changes that never affect existing bookings; Romanian law.",
        ro: "Modificări versionate care nu afectează programările existente; legea română.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "We change these terms by publishing a new version and notifying you in advance through the platform or by email. Changes never apply retroactively and never affect bookings already made. If you do not agree with a change, you can stop using the marketplace and delete your account before it takes effect. These terms are governed by Romanian law. As a consumer, you keep the protection of the mandatory rules of the country where you live. Disputes are resolved by the competent Romanian courts; if you live in another EU country, you can also bring a claim in the courts where you live. These terms are published in Romanian and English; if the versions diverge, the Romanian text prevails.",
            ro: "Modificăm acești termeni publicând o versiune nouă și notificându-vă în avans prin platformă sau prin email. Modificările nu se aplică niciodată retroactiv și nu afectează programările deja făcute. Dacă nu sunteți de acord cu o modificare, puteți înceta utilizarea marketplace-ului și vă puteți șterge contul înainte ca aceasta să intre în vigoare. Acești termeni sunt guvernați de legea română. Ca consumator, păstrați protecția normelor imperative din țara în care locuiți. Litigiile se soluționează de instanțele române competente; dacă locuiți în alt stat UE, puteți sesiza și instanțele de la domiciliul dumneavoastră. Acești termeni sunt publicați în română și engleză; în caz de divergență, textul în limba română prevalează.",
          },
        },
      ],
    },
  ],
};
