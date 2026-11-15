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
  status: "published",
  effectiveDate: "2026-11-15",
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
            en: "This agreement is between the company on the Company Information page (“Zavoia”) and the customer of a business workspace: either a legal entity (represented by the accepting owner, who warrants authority to bind it) or an individual acting in a professional capacity, in which case that individual is the contracting party personally. The billing details you give us before your first payment show which of the two applies.",
            ro: "Acest acord se încheie între societatea de pe pagina Informații despre companie („Zavoia”) și clientul unui spațiu de lucru pentru afaceri: fie o persoană juridică (reprezentată de proprietarul care acceptă și care garantează că are autoritatea de a o angaja), fie o persoană fizică acționând în calitate profesională, caz în care acea persoană este parte contractantă personal. Datele de facturare pe care ni le furnizați înainte de prima plată arată care dintre cele două situații se aplică.",
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
        en: "A ticked box at sign-up; applies once you create your business.",
        ro: "O căsuță bifată la înregistrare; se aplică după ce vă creați afacerea.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Your personal account is governed by the Terms of Use. You accept this agreement expressly by ticking the box when you sign up as a business owner, or when you add a business to an existing Zavoia account, including its clauses on automatic renewal, suspension and termination, liability, no set-off, governing law and courts. It applies from when you create your business in Zavoia, which also starts your free trial.",
            ro: "Contul dumneavoastră personal este guvernat de Termenii de utilizare. Acceptați în mod expres acest acord bifând căsuța când vă înregistrați ca proprietar de afacere sau când adăugați o afacere la un cont Zavoia existent, inclusiv clauzele sale privind reînnoirea automată, suspendarea și încetarea, răspunderea, excluderea compensării, legea aplicabilă și instanțele competente. Acordul se aplică din momentul în care vă creați afacerea în Zavoia, moment în care începe și perioada de probă gratuită.",
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
              "Subscription plans: Base, Plus and Custom, with the limits and features presented to you at the time of purchase (Custom plans are agreed individually); workspaces with Lifetime access keep their purchased entitlements and can buy additional paid seats.",
              "Add-ons: additional team seats; SMS credit packs (purchased credits do not expire); premium Web Studio styles, available on Plus as one-time purchases.",
              "Your marketplace listing is additionally governed by the Marketplace Provider Terms, which form part of this agreement.",
              "We continuously improve the service and may introduce new features; features that materially affect your rights or obligations follow the change-notice rules in this agreement.",
            ],
            ro: [
              "Planuri de abonament: Base, Plus și Personalizat, cu limitele și funcțiile prezentate la momentul achiziției (planurile personalizate se convin individual); spațiile de lucru cu Acces pe viață își păstrează drepturile achiziționate și pot cumpăra locuri suplimentare plătite.",
              "Suplimente: locuri de echipă suplimentare; pachete de credite SMS (creditele achiziționate nu expiră); stiluri premium Web Studio, disponibile pe planul Plus ca achiziții unice.",
              "Listarea în marketplace este guvernată suplimentar de Termenii pentru furnizori, care fac parte din acest acord.",
              "Îmbunătățim continuu serviciul și putem introduce funcții noi; funcțiile care vă afectează semnificativ drepturile sau obligațiile urmează regulile de notificare a modificărilor din acest acord.",
            ],
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
              "Invoices are issued electronically to the billing details you provide; you must keep billing data (including the fiscal code for companies) accurate.",
              "Price changes are announced at least 30 days in advance; if you do not agree, you can cancel before the new price takes effect.",
              "If you dispute an invoice, tell us within 30 days of receiving it; undisputed non-payment can lead to suspension per the Suspension and termination section.",
            ],
            ro: [
              "Spațiile de lucru noi încep cu o perioadă de probă gratuită de 14 zile; nu se percepe nicio plată înainte ca perioada de probă să devină abonament plătit.",
              "Abonamentele se facturează prin Stripe și se reînnoiesc automat pentru perioade succesive până la anulare; schimbările de plan se calculează pro-rata conform regulilor afișate la momentul schimbării.",
              "Facturile se emit electronic la datele de facturare furnizate; trebuie să mențineți datele de facturare (inclusiv CUI pentru societăți) corecte.",
              "Modificările de preț se anunță cu cel puțin 30 de zile înainte; dacă nu sunteți de acord, puteți anula înainte ca noul preț să intre în vigoare.",
              "Dacă contestați o factură, anunțați-ne în 30 de zile de la primire; neplata necontestată poate duce la suspendare conform secțiunii Suspendare și încetare.",
            ],
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
            en: "You can invite team members into your workspace; each invitee accepts the Account & Authorized User Terms through an explicit action when completing the invitation. Each team member besides you uses a team seat, billed per your plan; your own account is included. You are responsible for your users' acts and omissions in the workspace, for granting appropriate roles, for not sharing logins (including to avoid seat billing), and for removing access when someone leaves.",
            ro: "Puteți invita membri de echipă în spațiul de lucru; fiecare persoană invitată acceptă Termenii contului și ai utilizatorilor autorizați printr-o acțiune explicită la finalizarea invitației. Fiecare membru al echipei în afară de dumneavoastră ocupă un loc de echipă, facturat conform planului; contul dumneavoastră este inclus. Răspundeți pentru actele și omisiunile utilizatorilor dumneavoastră în spațiul de lucru, pentru acordarea rolurilor potrivite, pentru nepartajarea conturilor (inclusiv pentru a evita facturarea locurilor) și pentru retragerea accesului când cineva pleacă.",
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
        ro: "Roluri pe activități; Acordul de prelucrare a datelor guvernează prelucrarea în numele dumneavoastră.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "For client records and team schedules you enter and manage in your workspace, you are the controller and Zavoia processes on your behalf under the Data Processing Addendum, which forms part of this agreement. For platform-level processing (marketplace accounts and bookings, reviews, security, support, billing), Zavoia is an independent controller as described in the Privacy Notice. Each party assists the other with data-subject requests and regulator inquiries concerning shared flows, and you notify us without undue delay — at the latest within 24 hours — of any security incident affecting data in your workspace.",
            ro: "Pentru evidențele de clienți și programul echipei pe care le introduceți și gestionați în spațiul de lucru, dumneavoastră sunteți operatorul, iar Zavoia prelucrează în numele dumneavoastră conform Acordului de prelucrare a datelor, care face parte din acest acord. Pentru prelucrările la nivel de platformă (conturi și programări din marketplace, recenzii, securitate, asistență, facturare), Zavoia este operator independent, conform Politicii de confidențialitate. Fiecare parte o asistă pe cealaltă la cererile persoanelor vizate și la solicitările autorităților privind fluxurile comune, iar dumneavoastră ne notificați fără întârzieri nejustificate — cel târziu în 24 de ore — orice incident de securitate care afectează datele din spațiul de lucru.",
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
              "We may terminate for material breach not remedied after notice, or with 30 days' notice if we discontinue the service. If a termination also ends your marketplace listing, the Provider Terms apply: 30 days' notice with reasons, except in the cases they list.",
              "On subscription lapse or termination, your workspace data is preserved and you keep read-only access (writes are blocked); your marketplace listing is unpublished. The marketplace-specific rules (including reinstatement and data re-access) are in the Provider Terms. Your workspace data stays available, read-only, until you delete your account, which deletes the business and everything in it (see Deleting your account). You can download each client's history as a PDF; there is no bulk export.",
            ],
            ro: [
              "Puteți anula abonamentul oricând, cu efect la finalul perioadei plătite.",
              "Putem suspenda spațiul de lucru pentru: neplată persistentă după notificare, încălcare gravă sau repetată a acordului, amenințări de securitate sau când legea o impune. Vă comunicăm motivele și, cu excepția cazurilor în care legea impune acțiune imediată, vă notificăm în prealabil și vă oferim posibilitatea de remediere.",
              "Putem rezilia pentru încălcare esențială neremediată după notificare, sau cu preaviz de 30 de zile dacă întrerupem serviciul. Dacă încetarea duce și la retragerea listării din marketplace, se aplică Termenii pentru furnizori: preaviz de 30 de zile, cu motivare, cu excepția cazurilor prevăzute acolo.",
              "La expirarea abonamentului sau la încetare, datele spațiului de lucru sunt păstrate și mențineți acces de citire (modificările sunt blocate); listarea din marketplace este retrasă de la publicare. Regulile specifice marketplace-ului (inclusiv restabilirea și reaccesarea datelor) sunt în Termenii pentru furnizori. Datele spațiului de lucru rămân disponibile, în regim de citire, până când vă ștergeți contul, ceea ce șterge afacerea și tot conținutul ei (vezi Ștergerea contului). Puteți descărca istoricul fiecărui client ca PDF; nu există export în masă.",
            ],
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
            en: "We change this agreement by notice on a durable medium (email or in-product with email confirmation) at least 15 days before the change takes effect — longer where you need technical or commercial adaptation. Changes are not retroactive. If you do not accept a change, you may terminate this agreement before the change takes effect. Shorter notice applies only where a change is required by law or addresses an imminent security or fraud risk.",
            ro: "Modificăm acest acord prin notificare pe suport durabil (email sau în produs, cu confirmare pe email) cu cel puțin 15 zile înainte ca modificarea să intre în vigoare — mai mult când aveți nevoie de adaptare tehnică sau comercială. Modificările nu sunt retroactive. Dacă nu acceptați o modificare, puteți rezilia acest acord înainte de intrarea ei în vigoare. Un preaviz mai scurt se aplică doar când o modificare este impusă de lege sau vizează un risc iminent de securitate sau de fraudă.",
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
              "Entire agreement: this agreement together with the documents it references (plan details, Provider Terms, DPA) is the whole agreement for the service; it does not exclude liability for fraud.",
              "If a clause is found invalid, the rest remains in force; the invalid clause is replaced by the valid rule closest to its purpose.",
            ],
            ro: [
              "Fără compensare: taxele datorate în temeiul acestui acord se plătesc fără compensare cu pretenții pe care le-ați putea avea față de Zavoia, cu excepția cazului în care o hotărâre judecătorească sau acordul nostru scris stabilește pretenția.",
              "Cesiune: nu puteți cesiona acest acord fără acordul nostru; o schimbare a controlului afacerii nu necesită acord, dar anunțați-ne prompt pentru a menține datele de verificare corecte (vezi Termenii pentru furnizori). Zavoia poate cesiona acest acord în cadrul unei reorganizări sau vânzări corporative, cu notificare și fără a vă reduce drepturile.",
              "Notificări: vă trimitem notificările în spațiul de lucru și la adresa de email a proprietarului; ne trimiteți notificările la contactul de pe pagina Informații despre companie. Emailul contează ca suport durabil.",
              "Supraviețuire: clauzele care prin natura lor depășesc încetarea — protecția și returnarea datelor, confidențialitatea, răspunderea, plata taxelor acumulate, legea aplicabilă — supraviețuiesc încetării acordului.",
              "Întregul acord: acest acord, împreună cu documentele la care face trimitere (detaliile planului, Termenii pentru furnizori, Acordul de prelucrare a datelor), reprezintă întregul acord pentru serviciu; nu exclude răspunderea pentru fraudă.",
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
            en: "This agreement is governed by Romanian law; disputes go to the competent Romanian courts. The agreement is concluded in Romanian and English; the Romanian text prevails. How the contract is concluded (Law 365/2002 art. 8): you sign up and tick the box accepting these terms; you create your business in Zavoia, which starts your free trial; and you subscribe by choosing a plan and paying through Stripe. Before paying, you can review and correct your plan, seats and billing details, and you can change billing details later under Account → Billing & Subscription. The current version of these terms is always on this page, where you can print or save it, and we send you the version you accepted on request.",
            ro: "Acest acord este guvernat de legea română; litigiile revin instanțelor române competente. Acordul se încheie în română și engleză; textul în limba română prevalează. Cum se încheie contractul (Legea 365/2002 art. 8): vă înregistrați și bifați căsuța prin care acceptați acești termeni; vă creați afacerea în Zavoia, ceea ce pornește perioada de probă gratuită; și vă abonați alegând un plan și plătind prin Stripe. Înainte de plată, puteți verifica și corecta planul, locurile și datele de facturare, iar datele de facturare le puteți modifica ulterior din Cont → Facturare și abonament. Versiunea în vigoare a acestor termeni este mereu pe această pagină, de unde o puteți tipări sau salva, iar la cerere vă trimitem versiunea pe care ați acceptat-o.",
          },
        },
      ],
    },
  ],
};
