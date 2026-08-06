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
  status: "draft",
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
            en: "The customer account is free and gives you bookings, booking history, favourites and reviews. Booking requires an account. If you already use Zavoia as a business user, the customer role can be added to the same account — you will be asked to accept these terms when that happens. You can delete your account at any time from account settings; deletion of data is described in the Privacy Notice.",
            ro: "Contul de client este gratuit și vă oferă programări, istoricul programărilor, favorite și recenzii. Programarea necesită un cont. Dacă folosiți deja Zavoia ca utilizator business, rolul de client poate fi adăugat aceluiași cont — vi se va cere să acceptați acești termeni în acel moment. Vă puteți șterge contul oricând din setările contului; ștergerea datelor este descrisă în Politica de confidențialitate.",
          },
        },
        {
          kind: "note",
          text: {
            en: "IMPL (blueprint §0.2): terms presentation + acceptance recording at customer-role enablement (the confirm_enable_marketplace flow) is not built yet — required before publication. Notification promises were removed from this section deliberately: audit §6.20 verified gaps (auto-confirmed bookings send no confirmation, bulk cancellations send nothing, web inbox unwired).",
            ro: "IMPL (blueprint §0.2): prezentarea termenilor + înregistrarea acceptării la activarea rolului de client (fluxul confirm_enable_marketplace) nu este încă construită — necesară înainte de publicare. Promisiunile de notificări au fost eliminate deliberat din această secțiune: auditul §6.20 a verificat lacune (programările auto-confirmate nu trimit confirmare, anulările în masă nu trimit nimic, inbox-ul web neconectat).",
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
            ro: "Când faceți o programare, rezervați un interval orar la afacere pentru serviciile selectate. „Confirmat” înseamnă că afacerea a acceptat intervalul în calendarul său. Înainte de a trimite programarea, puteți verifica și corecta selecția. Pentru a beneficia de serviciu, prezentați-vă la sediu la ora programată; serviciul — și plata — au loc acolo, direct cu afacerea.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Booking through Zavoia does not oblige you to pay anything through the platform, and Zavoia will never charge you a fee or damages in connection with a booking. Please cancel in time if you cannot attend, so the slot can be offered to someone else — see the Booking & Cancellation Policy.",
            ro: "Programarea prin Zavoia nu vă obligă să plătiți nimic prin platformă, iar Zavoia nu vă va percepe niciodată taxe sau despăgubiri în legătură cu o programare. Vă rugăm să anulați din timp dacă nu puteți ajunge, pentru ca intervalul să poată fi oferit altcuiva — vezi Politica de programări și anulări.",
          },
        },
        {
          kind: "note",
          text: {
            en: "COUNSEL GATE (blueprint B3/D3): this section drafts the target non-binding model (booking = slot reservation; service contract forms with the provider later). It requires (a) counsel approval of the classification, (b) matching UI copy, (c) the provider-side obligations in the Provider Terms. If counsel classifies the flow as contract-forming, this section switches to the fallback: OUG 34/2014 art. 6(1) information set + withdrawal-rights treatment.",
            ro: "GATE JURIDIC (blueprint B3/D3): această secțiune redactează modelul țintă neobligațional (programare = rezervare de interval; contractul de servicii se formează ulterior cu furnizorul). Necesită (a) aprobarea juridică a clasificării, (b) texte de interfață concordante, (c) obligațiile furnizorului din Termenii pentru furnizori. Dacă avocații clasifică fluxul ca formator de contract, secțiunea trece pe varianta de rezervă: setul de informații art. 6(1) OUG 34/2014 + tratamentul dreptului de retragere.",
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
            ro: "Prețurile pe Zavoia sunt stabilite de fiecare afacere. Când faceți o programare, prețul listat al fiecărui serviciu selectat este înregistrat cu programarea; conform termenilor noștri pentru furnizori, afacerea trebuie să onoreze acel preț pentru acele servicii, dacă le prestează. Orice alegeți suplimentar la fața locului (servicii extra, produse) se convine acolo, între dumneavoastră și afacere.",
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
        {
          kind: "note",
          text: {
            en: "DEC + IMPL (blueprint B4, gate D8): drafted for a traders-only launch. Verified 1 Aug 2026: the trader-status declaration flow, the on-listing status label and ANAF validation do NOT exist in code yet — all must be built before publication. If non-trader providers are ever admitted, OUG 34/2014 art. 6¹ requires a non-trader label plus a warning that consumer rights do not apply to that contract — a different section text.",
            ro: "DEC + IMPL (blueprint B4, gate D8): redactat pentru o lansare exclusiv cu comercianți. Verificat 1 aug. 2026: fluxul de declarare a statutului de comerciant, eticheta de pe listare și validarea ANAF NU există încă în cod — toate trebuie construite înainte de publicare. Dacă vor fi admiși vreodată furnizori neprofesioniști, art. 6¹ OUG 34/2014 impune o etichetă de neprofesionist plus un avertisment că drepturile consumatorilor nu se aplică acelui contract — un text de secțiune diferit.",
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
              "Search results: relevance to your query, distance from your location, rating and recency. When few results match your filters, we show labelled fallback results with relaxed criteria.",
              "Homepage and category sections: the 'Latest' rail shows newest businesses first; other rails are ordered by review count, name or rating — each section states its own ordering where it appears.",
              "Payment does not influence ranking: businesses cannot pay to rank higher, and there are no sponsored placements.",
            ],
            ro: [
              "Rezultatele căutării: relevanța față de căutare, distanța față de locația dumneavoastră, ratingul și recența. Când puține rezultate corespund filtrelor, afișăm rezultate de rezervă etichetate, cu criterii relaxate.",
              "Secțiunile paginii principale și ale categoriilor: secțiunea „Cele mai noi” arată afacerile cele mai recente; celelalte secțiuni sunt ordonate după numărul de recenzii, nume sau rating — fiecare secțiune își indică ordonarea acolo unde apare.",
              "Plata nu influențează ierarhizarea: afacerile nu pot plăti pentru poziții mai bune și nu există plasări sponsorizate.",
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
        en: "Provider-set windows; Zavoia never charges fees.",
        ro: "Intervale stabilite de furnizor; Zavoia nu percepe taxe.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Each business sets a minimum notice period for cancelling or rescheduling, shown before you book. The notice period is a platform self-service rule reflecting the business's current settings: outside it you can cancel or reschedule online free of charge; inside it, online cancellation is not available and you should contact the venue directly. Zavoia itself never charges cancellation or no-show fees. Details in the Booking & Cancellation Policy.",
            ro: "Fiecare afacere stabilește un termen minim de preaviz pentru anulare sau reprogramare, afișat înainte de rezervare. Termenul de preaviz este o regulă de auto-servire a platformei care reflectă setările curente ale afacerii: în afara lui puteți anula sau reprograma online gratuit; în interiorul lui, anularea online nu este disponibilă și ar trebui să contactați direct unitatea. Zavoia nu percepe niciodată taxe de anulare sau neprezentare. Detalii în Politica de programări și anulări.",
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
            en: "Some services (for example treatments involving skin contact, products or physical manipulation) may be unsuitable if you have allergies, medical conditions or other special circumstances. Please tell the business in advance about anything relevant — ideally when booking or by contacting the venue. Such information is for the business performing your service; how Zavoia protects health-related data is described in the Privacy Notice.",
            ro: "Unele servicii (de exemplu tratamente care implică contact cu pielea, produse sau manipulare fizică) pot fi nepotrivite dacă aveți alergii, afecțiuni medicale sau alte circumstanțe speciale. Vă rugăm să informați afacerea în avans despre orice este relevant — ideal la programare sau contactând unitatea. Aceste informații sunt destinate afacerii care vă prestează serviciul; modul în care Zavoia protejează datele legate de sănătate este descris în Politica de confidențialitate.",
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
            en: "After an appointment booked through Zavoia you can review the venue and professional. Reviews must reflect your genuine experience. Who can review, how verification works, prohibited content and how moderation decisions are made and appealed are set out in the Reviews, Content & Moderation Policy.",
            ro: "După o programare făcută prin Zavoia puteți lăsa o recenzie unității și profesionistului. Recenziile trebuie să reflecte experiența dumneavoastră reală. Cine poate lăsa recenzii, cum funcționează verificarea, conținutul interzis și cum se iau și se contestă deciziile de moderare sunt stabilite în Politica de recenzii, conținut și moderare.",
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
            en: "We may restrict or suspend a customer account for: repeated no-shows or abusive cancellation patterns, abusive or threatening behaviour toward businesses or staff, fraudulent activity, or serious or repeated breaches of these terms. A business can also independently block you from booking with that business. If we restrict your account, we tell you the reasons and how to appeal our decision.",
            ro: "Putem restricționa sau suspenda un cont de client pentru: neprezentări repetate sau tipare abuzive de anulare, comportament abuziv sau amenințător față de afaceri sau personal, activitate frauduloasă, ori încălcări grave sau repetate ale acestor termeni. O afacere vă poate bloca, de asemenea, independent, de la programări la acea afacere. Dacă vă restricționăm contul, vă comunicăm motivele și modalitatea de a contesta decizia.",
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
            ro: "Zavoia răspunde pentru operarea platformei cu diligență profesională. Afacerile răspund pentru serviciile pe care le prestează, inclusiv pentru calitatea, siguranța și legalitatea lor. Nu răspundem pentru prestarea sau neprestarea unui serviciu de către o afacere — remediile dumneavoastră pentru serviciu sunt împotriva afacerii, iar legislația de protecție a consumatorilor vă protejează în acea relație.",
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
        en: "Provider first for service issues; Zavoia for platform issues; then ANPC/SAL.",
        ro: "Mai întâi furnizorul pentru servicii; Zavoia pentru platformă; apoi ANPC/SAL.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Issues with a service (quality, behaviour, pricing at the venue): raise them with the business first — it is responsible for the service and best placed to resolve them. You can also reflect your experience in a review.",
              "Issues with the platform (bookings not working, account problems, content): contact Zavoia support through the Help Centre.",
              "If a complaint to us is not resolved to your satisfaction, you can address ANPC (anpc.ro) or use the SAL alternative dispute resolution mechanism (reclamatiisal.anpc.ro).",
            ],
            ro: [
              "Probleme cu un serviciu (calitate, comportament, prețuri la sediu): adresați-le mai întâi afacerii — ea răspunde de serviciu și este cel mai bine plasată să le rezolve. Puteți reflecta experiența și într-o recenzie.",
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
            en: "We change these terms by publishing a new version and notifying you in advance through the platform or by email. Changes never apply retroactively and never affect bookings already made. If you do not agree with a change, you can stop using the marketplace and delete your account before it takes effect. These terms are governed by Romanian law; your mandatory consumer rights are unaffected; the Romanian text prevails over the English translation.",
            ro: "Modificăm acești termeni publicând o versiune nouă și notificându-vă în avans prin platformă sau prin email. Modificările nu se aplică niciodată retroactiv și nu afectează programările deja făcute. Dacă nu sunteți de acord cu o modificare, puteți înceta utilizarea marketplace-ului și vă puteți șterge contul înainte ca aceasta să intre în vigoare. Acești termeni sunt guvernați de legea română; drepturile dumneavoastră imperative de consumator rămân neatinse; textul în limba română prevalează asupra traducerii în engleză.",
          },
        },
      ],
    },
  ],
};
