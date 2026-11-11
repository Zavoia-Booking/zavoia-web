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
    en: "The GDPR data processing terms between Zavoia (as processor) and businesses (as controllers) for client records the business manages on the platform.",
    ro: "Termenii GDPR de prelucrare a datelor între Zavoia (persoană împuternicită) și afaceri (operatori) pentru evidențele de clienți gestionate de afacere pe platformă.",
  },
  status: "draft",
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
            en: "This addendum forms part of the Business Terms and applies where Zavoia processes personal data on your behalf: the client records, appointment details, notes and related content you enter or manage in your workspace. For those activities, you are the controller and Zavoia the processor under GDPR art. 28.",
            ro: "Acest acord face parte din Termenii pentru afaceri și se aplică acolo unde Zavoia prelucrează date personale în numele dumneavoastră: evidențele de clienți, detaliile programărilor, notele și conținutul aferent pe care le introduceți sau gestionați în spațiul de lucru. Pentru aceste activități, dumneavoastră sunteți operatorul, iar Zavoia persoana împuternicită conform art. 28 GDPR.",
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
              "Subject matter: hosting and processing of your workspace's client and appointment data on the Zavoia platform.",
              "Duration: the term of the Business Terms, plus the post-termination window in the Return and deletion section.",
              "Nature and purpose: storage, display, organization, scheduling, notification-sending and related operations needed to provide the service.",
              "Data categories: client identification and contact data, appointment details (services, times, professional, price), notes you record, communication history. Special-category data may be revealed by appointment context at health-related venues — see Special categories.",
              "Data subjects: your clients and prospective clients.",
              "Instructions: we process only on your documented instructions, which consist of the service's functionality and your configuration; we inform you if an instruction appears to infringe the law.",
              "Confidentiality: persons authorized to process are bound by confidentiality obligations.",
            ],
            ro: [
              "Obiectul: găzduirea și prelucrarea datelor de clienți și programări ale spațiului dumneavoastră de lucru pe platforma Zavoia.",
              "Durata: durata Termenilor pentru afaceri, plus fereastra post-încetare din secțiunea Returnarea și ștergerea datelor.",
              "Natura și scopul: stocare, afișare, organizare, programare, trimiterea notificărilor și operațiunile conexe necesare furnizării serviciului.",
              "Categoriile de date: date de identificare și contact ale clienților, detaliile programărilor (servicii, ore, profesionist, preț), notele înregistrate, istoricul comunicărilor. Date din categorii speciale pot fi relevate de contextul programării la unități din domeniul sănătății — vezi Categorii speciale.",
              "Persoanele vizate: clienții și potențialii dumneavoastră clienți.",
              "Instrucțiuni: prelucrăm doar pe baza instrucțiunilor dumneavoastră documentate, constând în funcționalitatea serviciului și configurarea dumneavoastră; vă informăm dacă o instrucțiune pare să încalce legea.",
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
        en: "Health-adjacent appointment data is in scope, with safeguards.",
        ro: "Datele de programare cu caracter medical sunt incluse, cu garanții.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Appointment data at medical, dental, psychology, physiotherapy or laboratory venues can reveal health information. Unlike templates that simply exclude special-category data, this addendum acknowledges it: such data is processed with access limited to authorized workspace roles and platform operations, and with the retention and notification safeguards described in the security annex. You are responsible for your own legal basis as controller for any health data you record about clients.",
            ro: "Datele de programare la unități medicale, stomatologice, de psihologie, fizioterapie sau laboratoare pot revela informații despre sănătate. Spre deosebire de șabloanele care pur și simplu exclud datele din categorii speciale, acest acord le recunoaște: aceste date sunt prelucrate cu acces limitat la rolurile autorizate din spațiul de lucru și la operațiunile platformei, și cu garanțiile de păstrare și notificare descrise în anexa de securitate. Sunteți responsabil de propriul temei legal, ca operator, pentru orice date de sănătate pe care le înregistrați despre clienți.",
          },
        },
        {
          kind: "note",
          text: {
            en: "GATE D7: the concrete safeguards (access scoping, retention, notification content) come out of the pending art. 9 assessment. This section cannot be finalised before it.",
            ro: "GATE D7: garanțiile concrete (limitarea accesului, păstrarea, conținutul notificărilor) rezultă din evaluarea art. 9 în curs. Această secțiune nu poate fi finalizată înainte de aceasta.",
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
              "Access control: every request to our API is authenticated and checked against the user's role (owner, team member or customer); a business's data is reachable only by the users that business has added.",
              "Data separation: all businesses share one database; each business's records are kept apart by business-scoped queries in our application, not by separate databases.",
              "Logging: requests to our API are logged together with the user and the business they concern.",
              "Personnel: only Zavoia staff who need it have access to production systems, and they are bound by confidentiality.",
            ],
            ro: [
              "Criptare în tranzit: site-ul, panoul, aplicațiile și API-ul nostru comunică doar prin HTTPS (TLS), cu HSTS pe web; conexiunea dintre API-ul nostru și baza de date este criptată cu TLS.",
              "Găzduire: API-ul nostru rulează pe Google Cloud Run, baza de date pe Supabase, fișierele media pe Cloudflare R2, iar site-ul și panoul pe Vercel.",
              "Autentificare și sesiuni: parolele sunt stocate doar ca hash-uri bcrypt; sesiunile web folosesc cookie-uri inaccesibile scripturilor, împreună cu protecție împotriva falsificării cererilor (CSRF).",
              "Controlul accesului: fiecare cerere către API-ul nostru este autentificată și verificată în funcție de rolul utilizatorului (proprietar, membru al echipei sau client); datele unei afaceri sunt accesibile doar utilizatorilor adăugați de acea afacere.",
              "Separarea datelor: toate afacerile folosesc o singură bază de date; evidențele fiecărei afaceri sunt separate prin interogări limitate la afacere în aplicația noastră, nu prin baze de date separate.",
              "Jurnalizare: cererile către API-ul nostru sunt jurnalizate împreună cu utilizatorul și afacerea la care se referă.",
              "Personal: doar personalul Zavoia care are nevoie are acces la sistemele de producție și este obligat la confidențialitate.",
            ],
          },
        },
        {
          kind: "note",
          text: {
            en: "Annex written 11 Nov 2026 from the code (data-source.ts, roles.guard.ts, upload.service.ts, auth, request logging). Deliberately NOT claimed, because they are not true today: certificate verification on the database connection (TLS runs with rejectUnauthorized:false — data-source.ts, app.module.ts); database-level tenant isolation (the API connects as the postgres user, so row-level security does not apply); an audit trail of who viewed client records; backups and encryption at rest (true at the vendors only if confirmed in their documentation and plan); end-to-end encryption; certifications. Before publication: confirm the staff confidentiality undertakings exist in writing, and check that every endpoint touching client data declares roles — roles.guard.ts lets a request through when an endpoint declares none.",
            ro: "Anexă redactată pe 11 nov. 2026 pe baza codului (data-source.ts, roles.guard.ts, upload.service.ts, autentificare, jurnalizarea cererilor). NU sunt pretinse în mod deliberat, pentru că nu sunt adevărate astăzi: verificarea certificatului la conexiunea cu baza de date (TLS rulează cu rejectUnauthorized:false — data-source.ts, app.module.ts); izolarea între afaceri la nivelul bazei de date (API-ul se conectează ca utilizator postgres, deci securitatea la nivel de rând nu se aplică); un jurnal de audit al celor care au vizualizat evidențele clienților; copiile de rezervă și criptarea datelor stocate (adevărate la furnizori doar dacă sunt confirmate în documentația și planul lor); criptarea end-to-end; certificările. Înainte de publicare: confirmați că angajamentele de confidențialitate ale personalului există în scris și verificați ca fiecare endpoint care atinge datele clienților să declare roluri — roles.guard.ts permite trecerea unei cereri când endpoint-ul nu declară niciunul.",
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
            en: "You authorize the sub-processors on our published vendor list [link], each engaged for a defined purpose under a contract imposing data-protection obligations equivalent to this addendum. We notify you at least 30 days before adding or replacing a sub-processor; if you have reasonable data-protection grounds to object and we cannot offer an alternative, you may terminate the affected service.",
            ro: "Autorizați subîmputerniciții de pe lista noastră publicată de furnizori [link], fiecare angajat pentru un scop definit, printr-un contract care impune obligații de protecția datelor echivalente acestui acord. Vă notificăm cu cel puțin 30 de zile înainte de adăugarea sau înlocuirea unui subîmputernicit; dacă aveți motive rezonabile de protecția datelor pentru a obiecta și nu putem oferi o alternativă, puteți înceta serviciul afectat.",
          },
        },
        {
          kind: "note",
          text: {
            en: "Blueprint A10: vendors are not automatically sub-processors — classify each (Stripe and Oblio serve Zavoia's own billing = not sub-processors of your client data; hosting/email/SMS/push vendors that touch client records likely are). Publish the classified list before this addendum goes live.",
            ro: "Blueprint A10: furnizorii nu sunt automat subîmputerniciți — clasificați fiecare (Stripe și Oblio servesc facturarea proprie Zavoia = nu sunt subîmputerniciți ai datelor clienților dumneavoastră; furnizorii de găzduire/email/SMS/push care ating evidențele de clienți probabil sunt). Publicați lista clasificată înainte ca acest acord să intre în vigoare.",
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
              "Vă asistăm, ținând cont de natura prelucrării, în răspunsul la cererile persoanelor vizate — în principal prin instrumentele produsului — și în obligațiile dumneavoastră de securitate, notificare a încălcărilor și evaluare de impact (art. 32–36).",
              "Cererile persoanelor vizate care ajung la Zavoia dar privesc evidențele dumneavoastră vă sunt transmise fără întârzieri nejustificate.",
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
            en: "Where processing involves transfers outside the EEA, they rely on an adequacy decision, the EU–US Data Privacy Framework for certified recipients, or the 2021 EU Standard Contractual Clauses (Commission Decision 2021/914), which we also impose on sub-processors. The transfer mechanism per vendor is stated in the published vendor list.",
            ro: "Când prelucrarea implică transferuri în afara SEE, acestea se bazează pe o decizie de adecvare, pe cadrul EU–US Data Privacy Framework pentru destinatarii certificați sau pe Clauzele Contractuale Standard UE 2021 (Decizia 2021/914), pe care le impunem și subîmputerniciților. Mecanismul de transfer pentru fiecare furnizor este indicat în lista publicată de furnizori.",
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
        en: "Export window at contract end, then deletion.",
        ro: "Fereastră de export la încetare, apoi ștergere.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "At the end of the Business Terms, your workspace data remains available to you in read-only form. [A defined export window and subsequent deletion/anonymization schedule are to be established — see note.] Statutory retention obligations survive in any case. This mirrors the data-access commitments in the Provider Terms.",
            ro: "La încetarea Termenilor pentru afaceri, datele spațiului de lucru vă rămân disponibile în mod de citire. [O fereastră definită de export și un calendar ulterior de ștergere/anonimizare urmează a fi stabilite — vezi nota.] Obligațiile legale de păstrare rămân valabile în orice caz. Aceasta reflectă angajamentele de acces la date din Termenii pentru furnizori.",
          },
        },
        {
          kind: "note",
          text: {
            en: "IMPL (verified 1 Aug 2026): lapse behaviour is indefinite read-only retention with no automated deletion; the only export is the individual customer-history PDF. Before finalising: build bulk export, decide the retention window, and implement the deletion/anonymization schedule — do not promise capabilities the product lacks. Align GDPR art. 28(3)(g) (deletion/return at end of services) with what is actually built.",
            ro: "IMPL (verificat 1 aug. 2026): comportamentul la expirare este păstrare în mod de citire pe durată nedeterminată, fără ștergere automată; singurul export este PDF-ul cu istoricul individual al unui client. Înainte de finalizare: construiți exportul în masă, decideți fereastra de păstrare și implementați calendarul de ștergere/anonimizare — nu promiteți capabilități pe care produsul nu le are. Aliniați art. 28(3)(g) GDPR (ștergerea/returnarea la finalul serviciilor) cu ce este efectiv construit.",
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
