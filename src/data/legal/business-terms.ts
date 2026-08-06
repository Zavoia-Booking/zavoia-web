import type { LegalDocument } from "./types";

export const businessTerms: LegalDocument = {
  slug: "business-terms",
  audience: "business",
  title: {
    en: "Business Terms (SaaS Agreement)",
    ro: "Termeni pentru afaceri (Contract SaaS)",
  },
  shortTitle: { en: "Business terms", ro: "Termeni afaceri" },
  description: {
    en: "The agreement between Zavoia and the businesses using the platform — plans, billing, team seats, data protection and termination.",
    ro: "Acordul dintre Zavoia și afacerile care folosesc platforma — planuri, facturare, locuri de echipă, protecția datelor și încetare.",
  },
  status: "draft",
  sections: [
    {
      id: "parties-professional-use",
      blueprintRef: "A1 / A2",
      title: {
        en: "Parties and professional use",
        ro: "Părțile și utilizarea profesională",
      },
      summary: {
        en: "The customer is the business; the service is for professional use.",
        ro: "Clientul este afacerea; serviciul este pentru uz profesional.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "This agreement is between the company on the Company Information page (“Zavoia”) and the customer of a business workspace: either a legal entity (represented by the accepting owner, who warrants authority to bind it) or an individual acting in a professional capacity, in which case that individual is the contracting party personally. The acceptance record captures which of the two applies.",
            ro: "Acest acord se încheie între societatea de pe pagina Informații despre companie („Zavoia”) și clientul unui spațiu de lucru business: fie o persoană juridică (reprezentată de proprietarul care acceptă și care garantează că are autoritatea de a o angaja), fie o persoană fizică acționând în calitate profesională, caz în care acea persoană este parte contractantă personal. Evidența acceptării înregistrează care dintre cele două situații se aplică.",
          },
        },
        {
          kind: "p",
          text: {
            en: "You confirm you are acquiring the service for the purposes of carrying on a business activity, not for personal, household or family purposes.",
            ro: "Confirmați că achiziționați serviciul în scopul desfășurării unei activități profesionale, nu în scopuri personale, casnice sau familiale.",
          },
        },
      ],
    },
    {
      id: "account-acceptance",
      blueprintRef: "A3 / §0.2",
      title: { en: "Account and acceptance", ro: "Cont și acceptare" },
      summary: {
        en: "Account terms bind at signup; this agreement binds at workspace creation.",
        ro: "Termenii de cont se aplică la înregistrare; acest acord — la crearea spațiului de lucru.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Creating a personal account is governed by the Account & Authorized User Terms. This SaaS agreement binds when you create your business workspace and your trial activates. Acceptance happens through an explicit action on every path (email registration, Google sign-in, invitation completion), and we record the accepted document version, the accepting user, the represented business and the timestamp.",
            ro: "Crearea unui cont personal este guvernată de Termenii contului și ai utilizatorilor autorizați. Acest contract SaaS se aplică din momentul creării spațiului de lucru business și activării perioadei de probă. Acceptarea are loc printr-o acțiune explicită pe fiecare cale (înregistrare cu email, autentificare Google, finalizarea invitației), iar noi înregistrăm versiunea documentului acceptat, utilizatorul care acceptă, afacerea reprezentată și data și ora.",
          },
        },
        {
          kind: "note",
          text: {
            en: "IMPL (blueprint §0.2, verified 1 Aug 2026): the acceptance-evidence record itself (version, user, workspace, timestamp) does not exist in code at all, the Google-signup path bypasses the terms checkbox, and team-invitation links auto-accept on open. All must be built/fixed before the acceptance and recording statements in this agreement are true — including the professional-purpose statement at workspace creation (decisions doc §9.3) and invitee acceptance in the Team section.",
            ro: "IMPL (blueprint §0.2, verificat 1 aug. 2026): evidența acceptării (versiune, utilizator, spațiu de lucru, dată/oră) nu există deloc în cod, fluxul de înregistrare cu Google ocolește bifa de termeni, iar linkurile de invitație acceptă automat la deschidere. Toate trebuie construite/corectate înainte ca declarațiile de acceptare și înregistrare din acest acord să fie adevărate — inclusiv declarația de scop profesional la crearea spațiului de lucru (documentul de decizii §9.3) și acceptarea de către invitați din secțiunea Echipă.",
          },
        },
      ],
    },
    {
      id: "services-plans",
      blueprintRef: "A4",
      title: { en: "Services and plans", ro: "Servicii și planuri" },
      summary: {
        en: "What each plan includes — described as the product actually is.",
        ro: "Ce include fiecare plan — descris așa cum este produsul în realitate.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Subscription plans: Standard, Plus and Custom, with the limits and features presented to you at the time of purchase (Custom plans are agreed individually); Lifetime Deal workspaces keep their purchased entitlements and can buy additional paid seats.",
              "Add-ons: additional team seats; SMS credit packs (purchased credits do not expire); one-time Website Builder purchases on eligible plans.",
              "The marketplace listing is governed additionally by the Marketplace Provider Terms, accepted when you activate your listing.",
              "We continuously improve the service and may introduce new features; features that materially affect your rights or obligations follow the change-notice rules in this agreement.",
            ],
            ro: [
              "Planuri de abonament: Standard, Plus și Custom, cu limitele și funcțiile prezentate la momentul achiziției (planurile Custom se convin individual); spațiile de lucru Lifetime Deal își păstrează drepturile achiziționate și pot cumpăra locuri suplimentare plătite.",
              "Suplimente: locuri de echipă suplimentare; pachete de credite SMS (creditele achiziționate nu expiră); achiziții unice Website Builder pe planurile eligibile.",
              "Listarea în marketplace este guvernată suplimentar de Termenii pentru furnizori, acceptați la activarea listării.",
              "Îmbunătățim continuu serviciul și putem introduce funcții noi; funcțiile care vă afectează semnificativ drepturile sau obligațiile urmează regulile de notificare a modificărilor din acest acord.",
            ],
          },
        },
        {
          kind: "note",
          text: {
            en: "Accuracy gates (blueprint A4 + audit §10.3): do not promise deposits, payouts, client import or bulk export — they are not built. Seat billing must be reconciled: marketing describes 'bookable staff' but the code bills all non-owner seats; the final clause must state whichever the business confirms as true.",
            ro: "Gate-uri de acuratețe (blueprint A4 + audit §10.3): nu promiteți avansuri, plăți către afaceri, importul clienților sau exportul în masă — nu sunt construite. Facturarea locurilor trebuie clarificată: marketingul descrie „personal programabil”, dar codul facturează toate locurile non-proprietar; clauza finală trebuie să reflecte varianta confirmată de business ca adevărată.",
          },
        },
      ],
    },
    {
      id: "billing",
      blueprintRef: "A5",
      title: {
        en: "Billing, trial and renewal",
        ro: "Facturare, probă și reînnoire",
      },
      summary: {
        en: "Stripe billing, 14-day trial, notice for price changes.",
        ro: "Facturare prin Stripe, probă de 14 zile, notificare pentru modificări de preț.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "New workspaces start with a 14-day free trial; no charge before the trial converts to a paid subscription.",
              "Subscriptions are billed through Stripe and renew automatically for successive periods until cancelled; plan changes are prorated per the rules shown at the time of change.",
              "Invoices are issued electronically [via Oblio] to the billing details you provide; you must keep billing data (including CUI for companies) accurate.",
              "Price changes are announced at least [30] days in advance; if you do not agree, you can cancel before the new price takes effect.",
              "If you dispute an invoice, tell us within [10] days of receiving it; undisputed non-payment can lead to suspension per the Suspension and termination section.",
            ],
            ro: [
              "Spațiile de lucru noi încep cu o perioadă de probă gratuită de 14 zile; nicio plată înainte ca proba să devină abonament plătit.",
              "Abonamentele se facturează prin Stripe și se reînnoiesc automat pentru perioade succesive până la anulare; schimbările de plan se calculează pro-rata conform regulilor afișate la momentul schimbării.",
              "Facturile se emit electronic [prin Oblio] la datele de facturare furnizate; trebuie să mențineți datele de facturare (inclusiv CUI pentru societăți) corecte.",
              "Modificările de preț se anunță cu cel puțin [30] de zile înainte; dacă nu sunteți de acord, puteți anula înainte ca noul preț să intre în vigoare.",
              "Dacă contestați o factură, anunțați-ne în [10] zile de la primire; neplata necontestată poate duce la suspendare conform secțiunii Suspendare și încetare.",
            ],
          },
        },
        {
          kind: "note",
          text: {
            en: "GATES: VAT treatment and invoicing details to be confirmed with the accountant (blueprint A5). Bracketed notice periods are proposals — confirm. E-invoicing: per blueprint, B2C e-Factura uses the 13-zeros identifier, never CNP.",
            ro: "GATE-uri: tratamentul TVA și detaliile de facturare de confirmat cu contabilul (blueprint A5). Termenele dintre paranteze sunt propuneri — de confirmat. E-facturare: conform blueprint, e-Factura B2C folosește identificatorul cu 13 zerouri, niciodată CNP.",
          },
        },
      ],
    },
    {
      id: "team-authorized-users",
      blueprintRef: "A8",
      title: {
        en: "Team members and authorized users",
        ro: "Membrii echipei și utilizatorii autorizați",
      },
      summary: {
        en: "You manage who has access; you answer for their use.",
        ro: "Dumneavoastră gestionați cine are acces; răspundeți pentru utilizarea lor.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You can invite team members into your workspace; each invitee accepts the Account & Authorized User Terms through an explicit action when completing the invitation. Additional seats are billed per your plan. You are responsible for your users' acts and omissions in the workspace, for granting appropriate roles, for not sharing logins (including to avoid seat billing), and for removing access when someone leaves.",
            ro: "Puteți invita membri de echipă în spațiul de lucru; fiecare persoană invitată acceptă Termenii contului și ai utilizatorilor autorizați printr-o acțiune explicită la finalizarea invitației. Locurile suplimentare se facturează conform planului. Răspundeți pentru actele și omisiunile utilizatorilor dumneavoastră în spațiul de lucru, pentru acordarea rolurilor potrivite, pentru nepartajarea conturilor (inclusiv pentru a evita facturarea locurilor) și pentru retragerea accesului când cineva pleacă.",
          },
        },
      ],
    },
    {
      id: "content-ip",
      blueprintRef: "A9",
      title: {
        en: "Content and intellectual property",
        ro: "Conținut și proprietate intelectuală",
      },
      summary: {
        en: "Your content and client records stay yours.",
        ro: "Conținutul și evidențele dumneavoastră de clienți rămân ale dumneavoastră.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You keep all rights in your content and your client records. You grant Zavoia a non-exclusive licence to host, display and process them as needed to provide the service (including your public listing, per the Provider Terms). Zavoia keeps all rights in the platform and its software. We do not acquire ownership of your client database.",
            ro: "Păstrați toate drepturile asupra conținutului și evidențelor dumneavoastră de clienți. Acordați Zavoia o licență neexclusivă de a le găzdui, afișa și prelucra în măsura necesară furnizării serviciului (inclusiv listarea publică, conform Termenilor pentru furnizori). Zavoia păstrează toate drepturile asupra platformei și software-ului său. Nu dobândim proprietatea asupra bazei dumneavoastră de date de clienți.",
          },
        },
      ],
    },
    {
      id: "data-protection",
      blueprintRef: "A10",
      title: { en: "Data protection", ro: "Protecția datelor" },
      summary: {
        en: "Roles per activity; the DPA governs processing on your behalf.",
        ro: "Roluri pe activități; DPA guvernează prelucrarea în numele dumneavoastră.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "For client records you enter and manage in your workspace, you are the controller and Zavoia processes on your behalf under the Data Processing Addendum, which forms part of this agreement. For platform-level processing (marketplace accounts and bookings, reviews, security, support, billing), Zavoia is an independent controller as described in the Privacy Notice. Each party assists the other with data-subject requests and regulator inquiries concerning shared flows, and you notify us without undue delay — at the latest within 24 hours — of any security incident affecting data in your workspace.",
            ro: "Pentru evidențele de clienți pe care le introduceți și gestionați în spațiul de lucru, dumneavoastră sunteți operatorul, iar Zavoia prelucrează în numele dumneavoastră conform Acordului de prelucrare a datelor, care face parte din acest acord. Pentru prelucrările la nivel de platformă (conturi și programări din marketplace, recenzii, securitate, asistență, facturare), Zavoia este operator independent, conform Politicii de confidențialitate. Fiecare parte o asistă pe cealaltă la cererile persoanelor vizate și la solicitările autorităților privind fluxurile comune, iar dumneavoastră ne notificați fără întârzieri nejustificate — cel târziu în 24 de ore — orice incident de securitate care afectează datele din spațiul de lucru.",
          },
        },
      ],
    },
    {
      id: "suspension-termination",
      blueprintRef: "A11",
      title: {
        en: "Suspension and termination",
        ro: "Suspendare și încetare",
      },
      summary: {
        en: "Enumerated grounds, reasons given, your data stays accessible.",
        ro: "Motive enumerate, motivare comunicată, datele rămân accesibile.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "You can cancel your subscription at any time, effective at the end of the paid period.",
              "We may suspend the workspace for: sustained non-payment after notice, serious or repeated breach of this agreement, security threats, or where the law requires it. We give you the reasons and, except where immediate action is legally required, prior notice and a chance to remedy.",
              "We may terminate for material breach not remedied after notice, or with [30] days' notice if we discontinue the service.",
              "On subscription lapse or termination, your workspace data is preserved and you keep read-only access (writes are blocked); your marketplace listing is unpublished. The marketplace-specific rules (including reinstatement and data re-access) are in the Provider Terms. [Defined retention window and export options — decision pending, see note.]",
            ],
            ro: [
              "Puteți anula abonamentul oricând, cu efect la finalul perioadei plătite.",
              "Putem suspenda spațiul de lucru pentru: neplată persistentă după notificare, încălcare gravă sau repetată a acordului, amenințări de securitate sau când legea o impune. Vă comunicăm motivele și, cu excepția cazurilor în care legea impune acțiune imediată, o notificare prealabilă și posibilitatea de remediere.",
              "Putem rezilia pentru încălcare esențială neremediată după notificare, sau cu preaviz de [30] de zile dacă întrerupem serviciul.",
              "La expirarea abonamentului sau la încetare, datele spațiului de lucru sunt păstrate și mențineți acces de citire (scrierile sunt blocate); listarea din marketplace este retrasă de la publicare. Regulile specifice marketplace-ului (inclusiv restabilirea și reaccesarea datelor) sunt în Termenii pentru furnizori. [Fereastra definită de păstrare și opțiunile de export — decizie în curs, vezi nota.]",
            ],
          },
        },
        {
          kind: "note",
          text: {
            en: "Verified 1 Aug 2026 (subscription.guard.ts): lapse = indefinite read-only access, writes blocked, no automated deletion, no bulk export (individual customer-history PDF only). The read-only statement reflects real behaviour. Still to decide/build: a defined retention window, export tooling, and a deletion policy — before promising any of them.",
            ro: "Verificat 1 aug. 2026 (subscription.guard.ts): expirare = acces de citire pe durată nedeterminată, scrieri blocate, fără ștergere automată, fără export în masă (doar PDF-ul cu istoricul individual al unui client). Declarația de acces de citire reflectă comportamentul real. Rămân de decis/construit: o fereastră definită de păstrare, instrumente de export și o politică de ștergere — înainte de a promite oricare dintre ele.",
          },
        },
      ],
    },
    {
      id: "liability",
      blueprintRef: "A11–A15",
      title: { en: "Liability", ro: "Răspundere" },
      summary: {
        en: "Caps proportionate to fees, with statutory carve-outs.",
        ro: "Plafoane proporționale cu taxele, cu excepțiile legale.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Zavoia provides the platform with professional diligence but does not guarantee uninterrupted operation. Each party's aggregate liability under this agreement is capped at the fees you paid in the 12 months preceding the event. The cap does not apply where Romanian law does not allow limitation — including liability for intent or gross negligence, or for death or personal injury.",
            ro: "Zavoia furnizează platforma cu diligență profesională, dar nu garantează funcționarea neîntreruptă. Răspunderea totală a fiecărei părți în temeiul acestui acord este plafonată la taxele plătite în cele 12 luni anterioare evenimentului. Plafonul nu se aplică acolo unde legea română nu permite limitarea — inclusiv pentru intenție sau culpă gravă, ori pentru deces sau vătămare corporală.",
          },
        },
        {
          kind: "note",
          text: {
            en: "Counsel drafting required (blueprint A11–A15): the cap structure is permissible in principle under the Civil Code but enforceability needs professional drafting, not template text.",
            ro: "Necesită redactare de către avocați (blueprint A11–A15): structura plafonului este permisă în principiu de Codul civil, dar aplicabilitatea necesită redactare profesionistă, nu text șablon.",
          },
        },
      ],
    },
    {
      id: "changes",
      blueprintRef: "A13 / P2B art. 3(2)",
      title: {
        en: "Changes to these terms",
        ro: "Modificarea acestor termeni",
      },
      summary: {
        en: "15-day minimum notice, no retroactivity, termination right.",
        ro: "Preaviz minim de 15 zile, fără retroactivitate, drept de reziliere.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "We change this agreement by notice on a durable medium (email or in-product with email confirmation) at least 15 days before the change takes effect — longer where you need technical or commercial adaptation. Changes are not retroactive. If a change materially affects you, you may terminate before it takes effect. Shorter notice applies only where a change is required by law or addresses an imminent security risk.",
            ro: "Modificăm acest acord prin notificare pe suport durabil (email sau în produs, cu confirmare pe email) cu cel puțin 15 zile înainte ca modificarea să intre în vigoare — mai mult când aveți nevoie de adaptare tehnică sau comercială. Modificările nu sunt retroactive. Dacă o modificare vă afectează semnificativ, puteți rezilia înainte de intrarea ei în vigoare. Un preaviz mai scurt se aplică doar când o modificare este impusă de lege sau vizează un risc iminent de securitate.",
          },
        },
      ],
    },
    {
      id: "general-provisions",
      blueprintRef: "partner-terms §22/§24h",
      title: { en: "General provisions", ro: "Dispoziții generale" },
      summary: {
        en: "Payment set-off, assignment, notices, survival.",
        ro: "Compensarea plăților, cesiunea, notificările, supraviețuirea clauzelor.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "No set-off: fees due under this agreement are paid without set-off against claims you may have against Zavoia, except where a court decision or our written agreement establishes the claim.",
              "Assignment: you may not assign this agreement without our consent; a change of control of your business does not require consent, but tell us promptly so we can keep verification data accurate (see the Provider Terms). Zavoia may assign this agreement within a corporate reorganization or sale, with notice to you and without reducing your rights.",
              "Notices: we send notices to your workspace and the owner's email address; you send notices to the contact on the Company Information page. Email counts as a durable medium.",
              "Survival: clauses that by nature outlast termination — data protection and return, confidentiality, liability, payment of accrued fees, governing law — survive the end of this agreement.",
              "Entire agreement: this agreement together with the documents it references (Order/plan details, Provider Terms, Account Terms, DPA) is the whole agreement for the service; it does not exclude liability for fraud.",
              "If a clause is found invalid, the rest remains in force; the invalid clause is replaced by the valid rule closest to its purpose.",
            ],
            ro: [
              "Fără compensare: taxele datorate în temeiul acestui acord se plătesc fără compensare cu pretenții pe care le-ați putea avea față de Zavoia, cu excepția cazului în care o hotărâre judecătorească sau acordul nostru scris stabilește pretenția.",
              "Cesiune: nu puteți cesiona acest acord fără acordul nostru; o schimbare a controlului afacerii nu necesită acord, dar anunțați-ne prompt pentru a menține datele de verificare corecte (vezi Termenii pentru furnizori). Zavoia poate cesiona acest acord în cadrul unei reorganizări sau vânzări corporative, cu notificare și fără a vă reduce drepturile.",
              "Notificări: vă trimitem notificările în spațiul de lucru și la adresa de email a proprietarului; ne trimiteți notificările la contactul de pe pagina Informații despre companie. Emailul contează ca suport durabil.",
              "Supraviețuire: clauzele care prin natura lor depășesc încetarea — protecția și returnarea datelor, confidențialitatea, răspunderea, plata taxelor acumulate, legea aplicabilă — supraviețuiesc încetării acordului.",
              "Întregul acord: acest acord, împreună cu documentele la care face trimitere (detaliile planului, Termenii pentru furnizori, Termenii de cont, DPA), reprezintă întregul acord pentru serviciu; nu exclude răspunderea pentru fraudă.",
              "Dacă o clauză este constatată nulă, restul rămâne în vigoare; clauza nulă se înlocuiește cu regula validă cea mai apropiată de scopul ei.",
            ],
          },
        },
      ],
    },
    {
      id: "law",
      blueprintRef: "A14 / A15",
      title: { en: "Governing law", ro: "Legea aplicabilă" },
      summary: {
        en: "Romanian law and courts; Romanian text prevails.",
        ro: "Legea și instanțele române; textul român prevalează.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "This agreement is governed by Romanian law; disputes go to the competent Romanian courts. The agreement is concluded in Romanian and English; the Romanian text prevails. The contracting formalities of Legea 365/2002 (technical steps, error correction, storage of the contract) will be presented in the product at the point of contracting.",
            ro: "Acest acord este guvernat de legea română; litigiile revin instanțelor române competente. Acordul se încheie în română și engleză; textul în limba română prevalează. Formalitățile de contractare din Legea 365/2002 (etapele tehnice, corectarea erorilor, stocarea contractului) vor fi prezentate în produs la momentul contractării.",
          },
        },
        {
          kind: "note",
          text: {
            en: "IMPL (audit §13): the dashboard's in-product legal screens are placeholders today (Lorem Ipsum terms, fabricated company details in the native shell) — the L365/2002 formality presentation must be built before contracting under this agreement.",
            ro: "IMPL (audit §13): ecranele legale din produs sunt în prezent substituenți (termeni Lorem Ipsum, detalii de companie fictive în aplicația nativă) — prezentarea formalităților L365/2002 trebuie construită înainte de contractarea sub acest acord.",
          },
        },
      ],
    },
  ],
};
