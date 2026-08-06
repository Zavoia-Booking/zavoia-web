import type { LegalDocument } from "./types";

export const accountTerms: LegalDocument = {
  slug: "account-terms",
  audience: "business",
  title: {
    en: "Account & Authorized User Terms",
    ro: "Termenii contului și ai utilizatorilor autorizați",
  },
  shortTitle: { en: "Account terms", ro: "Termeni cont" },
  description: {
    en: "The terms for individual accounts on the business side — team members, invitees and role holders.",
    ro: "Termenii pentru conturile individuale pe partea de business — membri de echipă, persoane invitate și deținători de roluri.",
  },
  status: "draft",
  sections: [
    {
      id: "scope",
      blueprintRef: "doc 4",
      title: {
        en: "Who these terms cover",
        ro: "Cui i se aplică acești termeni",
      },
      summary: {
        en: "Every individual account used in a business workspace.",
        ro: "Fiecare cont individual folosit într-un spațiu de lucru business.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "These terms govern your individual account when it is used on the business side of Zavoia — as a workspace owner, an invited team member, or a professional appearing in a listing. They bind you personally; the workspace's relationship with Zavoia is governed by the Business Terms accepted by the workspace customer.",
            ro: "Acești termeni guvernează contul dumneavoastră individual când este folosit pe partea de business a Zavoia — ca proprietar de spațiu de lucru, membru de echipă invitat sau profesionist care apare într-o listare. Vă obligă personal; relația spațiului de lucru cu Zavoia este guvernată de Termenii pentru afaceri acceptați de clientul spațiului de lucru.",
          },
        },
      ],
    },
    {
      id: "acceptance",
      blueprintRef: "§0.2 / A3",
      title: { en: "Acceptance", ro: "Acceptare" },
      summary: {
        en: "Explicit acceptance on every path, recorded with version.",
        ro: "Acceptare explicită pe fiecare cale, înregistrată cu versiune.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You accept these terms through an explicit action when you create your account or complete a team invitation — whichever happens first — and again when a materially new role is enabled for your account. We record the accepted version, timestamp and the path through which you accepted. Opening an invitation link alone never constitutes acceptance.",
            ro: "Acceptați acești termeni printr-o acțiune explicită când vă creați contul sau finalizați o invitație în echipă — oricare are loc prima — și din nou când un rol semnificativ nou este activat pentru contul dumneavoastră. Înregistrăm versiunea acceptată, data și ora, și calea prin care ați acceptat. Simpla deschidere a unui link de invitație nu constituie niciodată acceptare.",
          },
        },
        {
          kind: "note",
          text: {
            en: "IMPL (blueprint §0.2): today the invitation link auto-accepts for existing active users on a GET request, and Google signup bypasses the terms checkbox — both must be replaced with explicit actions before this clause is accurate.",
            ro: "IMPL (blueprint §0.2): în prezent linkul de invitație acceptă automat pentru utilizatorii activi existenți la o simplă accesare, iar înregistrarea cu Google ocolește bifa de termeni — ambele trebuie înlocuite cu acțiuni explicite înainte ca această clauză să fie exactă.",
          },
        },
      ],
    },
    {
      id: "account-security",
      title: { en: "Account and security", ro: "Cont și securitate" },
      summary: {
        en: "One personal account, no sharing.",
        ro: "Un singur cont personal, fără partajare.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Your account is personal: one account per person, not transferable, not shared — including not sharing a login among staff to avoid seat billing.",
              "Keep credentials confidential and enable the security features available; notify the workspace owner and Zavoia promptly of suspected unauthorized access.",
              "Provide accurate information and keep it current; your professional profile must describe you truthfully.",
            ],
            ro: [
              "Contul este personal: un cont de persoană, netransferabil, nepartajat — inclusiv fără partajarea unui cont între angajați pentru a evita facturarea locurilor.",
              "Păstrați confidențialitatea datelor de autentificare și folosiți funcțiile de securitate disponibile; notificați prompt proprietarul spațiului de lucru și Zavoia dacă suspectați acces neautorizat.",
              "Furnizați informații corecte și mențineți-le actuale; profilul dumneavoastră profesional trebuie să vă descrie cu adevărat.",
            ],
          },
        },
      ],
    },
    {
      id: "roles",
      blueprintRef: "§0.1",
      title: { en: "Roles", ro: "Roluri" },
      summary: {
        en: "One identity, several possible roles, each with its own document.",
        ro: "O identitate, mai multe roluri posibile, fiecare cu propriul document.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "The same account can hold different roles, in one or several workspaces: owner, team member, professional — and separately, marketplace customer. Each role gives access only to what it needs, and each is governed by its document: these terms for individual business-side use, the Business Terms for the workspace, the Provider Terms for the listing, and the Marketplace Customer Terms for the customer role (presented when that role is enabled).",
            ro: "Același cont poate deține roluri diferite, în unul sau mai multe spații de lucru: proprietar, membru de echipă, profesionist — și, separat, client în marketplace. Fiecare rol oferă acces doar la ce are nevoie și fiecare este guvernat de documentul său: acești termeni pentru utilizarea individuală pe partea de business, Termenii pentru afaceri pentru spațiul de lucru, Termenii pentru furnizori pentru listare și Termenii pentru clienți pentru rolul de client (prezentați la activarea acelui rol).",
          },
        },
      ],
    },
    {
      id: "acceptable-use",
      title: { en: "Acceptable use", ro: "Utilizare acceptabilă" },
      summary: {
        en: "The platform-wide rules apply to you personally.",
        ro: "Regulile platformei vi se aplică personal.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "The acceptable-use rules in the Website Terms of Use apply to your individual use. Additionally, on the business side: only enter client data you are entitled to process, respect customers' privacy, and do not misuse marketplace-originated contact data.",
            ro: "Regulile de utilizare acceptabilă din Termenii de utilizare a site-ului se aplică utilizării dumneavoastră individuale. Suplimentar, pe partea de business: introduceți doar date de clienți pe care aveți dreptul să le prelucrați, respectați confidențialitatea clienților și nu folosiți abuziv datele de contact provenite din marketplace.",
          },
        },
      ],
    },
    {
      id: "offboarding",
      blueprintRef: "A8",
      title: { en: "Leaving a workspace", ro: "Părăsirea unui spațiu de lucru" },
      summary: {
        en: "Access ends; your personal account survives; business data stays with the business.",
        ro: "Accesul încetează; contul personal rămâne; datele afacerii rămân la afacere.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "When your role in a workspace is removed — by you or by the workspace owner — your access to that workspace ends. Your personal account continues to exist, along with any other roles it holds. Data belonging to the business (clients, appointments, business content) stays with the business; data about you as a person is handled per the Privacy Notice.",
            ro: "Când rolul dumneavoastră într-un spațiu de lucru este eliminat — de dumneavoastră sau de proprietarul spațiului — accesul la acel spațiu încetează. Contul personal continuă să existe, împreună cu orice alte roluri deținute. Datele care aparțin afacerii (clienți, programări, conținutul afacerii) rămân la afacere; datele despre dumneavoastră ca persoană sunt gestionate conform Politicii de confidențialitate.",
          },
        },
      ],
    },
  ],
};
