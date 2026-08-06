import type { LegalDocument } from "./types";

export const providerTerms: LegalDocument = {
  slug: "provider-terms",
  audience: "business",
  title: {
    en: "Marketplace Provider Terms (P2B Schedule)",
    ro: "Termeni pentru furnizori (Marketplace)",
  },
  shortTitle: { en: "Provider terms", ro: "Termeni furnizori" },
  description: {
    en: "The terms that apply when a business activates a marketplace listing on Zavoia — eligibility, verification, bookings, ranking, and the protections of the EU Platform-to-Business Regulation.",
    ro: "Termenii aplicabili când o afacere își activează listarea în marketplace-ul Zavoia — eligibilitate, verificare, programări, ierarhizare și protecțiile Regulamentului UE platformă-întreprindere (P2B).",
  },
  status: "draft",
  sections: [
    {
      id: "scope-acceptance",
      blueprintRef: "A6 / P2B art. 3(1)",
      title: { en: "Scope and acceptance", ro: "Domeniu și acceptare" },
      summary: {
        en: "This schedule binds at listing activation and is public before that.",
        ro: "Acest document se aplică la activarea listării și este public înainte de aceasta.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "This schedule supplements the Business Terms and binds when you activate a marketplace listing. It is published here so you can read it before activating. In this schedule, the “provider” is your business (the workspace customer); the individual professionals who appear in your listing act for your business, and your business is the party offering services to consumers.",
            ro: "Acest document completează Termenii pentru afaceri și se aplică din momentul activării listării în marketplace. Este publicat aici pentru a-l putea citi înainte de activare. În acest document, „furnizorul” este afacerea dumneavoastră (clientul spațiului de lucru); profesioniștii individuali care apar în listare acționează pentru afacerea dumneavoastră, iar afacerea este partea care oferă servicii consumatorilor.",
          },
        },
      ],
    },
    {
      id: "eligibility-verification",
      blueprintRef: "A2 / A7 / gate D8",
      title: {
        en: "Eligibility and verification",
        ro: "Eligibilitate și verificare",
      },
      summary: {
        en: "Registered businesses only, verified against official registers.",
        ro: "Doar afaceri înregistrate, verificate în registrele oficiale.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Marketplace providers must be businesses registered in Romania or another EU member state — a company (e.g. SRL) or a registered sole trader (e.g. PFA / întreprindere individuală). You warrant that your business is duly registered and that the person accepting is entitled to act for it.",
            ro: "Furnizorii din marketplace trebuie să fie afaceri înregistrate în România sau în alt stat membru UE — o societate (ex. SRL) sau o formă individuală înregistrată (ex. PFA / întreprindere individuală). Garantați că afacerea este legal înregistrată și că persoana care acceptă are dreptul să acționeze pentru ea.",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "At listing activation you provide your CUI (tax identification code); we validate it against official sources (the ANAF taxpayer register) and match the official business name.",
              "As part of our verification policy we collect: identity, address, contact details, trade-register data and a self-certification that you will offer only services compliant with applicable law. This also covers EU trader-traceability duties to the extent counsel confirms they apply to our booking model.",
              "You must keep this data current and tell us promptly about changes (legal form, name, deregistration, fiscal inactivity).",
              "Your declared trader status feeds the label shown to consumers on your listing.",
              "If verification fails, lapses or shows fiscal inactivity, we may decline or suspend the listing until resolved (with the safeguards in the Restriction section).",
            ],
            ro: [
              "La activarea listării furnizați CUI-ul; îl validăm în sursele oficiale (registrul contribuabililor ANAF) și potrivim denumirea oficială a afacerii.",
              "Ca parte a politicii noastre de verificare colectăm: identitate, adresă, date de contact, date din Registrul Comerțului și o autocertificare că veți oferi doar servicii conforme cu legea aplicabilă. Aceasta acoperă și obligațiile UE de trasabilitate a comercianților, în măsura în care avocații confirmă că se aplică modelului nostru de programări.",
              "Trebuie să mențineți aceste date actuale și să ne anunțați prompt despre schimbări (formă juridică, denumire, radiere, inactivitate fiscală).",
              "Statutul de comerciant declarat alimentează eticheta afișată consumatorilor pe listare.",
              "Dacă verificarea eșuează, expiră sau indică inactivitate fiscală, putem refuza sau suspenda listarea până la rezolvare (cu garanțiile din secțiunea Restricționare).",
            ],
          },
        },
        {
          kind: "note",
          text: {
            en: "GATES D8 + IMPL (verified 1 Aug 2026): NONE of this flow exists in code yet — no CUI collection at listing activation, no ANAF validation, no trader-status declaration, no consumer-facing trader label. The registered-businesses-only policy is the drafted direction from the 1 Aug 2026 session, still a formal [DEC]. Everything in this section must be BUILT before listings activate under these terms; whether DSA art. 30 formally applies under the appointment-coordination model is a separate counsel classification (decisions doc §4.2).",
            ro: "GATE-uri D8 + IMPL (verificat 1 aug. 2026): NIMIC din acest flux nu există încă în cod — nicio colectare de CUI la activarea listării, nicio validare ANAF, nicio declarație de statut de comerciant, nicio etichetă pentru consumatori. Politica exclusiv-afaceri-înregistrate este direcția stabilită în sesiunea din 1 aug. 2026, încă un [DEC] formal. Tot ce este în această secțiune trebuie CONSTRUIT înainte ca listările să se activeze sub acești termeni; dacă art. 30 DSA se aplică formal modelului de coordonare a programărilor este o clasificare juridică separată (documentul de decizii §4.2).",
          },
        },
      ],
    },
    {
      id: "listing-content",
      blueprintRef: "A7 / P2B arts. 3(1)(e), 3(5)",
      title: {
        en: "Your listing and content",
        ro: "Listarea și conținutul dumneavoastră",
      },
      summary: {
        en: "Accuracy, honored prices, content licence, visible identity.",
        ro: "Acuratețe, prețuri onorate, licență de conținut, identitate vizibilă.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Your listing must be accurate and not misleading: services, prices, durations, professionals, qualifications and photos must reflect reality.",
              "Prices you list are the prices you honour at the venue. The price recorded at booking time is binding on you toward the customer.",
              "You hold and maintain every licence, authorization (including sanitary authorization where required) and insurance your activity needs.",
              "For photos showing identifiable people (your staff or clients), you obtain and keep record of their consent and remove content if consent is withdrawn.",
              "You grant Zavoia a non-exclusive licence to host and display your listing content on the platform and in Zavoia's own promotion of the marketplace (see Distribution). Effect on your rights: you remain the owner; the licence is limited to these purposes and ends when the content is removed, except in already-published materials.",
              "Your business identity (name and registration identity) remains clearly visible on your listing — an EU-law requirement (P2B art. 3(5)).",
            ],
            ro: [
              "Listarea trebuie să fie corectă și neînșelătoare: serviciile, prețurile, duratele, profesioniștii, calificările și fotografiile trebuie să reflecte realitatea.",
              "Prețurile listate sunt prețurile pe care le onorați la sediu. Prețul înregistrat la momentul programării vă obligă față de client.",
              "Dețineți și mențineți fiecare licență, autorizație (inclusiv autorizația sanitară unde este necesară) și asigurare de care activitatea are nevoie.",
              "Pentru fotografiile cu persoane identificabile (personal sau clienți), obțineți și păstrați dovada consimțământului și eliminați conținutul dacă acesta este retras.",
              "Acordați Zavoia o licență neexclusivă de a găzdui și afișa conținutul listării pe platformă și în promovarea proprie a marketplace-ului (vezi Distribuție). Efectul asupra drepturilor: rămâneți proprietar; licența este limitată la aceste scopuri și încetează la eliminarea conținutului, cu excepția materialelor deja publicate.",
              "Identitatea afacerii (denumirea și identitatea de înregistrare) rămâne clar vizibilă pe listare — o cerință a legislației UE (art. 3(5) P2B).",
            ],
          },
        },
      ],
    },
    {
      id: "regulated-services",
      blueprintRef: "A7 / partner-terms §23",
      title: {
        en: "Regulated and prohibited services",
        ro: "Servicii reglementate și interzise",
      },
      summary: {
        en: "Extra warranties for regulated activities; what may not be listed at all.",
        ro: "Garanții suplimentare pentru activități reglementate; ce nu poate fi listat deloc.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Some categories on Zavoia are regulated professions or activities — for example medical, dental, psychology, physiotherapy or laboratory services, and body-modification services such as tattooing or piercing. If you list services in a regulated category, you additionally warrant that your business and each professional performing them hold every authorization, professional qualification and registration the law requires for that activity (for example free-practice permits and professional-body registration for health professions), and you will provide evidence at our request.",
            ro: "Unele categorii de pe Zavoia sunt profesii sau activități reglementate — de exemplu servicii medicale, stomatologice, de psihologie, fizioterapie sau de laborator, precum și servicii de modificare corporală, cum ar fi tatuajele sau piercingul. Dacă listați servicii într-o categorie reglementată, garantați suplimentar că afacerea și fiecare profesionist care le prestează dețin toate autorizațiile, calificările profesionale și înregistrările cerute de lege pentru acea activitate (de exemplu avize de liberă practică și înregistrarea în corpul profesional pentru profesiile din sănătate) și veți furniza dovezi la cererea noastră.",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "May not be listed at all: services that are unlawful to offer commercially; prescription-only medical acts offered outside an authorized framework; services whose advertising is prohibited; and any service the platform designates as prohibited in the listing taxonomy.",
              "Misrepresenting a regulated service, or listing one without the required authorization, is a serious breach and a ground for immediate suspension under the Restriction section.",
            ],
            ro: [
              "Nu pot fi listate deloc: servicii ilegale de oferit comercial; acte medicale care necesită prescripție, oferite în afara unui cadru autorizat; servicii a căror publicitate este interzisă; și orice serviciu desemnat de platformă ca interzis în taxonomia de listare.",
              "Prezentarea falsă a unui serviciu reglementat sau listarea unuia fără autorizația necesară constituie o încălcare gravă și un motiv de suspendare imediată conform secțiunii Restricționare.",
            ],
          },
        },
        {
          kind: "note",
          text: {
            en: "Decide and publish the concrete prohibited-services list (Fresha pattern: a linked living document). For health categories, align with gate D7 and the per-profession authorization requirements before onboarding those venue types.",
            ro: "Decideți și publicați lista concretă de servicii interzise (modelul Fresha: un document separat, actualizabil). Pentru categoriile de sănătate, aliniați cu gate-ul D7 și cu cerințele de autorizare per profesie înainte de a accepta acele tipuri de unități.",
          },
        },
      ],
    },
    {
      id: "bookings-obligations",
      blueprintRef: "A7 / B3",
      title: {
        en: "Bookings and your obligations",
        ro: "Programările și obligațiile dumneavoastră",
      },
      summary: {
        en: "Honor the slot and price; no fees imposed on customers via platform bookings.",
        ro: "Onorați intervalul și prețul; fără taxe impuse clienților pentru programările din platformă.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "A confirmed booking means the requested slot is reserved in your calendar. The booking itself does not legally oblige you to perform or the customer to attend — keep your calendar accurate and promptly cancel, through the platform, any appointment you cannot honour.",
              "The service contract (its scope and final price) is concluded directly between you and the customer, at the venue. If you provide the service, you honour the price recorded at booking for the selected services.",
              "The platform booking creates no payment obligation for the customer through Zavoia, and you may not represent that a Zavoia booking by itself creates a debt, fee or damages claim. You may not impose deposits, cancellation fees, no-show charges or claim damages arising from a platform booking — neither through the platform nor outside it. Your remedy for problematic customers is blocking future bookings.",
              "You set your cancellation/reschedule notice period in booking settings; it is shown to customers before booking and controls when they can self-cancel through the platform.",
              "Customer complaints about your services are yours to resolve: acknowledge within 48 hours and aim to resolve within 14 days. We may refer complaints we receive to you.",
              "You issue fiscal receipts/invoices to customers as the law requires; Zavoia issues none for your services.",
            ],
            ro: [
              "O programare confirmată înseamnă că intervalul solicitat este rezervat în calendarul dumneavoastră. Programarea în sine nu vă obligă juridic să prestați și nu obligă clientul să se prezinte — mențineți calendarul corect și anulați prompt, prin platformă, orice programare pe care nu o puteți onora.",
              "Contractul de servicii (conținutul și prețul final) se încheie direct între dumneavoastră și client, la sediu. Dacă prestați serviciul, onorați prețul înregistrat la programare pentru serviciile selectate.",
              "Programarea din platformă nu creează pentru client nicio obligație de plată prin Zavoia și nu puteți susține că o programare Zavoia creează, prin ea însăși, o datorie, o taxă sau un drept la despăgubiri. Nu puteți impune avansuri, taxe de anulare, taxe de neprezentare și nu puteți pretinde despăgubiri decurgând dintr-o programare din platformă — nici prin platformă, nici în afara ei. Remediul pentru clienții problematici este blocarea programărilor viitoare.",
              "Stabiliți termenul de preaviz pentru anulare/reprogramare în setările de programare; este afișat clienților înainte de rezervare și controlează când aceștia se pot auto-anula prin platformă.",
              "Reclamațiile clienților privind serviciile dumneavoastră vă revin spre soluționare: confirmați primirea în 48 de ore și urmăriți soluționarea în 14 zile. Reclamațiile primite de noi vă pot fi transmise.",
              "Emiteți bonuri fiscale/facturi clienților conform legii; Zavoia nu emite niciunul pentru serviciile dumneavoastră.",
            ],
          },
        },
        {
          kind: "note",
          text: {
            en: "COUNSEL GATE (blueprint B3/D4 + decisions doc §2): the no-obligation and no-fees-no-damages rules implement the recorded appointment-coordination decision and must survive counsel review together with the B3 classification. IMPL: per-booking policy snapshotting (blueprint §0.2) is NOT built — the API currently applies your CURRENT settings to existing appointments; until snapshotting ships, no document may promise that setting changes don't affect existing bookings. The price rule reflects the fixed-price election (decisions doc §2.4.C) — confirm with counsel, or build 'from/estimate' labelling before allowing variable prices.",
            ro: "GATE JURIDIC (blueprint B3/D4 + documentul de decizii §2): regulile fără-obligație și fără-taxe-fără-despăgubiri implementează decizia înregistrată de coordonare a programărilor și trebuie să treacă de analiza juridică împreună cu clasificarea B3. IMPL: înregistrarea versiunii politicii per programare (blueprint §0.2) NU este construită — API-ul aplică în prezent setările CURENTE programărilor existente; până la implementare, niciun document nu poate promite că modificările setărilor nu afectează programările existente. Regula de preț reflectă alegerea prețului fix (documentul de decizii §2.4.C) — confirmați cu avocații sau construiți etichetarea „de la/estimat” înainte de a permite prețuri variabile.",
          },
        },
      ],
    },
    {
      id: "reviews",
      blueprintRef: "B6 / doc 7",
      title: { en: "Reviews", ro: "Recenzii" },
      summary: {
        en: "Reviews are part of the marketplace; conduct rules apply to replies.",
        ro: "Recenziile fac parte din marketplace; regulile de conduită se aplică răspunsurilor.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Customers can review your venue and professionals after appointments booked through the platform; being reviewable is part of the marketplace and cannot be opted out of. You may reply to reviews; replies must be professional and must not disclose customer personal data. You may not manipulate reviews — no incentivized, purchased, self-authored or competitor-targeted reviews. If you consider a review unlawful or in breach of the Content Policy, flag it through the reporting route; decisions follow the Content Policy, with reasons and an appeal.",
            ro: "Clienții pot lăsa recenzii unității și profesioniștilor după programările făcute prin platformă; a putea fi recenzat face parte din marketplace și nu poate fi dezactivat. Puteți răspunde la recenzii; răspunsurile trebuie să fie profesioniste și să nu dezvăluie date personale ale clienților. Nu puteți manipula recenziile — fără recenzii stimulate, cumpărate, scrise de dumneavoastră ori vizând concurenții. Dacă apreciați că o recenzie este ilegală sau încalcă Politica de conținut, semnalați-o prin canalul de raportare; deciziile urmează Politica de conținut, cu motivare și contestație.",
          },
        },
      ],
    },
    {
      id: "ranking",
      blueprintRef: "A6 / P2B art. 5",
      title: { en: "Ranking", ro: "Ierarhizare" },
      summary: {
        en: "Main parameters, relative importance, no paid influence.",
        ro: "Parametri principali, importanța relativă, fără influență plătită.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Search results: ordered by relevance to the query, distance to the customer, rating and recency — in that order of importance for typical searches. When few results match, labelled fallback results with relaxed criteria are appended.",
              "Homepage sections and category rails: each states its own ordering — for example newest-first for new businesses, or ordering by review count, name or rating.",
              "Remuneration does not influence ranking: there is no paid placement, and no Zavoia product or subscription tier improves position. If this ever changes, this schedule will be amended first, with the notice period below.",
            ],
            ro: [
              "Rezultatele căutării: ordonate după relevanța față de căutare, distanța față de client, rating și recență — în această ordine a importanței pentru căutările tipice. Când puține rezultate corespund, se adaugă rezultate de rezervă etichetate, cu criterii relaxate.",
              "Secțiunile paginii principale și ale categoriilor: fiecare își indică propria ordonare — de exemplu cele mai noi afaceri, ordonare după numărul de recenzii, nume sau rating.",
              "Remunerarea nu influențează ierarhizarea: nu există plasare plătită, iar niciun produs sau nivel de abonament Zavoia nu îmbunătățește poziția. Dacă acest lucru se schimbă vreodată, acest document va fi modificat mai întâi, cu termenul de preaviz de mai jos.",
            ],
          },
        },
        {
          kind: "note",
          text: {
            en: "Blueprint B5/A6: the disclosure must inventory each ranked surface as actually implemented (search similarity/distance/rating/recency; homepage newest-first; rails by review count/name/rating; the labelled relaxation ladder). Re-verify against code at publication.",
            ro: "Blueprint B5/A6: prezentarea trebuie să inventarieze fiecare secțiune ierarhizată așa cum este efectiv implementată (căutare: similaritate/distanță/rating/recență; pagina principală: cele mai noi; secțiuni după numărul de recenzii/nume/rating; scara de relaxare etichetată). Reverificați față de cod la publicare.",
          },
        },
      ],
    },
    {
      id: "connected-records",
      blueprintRef: "A10 / §0.2",
      title: {
        en: "Connected client records",
        ro: "Evidențe de clienți conectate",
      },
      summary: {
        en: "Marketplace bookers are linked into your client records; you are their controller.",
        ro: "Clienții din marketplace sunt asociați evidențelor dumneavoastră; sunteți operatorul lor.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "When a marketplace customer books with you, their booking details are associated with a client record in your workspace. You are the controller of your client records: you must have a lawful basis for how you use them, keep them accurate, reflect them in your own privacy information, and not use marketplace-originated contact data for unsolicited marketing. Zavoia processes these records on your behalf under the Data Processing Addendum.",
            ro: "Când un client din marketplace face o programare la dumneavoastră, detaliile programării sunt asociate unei evidențe de client în spațiul de lucru. Sunteți operatorul evidențelor dumneavoastră de clienți: trebuie să aveți un temei legal pentru utilizarea lor, să le mențineți corecte, să le reflectați în propria informare de confidențialitate și să nu folosiți datele de contact provenite din marketplace pentru marketing nesolicitat. Zavoia prelucrează aceste evidențe în numele dumneavoastră conform Acordului de prelucrare a datelor.",
          },
        },
      ],
    },
    {
      id: "distribution-transparency",
      blueprintRef: "A6 / P2B arts. 3(1)(d), 6, 7, 10",
      title: {
        en: "Distribution, channels and equal treatment",
        ro: "Distribuție, canale și tratament egal",
      },
      summary: {
        en: "The P2B transparency statements, mostly 'none'.",
        ro: "Declarațiile de transparență P2B, în mare parte „nu există”.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Promotion: you permit Zavoia to use your public listing information (name, photos, services, location, ratings) in the marketplace's own promotion — including Zavoia's SEO city and category pages and social media. This licence covers no other use.",
              "Additional distribution channels and affiliate programmes (P2B art. 3(1)(d)): none — your listing is published only on Zavoia's own website and apps.",
              "Ancillary goods/services offered to consumers through the platform (art. 6): none.",
              "Differentiated treatment of providers (art. 7): none — no provider (including any business connected to Zavoia) receives preferential ranking or treatment.",
              "Restrictions on offering different conditions through other channels (art. 10): none — you are free to offer your services anywhere, at any conditions.",
            ],
            ro: [
              "Promovare: permiteți Zavoia să folosească informațiile publice ale listării (nume, fotografii, servicii, locație, ratinguri) în promovarea proprie a marketplace-ului — inclusiv paginile SEO de orașe și categorii și rețelele sociale. Această licență nu acoperă alte utilizări.",
              "Canale de distribuție suplimentare și programe de afiliere (art. 3(1)(d) P2B): nu există — listarea este publicată doar pe site-ul și aplicațiile Zavoia.",
              "Bunuri/servicii auxiliare oferite consumatorilor prin platformă (art. 6): nu există.",
              "Tratament diferențiat al furnizorilor (art. 7): nu există — niciun furnizor (inclusiv vreo afacere legată de Zavoia) nu primește ierarhizare sau tratament preferențial.",
              "Restricții privind oferirea de condiții diferite prin alte canale (art. 10): nu există — sunteți liber să vă oferiți serviciile oriunde, în orice condiții.",
            ],
          },
        },
      ],
    },
    {
      id: "tax-reporting",
      blueprintRef: "gate D12 / DAC7",
      title: {
        en: "Tax responsibilities and platform reporting (DAC7)",
        ro: "Obligații fiscale și raportarea platformei (DAC7)",
      },
      summary: {
        en: "Your taxes are yours; Zavoia must report marketplace activity to ANAF.",
        ro: "Taxele dumneavoastră vă aparțin; Zavoia trebuie să raporteze activitatea din marketplace către ANAF.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You are solely responsible for your fiscal obligations: registration, declaring income, VAT where applicable, fiscal receipts (including cash-register obligations under OUG 28/1999) and invoices.",
            ro: "Sunteți singurul responsabil de obligațiile fiscale: înregistrare, declararea veniturilor, TVA unde este cazul, bonuri fiscale (inclusiv obligațiile privind casele de marcat conform OUG 28/1999) și facturi.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Platform operators can be subject to DAC7 (Directive 2021/514, transposed into the Romanian Fiscal Procedure Code) — an information-reporting regime under which the platform collects seller identification data (name, address, CUI and, for sole traders, the personal tax identification number and date of birth) and reports marketplace activity annually to ANAF. Whether Zavoia's appointment-coordination model is in scope is being confirmed with tax counsel. To the extent Zavoia is or becomes a reporting platform operator, you agree to provide this data on request, we will report as the law requires, and — as the regime itself mandates — a listing may be suspended if the required data is not provided after two reminders and 60 days. DAC7 reporting would not change your own tax obligations. Our DAC7 page explains the regime, the exact data involved and what it means for you in full.",
            ro: "Operatorii de platforme pot intra sub incidența DAC7 (Directiva 2021/514, transpusă în Codul de procedură fiscală) — un regim de raportare informativă în care platforma colectează datele de identificare ale vânzătorilor (denumire, adresă, CUI și, pentru formele individuale, numărul de identificare fiscală personal și data nașterii) și raportează anual activitatea din marketplace către ANAF. Dacă modelul Zavoia de coordonare a programărilor intră în domeniul de aplicare se confirmă cu consultantul fiscal. În măsura în care Zavoia este sau devine operator de platformă cu obligație de raportare, sunteți de acord să furnizați aceste date la cerere, vom raporta conform legii, iar — așa cum impune chiar regimul — o listare poate fi suspendată dacă datele necesare nu sunt furnizate după două reamintiri și 60 de zile. Raportarea DAC7 nu v-ar schimba propriile obligații fiscale. Pagina noastră DAC7 explică pe larg regimul, datele exacte implicate și ce înseamnă pentru dumneavoastră.",
          },
        },
        {
          kind: "note",
          text: {
            en: "GATE D12: confirm the DAC7 position with tax counsel (this session's research: booked list prices of executed bookings are 'reasonably knowable' consideration even without payment processing — OECD FAQ 14). Also confirm the operator registration step with ANAF and the F7000 pipeline before the first reporting year.",
            ro: "GATE D12: confirmați poziția DAC7 cu consultantul fiscal (cercetarea din această sesiune: prețurile listate ale programărilor efectuate sunt contravaloare „care poate fi cunoscută în mod rezonabil” chiar fără procesarea plăților — OECD FAQ 14). Confirmați și etapa de înregistrare ca operator la ANAF și fluxul F7000 înainte de primul an de raportare.",
          },
        },
      ],
    },
    {
      id: "restriction-suspension-termination",
      blueprintRef: "A6 / P2B art. 4",
      title: {
        en: "Restriction, suspension and termination",
        ro: "Restricționare, suspendare și încetare",
      },
      summary: {
        en: "Objective grounds, reasons in writing, redress and reinstatement.",
        ro: "Motive obiective, motivare scrisă, contestație și restabilire.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Grounds for restricting or suspending a listing: failed or lapsed business verification; unlawful services or missing authorizations; material listing inaccuracy (including not honouring booked prices); imposing prohibited charges on platform customers; review manipulation; abusive conduct; serious or repeated breach of this schedule; legal requirement.",
              "For any restriction or suspension, we give you a statement of reasons on a durable medium at the latest when it takes effect, and a chance to clarify or remedy through the complaints route.",
              "Termination of your listing requires 30 days' prior notice with reasons, except where the law requires immediate action, repeated infringement, or a legal obligation prevents notice.",
              "If a restriction or termination is revoked, we reinstate the listing, including your access to the data connected to it.",
              "You may end this schedule at any time by deactivating your listing from your workspace, effective immediately; your SaaS subscription continues under the Business Terms until you cancel it.",
            ],
            ro: [
              "Motive pentru restricționarea sau suspendarea unei listări: verificarea afacerii eșuată sau expirată; servicii ilegale sau autorizații lipsă; inexactitate semnificativă a listării (inclusiv neonorarea prețurilor din programări); impunerea de taxe interzise clienților platformei; manipularea recenziilor; conduită abuzivă; încălcare gravă sau repetată a acestui document; obligație legală.",
              "Pentru orice restricționare sau suspendare, vă comunicăm o motivare pe suport durabil cel târziu la momentul aplicării, și posibilitatea de a clarifica sau remedia prin canalul de reclamații.",
              "Încetarea listării necesită preaviz de 30 de zile cu motivare, cu excepția cazurilor în care legea impune acțiune imediată, a încălcărilor repetate sau când o obligație legală împiedică preavizul.",
              "Dacă o restricționare sau încetare este revocată, restabilim listarea, inclusiv accesul dumneavoastră la datele legate de ea.",
              "Puteți înceta acest document oricând prin dezactivarea listării din spațiul de lucru, cu efect imediat; abonamentul SaaS continuă conform Termenilor pentru afaceri până îl anulați.",
            ],
          },
        },
      ],
    },
    {
      id: "changes",
      blueprintRef: "A6 / P2B art. 3(2)",
      title: {
        en: "Changes to this schedule",
        ro: "Modificarea acestui document",
      },
      summary: {
        en: "≥15 days on a durable medium; no retroactivity; termination right.",
        ro: "≥15 zile pe suport durabil; fără retroactivitate; drept de reziliere.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "We change this schedule with at least 15 days' notice on a durable medium — longer where the change requires you to make technical or commercial adaptations. Changes are never retroactive. You may terminate your listing before a change takes effect if you do not accept it. Shorter notice applies only where the law requires the change or it addresses an imminent security or fraud risk.",
            ro: "Modificăm acest document cu preaviz de cel puțin 15 zile pe suport durabil — mai mult când modificarea vă impune adaptări tehnice sau comerciale. Modificările nu sunt niciodată retroactive. Puteți înceta listarea înainte ca o modificare să intre în vigoare, dacă nu o acceptați. Un preaviz mai scurt se aplică doar când legea impune modificarea sau aceasta vizează un risc iminent de securitate ori fraudă.",
          },
        },
      ],
    },
    {
      id: "data-access",
      blueprintRef: "A6 / P2B art. 9",
      title: {
        en: "Access to your data",
        ro: "Accesul la datele dumneavoastră",
      },
      summary: {
        en: "What you can access during the contract and after it ends.",
        ro: "Ce puteți accesa pe durata contractului și după încetare.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "During the contract you have access to the data of your workspace: your listing, bookings, client records you manage, reviews of your venue and your analytics. Your data is not shared with other providers, and aggregated marketplace data of other providers is not shared with you. Third-party access is limited to the technical vendors in the published vendor list and to your listing content used in Zavoia's own promotion (see Distribution). If your subscription lapses or this schedule ends, your listing is unpublished and your workspace data is preserved with read-only access (writes are blocked); Zavoia retains data after the contract only per the Privacy Notice and the Data Processing Addendum. [Defined retention window and export options — decision pending, see note.]",
            ro: "Pe durata contractului aveți acces la datele spațiului dumneavoastră de lucru: listarea, programările, evidențele de clienți pe care le gestionați, recenziile unității și analizele dumneavoastră. Datele dumneavoastră nu sunt partajate altor furnizori, iar datele agregate ale altor furnizori nu vă sunt partajate. Accesul terților este limitat la furnizorii tehnici din lista publicată și la conținutul listării folosit în promovarea proprie Zavoia (vezi Distribuție). Dacă abonamentul expiră sau acest document încetează, listarea este retrasă de la publicare, iar datele spațiului de lucru sunt păstrate cu acces de citire (scrierile sunt blocate); Zavoia păstrează datele după contract doar conform Politicii de confidențialitate și Acordului de prelucrare a datelor. [Fereastra definită de păstrare și opțiunile de export — decizie în curs, vezi nota.]",
          },
        },
        {
          kind: "note",
          text: {
            en: "Verified 1 Aug 2026 (subscription.guard.ts): on lapse, businesses keep indefinite read-only access; writes blocked; no automated deletion; no bulk export (only the individual customer-history PDF). The read-only statement above reflects real behaviour. Still to decide/build: a defined retention window and real export tooling before promising either.",
            ro: "Verificat 1 aug. 2026 (subscription.guard.ts): la expirare, afacerile păstrează acces de citire pe durată nedeterminată; scrierile sunt blocate; nu există ștergere automată; nu există export în masă (doar PDF-ul cu istoricul individual al unui client). Declarația de acces de citire de mai sus reflectă comportamentul real. Rămân de decis/construit: o fereastră definită de păstrare și instrumente reale de export înainte de a promite oricare dintre ele.",
          },
        },
      ],
    },
    {
      id: "complaints-mediation",
      blueprintRef: "A6 / P2B arts. 11–12",
      title: { en: "Complaints and mediation", ro: "Reclamații și mediere" },
      summary: {
        en: "A complaints contact for providers; P2B position stated.",
        ro: "Un contact de reclamații pentru furnizori; poziția P2B declarată.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Provider complaints about the platform — including about restrictions, ranking or this schedule — can be raised at [provider complaints contact]. We acknowledge complaints, examine them individually and respond with a reasoned outcome within a reasonable time, free of charge.",
            ro: "Reclamațiile furnizorilor privind platforma — inclusiv privind restricționările, ierarhizarea sau acest document — pot fi transmise la [contactul de reclamații pentru furnizori]. Confirmăm primirea reclamațiilor, le examinăm individual și răspundem cu un rezultat motivat într-un termen rezonabil, gratuit.",
          },
        },
        {
          kind: "note",
          text: {
            en: "GATE D2 (blueprint A6): whether the formal P2B art. 11 internal-complaint system and art. 12 mediator designation are mandatory depends on Zavoia's enterprise size (small-enterprise exemption per Rec. 2003/361 — headcount, turnover, linked enterprises unconfirmed). Decide and either name mediators here or state the exemption; the voluntary complaints contact above stands regardless.",
            ro: "GATE D2 (blueprint A6): dacă sistemul intern formal de reclamații (art. 11 P2B) și desemnarea mediatorilor (art. 12) sunt obligatorii depinde de dimensiunea întreprinderii Zavoia (excepția pentru întreprinderi mici conform Rec. 2003/361 — personal, cifră de afaceri, întreprinderi legate neconfirmate). Decideți și fie numiți mediatorii aici, fie declarați excepția; contactul voluntar de reclamații de mai sus rămâne indiferent de decizie.",
          },
        },
      ],
    },
  ],
};
