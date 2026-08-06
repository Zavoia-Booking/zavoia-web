import type { LegalDocument } from "./types";

export const dac7: LegalDocument = {
  slug: "dac7",
  audience: "business",
  title: {
    en: "DAC7 — Platform Tax Reporting",
    ro: "DAC7 — Raportarea fiscală a platformei",
  },
  shortTitle: { en: "DAC7", ro: "DAC7" },
  description: {
    en: "What the EU platform-reporting rules (DAC7) are, what data they require, and what they mean for businesses listed on the Zavoia marketplace.",
    ro: "Ce sunt regulile UE de raportare a platformelor (DAC7), ce date presupun și ce înseamnă pentru afacerile listate în marketplace-ul Zavoia.",
  },
  status: "draft",
  sections: [
    {
      id: "what-is-dac7",
      blueprintRef: "gate D12",
      title: { en: "What DAC7 is", ro: "Ce este DAC7" },
      summary: {
        en: "An EU tax-transparency rule that makes platforms report seller activity to tax authorities.",
        ro: "O regulă UE de transparență fiscală prin care platformele raportează activitatea vânzătorilor către autoritățile fiscale.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "DAC7 is Council Directive (EU) 2021/514, transposed into Romanian law by OG 16/2023 into the Fiscal Procedure Code (Legea 207/2015). It requires online platforms that connect sellers with users to identify those sellers and report their activity annually to the tax authority — in Romania, ANAF, which then exchanges the information with other EU tax authorities.",
            ro: "DAC7 este Directiva (UE) 2021/514 a Consiliului, transpusă în legislația română prin OG 16/2023 în Codul de procedură fiscală (Legea 207/2015). Impune platformelor online care pun în legătură vânzători cu utilizatori să identifice acei vânzători și să le raporteze anual activitatea către autoritatea fiscală — în România, ANAF, care apoi face schimb de informații cu celelalte autorități fiscale din UE.",
          },
        },
        {
          kind: "p",
          text: {
            en: "It is a transparency and information-reporting regime, not a new tax. It does not create any tax for you, and it does not make the platform responsible for paying or declaring your taxes — those obligations remain entirely yours.",
            ro: "Este un regim de transparență și raportare informativă, nu o taxă nouă. Nu creează nicio taxă pentru dumneavoastră și nu face platforma responsabilă de plata sau declararea taxelor dumneavoastră — acele obligații vă revin în întregime.",
          },
        },
        {
          kind: "p",
          text: {
            en: "The activities DAC7 covers include “personal services” — time- or task-based work carried out at a user's request, including work performed physically offline after being arranged through a platform. Beauty, wellness and similar appointment-based services fall in that category.",
            ro: "Activitățile acoperite de DAC7 includ „serviciile personale” — muncă pe bază de timp sau sarcini, prestată la cererea unui utilizator, inclusiv muncă efectuată fizic, offline, după ce a fost intermediată printr-o platformă. Serviciile de înfrumusețare, wellness și alte servicii pe bază de programare intră în această categorie.",
          },
        },
      ],
    },
    {
      id: "does-it-apply",
      blueprintRef: "gate D12",
      title: {
        en: "Does it apply to Zavoia?",
        ro: "Se aplică pentru Zavoia?",
      },
      summary: {
        en: "Being in scope does not depend on the platform handling payments — the test is different.",
        ro: "Intrarea în domeniul de aplicare nu depinde de gestionarea plăților de către platformă — testul este altul.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Zavoia does not process any customer payments — you are paid directly, at your venue. That alone does not settle the question: DAC7 excludes software that exclusively processes payments, exclusively lists or advertises, or exclusively redirects users, and it defines reportable amounts as consideration whose value is “known or reasonably knowable” by the platform. A booking platform that shows listed prices and records completed appointments is not automatically outside that definition.",
            ro: "Zavoia nu procesează nicio plată de la clienți — sunteți plătit direct, la sediul dumneavoastră. Acest lucru, în sine, nu tranșează întrebarea: DAC7 exclude software-ul care exclusiv procesează plăți, exclusiv listează sau promovează, ori exclusiv redirecționează utilizatori, și definește sumele raportabile drept contraprestație a cărei valoare este „cunoscută sau ar putea fi, în mod rezonabil, cunoscută” de platformă. O platformă de programări care afișează prețuri listate și înregistrează programări finalizate nu se află automat în afara acestei definiții.",
          },
        },
        {
          kind: "p",
          text: {
            en: "We are confirming Zavoia's exact position with tax counsel. This page describes what applies if and to the extent Zavoia is a reporting platform operator; we will publish the outcome here and notify listed businesses before any first reporting period.",
            ro: "Confirmăm poziția exactă a Zavoia cu un consultant fiscal. Această pagină descrie ce se aplică dacă și în măsura în care Zavoia este operator de platformă cu obligație de raportare; vom publica rezultatul aici și vom notifica afacerile listate înainte de orice prim an de raportare.",
          },
        },
        {
          kind: "note",
          text: {
            en: "GATE D12 (decisions doc §6): DAC7 applicability is an open tax-classification question — a memo from Romanian tax counsel is required. Do not publish this page stating that Zavoia reports, or that it does not, until the memo lands. Supporting research from the 1 Aug 2026 session: OECD Model Rules FAQ 14 (a listed price is knowable consideration where the operator knows the transaction was executed) and Finnish tax-administration guidance (where payment is not facilitated via the platform, the price quoted/agreed on the platform is treated as the known price) both point toward scope; Treatwell (same pay-at-venue model) reports under DAC7, while Fresha reports only Fresha-Payments activity and applies the goods thresholds to services — an aggressive position not to copy.",
            ro: "GATE D12 (documentul de decizii §6): aplicabilitatea DAC7 este o întrebare deschisă de clasificare fiscală — este necesar un memo de la un consultant fiscal român. Nu publicați această pagină afirmând că Zavoia raportează sau că nu raportează, până la primirea memo-ului. Cercetarea suport din sesiunea 1 aug. 2026: OECD Model Rules FAQ 14 (un preț listat este contraprestație cunoscută atunci când operatorul știe că tranzacția a fost executată) și ghidul administrației fiscale finlandeze (când plata nu este intermediată prin platformă, prețul cotat/convenit pe platformă este tratat drept prețul cunoscut) indică ambele spre includere; Treatwell (același model de plată la sediu) raportează conform DAC7, în timp ce Fresha raportează doar activitatea prin Fresha Payments și aplică pragurile pentru bunuri la servicii — o poziție agresivă care nu trebuie copiată.",
          },
        },
      ],
    },
    {
      id: "thresholds",
      title: {
        en: "Are there minimum thresholds?",
        ro: "Există praguri minime?",
      },
      summary: {
        en: "For services there is no de-minimis threshold — unlike sales of goods.",
        ro: "Pentru servicii nu există un prag minim — spre deosebire de vânzarea de bunuri.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You may have seen other platforms mention a threshold of 30 transactions or EUR 2,000 per year. That exclusion exists in DAC7 only for sellers of goods. For personal services there is no minimum volume or value: a business that provided at least one reportable appointment in a calendar year is reportable for that year.",
            ro: "Este posibil să fi văzut alte platforme menționând un prag de 30 de tranzacții sau 2.000 EUR pe an. Acea excludere există în DAC7 doar pentru vânzătorii de bunuri. Pentru serviciile personale nu există un volum sau o valoare minimă: o afacere care a prestat cel puțin o programare raportabilă într-un an calendaristic este raportabilă pentru acel an.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Reporting is also activity-based, not subscription-based: a Zavoia subscription alone does not make you reportable. What counts is marketplace activity — appointments booked by customers through the Zavoia marketplace. Appointments you create yourself in your calendar, walk-ins and clients who book with you directly are not platform-facilitated and are outside the platform's reporting.",
            ro: "Raportarea este bazată pe activitate, nu pe abonament: un abonament Zavoia, în sine, nu vă face raportabil. Contează activitatea din marketplace — programările făcute de clienți prin marketplace-ul Zavoia. Programările pe care le creați dumneavoastră în calendar, clienții veniți direct și cei care se programează direct la dumneavoastră nu sunt intermediate de platformă și rămân în afara raportării platformei.",
          },
        },
      ],
    },
    {
      id: "what-is-reported",
      title: {
        en: "What information would be reported",
        ro: "Ce informații ar fi raportate",
      },
      summary: {
        en: "Identification data about your business, plus quarterly marketplace activity.",
        ro: "Date de identificare despre afacerea dumneavoastră, plus activitatea trimestrială din marketplace.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "The regime prescribes exactly what a platform collects and reports. For a business organised as a legal entity (for example an SRL):",
            ro: "Regimul prevede exact ce colectează și raportează o platformă. Pentru o afacere organizată ca persoană juridică (de exemplu un SRL):",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "legal name, primary address and tax identification code (CUI), plus VAT number where you have one;",
              "the Trade Register registration number;",
              "the identifier of the financial account used for payments, where the platform holds one;",
              "the consideration attributable to your marketplace activity, broken down per calendar quarter, and the number of activities;",
              "any fees, commissions or taxes the platform withheld or charged you.",
            ],
            ro: [
              "denumirea legală, adresa principală și codul de identificare fiscală (CUI), plus codul de TVA, dacă aveți;",
              "numărul de înregistrare în Registrul Comerțului;",
              "identificatorul contului financiar folosit pentru plăți, dacă platforma îl deține;",
              "contraprestația aferentă activității dumneavoastră din marketplace, defalcată pe trimestre calendaristice, și numărul de activități;",
              "orice onorarii, comisioane sau taxe reținute sau percepute de platformă.",
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "If you operate as an individual professional (for example a PFA or întreprindere individuală), the regime treats you as a natural person, so the identification set is: first and last name, primary address, tax identification number (in Romania, the CNP), date of birth, and VAT number where you have one — plus the same activity and fee information.",
            ro: "Dacă activați ca profesionist individual (de exemplu PFA sau întreprindere individuală), regimul vă tratează ca persoană fizică, astfel că setul de identificare este: nume și prenume, adresa principală, numărul de identificare fiscală (în România, CNP-ul), data nașterii și codul de TVA, dacă aveți — plus aceleași informații despre activitate și onorarii.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Because Zavoia does not handle your money, the activity figure would be based on the prices listed and recorded for appointments booked through the marketplace — not on amounts actually collected by you at the venue. It is therefore an indication of platform-facilitated activity, not a statement of your income, and it is not a substitute for your own accounting.",
            ro: "Deoarece Zavoia nu vă gestionează banii, cifra de activitate s-ar baza pe prețurile listate și înregistrate pentru programările făcute prin marketplace — nu pe sumele efectiv încasate de dumneavoastră la sediu. Prin urmare, este o indicație a activității intermediate de platformă, nu o declarație a veniturilor dumneavoastră, și nu înlocuiește propria contabilitate.",
          },
        },
        {
          kind: "note",
          text: {
            en: "The exact basis for the activity figure (booked list prices of appointments marked completed vs. another measure) must be settled in the tax memo, together with the reliability of the manual COMPLETED status (decisions doc §6.4). Do not publish a specific methodology before that.",
            ro: "Baza exactă a cifrei de activitate (prețurile listate ale programărilor marcate ca finalizate vs. o altă măsură) trebuie stabilită în memo-ul fiscal, împreună cu fiabilitatea statutului manual FINALIZAT (documentul de decizii §6.4). Nu publicați o metodologie specifică înainte de aceasta.",
          },
        },
      ],
    },
    {
      id: "where-and-when",
      title: {
        en: "Where the data goes, and when",
        ro: "Unde ajung datele și când",
      },
      summary: {
        en: "To ANAF, once a year, by 31 January for the previous calendar year.",
        ro: "La ANAF, o dată pe an, până la 31 ianuarie pentru anul calendaristic anterior.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Reporting is annual, not continuous. A reporting platform operator established in Romania files with ANAF (form F7000, electronically signed) by 31 January for the preceding calendar year, and ANAF exchanges the relevant information with the tax authorities of other member states where a seller is resident there.",
            ro: "Raportarea este anuală, nu continuă. Un operator de platformă cu obligație de raportare, stabilit în România, depune la ANAF (formularul F7000, semnat electronic) până la 31 ianuarie pentru anul calendaristic anterior, iar ANAF face schimb de informații relevante cu autoritățile fiscale din alte state membre, când vânzătorul este rezident acolo.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Collecting and verifying the identification data, by contrast, happens continuously — at listing activation and whenever your details change.",
            ro: "În schimb, colectarea și verificarea datelor de identificare au loc continuu — la activarea listării și ori de câte ori datele dumneavoastră se modifică.",
          },
        },
      ],
    },
    {
      id: "what-you-do",
      title: {
        en: "What this means for you",
        ro: "Ce înseamnă pentru dumneavoastră",
      },
      summary: {
        en: "Keep your data accurate; your own tax obligations are unchanged.",
        ro: "Mențineți datele corecte; obligațiile dumneavoastră fiscale rămân neschimbate.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Provide accurate identification data when you activate your listing, and update it promptly when anything changes (legal form, name, address, registration, VAT status).",
              "Keep declaring your income and issuing fiscal receipts and invoices exactly as you do now — DAC7 changes none of this. The reported figure is not a tax return and is not calculated as one.",
              "If you do not provide the required data, the regime obliges the platform to remind you twice and, after 60 days, to restrict your listing or withhold amounts until you do. We would always tell you what is missing before that point.",
              "You can ask us at any time what data about your business we hold for this purpose, and receive a copy.",
              "If you think a reported figure is wrong, contact us — we will check it and, where a correction is warranted, file a corrected report.",
            ],
            ro: [
              "Furnizați date de identificare corecte la activarea listării și actualizați-le prompt la orice schimbare (formă juridică, denumire, adresă, înregistrare, statut TVA).",
              "Continuați să vă declarați veniturile și să emiteți bonuri fiscale și facturi exact ca până acum — DAC7 nu schimbă nimic din toate acestea. Cifra raportată nu este o declarație fiscală și nu se calculează ca atare.",
              "Dacă nu furnizați datele necesare, regimul obligă platforma să vă reamintească de două ori și, după 60 de zile, să vă restricționeze listarea sau să rețină sume până când le furnizați. V-am comunica întotdeauna ce lipsește înainte de acel moment.",
              "Ne puteți întreba oricând ce date despre afacerea dumneavoastră deținem în acest scop și puteți primi o copie.",
              "Dacă apreciați că o cifră raportată este greșită, contactați-ne — o verificăm și, unde se justifică o corecție, depunem un raport rectificativ.",
            ],
          },
        },
      ],
    },
    {
      id: "privacy",
      title: {
        en: "Privacy and this data",
        ro: "Confidențialitatea acestor date",
      },
      summary: {
        en: "Collected for a legal purpose, used only for it.",
        ro: "Colectate pentru un scop legal, folosite doar pentru acesta.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Where this reporting applies, the identification data is collected because the law requires it, and it is used only for that purpose — identifying you as a seller and filing the annual report. It is not used for marketing, ranking or any commercial purpose. Personal identifiers of individual professionals (such as the CNP) are handled with restricted access and the retention the tax rules require. Your rights and our contact details are in the Privacy Notice.",
            ro: "Acolo unde această raportare se aplică, datele de identificare sunt colectate pentru că legea o cere și sunt folosite doar în acest scop — identificarea dumneavoastră ca vânzător și depunerea raportului anual. Nu sunt folosite pentru marketing, ierarhizare sau vreun scop comercial. Identificatorii personali ai profesioniștilor individuali (precum CNP-ul) sunt gestionați cu acces restricționat și cu perioada de păstrare cerută de regulile fiscale. Drepturile dumneavoastră și datele noastre de contact sunt în Politica de confidențialitate.",
          },
        },
        {
          kind: "note",
          text: {
            en: "If the tax memo confirms scope, add the DAC7 legal-obligation purpose (with CNP/CUI collection and the tax-law retention period) to the Privacy Notice §purposes-legal-bases — it was deliberately left out while the classification is open. Legea 190/2018 permits CNP processing on a legal-obligation basis; scope it to this purpose only.",
            ro: "Dacă memo-ul fiscal confirmă includerea, adăugați scopul de obligație legală DAC7 (cu colectarea CNP/CUI și perioada de păstrare cerută de legislația fiscală) în Politica de confidențialitate §scopuri-și-temeiuri — a fost lăsat deliberat afară cât timp clasificarea este deschisă. Legea 190/2018 permite prelucrarea CNP pe temei de obligație legală; limitați-o strict la acest scop.",
          },
        },
      ],
    },
    {
      id: "questions",
      title: { en: "Questions", ro: "Întrebări" },
      summary: {
        en: "Where to ask — and where not to.",
        ro: "Unde întrebați — și unde nu.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "For questions about what data we hold or report about your business, contact us through the Help Centre. For questions about your own tax position — how to declare income, what regime applies to you, VAT registration — please ask your accountant or ANAF: we cannot give tax advice, and nothing on this page is tax advice.",
            ro: "Pentru întrebări despre ce date deținem sau raportăm despre afacerea dumneavoastră, contactați-ne prin Centrul de ajutor. Pentru întrebări despre propria situație fiscală — cum vă declarați veniturile, ce regim vi se aplică, înregistrarea în scopuri de TVA — adresați-vă contabilului dumneavoastră sau ANAF: nu putem oferi consultanță fiscală, iar nimic de pe această pagină nu constituie consultanță fiscală.",
          },
        },
      ],
    },
  ],
};
