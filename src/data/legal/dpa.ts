import type { LegalDocument } from "./types";

export const dpa: LegalDocument = {
  slug: "dpa",
  audience: "business",
  title: {
    en: "Data Processing Addendum",
    ro: "Acord de prelucrare a datelor",
  },
  shortTitle: { en: "DPA", ro: "DPA" },
  description: {
    en: "The GDPR data processing terms between Zavoia (as processor) and businesses (as controllers) for the client records and team schedules a business manages on the platform.",
    ro: "Termenii GDPR de prelucrare a datelor între Zavoia (persoană împuternicită) și afaceri (operatori) pentru evidențele de clienți și programul echipei gestionate de afacere pe platformă.",
  },
  status: "published",
  effectiveDate: "2026-11-15",
  sections: [
    {
      id: "scope-roles",
      blueprintRef: "A10",
      title: { en: "Scope and roles", ro: "Domeniu și roluri" },
      summary: {
        en: "Processor only for business-managed records; controller elsewhere.",
        ro: "Persoană împuternicită doar pentru evidențele gestionate de afacere; operator în rest.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "This addendum forms part of the Business Terms and applies where Zavoia processes personal data on your behalf: the client records, appointment details, notes, team schedules and related content you enter or manage in your workspace. For those activities, you are the controller and Zavoia the processor under GDPR art. 28.",
            ro: "Acest acord face parte din Termenii pentru afaceri și se aplică acolo unde Zavoia prelucrează date personale în numele dumneavoastră: evidențele de clienți, detaliile programărilor, notele, programul echipei și conținutul aferent pe care le introduceți sau gestionați în spațiul de lucru. Pentru aceste activități, dumneavoastră sunteți operatorul, iar Zavoia persoana împuternicită conform art. 28 GDPR.",
          },
        },
        {
          kind: "p",
          text: {
            en: "This addendum does not cover the processing where Zavoia is an independent controller — marketplace accounts and bookings, reviews, security, support, billing — which is described in the Privacy Notice. Where a marketplace booking creates data in both spheres, each party is responsible for its own sphere.",
            ro: "Acest acord nu acoperă prelucrările în care Zavoia este operator independent — conturile și programările din marketplace, recenziile, securitatea, asistența, facturarea — descrise în Politica de confidențialitate. Când o programare din marketplace creează date în ambele sfere, fiecare parte răspunde pentru sfera proprie.",
          },
        },
      ],
    },
    {
      id: "processing-details",
      blueprintRef: "A10 / art. 28(3)",
      title: { en: "Details of processing", ro: "Detaliile prelucrării" },
      summary: {
        en: "The full art. 28(3) content.",
        ro: "Conținutul complet al art. 28(3).",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Subject matter: hosting and processing of your workspace's client, appointment and team schedule data on the Zavoia platform.",
              "Duration: from when you create your business in Zavoia until its workspace data is deleted (see Return and deletion).",
              "Nature and purpose: storage, display, organization, scheduling, notification-sending and related operations needed to provide the service.",
              "Data categories: clients' names and contact details; appointment details (services, times, location, professional, price, status, cancellation reason); notes you record; records of the notifications sent to clients; team members' location and service assignments and their time off. Some of this can be special-category data — see Special categories.",
              "Data subjects: your clients and prospective clients, and your team members.",
              "Instructions: we process only on your documented instructions, which consist of the service's functionality and your configuration, including for transfers outside the EEA, unless EU or Romanian law requires us to do otherwise; in that case we tell you first, unless that law forbids it. We inform you if an instruction appears to infringe the law.",
              "Confidentiality: persons authorized to process are bound by confidentiality obligations.",
            ],
            ro: [
              "Obiectul: găzduirea și prelucrarea datelor de clienți și programări și a programului echipei din spațiul dumneavoastră de lucru, pe platforma Zavoia.",
              "Durata: de la crearea afacerii dumneavoastră în Zavoia până la ștergerea datelor spațiului ei de lucru (vezi Returnarea și ștergerea datelor).",
              "Natura și scopul: stocare, afișare, organizare, programare, trimiterea notificărilor și operațiunile conexe necesare furnizării serviciului.",
              "Categoriile de date: numele și datele de contact ale clienților; detaliile programărilor (servicii, ore, locație, profesionist, preț, status, motivul anulării); notele înregistrate; evidența notificărilor trimise clienților; repartizarea membrilor echipei pe locații și servicii și perioadele lor de absență. O parte dintre acestea pot fi date din categorii speciale — vezi Categorii speciale.",
              "Persoanele vizate: clienții și potențialii dumneavoastră clienți, precum și membrii echipei dumneavoastră.",
              "Instrucțiuni: prelucrăm doar pe baza instrucțiunilor dumneavoastră documentate, constând în funcționalitatea serviciului și configurarea dumneavoastră, inclusiv în privința transferurilor în afara SEE, cu excepția cazului în care dreptul UE sau dreptul român ne obligă să procedăm altfel; în acest caz vă informăm în prealabil, dacă legea respectivă nu interzice acest lucru. Vă informăm dacă o instrucțiune pare să încalce legea.",
              "Confidențialitate: persoanele autorizate să prelucreze sunt ținute de obligații de confidențialitate.",
            ],
          },
        },
      ],
    },
    {
      id: "special-categories",
      blueprintRef: "A10 / gate D7",
      title: {
        en: "Special categories of data",
        ro: "Categorii speciale de date",
      },
      summary: {
        en: "Health data can be in your workspace; how it is handled.",
        ro: "Datele privind sănătatea pot exista în spațiul de lucru; cum sunt tratate.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Your workspace can contain special categories of data (GDPR art. 9): an appointment at a medical, dental, psychology, physiotherapy or laboratory practice can reveal a client's health, notes can contain health details, and a team member's time off can be recorded as sick leave. This data gets the same security measures as the rest of your workspace (see Security measures). Emails to your clients show your business, the service and the location; SMS and app notifications to your clients show your business and the appointment date and time, not the service — plus your reason if you cancel and give one, so keep health details out of cancellation reasons. Email reminders are on by default and SMS reminders are off by default; you can change both, or turn reminders off, in your booking settings. As controller, you decide what you record, and you need your own legal basis for health data.",
            ro: "Spațiul dumneavoastră de lucru poate conține date din categorii speciale (art. 9 GDPR): o programare la un cabinet medical, stomatologic, de psihologie, de fizioterapie sau la un laborator poate dezvălui informații despre sănătatea unui client, notele pot conține detalii despre sănătate, iar absența unui membru al echipei poate fi înregistrată ca concediu medical. Aceste date beneficiază de aceleași măsuri de securitate ca restul spațiului de lucru (vezi Măsuri de securitate). Emailurile către clienții dumneavoastră indică afacerea, serviciul și locația; SMS-urile și notificările din aplicație trimise clienților indică afacerea și data și ora programării, nu și serviciul — precum și motivul, dacă anulați și îl precizați, așa că nu includeți detalii despre sănătate în motivul anulării. Mementourile prin email sunt activate implicit, iar cele prin SMS sunt dezactivate implicit; le puteți modifica pe amândouă sau puteți dezactiva mementourile în setările de programare. Ca operator, decideți ce înregistrați și aveți nevoie de propriul temei legal pentru datele privind sănătatea.",
          },
        },
      ],
    },
    {
      id: "security",
      title: { en: "Security measures", ro: "Măsuri de securitate" },
      summary: {
        en: "Concrete technical and organisational measures.",
        ro: "Măsuri tehnice și organizatorice concrete.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "We implement technical and organisational measures appropriate to the risk, including: encryption in transit, access controls and role scoping, tenant-scoped data separation within the application, logging, and personnel confidentiality. The concrete measures are listed below; we may update them provided the overall security level does not decrease.",
            ro: "Implementăm măsuri tehnice și organizatorice adecvate riscului, printre care: criptare în tranzit, controale de acces și limitarea rolurilor, separarea datelor pe spații de lucru în cadrul aplicației, jurnalizare și confidențialitatea personalului. Măsurile concrete sunt listate mai jos; le putem actualiza cu condiția ca nivelul general de securitate să nu scadă.",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "Encryption in transit: the website, the dashboard, the apps and our API communicate only over HTTPS (TLS), with HSTS on the web; the connection between our API and the database is encrypted with TLS.",
              "Hosting: our API runs on Google Cloud Run, the database on Supabase, media files on Cloudflare R2, and the website and dashboard on Vercel.",
              "Sign-in and sessions: passwords are stored only as bcrypt hashes; web sessions use cookies that scripts cannot read, together with protection against cross-site request forgery.",
              "Access control: a business's workspace can be opened only through the signed-in session of its owner or of a team member it has added; sessions are checked on every request and expire, and removing a team member ends their sessions. Authorized Zavoia staff can also access workspace data through our internal admin tool, to operate and support the service.",
              "Data separation: all businesses share one database; each business's records are kept apart by business-scoped queries in our application, not by separate databases.",
              "Logging: requests to our API are logged together with the user and the business they concern.",
              "Personnel: only Zavoia staff who need it have access to production systems and the admin tool, and they are bound by confidentiality.",
            ],
            ro: [
              "Criptare în tranzit: site-ul, panoul, aplicațiile și API-ul nostru comunică doar prin HTTPS (TLS), cu HSTS pe web; conexiunea dintre API-ul nostru și baza de date este criptată cu TLS.",
              "Găzduire: API-ul nostru rulează pe Google Cloud Run, baza de date pe Supabase, fișierele media pe Cloudflare R2, iar site-ul și panoul pe Vercel.",
              "Autentificare și sesiuni: parolele sunt stocate doar ca hash-uri bcrypt; sesiunile web folosesc cookie-uri inaccesibile scripturilor, împreună cu protecție împotriva falsificării cererilor (CSRF).",
              "Controlul accesului: spațiul de lucru al unei afaceri poate fi deschis doar printr-o sesiune autentificată a proprietarului ei sau a unui membru al echipei adăugat de aceasta; sesiunile sunt verificate la fiecare cerere și expiră, iar eliminarea unui membru al echipei îi încheie sesiunile. Personalul autorizat Zavoia poate accesa, de asemenea, datele spațiului de lucru prin instrumentul nostru intern de administrare, pentru operarea și asistența serviciului.",
              "Separarea datelor: toate afacerile folosesc o singură bază de date; evidențele fiecărei afaceri sunt separate prin interogări limitate la afacere în aplicația noastră, nu prin baze de date separate.",
              "Jurnalizare: cererile către API-ul nostru sunt jurnalizate împreună cu utilizatorul și afacerea la care se referă.",
              "Personal: doar personalul Zavoia care are nevoie are acces la sistemele de producție și la instrumentul de administrare și este obligat la confidențialitate.",
            ],
          },
        },
      ],
    },
    {
      id: "subprocessors",
      blueprintRef: "A10",
      title: { en: "Sub-processors", ro: "Subîmputerniciți" },
      summary: {
        en: "Published list, notice of changes, objection right.",
        ro: "Listă publicată, notificarea modificărilor, drept de obiecție.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You authorize the sub-processors listed below. Each is bound by a written contract with the data-protection terms GDPR art. 28 requires, and we remain responsible to you for their performance. We notify you at least 30 days before adding or replacing a sub-processor; if you have reasonable data-protection grounds to object and we cannot offer an alternative, you may terminate the affected service.",
            ro: "Autorizați subîmputerniciții enumerați mai jos. Fiecare este ținut de un contract scris cu clauzele de protecție a datelor cerute de art. 28 GDPR, iar noi răspundem față de dumneavoastră pentru modul în care își îndeplinesc obligațiile. Vă notificăm cu cel puțin 30 de zile înainte de adăugarea sau înlocuirea unui subîmputernicit; dacă aveți motive rezonabile legate de protecția datelor pentru a obiecta și nu putem oferi o alternativă, puteți înceta serviciul afectat.",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "Google Cloud (Cloud Run, Cloud Tasks): runs our API, which processes all workspace data, and schedules notifications.",
              "Supabase: our database, where workspace data is stored.",
              "Cloudflare: network protection and delivery; traffic to our API passes through it.",
              "Amazon Web Services (SES): sends emails to your clients.",
              "Twilio: sends SMS to your clients, if you turn SMS on.",
              "Expo: sends app notifications to clients who use the Zavoia app.",
              "Google Firebase Cloud Messaging: sends appointment notifications to you and your team in the Zavoia Admin app.",
            ],
            ro: [
              "Google Cloud (Cloud Run, Cloud Tasks): rulează API-ul nostru, care prelucrează toate datele spațiului de lucru, și programează trimiterea notificărilor.",
              "Supabase: baza noastră de date, în care sunt stocate datele spațiului de lucru.",
              "Cloudflare: protecția și livrarea traficului; traficul către API-ul nostru trece prin rețeaua sa.",
              "Amazon Web Services (SES): trimite emailurile către clienții dumneavoastră.",
              "Twilio: trimite SMS-urile către clienții dumneavoastră, dacă activați SMS-urile.",
              "Expo: trimite notificările din aplicație clienților care folosesc aplicația Zavoia.",
              "Google Firebase Cloud Messaging: trimite notificările despre programări către dumneavoastră și echipa dumneavoastră în aplicația Zavoia Admin.",
            ],
          },
        },
      ],
    },
    {
      id: "breach-assistance",
      title: {
        en: "Breach notification and assistance",
        ro: "Notificarea încălcărilor și asistență",
      },
      summary: {
        en: "Notification without undue delay; help with DSRs and DPIAs.",
        ro: "Notificare fără întârzieri nejustificate; ajutor pentru cereri și evaluări.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "We notify you without undue delay after becoming aware of a personal-data breach affecting your data, with the information you need for your own notification duties.",
              "We assist you, considering the nature of the processing, in responding to data-subject requests — primarily through the product's own tools — and in your security, breach-notification and impact-assessment obligations (arts. 32–36).",
              "Data-subject requests that reach Zavoia but concern your records are forwarded to you without undue delay.",
            ],
            ro: [
              "Vă notificăm fără întârzieri nejustificate după ce luăm cunoștință de o încălcare a securității datelor care vă afectează datele, cu informațiile necesare pentru propriile obligații de notificare.",
              "Vă asistăm, ținând cont de natura prelucrării, în răspunsul la cererile persoanelor vizate — în principal prin instrumentele produsului — și în respectarea obligațiilor dumneavoastră de securitate, de notificare a încălcărilor și de evaluare a impactului (art. 32–36).",
              "Cererile persoanelor vizate care ajung la Zavoia, dar privesc evidențele dumneavoastră vă sunt transmise fără întârzieri nejustificate.",
            ],
          },
        },
      ],
    },
    {
      id: "transfers",
      title: {
        en: "International transfers",
        ro: "Transferuri internaționale",
      },
      summary: {
        en: "EU 2021 SCCs / adequacy / DPF, flowed down.",
        ro: "SCC UE 2021 / adecvare / DPF, aplicate în lanț.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Some sub-processors process data outside the EEA, for example in the United States. Those transfers rely on an adequacy decision (including the EU–US Data Privacy Framework for certified recipients), binding corporate rules or the 2021 EU Standard Contractual Clauses (Commission Decision 2021/914), as set out in each sub-processor's data-protection terms.",
            ro: "Unii subîmputerniciți prelucrează date în afara SEE, de exemplu în Statele Unite. Aceste transferuri se bazează pe o decizie de adecvare (inclusiv cadrul UE-SUA privind confidențialitatea datelor, pentru destinatarii certificați), pe reguli corporatiste obligatorii sau pe clauzele contractuale standard ale UE din 2021 (Decizia 2021/914), conform clauzelor de protecție a datelor ale fiecărui subîmputernicit.",
          },
        },
      ],
    },
    {
      id: "audit",
      title: { en: "Audit", ro: "Audit" },
      summary: {
        en: "Documentation first; on-site audit for cause.",
        ro: "Mai întâi documentație; audit la fața locului pentru motive întemeiate.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "We make available the information necessary to demonstrate compliance with art. 28 — primarily documentation and summaries of measures. Where that is insufficient and you have a specific, justified reason, you may conduct (directly or through an independent auditor) an audit with reasonable notice, during business hours, at your cost, without access to other customers' data.",
            ro: "Punem la dispoziție informațiile necesare pentru a demonstra conformitatea cu art. 28 — în principal documentație și rezumate ale măsurilor. Când acestea nu sunt suficiente și aveți un motiv specific și justificat, puteți efectua (direct sau printr-un auditor independent) un audit cu notificare rezonabilă, în timpul programului, pe costul dumneavoastră, fără acces la datele altor clienți.",
          },
        },
      ],
    },
    {
      id: "deletion-return",
      blueprintRef: "A10 / P2B art. 9",
      title: { en: "Return and deletion", ro: "Returnarea și ștergerea datelor" },
      summary: {
        en: "Read-only access after the end; deletion with your account.",
        ro: "Acces de citire după încetare; ștergere odată cu contul.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "When your subscription lapses or this agreement ends, your workspace data stays stored and available to you read-only until you delete your account. You can download each client's history as a PDF; there is no bulk export. Deleting your account deletes your business and all its workspace data from our database (see Deleting your account); copies in our database provider's backups are removed as those backups expire. Records the law requires us to keep about your business, such as tax-reporting records, are kept for the period the law sets.",
            ro: "Când abonamentul expiră sau acest acord încetează, datele spațiului de lucru rămân stocate și disponibile pentru dumneavoastră în regim de citire până când vă ștergeți contul. Puteți descărca istoricul fiecărui client ca PDF; nu există export în masă. Ștergerea contului șterge afacerea și toate datele spațiului ei de lucru din baza noastră de date (vezi Ștergerea contului); datele din copiile de siguranță ale furnizorului bazei de date sunt eliminate pe măsură ce aceste copii expiră. Evidențele pe care legea ne obligă să le păstrăm despre afacerea dumneavoastră, cum ar fi cele pentru raportarea fiscală, sunt păstrate pe durata prevăzută de lege.",
          },
        },
      ],
    },
    {
      id: "liability",
      title: { en: "Liability", ro: "Răspundere" },
      summary: {
        en: "Follows the Business Terms caps, within legal limits.",
        ro: "Urmează plafoanele din Termenii pentru afaceri, în limitele legii.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Liability under this addendum is subject to the caps and carve-outs in the Business Terms, without limiting either party's liability toward data subjects or authorities under GDPR arts. 82–84.",
            ro: "Răspunderea în temeiul acestui acord este supusă plafoanelor și excepțiilor din Termenii pentru afaceri, fără a limita răspunderea vreunei părți față de persoanele vizate sau autorități conform art. 82–84 GDPR.",
          },
        },
      ],
    },
  ],
};
