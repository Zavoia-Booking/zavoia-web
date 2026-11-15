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
    en: "The terms for team members — people invited to work in a business's workspace.",
    ro: "Termenii pentru membrii echipei — persoanele invitate să lucreze în spațiul de lucru al unei afaceri.",
  },
  status: "published",
  effectiveDate: "2026-11-14",
  sections: [
    {
      id: "scope",
      blueprintRef: "doc 4",
      title: {
        en: "Who these terms cover",
        ro: "Cui i se aplică acești termeni",
      },
      summary: {
        en: "Everyone who joins a business's workspace as a team member.",
        ro: "Oricine se alătură spațiului de lucru al unei afaceri ca membru de echipă.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "These terms govern your individual account when you work in a business's workspace on Zavoia as an invited team member, including when you appear as a professional in its listing. They bind you personally. The workspace owner accepts the Business Terms instead, which govern the workspace's relationship with Zavoia.",
            ro: "Acești termeni guvernează contul dumneavoastră individual când lucrați în spațiul de lucru al unei afaceri pe Zavoia ca membru de echipă invitat, inclusiv când apăreți ca profesionist în listarea acesteia. Vă obligă personal. Proprietarul spațiului de lucru acceptă în schimb Termenii pentru afaceri, care guvernează relația spațiului de lucru cu Zavoia.",
          },
        },
      ],
    },
    {
      id: "acceptance",
      blueprintRef: "§0.2 / A3",
      title: { en: "Acceptance", ro: "Acceptare" },
      summary: {
        en: "A ticked box each time you accept an invitation.",
        ro: "O căsuță bifată la fiecare invitație acceptată.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You accept these terms by ticking the box each time you accept an invitation to join a business's team. If you are new to Zavoia, this happens before your account is created. Opening an invitation link alone never constitutes acceptance.",
            ro: "Acceptați acești termeni bifând căsuța de fiecare dată când acceptați o invitație de a vă alătura echipei unei afaceri. Dacă sunteți nou pe Zavoia, acest lucru are loc înainte de crearea contului. Simpla deschidere a unui link de invitație nu constituie niciodată acceptare.",
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
              "Contul este personal: un singur cont pentru fiecare persoană, netransferabil, nepartajat — inclusiv fără partajarea unui cont între angajați pentru a evita facturarea locurilor.",
              "Păstrați confidențialitatea datelor de autentificare și activați funcțiile de securitate disponibile; notificați prompt proprietarul spațiului de lucru și Zavoia dacă suspectați acces neautorizat.",
              "Furnizați informații corecte și mențineți-le actuale; profilul dumneavoastră profesional trebuie să vă descrie în mod veridic.",
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
            en: "The same account can hold different roles, in one or several workspaces: owner, team member, professional — and separately, marketplace customer. Each role gives access only to what it needs, and each is governed by its document: these terms for your work as a team member, the Business Terms for the workspace, the Provider Terms for the listing, and the Marketplace Customer Terms for the customer role (presented when that role is enabled).",
            ro: "Același cont poate deține roluri diferite, în unul sau mai multe spații de lucru: proprietar, membru de echipă, profesionist — și, separat, client în marketplace. Fiecare rol oferă acces doar la ce are nevoie și fiecare este guvernat de documentul său: acești termeni pentru activitatea dumneavoastră ca membru de echipă, Termenii pentru afaceri pentru spațiul de lucru, Termenii pentru furnizori pentru listare și Termenii pentru clienți pentru rolul de client (prezentați la activarea acelui rol).",
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
            en: "The acceptable-use rules in the Terms of Use apply to your individual use. Additionally, on the business side: only enter client data you are entitled to process, respect customers' privacy, and do not misuse marketplace-originated contact data.",
            ro: "Regulile de utilizare acceptabilă din Termenii de utilizare se aplică utilizării dumneavoastră individuale. Suplimentar, când lucrați pentru o afacere: introduceți doar date de clienți pe care aveți dreptul să le prelucrați, respectați confidențialitatea clienților și nu folosiți abuziv datele de contact provenite din marketplace.",
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
            en: "When your role in a workspace is removed — by you or by the workspace owner — your access to that workspace ends. Your personal account continues to exist, along with any other roles it holds. If the owner deletes the business and your account has no other role on Zavoia (for example as a customer), your account is deleted as well, and we tell you by email. Data belonging to the business (clients, appointments, business content) stays with the business; data about you as a person is handled per the Privacy Notice.",
            ro: "Când rolul dumneavoastră într-un spațiu de lucru este eliminat — de dumneavoastră sau de proprietarul spațiului — accesul la acel spațiu încetează. Contul personal continuă să existe, împreună cu orice alte roluri deținute. Dacă proprietarul șterge afacerea, iar contul dumneavoastră nu are alt rol în Zavoia (de exemplu, de client), contul este șters și el, iar noi vă anunțăm prin email. Datele care aparțin afacerii (clienți, programări, conținutul afacerii) rămân la afacere; datele despre dumneavoastră ca persoană sunt gestionate conform Politicii de confidențialitate.",
          },
        },
      ],
    },
  ],
};
