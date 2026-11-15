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
  status: "published",
  effectiveDate: "2026-11-15",
  sections: [
    {
      id: "scope-acceptance",
      blueprintRef: "A6 / P2B art. 3(1)",
      title: { en: "Scope and acceptance", ro: "Domeniu și acceptare" },
      summary: {
        en: "Part of the Business Terms; applies while you are listed.",
        ro: "Face parte din Termenii pentru afaceri; se aplică cât timp sunteți listat.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "This schedule forms part of the Business Terms, which you accept when you sign up as a business owner or add a business to your Zavoia account, and applies while your business is listed on the Zavoia marketplace. It is published here so you can read it before you sign up and before you publish your listing. In this schedule, the “provider” is your business (the workspace customer); the individual professionals who appear in your listing act for your business, and your business is the party offering services to consumers.",
            ro: "Acest document face parte din Termenii pentru afaceri, pe care îi acceptați când vă înscrieți ca proprietar de afacere sau adăugați o afacere în contul Zavoia, și se aplică cât timp afacerea dumneavoastră este listată în marketplace-ul Zavoia. Este publicat aici ca să îl puteți citi înainte de înscriere și înainte de publicarea listării. În acest document, „furnizorul” este afacerea dumneavoastră (clientul titular al spațiului de lucru); profesioniștii individuali care apar în listare acționează pentru afacerea dumneavoastră, iar afacerea este partea care oferă servicii consumatorilor.",
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
        en: "Registered businesses only; proof on request.",
        ro: "Doar afaceri înregistrate; dovada la cerere.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "To be listed on the marketplace, your business must be registered to carry on its activity in Romania or another EU member state — as a company (such as a limited liability company), a registered individual business (such as an authorised sole trader or an individual enterprise), or a practice registered under the rules of its profession (such as an individual practice). You warrant that your business is duly registered and that the person accepting is entitled to act for it.",
            ro: "Pentru a fi listată în marketplace, afacerea dumneavoastră trebuie să fie înregistrată pentru a-și desfășura activitatea în România sau în alt stat membru UE — ca societate (de exemplu SRL), ca formă individuală înregistrată (de exemplu PFA sau întreprindere individuală) ori ca formă de exercitare a profesiei înregistrată conform regulilor acesteia (de exemplu cabinet individual). Garantați că afacerea este legal înregistrată și că persoana care acceptă are dreptul să acționeze în numele ei.",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "Your business details — your business name and, in your billing details, the legal name, address, fiscal code and trade-register number where you have one — must be accurate. Update them promptly when something changes, such as your legal form, name, address or registration.",
              "We may ask you at any time for proof of your registration, or of the authorizations described in Regulated and prohibited services. If you do not provide it, we may restrict or suspend your listing under Restriction, suspension and termination.",
            ],
            ro: [
              "Datele afacerii — denumirea afacerii și, în datele de facturare, denumirea legală, adresa, CUI-ul și numărul de înregistrare la Registrul Comerțului, dacă aveți unul — trebuie să fie corecte. Actualizați-le prompt când se schimbă ceva, cum ar fi forma juridică, denumirea, adresa sau înregistrarea.",
              "Vă putem cere oricând dovada înregistrării sau a autorizațiilor descrise în secțiunea Servicii reglementate și interzise. Dacă nu o furnizați, putem restricționa sau suspenda listarea conform secțiunii Restricționare, suspendare și încetare.",
            ],
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
              "Prices you list are the prices you charge at the venue: if you provide a booked service, you charge the price recorded at booking.",
              "You hold and maintain every licence, authorization (including sanitary authorization where required) and insurance your activity needs.",
              "For photos showing identifiable people (your staff or clients), you obtain and keep a record of their consent and remove content if consent is withdrawn.",
              "You grant Zavoia a non-exclusive licence to host and display your listing content on the platform and in Zavoia's own promotion of the marketplace (see Distribution). Effect on your rights: you remain the owner; the licence is limited to these purposes and ends when the content is removed, except in already-published materials.",
              "Your business name stays clearly visible on your listing — an EU-law requirement (P2B art. 3(5)).",
            ],
            ro: [
              "Listarea trebuie să fie corectă și neînșelătoare: serviciile, prețurile, duratele, profesioniștii, calificările și fotografiile trebuie să reflecte realitatea.",
              "Prețurile listate sunt prețurile pe care le practicați la sediu: dacă prestați un serviciu programat, încasați prețul înregistrat la programare.",
              "Dețineți și mențineți fiecare licență, autorizație (inclusiv autorizația sanitară unde este necesară) și asigurare de care activitatea are nevoie.",
              "Pentru fotografiile cu persoane identificabile (personal sau clienți), obțineți și păstrați dovada consimțământului și eliminați conținutul dacă consimțământul este retras.",
              "Acordați Zavoia o licență neexclusivă de a găzdui și afișa conținutul listării pe platformă și în promovarea proprie a marketplace-ului (vezi Distribuție). Efectul asupra drepturilor: rămâneți proprietar; licența este limitată la aceste scopuri și încetează la eliminarea conținutului, cu excepția materialelor deja publicate.",
              "Denumirea afacerii rămâne clar vizibilă pe listare — o cerință a legislației UE (art. 3(5) P2B).",
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
            en: "Some categories on Zavoia are regulated professions or activities — for example medical, dental, psychology, physiotherapy, laboratory or veterinary services, aesthetic medicine such as injectables, and body-modification services such as tattooing or piercing. If you list services in a regulated category, you additionally warrant that your business and each professional performing them hold every authorization, professional qualification and registration the law requires for that activity (for example licences to practise and professional-body registration for health professions), and you will provide evidence at our request.",
            ro: "Unele categorii de pe Zavoia sunt profesii sau activități reglementate — de exemplu servicii medicale, stomatologice, de psihologie, fizioterapie, de laborator sau veterinare, medicină estetică, cum ar fi procedurile injectabile, precum și servicii de modificare corporală, cum ar fi tatuajele sau piercingul. Dacă listați servicii într-o categorie reglementată, garantați suplimentar că afacerea și fiecare profesionist care le prestează dețin toate autorizațiile, calificările profesionale și înregistrările cerute de lege pentru acea activitate (de exemplu avize de liberă practică și înregistrarea în corpul profesional pentru profesiile din sănătate) și veți furniza dovezi la cererea noastră.",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "May not be listed at all: services that are unlawful to offer commercially; prescription-only medical acts offered outside an authorized framework; and services whose advertising is prohibited.",
              "Misrepresenting a regulated service, or listing one without the required authorization, is a serious breach and a ground for immediate suspension under the Restriction section.",
            ],
            ro: [
              "Nu pot fi listate deloc: servicii a căror oferire comercială este ilegală; acte medicale care necesită prescripție, oferite în afara unui cadru autorizat; și servicii a căror publicitate este interzisă.",
              "Prezentarea falsă a unui serviciu reglementat sau listarea unuia fără autorizația necesară constituie o încălcare gravă și un motiv de suspendare imediată conform secțiunii Restricționare.",
            ],
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
              "The platform booking creates no payment obligation for the customer through Zavoia, and you may not represent that a Zavoia booking by itself creates a debt, fee or damages claim. You may not impose deposits, cancellation fees, no-show charges or claim damages arising from a platform booking — neither through the platform nor outside it.",
              "In your booking settings you choose whether customers can cancel or reschedule through Zavoia and how much notice they must give. Customers see these rules before they book: on your listing on the website and on the booking screen in the app. A cancellation or change is checked against your settings at the moment it is made, including for bookings made earlier.",
              "Customer complaints about your services are yours to resolve. We may forward to you complaints we receive about your services.",
              "You issue fiscal receipts/invoices to customers as the law requires; Zavoia issues none for your services.",
            ],
            ro: [
              "O programare confirmată înseamnă că intervalul solicitat este rezervat în calendarul dumneavoastră. Programarea în sine nu vă obligă juridic să prestați și nu obligă clientul să se prezinte — mențineți calendarul corect și anulați prompt, prin platformă, orice programare pe care nu o puteți onora.",
              "Contractul de servicii (conținutul și prețul final) se încheie direct între dumneavoastră și client, la sediu. Dacă prestați serviciul, onorați prețul înregistrat la programare pentru serviciile selectate.",
              "Programarea din platformă nu creează pentru client nicio obligație de plată prin Zavoia și nu puteți susține că o programare Zavoia creează, prin ea însăși, o datorie, o taxă sau un drept la despăgubiri. Nu puteți impune avansuri, taxe de anulare, taxe de neprezentare și nu puteți pretinde despăgubiri decurgând dintr-o programare din platformă — nici prin platformă, nici în afara ei.",
              "În setările de programare alegeți dacă clienții pot anula sau reprograma prin Zavoia și cu cât timp înainte trebuie să o facă. Clienții văd aceste reguli înainte de a face programarea: pe pagina listării de pe site și în ecranul de programare din aplicație. O anulare sau o modificare se verifică după setările dumneavoastră din momentul în care este făcută, inclusiv pentru programările făcute anterior.",
              "Reclamațiile clienților privind serviciile dumneavoastră vă revin spre soluționare. Reclamațiile primite de noi privind serviciile dumneavoastră vă pot fi transmise.",
              "Emiteți bonuri fiscale/facturi clienților conform legii; Zavoia nu emite niciunul pentru serviciile dumneavoastră.",
            ],
          },
        },
      ],
    },
    {
      id: "reviews",
      blueprintRef: "B6 / doc 7",
      title: { en: "Reviews", ro: "Recenzii" },
      summary: {
        en: "Reviews are part of the marketplace and can't be switched off.",
        ro: "Recenziile fac parte din marketplace și nu pot fi dezactivate.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Customers can review your venue and your professionals once you mark their appointment as completed, from the Zavoia account the appointment belongs to — whether they booked it through Zavoia or you booked it for them in Zavoia. Being reviewable is part of the marketplace and cannot be switched off. You may not manipulate reviews — no incentivized, purchased, self-written or competitor-targeted reviews. Mark each appointment that took place as completed, and only those; leaving appointments unmarked so that customers cannot review them counts as review manipulation. If you consider a review unlawful or in breach of the Content Policy, report it through Support in your dashboard or as the Content Policy describes; decisions follow the Content Policy, with reasons and an appeal.",
            ro: "Clienții pot lăsa recenzii unității și profesioniștilor dumneavoastră după ce marcați programarea lor ca finalizată, din contul Zavoia căruia îi aparține programarea — fie că au făcut-o prin Zavoia, fie că ați făcut-o dumneavoastră pentru ei în Zavoia. Posibilitatea de a primi recenzii face parte din marketplace și nu poate fi dezactivată. Nu puteți manipula recenziile — fără recenzii stimulate, cumpărate, scrise de dumneavoastră ori vizând concurenții. Marcați ca finalizată fiecare programare care a avut loc, și doar pe acestea; nemarcarea programărilor pentru ca clienții să nu poată lăsa recenzii este considerată manipulare a recenziilor. Dacă apreciați că o recenzie este ilegală sau încalcă Politica de conținut, raportați-o prin secțiunea Suport din panou sau conform Politicii de conținut; deciziile urmează Politica de conținut, cu motivare și contestație.",
          },
        },
      ],
    },
    {
      id: "ranking",
      blueprintRef: "A6 / P2B art. 5",
      title: { en: "Ranking", ro: "Ierarhizare" },
      summary: {
        en: "Main parameters, how they are applied, and the one section that depends on your plan.",
        ro: "Parametrii principali, cum sunt aplicați și singura secțiune care depinde de planul dumneavoastră.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Search with typed text: venues whose name or category matches the text are ordered by how closely the venue's name matches it, then by distance to the customer (or by rating when the customer's location is not known). Matching businesses are also listed separately, in alphabetical order.",
              "Lists without typed text — search results, the map, and the category pages for each city — are ordered by distance when the customer's location is known; otherwise by rating, with venues without reviews last, then newest first. Customers can re-sort what they see by Closest, Top rated or Newest.",
              "Suggestions shown while a customer types follow the same order. If the typed text matches nothing, the suggestions show other venues instead, by rating and then newest first. A search that finds nothing shows no results; Zavoia does not fill it with other venues.",
              "Homepage: “In your city” shows venues within about 50 km in a random order that changes between visits; “Near you” shows venues within about 20 km, nearest first; “Brands” are ordered by rating, then by number of reviews.",
              "The website's homepage section “Made with Web Studio” shows businesses that have published a Zavoia website, most recently published first. Publishing a website requires a plan that includes it (currently Plus), so only those businesses appear in that section.",
              "Why this order: a typed name shows most clearly what the customer is looking for, so the match comes first; services are provided in person, so distance comes next; when the customer's location is not known, rating is the best guide we have — venues without reviews come after rated ones so that ratings are compared fairly, and newer venues come first among equals so that they are not overlooked. “In your city” is shown in random order so that every nearby venue gets seen.",
              "Apart from the “Made with Web Studio” section, payment does not influence ranking: there is no paid placement, and no subscription tier changes the order of search results or of the other sections. If this changes, this schedule will be amended first, with the notice period below.",
            ],
            ro: [
              "Căutare cu text tastat: unitățile al căror nume sau categorie se potrivește cu textul sunt ordonate după cât de bine se potrivește numele unității, apoi după distanța față de client (sau după rating, când locația clientului nu este cunoscută). Afacerile care se potrivesc sunt afișate și separat, în ordine alfabetică.",
              "Listele fără text tastat — rezultatele căutării, harta și paginile de categorie ale fiecărui oraș — sunt ordonate după distanță când locația clientului este cunoscută; altfel după rating, cu unitățile fără recenzii la final, apoi cele mai noi primele. Clienții pot reordona ce văd după Cele mai apropiate, Cele mai apreciate sau Cele mai noi.",
              "Sugestiile afișate în timp ce clientul tastează urmează aceeași ordine. Dacă textul tastat nu se potrivește cu nimic, sugestiile afișează în schimb alte unități, după rating și apoi cele mai noi primele. O căutare fără rezultate rămâne goală; Zavoia nu o completează cu alte unități.",
              "Pagina principală: „În orașul tău” afișează unități pe o rază de aproximativ 50 km, într-o ordine aleatorie care se schimbă de la o vizită la alta; „Lângă tine” (în aplicație, „Aproape de tine”) afișează unități pe o rază de aproximativ 20 km, cele mai apropiate primele; „Branduri” sunt ordonate după rating, apoi după numărul de recenzii.",
              "Secțiunea „Site-uri create cu Web Studio” de pe pagina principală a site-ului afișează afacerile care au publicat un site Zavoia, cele publicate cel mai recent primele. Publicarea unui site necesită un plan care o include (în prezent Plus), așa că doar aceste afaceri apar în acea secțiune.",
              "De ce această ordine: numele tastat arată cel mai clar ce caută clientul, așa că potrivirea vine prima; serviciile se prestează la fața locului, așa că urmează distanța; când locația clientului nu este cunoscută, ratingul este cel mai bun reper pe care îl avem — unitățile fără recenzii vin după cele cu rating, ca ratingurile să fie comparate corect, iar la egalitate cele mai noi vin primele, ca să nu rămână nevăzute. „În orașul tău” este afișat în ordine aleatorie, ca fiecare unitate din apropiere să fie văzută.",
              "În afara secțiunii „Site-uri create cu Web Studio”, plata nu influențează ierarhizarea: nu există plasare plătită, iar niciun nivel de abonament nu schimbă ordinea rezultatelor căutării sau a celorlalte secțiuni. Dacă acest lucru se schimbă, acest document va fi modificat mai întâi, cu termenul de preaviz de mai jos.",
            ],
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
            en: "When a marketplace customer books with you, Zavoia adds them to your client records with their name, email address and phone number (if they gave one), together with the booking details. You are the controller of your client records: you must have a lawful basis for how you use them, keep them accurate, reflect them in your own privacy information, and not use marketplace-originated contact data for unsolicited marketing. Zavoia processes these records on your behalf under the Data Processing Addendum. If a marketplace customer deletes their Zavoia account, their upcoming bookings are cancelled and you get the usual cancellation notice; then their bookings and the client record linked to their account are removed from your workspace. Client records you created yourself stay. Keep anything the law requires you to keep in your own records.",
            ro: "Când un client din marketplace face o programare la dumneavoastră, Zavoia îl adaugă în evidențele dumneavoastră de clienți cu numele, adresa de email și numărul de telefon (dacă l-a furnizat), împreună cu detaliile programării. Sunteți operatorul evidențelor dumneavoastră de clienți: trebuie să aveți un temei legal pentru utilizarea lor, să le mențineți corecte, să le reflectați în propria informare de confidențialitate și să nu folosiți datele de contact provenite din marketplace pentru marketing nesolicitat. Zavoia prelucrează aceste evidențe în numele dumneavoastră conform Acordului de prelucrare a datelor. Dacă un client din marketplace își șterge contul Zavoia, programările sale viitoare sunt anulate și primiți notificarea obișnuită de anulare; apoi programările sale și fișa de client legată de contul său sunt eliminate din spațiul dumneavoastră de lucru. Fișele de client create de dumneavoastră rămân. Păstrați în propriile evidențe orice informații pe care legea vă obligă să le păstrați.",
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
              "Additional distribution channels and affiliate programmes (P2B art. 3(1)(d)): none — your listing is published only on Zavoia's own website and apps; Zavoia may also feature it in its own promotion, including on social media (see Promotion).",
              "Ancillary goods/services offered to consumers through the platform (art. 6): none.",
              "Differentiated treatment (art. 7): none — Zavoia does not offer services on the marketplace itself, and no business connected to Zavoia receives preferential ranking or treatment. Differences that depend on your plan are described under Ranking.",
              "Restrictions on offering different conditions through other channels (art. 10): none — you are free to offer your services anywhere, on any terms.",
            ],
            ro: [
              "Promovare: permiteți Zavoia să folosească informațiile publice ale listării (nume, fotografii, servicii, locație, ratinguri) în promovarea proprie a marketplace-ului — inclusiv paginile SEO de orașe și categorii și rețelele sociale. Această licență nu acoperă alte utilizări.",
              "Canale de distribuție suplimentare și programe de afiliere (art. 3(1)(d) P2B): nu există — listarea este publicată doar pe site-ul și aplicațiile Zavoia; Zavoia o poate prezenta și în promovarea proprie, inclusiv pe rețelele sociale (vezi Promovare).",
              "Bunuri/servicii auxiliare oferite consumatorilor prin platformă (art. 6): nu există.",
              "Tratament diferențiat (art. 7): nu există — Zavoia nu oferă ea însăși servicii în marketplace, iar nicio afacere legată de Zavoia nu primește ierarhizare sau tratament preferențial. Diferențele care depind de planul dumneavoastră sunt descrise la Ierarhizare.",
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
        ro: "Obligațiile fiscale vă revin; Zavoia trebuie să raporteze activitatea din marketplace către ANAF.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You are solely responsible for your fiscal obligations: registration, declaring income, VAT where applicable, fiscal receipts (including cash-register obligations under Government Emergency Ordinance 28/1999) and invoices.",
            ro: "Sunteți singurul responsabil de obligațiile fiscale: înregistrare, declararea veniturilor, TVA unde este cazul, bonuri fiscale (inclusiv obligațiile privind casele de marcat conform OUG 28/1999) și facturi.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Zavoia is a reporting platform operator under DAC7 (Directive 2021/514, transposed into the Romanian Fiscal Procedure Code) — an information-reporting regime under which the platform collects identification data about the businesses offering services through it and reports their bookings made through Zavoia annually to the National Agency for Fiscal Administration (ANAF). You agree to provide this data when we ask for it, and we report as the law requires. If required data is still missing after two reminders and at least 60 days, the law requires us to take your business off the marketplace until you provide it. DAC7 reporting does not change your own tax obligations. Our DAC7 page explains the regime, the exact data involved and what it means for you.",
            ro: "Zavoia este operator de platformă cu obligație de raportare conform DAC7 (Directiva 2021/514, transpusă în Codul de procedură fiscală) — un regim de raportare informativă în care platforma colectează datele de identificare ale afacerilor care oferă servicii prin ea și raportează anual la ANAF programările făcute la ele prin Zavoia. Sunteți de acord să furnizați aceste date când vi le cerem, iar noi raportăm conform legii. Dacă datele obligatorii lipsesc în continuare după două reamintiri și cel puțin 60 de zile, legea ne obligă să vă scoatem afacerea din marketplace până când le furnizați. Raportarea DAC7 nu vă schimbă propriile obligații fiscale. Pagina noastră DAC7 explică regimul, datele exacte implicate și ce înseamnă pentru dumneavoastră.",
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
              "Grounds for restricting or suspending a listing: not providing proof of registration or of required authorizations when we ask; unlawful services or missing authorizations; material listing inaccuracy (including not honouring booked prices); imposing prohibited charges on platform customers; review manipulation; abusive conduct; serious or repeated breach of this schedule; legal requirement.",
              "For any restriction or suspension, we give you a statement of reasons on a durable medium at the latest when it takes effect, and a chance to clarify or remedy through the complaints route.",
              "Termination of your listing requires 30 days' prior notice with reasons, except in cases of repeated infringement, or where the law requires immediate action or a legal obligation prevents notice.",
              "If a restriction or termination is revoked, we reinstate the listing, including your access to the data connected to it.",
              "You can take your business off the marketplace at any time by turning off “Show location on marketplace” for each of your locations; this takes effect immediately, and your subscription continues under the Business Terms until you cancel it.",
            ],
            ro: [
              "Motive pentru restricționarea sau suspendarea unei listări: nefurnizarea, la cerere, a dovezii înregistrării sau a autorizațiilor necesare; servicii ilegale sau autorizații lipsă; inexactitate semnificativă a listării (inclusiv neonorarea prețurilor din programări); impunerea de taxe interzise clienților platformei; manipularea recenziilor; conduită abuzivă; încălcare gravă sau repetată a acestui document; obligație legală.",
              "Pentru orice restricționare sau suspendare, vă comunicăm o motivare pe suport durabil cel târziu la momentul aplicării, și posibilitatea de a clarifica sau remedia prin canalul de reclamații.",
              "Încetarea listării necesită preaviz de 30 de zile cu motivare, cu excepția cazurilor de încălcări repetate și a celor în care legea impune acțiune imediată sau o obligație legală împiedică preavizul.",
              "Dacă o restricționare sau încetare este revocată, restabilim listarea, inclusiv accesul dumneavoastră la datele legate de ea.",
              "Vă puteți retrage afacerea din marketplace oricând, dezactivând „Afișează locația în marketplace” pentru fiecare locație; retragerea are efect imediat, iar abonamentul continuă conform Termenilor pentru afaceri până îl anulați.",
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
            en: "During the contract you have access to the data of your workspace: your listing, bookings, client records you manage, reviews of your venue and your analytics. Zavoia has access to all data on the platform, including your listing, bookings and reviews and the accounts of customers who book with you, and uses it as described in the Privacy Notice and, for your workspace data, the Data Processing Addendum. Your data is not shared with other providers, and aggregated marketplace data of other providers is not shared with you. Third-party access is limited to the service providers that run Zavoia for us — the sub-processors listed in the Data Processing Addendum and the other providers described in the Privacy Notice — and to your listing content used in Zavoia's own promotion (see Distribution). If your subscription lapses or ends, your listing is unpublished, and your workspace data stays available to you read-only until you delete your account. You can download each client's history as a PDF; there is no bulk export.",
            ro: "Pe durata contractului aveți acces la datele spațiului dumneavoastră de lucru: listarea, programările, evidențele de clienți pe care le gestionați, recenziile unității și analizele dumneavoastră. Zavoia are acces la toate datele de pe platformă, inclusiv listarea, programările și recenziile dumneavoastră și conturile clienților care fac programări la dumneavoastră, și le folosește conform Politicii de confidențialitate și, pentru datele spațiului de lucru, conform Acordului de prelucrare a datelor. Datele dumneavoastră nu sunt partajate altor furnizori, iar datele agregate ale altor furnizori nu vă sunt partajate. Accesul terților este limitat la furnizorii de servicii care operează Zavoia pentru noi — subîmputerniciții enumerați în Acordul de prelucrare a datelor și ceilalți furnizori descriși în Politica de confidențialitate — și la conținutul listării folosit în promovarea proprie Zavoia (vezi Distribuție). Dacă abonamentul expiră sau încetează, listarea este retrasă de la publicare, iar datele spațiului de lucru vă rămân disponibile în regim de citire până când vă ștergeți contul. Puteți descărca istoricul fiecărui client ca PDF; nu există export în masă.",
          },
        },
      ],
    },
    {
      id: "complaints-mediation",
      blueprintRef: "A6 / P2B arts. 11–12",
      title: { en: "Complaints", ro: "Reclamații" },
      summary: {
        en: "How to complain about the platform.",
        ro: "Cum transmiteți o reclamație privind platforma.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You can raise complaints about the platform — including about restrictions, ranking or this schedule — through Support in your dashboard or by email to support@zavoia.com. We examine each complaint individually, free of charge, and reply with a reasoned answer within a reasonable time.",
            ro: "Reclamațiile privind platforma — inclusiv privind restricționările, ierarhizarea sau acest document — pot fi transmise prin secțiunea Suport din panou sau prin email la support@zavoia.com. Examinăm fiecare reclamație individual, gratuit, și răspundem motivat într-un termen rezonabil.",
          },
        },
      ],
    },
  ],
};
