import type { LegalDocument } from "./types";

// Public account-deletion page (Google Play "Delete account URL"; also useful
// for Apple review). Every statement mirrors the code as of 11 Nov 2026:
// admin-api src/modules/auth/account-deletion.service.ts (what is purged,
// DAC7 records kept), auth.controller.ts POST /auth/account/delete (owner
// blocked by an active subscription; native gets an email with the steps) and
// customer.controller.ts POST /marketplace/customer/delete. Menu paths match
// the EN/RO UI strings of the marketplace app, zavoia-web /account and the
// admin dashboard. Update this page whenever any of those change.

export const accountDeletion: LegalDocument = {
  slug: "account-deletion",
  audience: "general",
  title: { en: "Deleting your account", ro: "Ștergerea contului" },
  shortTitle: { en: "Account deletion", ro: "Ștergerea contului" },
  description: {
    en: "How to delete your account in the Zavoia and Zavoia Admin apps or on the web, what is deleted and what is kept.",
    ro: "Cum vă ștergeți contul din aplicațiile Zavoia și Zavoia Admin sau de pe web, ce se șterge și ce se păstrează.",
  },
  status: "published",
  effectiveDate: "2026-11-11",
  sections: [
    {
      id: "in-the-apps",
      title: {
        en: "Delete your account in the app",
        ro: "Ștergerea contului din aplicație",
      },
      summary: {
        en: "You can delete your account yourself, at any time. Deletion is immediate and permanent, and we confirm it by email.",
        ro: "Vă puteți șterge singur contul, oricând. Ștergerea este imediată și definitivă, iar confirmarea vă este trimisă pe email.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Zavoia (the app for booking appointments): Profile → Login & security → Delete account.",
              "Zavoia Admin (the app for businesses), business owners: Account → Delete account.",
              "Zavoia Admin, team members: Account → Advanced → Delete account.",
            ],
            ro: [
              "Zavoia (aplicația pentru programări): Profil → Autentificare și securitate → Șterge contul.",
              "Zavoia Admin (aplicația pentru afaceri), proprietari: Cont → Șterge contul.",
              "Zavoia Admin, membri ai echipei: Cont → Avansat → Șterge contul.",
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "A business owner with an active subscription must cancel it before the account can be deleted. In the Zavoia Admin app you will receive an email with the steps; on the web, cancel it under Account → Billing & Subscription.",
            ro: "Un proprietar de afacere cu un abonament activ trebuie să îl anuleze înainte ca contul să poată fi șters. În aplicația Zavoia Admin veți primi un email cu pașii de urmat; pe web, îl anulați din Cont → Facturare și Abonament.",
          },
        },
      ],
    },
    {
      id: "on-the-web",
      title: {
        en: "Delete your account on the web",
        ro: "Ștergerea contului de pe web",
      },
      summary: {
        en: "If you no longer have the app, you can delete your account from any browser.",
        ro: "Dacă nu mai aveți aplicația, vă puteți șterge contul din orice browser.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Customer accounts: sign in at www.zavoia.com, then Account → Login & security → Delete account.",
              "Business owners: sign in at app.zavoia.com, then Account → Delete account.",
              "Team members: sign in at app.zavoia.com, then Account → Advanced → Delete account.",
            ],
            ro: [
              "Conturi de client: autentificați-vă pe www.zavoia.com, apoi Cont → Autentificare și securitate → Șterge contul.",
              "Proprietari de afaceri: autentificați-vă pe app.zavoia.com, apoi Cont → Șterge contul.",
              "Membri ai echipei: autentificați-vă pe app.zavoia.com, apoi Cont → Avansat → Șterge contul.",
            ],
          },
        },
      ],
    },
    {
      id: "by-email",
      title: {
        en: "If you cannot sign in",
        ro: "Dacă nu vă puteți autentifica",
      },
      summary: {
        en: "Ask us by email, from the email address of the account.",
        ro: "Ne puteți cere ștergerea pe email, de la adresa de email a contului.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Write to support@zavoia.com from the email address of the account you want deleted, with the subject “Delete my account”. We act only on requests sent from the account’s own email address, and we may ask you to confirm before we delete anything. We complete the deletion within 30 days and confirm it by email.",
            ro: "Scrieți la support@zavoia.com de la adresa de email a contului pe care doriți să îl ștergeți, cu subiectul „Ștergere cont”. Dăm curs doar solicitărilor trimise de la adresa de email a contului și vă putem cere o confirmare înainte de a șterge ceva. Finalizăm ștergerea în cel mult 30 de zile și vă confirmăm pe email.",
          },
        },
      ],
    },
    {
      id: "what-is-deleted",
      title: { en: "What is deleted", ro: "Ce se șterge" },
      summary: {
        en: "Your account and its data are removed from Zavoia straight away.",
        ro: "Contul și datele sale sunt eliminate imediat din Zavoia.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Customer account: your profile and sign-in details, profile photo, bookings, saved businesses and professionals, the reviews you wrote, your notifications and the devices registered for push notifications.",
              "Business account (owner): the business and everything in it: locations, services, team, calendar and appointments, client list, marketplace listing and website, photos and files, notifications, support requests and SMS history. Team members who have no other Zavoia access are deleted as well and are informed by email.",
              "Team member account: your access to every business you belonged to, your professional profile and your profile photo.",
            ],
            ro: [
              "Cont de client: profilul și datele de autentificare, fotografia de profil, programările, afacerile și profesioniștii salvați, recenziile scrise de dumneavoastră, notificările și dispozitivele înregistrate pentru notificări push.",
              "Cont de afacere (proprietar): afacerea și tot ce conține: locațiile, serviciile, echipa, calendarul și programările, lista de clienți, profilul din marketplace și site-ul, fotografiile și fișierele, notificările, solicitările de asistență și istoricul SMS. Membrii echipei care nu au alt acces în Zavoia sunt șterși la rândul lor și sunt anunțați pe email.",
              "Cont de membru al echipei: accesul la fiecare afacere din care ați făcut parte, profilul profesional și fotografia de profil.",
            ],
          },
        },
        {
          kind: "p",
          text: {
            en: "One email address can hold more than one kind of access, for example a customer account and a team-member account. Deleting one of them removes only that access; the rest of your account data is kept until you delete the last one.",
            ro: "O adresă de email poate avea mai multe tipuri de acces, de exemplu un cont de client și un cont de membru al echipei. Ștergerea unuia dintre ele elimină doar acel acces; restul datelor contului se păstrează până când îl ștergeți și pe ultimul.",
          },
        },
      ],
    },
    {
      id: "what-we-keep",
      title: {
        en: "What we keep, and for how long",
        ro: "Ce păstrăm și cât timp",
      },
      summary: {
        en: "A few records must be kept after deletion, either by law or because they belong to someone else.",
        ro: "Câteva înregistrări trebuie păstrate după ștergere, fie prin lege, fie pentru că aparțin altcuiva.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Invoices and payment records for Zavoia subscriptions and purchases are kept by our payment processor (Stripe) and our invoicing provider (Oblio) for the period required by Romanian accounting and tax law.",
              "For businesses that completed bookings through Zavoia, the business identification details and booking-activity records needed for EU platform tax reporting (DAC7) are kept for the period required by tax law.",
              "Deleted data can remain in our database backups for a short period, until those backups are overwritten.",
              "Client records that a business created itself, for example when you booked by phone, belong to that business. To have them deleted, contact the business directly.",
            ],
            ro: [
              "Facturile și evidențele plăților pentru abonamentele și achizițiile Zavoia sunt păstrate de procesatorul nostru de plăți (Stripe) și de furnizorul nostru de facturare (Oblio) pe perioada impusă de legislația contabilă și fiscală din România.",
              "Pentru afacerile care au avut programări finalizate prin Zavoia, datele de identificare ale afacerii și evidențele activității de programare necesare raportării fiscale a platformelor în UE (DAC7) sunt păstrate pe perioada impusă de legislația fiscală.",
              "Datele șterse pot rămâne pentru o scurtă perioadă în copiile de siguranță ale bazei de date, până când acestea sunt suprascrise.",
              "Fișele de client create chiar de o afacere, de exemplu când ați făcut o programare telefonic, aparțin acelei afaceri. Pentru ștergerea lor, contactați direct afacerea.",
            ],
          },
        },
      ],
    },
  ],
};
