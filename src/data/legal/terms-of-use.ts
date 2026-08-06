import type { LegalDocument } from "./types";

export const termsOfUse: LegalDocument = {
  slug: "terms-of-use",
  audience: "general",
  title: { en: "Website Terms of Use", ro: "Termeni de utilizare a site-ului" },
  shortTitle: { en: "Terms of Use", ro: "Termeni de utilizare" },
  description: {
    en: "The rules for visiting and using the Zavoia website and apps — accounts, acceptable use, content and intellectual property.",
    ro: "Regulile pentru vizitarea și utilizarea site-ului și aplicațiilor Zavoia — conturi, utilizare acceptabilă, conținut și proprietate intelectuală.",
  },
  status: "draft",
  sections: [
    {
      id: "who-we-are",
      blueprintRef: "A1 / doc 9",
      title: { en: "Who we are", ro: "Cine suntem" },
      summary: {
        en: "Zavoia is a Romanian platform for discovering local service businesses and booking appointments with them.",
        ro: "Zavoia este o platformă românească pentru descoperirea afacerilor locale de servicii și programarea la acestea.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "These terms govern your use of the zavoia.com website and the Zavoia mobile applications (together, the “Site”). The Site is operated by the company identified on our Company Information page, which forms part of these terms.",
            ro: "Acești termeni guvernează utilizarea site-ului zavoia.com și a aplicațiilor mobile Zavoia (împreună, „Site-ul”). Site-ul este operat de societatea identificată pe pagina Informații despre companie, care face parte din acești termeni.",
          },
        },
        {
          kind: "p",
          text: {
            en: "These terms cover using the Site itself. Booking an appointment is additionally governed by the Marketplace Customer Terms and the Booking & Cancellation Policy; using Zavoia as a business is governed by the Business Terms.",
            ro: "Acești termeni acoperă utilizarea Site-ului în sine. Programarea unui serviciu este guvernată suplimentar de Termenii pentru clienți și de Politica de programări și anulări; utilizarea Zavoia ca afacere este guvernată de Termenii pentru afaceri.",
          },
        },
      ],
    },
    {
      id: "acceptance-and-changes",
      blueprintRef: "§0.2 / B13",
      title: {
        en: "Acceptance and changes to these terms",
        ro: "Acceptarea și modificarea acestor termeni",
      },
      summary: {
        en: "How these terms apply and how we change them.",
        ro: "Cum se aplică acești termeni și cum îi modificăm.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "If you only browse the Site, these terms and our Privacy Notice are presented for your information. If you create an account, you accept these terms through an explicit action at registration, and we keep a record of the version you accepted.",
            ro: "Dacă doar navigați pe Site, acești termeni și Politica de confidențialitate vă sunt prezentate cu titlu de informare. Dacă vă creați un cont, acceptați acești termeni printr-o acțiune explicită la înregistrare, iar noi păstrăm o evidență a versiunii acceptate.",
          },
        },
        {
          kind: "p",
          text: {
            en: "When we change these terms, we publish the new version with its date and notify account holders in advance through the Site or by email. Changes do not apply retroactively. If you do not agree with a change, you can stop using the Site and delete your account before the change takes effect.",
            ro: "Când modificăm acești termeni, publicăm noua versiune cu data ei și notificăm în avans deținătorii de cont prin Site sau prin email. Modificările nu se aplică retroactiv. Dacă nu sunteți de acord cu o modificare, puteți înceta utilizarea Site-ului și vă puteți șterge contul înainte ca modificarea să intre în vigoare.",
          },
        },
        {
          kind: "note",
          text: {
            en: "IMPL (blueprint §0.2, verified 1 Aug 2026): the acceptance-evidence system (document version, user, timestamp) does not exist in code, the Google-signup path bypasses the terms checkbox, invitation links auto-accept on open, and role-enablement flows present no terms. All must be built before the acceptance statements in this document are true.",
            ro: "IMPL (blueprint §0.2, verificat 1 aug. 2026): sistemul de evidență a acceptării (versiunea documentului, utilizator, dată/oră) nu există în cod, înregistrarea cu Google ocolește bifa de termeni, linkurile de invitație acceptă automat la deschidere, iar fluxurile de activare a rolurilor nu prezintă termenii. Toate trebuie construite înainte ca declarațiile de acceptare din acest document să fie adevărate.",
          },
        },
      ],
    },
    {
      id: "accounts",
      blueprintRef: "ToU §6",
      title: { en: "Accounts and security", ro: "Conturi și securitate" },
      summary: {
        en: "One personal account; you are responsible for keeping access secure.",
        ro: "Un singur cont personal; sunteți responsabil de păstrarea securității accesului.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "You may hold one personal account. Accounts are personal and non-transferable — do not share credentials or sell, lend or transfer an account.",
              "Provide accurate registration information and keep it up to date.",
              "Keep your password and sign-in methods confidential. Tell us promptly if you suspect unauthorized access.",
              "The same account can hold different roles over time — marketplace customer, business team member, or business owner. Each role is governed by its own document, which is presented to you when the role is activated.",
            ],
            ro: [
              "Puteți deține un singur cont personal. Conturile sunt personale și netransferabile — nu partajați datele de autentificare și nu vindeți, împrumutați sau transferați un cont.",
              "Furnizați informații corecte la înregistrare și mențineți-le actualizate.",
              "Păstrați confidențialitatea parolei și a metodelor de autentificare. Anunțați-ne imediat dacă suspectați un acces neautorizat.",
              "Același cont poate deține roluri diferite în timp — client în marketplace, membru al echipei unei afaceri sau proprietar de afacere. Fiecare rol este guvernat de propriul document, care vă este prezentat la activarea rolului.",
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "We may suspend an account for a serious or repeated breach of these terms; when we do, we tell you why and how to respond, as described in the Reviews, Content & Moderation Policy and, for customers, the Marketplace Customer Terms.",
            ro: "Putem suspenda un cont pentru o încălcare gravă sau repetată a acestor termeni; când o facem, vă comunicăm motivele și cum puteți răspunde, conform Politicii de recenzii, conținut și moderare și, pentru clienți, Termenilor pentru clienți.",
          },
        },
      ],
    },
    {
      id: "age-requirements",
      blueprintRef: "gate D11",
      title: { en: "Age requirements", ro: "Cerințe de vârstă" },
      summary: {
        en: "The minimum age for holding a Zavoia account.",
        ro: "Vârsta minimă pentru a deține un cont Zavoia.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You must be at least [16/18] years old to create an account. Appointments for minors may be booked by a parent or legal guardian from their own account, where the service is appropriate for minors.",
            ro: "Trebuie să aveți cel puțin [16/18] ani pentru a vă crea un cont. Programările pentru minori pot fi făcute de un părinte sau tutore legal din propriul cont, acolo unde serviciul este potrivit pentru minori.",
          },
        },
        {
          kind: "note",
          text: {
            en: "GATE D11 (blueprint): the minors/age policy is an open business decision. Romanian digital-consent age under Legea 190/2018 is 16; whether to allow 16–18-year-old account holders, and any per-category restrictions (e.g. tattoo/piercing venues), must be decided before publication.",
            ro: "GATE D11 (blueprint): politica privind minorii/vârsta este o decizie de business nerezolvată. Vârsta consimțământului digital conform Legii 190/2018 este 16 ani; dacă se permit titulari de cont între 16–18 ani, precum și eventuale restricții pe categorii (ex. saloane de tatuaje/piercing), trebuie decise înainte de publicare.",
          },
        },
      ],
    },
    {
      id: "acceptable-use",
      blueprintRef: "doc 4 / ToU §9",
      title: { en: "Acceptable use", ro: "Utilizare acceptabilă" },
      summary: {
        en: "What you may not do on the Site.",
        ro: "Ce nu aveți voie să faceți pe Site.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You may use the Site for its intended purpose: discovering businesses, booking and managing appointments, and — for businesses — running your presence on the platform. You may not:",
            ro: "Puteți folosi Site-ul în scopul său: descoperirea afacerilor, efectuarea și gestionarea programărilor și — pentru afaceri — administrarea prezenței pe platformă. Nu aveți voie să:",
          },
        },
        {
          kind: "list",
          items: {
            en: [
              "scrape, crawl or extract data from the Site by automated means, or use bots to make or hold bookings;",
              "copy, frame or mirror the Site or present it as your own;",
              "reverse engineer, decompile or attempt to extract source code, except where the law permits;",
              "interfere with the Site's operation — including probing or testing vulnerabilities without authorization, transmitting malware, or overloading our infrastructure;",
              "send spam or unsolicited messages through the Site, or misuse contact details found on it;",
              "impersonate another person or business, or misrepresent an affiliation;",
              "use the Site for any unlawful purpose.",
            ],
            ro: [
              "extrageți date de pe Site prin mijloace automate (scraping/crawling) sau să folosiți boți pentru a face programări ori a ocupa intervale;",
              "copiați, încadrați (frame) sau oglindiți Site-ul ori să îl prezentați drept al dumneavoastră;",
              "faceți inginerie inversă, decompilare sau să încercați extragerea codului sursă, cu excepția cazurilor permise de lege;",
              "perturbați funcționarea Site-ului — inclusiv prin testarea neautorizată a vulnerabilităților, transmiterea de malware sau supraîncărcarea infrastructurii;",
              "trimiteți spam sau mesaje nesolicitate prin Site ori să folosiți abuziv datele de contact găsite pe acesta;",
              "vă dați drept altă persoană sau afacere ori să prezentați fals o afiliere;",
              "folosiți Site-ul în orice scop ilegal.",
            ],
          },
        },
      ],
    },
    {
      id: "user-content",
      blueprintRef: "A9 / ToU §10",
      title: { en: "Your content", ro: "Conținutul dumneavoastră" },
      summary: {
        en: "What you grant us when you post content, and what content is prohibited.",
        ro: "Ce ne acordați când publicați conținut și ce conținut este interzis.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "When you post content on the Site (for example a review or a profile photo), you keep ownership of it. You grant Zavoia a non-exclusive licence to host, store, display and distribute that content on the platform, for the purpose of operating the service, for as long as the content remains on the platform. We do not acquire your moral rights and do not use your content for unrelated purposes.",
            ro: "Când publicați conținut pe Site (de exemplu o recenzie sau o fotografie de profil), rămâneți proprietarul acestuia. Acordați Zavoia o licență neexclusivă de a găzdui, stoca, afișa și distribui acel conținut pe platformă, în scopul operării serviciului, atât timp cât conținutul rămâne pe platformă. Nu dobândim drepturile dumneavoastră morale și nu folosim conținutul în scopuri fără legătură cu serviciul.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Prohibited content, how moderation works, how to report content and how to appeal a decision are set out in the Reviews, Content & Moderation Policy, which applies to all content on the Site.",
            ro: "Conținutul interzis, modul în care funcționează moderarea, cum raportați conținut și cum contestați o decizie sunt stabilite în Politica de recenzii, conținut și moderare, care se aplică întregului conținut de pe Site.",
          },
        },
      ],
    },
    {
      id: "intellectual-property",
      blueprintRef: "ToU §11",
      title: { en: "Intellectual property", ro: "Proprietate intelectuală" },
      summary: {
        en: "The platform and its branding belong to Zavoia and its licensors.",
        ro: "Platforma și brandul aparțin Zavoia și licențiatorilor săi.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "The Site, its software, design, branding and content created by us are protected by intellectual property rights owned by Zavoia or its licensors. Using the Site does not transfer any of these rights to you. You may view, print or store pages for your personal use; any other reproduction or reuse requires our written permission.",
            ro: "Site-ul, software-ul, designul, brandul și conținutul creat de noi sunt protejate de drepturi de proprietate intelectuală aparținând Zavoia sau licențiatorilor săi. Utilizarea Site-ului nu vă transferă niciunul dintre aceste drepturi. Puteți vizualiza, imprima sau salva pagini pentru uz personal; orice altă reproducere sau reutilizare necesită acordul nostru scris.",
          },
        },
        {
          kind: "p",
          text: {
            en: "If you send us ideas or suggestions about the Site, we may use them to improve the service without an obligation to compensate you — please do not send suggestions you consider confidential.",
            ro: "Dacă ne trimiteți idei sau sugestii despre Site, le putem folosi pentru a îmbunătăți serviciul fără obligația de a vă compensa — vă rugăm să nu trimiteți sugestii pe care le considerați confidențiale.",
          },
        },
      ],
    },
    {
      id: "third-party-links",
      blueprintRef: "ToU §13",
      title: { en: "Third-party links", ro: "Linkuri către terți" },
      summary: {
        en: "External sites are outside our control.",
        ro: "Site-urile externe sunt în afara controlului nostru.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "The Site may contain links to websites operated by others, including websites of the businesses listed on Zavoia. We do not control those sites and are not responsible for their content or practices; their own terms and privacy policies apply.",
            ro: "Site-ul poate conține linkuri către site-uri operate de alții, inclusiv site-urile afacerilor listate pe Zavoia. Nu controlăm acele site-uri și nu răspundem de conținutul sau practicile lor; se aplică propriii lor termeni și politici de confidențialitate.",
          },
        },
      ],
    },
    {
      id: "disclaimers-liability",
      blueprintRef: "B8 / L193/2000",
      title: { en: "Disclaimers and liability", ro: "Limitări de răspundere" },
      summary: {
        en: "Our responsibility for the Site, within the limits Romanian law allows.",
        ro: "Responsabilitatea noastră pentru Site, în limitele permise de legea română.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "We work to keep the Site available and correct, but we cannot promise uninterrupted or error-free operation, and we may need to suspend the Site for maintenance or security. Information published by businesses in their listings is their responsibility (see the Marketplace Customer Terms).",
            ro: "Ne străduim să menținem Site-ul disponibil și corect, dar nu putem promite o funcționare neîntreruptă sau fără erori și este posibil să suspendăm Site-ul pentru mentenanță sau securitate. Informațiile publicate de afaceri în listările lor sunt responsabilitatea acestora (vezi Termenii pentru clienți).",
          },
        },
        {
          kind: "p",
          text: {
            en: "Nothing in these terms excludes or limits our liability where the law does not allow it — including liability for intent or gross negligence — and nothing affects the mandatory rights you have as a consumer under Romanian law.",
            ro: "Nimic din acești termeni nu exclude și nu limitează răspunderea noastră acolo unde legea nu o permite — inclusiv răspunderea pentru intenție sau culpă gravă — și nimic nu afectează drepturile imperative pe care le aveți în calitate de consumator conform legii române.",
          },
        },
      ],
    },
    {
      id: "governing-law",
      blueprintRef: "B14",
      title: { en: "Governing law and language", ro: "Legea aplicabilă și limba" },
      summary: {
        en: "Romanian law; the Romanian text prevails.",
        ro: "Legea română; textul în limba română prevalează.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "These terms are governed by Romanian law. If you are a consumer, you keep the protection of the mandatory rules of the country where you live. Disputes are resolved by the competent Romanian courts, without limiting a consumer's statutory forum rights. These terms are published in Romanian and English; if the versions diverge, the Romanian text prevails. The Site is operated from Romania and the marketplace currently addresses services provided in Romania; if you use the Site from elsewhere, you are responsible for compliance with your local law.",
            ro: "Acești termeni sunt guvernați de legea română. Dacă sunteți consumator, păstrați protecția normelor imperative din țara în care locuiți. Litigiile se soluționează de instanțele române competente, fără a limita drepturile legale ale consumatorului privind instanța competentă. Acești termeni sunt publicați în română și engleză; în caz de divergență, textul în limba română prevalează. Site-ul este operat din România, iar marketplace-ul vizează în prezent servicii prestate în România; dacă folosiți Site-ul din altă parte, sunteți responsabil de respectarea legii locale.",
          },
        },
      ],
    },
    {
      id: "contact-complaints",
      blueprintRef: "B9",
      title: { en: "Contact and complaints", ro: "Contact și reclamații" },
      summary: {
        en: "How to reach us, and consumer-protection channels.",
        ro: "Cum ne contactați și canalele de protecția consumatorului.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You can reach us through the Help Centre or at the contact details on the Company Information page. Consumers may also address ANPC (anpc.ro) or use the SAL alternative dispute resolution mechanism (reclamatiisal.anpc.ro) — details on the Company Information page.",
            ro: "Ne puteți contacta prin Centrul de ajutor sau la datele de contact de pe pagina Informații despre companie. Consumatorii se pot adresa și ANPC (anpc.ro) sau pot folosi mecanismul SAL de soluționare alternativă a litigiilor (reclamatiisal.anpc.ro) — detalii pe pagina Informații despre companie.",
          },
        },
      ],
    },
  ],
};
