import type { LegalDocument } from "./types";

export const bookingPolicy: LegalDocument = {
  slug: "booking-policy",
  audience: "customer",
  title: {
    en: "Booking & Cancellation Policy",
    ro: "Politica de programări și anulări",
  },
  shortTitle: { en: "Booking policy", ro: "Politica de programări" },
  description: {
    en: "How bookings, confirmations, cancellations, rescheduling and no-shows work on Zavoia.",
    ro: "Cum funcționează programările, confirmările, anulările, reprogramările și neprezentările pe Zavoia.",
  },
  status: "published",
  effectiveDate: "2026-11-14",
  sections: [
    {
      id: "how-booking-works",
      blueprintRef: "B3",
      title: { en: "How booking works", ro: "Cum funcționează programarea" },
      summary: {
        en: "Select, review, submit — then the business accepts the slot.",
        ro: "Selectați, verificați, trimiteți — apoi afacerea acceptă intervalul.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You choose a venue, one or more services, a professional (or any available professional) and an available time. Before submitting, you can check and correct your selection. After you submit, the booking reserves the slot in the business's calendar. Some businesses confirm bookings automatically; others review each request first, and until they do, your booking shows as pending. Your bookings screen always shows the current status of each booking.",
            ro: "Alegeți o unitate, unul sau mai multe servicii, un profesionist (sau orice profesionist disponibil) și un interval disponibil. Înainte de trimitere, puteți verifica și corecta selecția. După trimitere, programarea rezervă intervalul în calendarul afacerii. Unele afaceri confirmă programările automat; altele verifică fiecare cerere, iar până atunci programarea apare ca fiind în așteptare. Ecranul programărilor arată întotdeauna starea curentă a fiecărei programări.",
          },
        },
        {
          kind: "p",
          text: {
            en: "Booking creates no payment obligation through Zavoia — payment for the service happens at the venue, directly with the business.",
            ro: "Programarea nu creează nicio obligație de plată prin Zavoia — plata serviciului are loc la sediu, direct cu afacerea.",
          },
        },
      ],
    },
    {
      id: "provider-policies",
      blueprintRef: "§0.2",
      title: { en: "Provider policies", ro: "Politicile furnizorilor" },
      summary: {
        en: "Each business sets its own notice periods, shown before you book.",
        ro: "Fiecare afacere își stabilește propriile termene de preaviz, afișate înainte de rezervare.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Each business decides whether you can cancel or reschedule online and sets a minimum notice period for each — for example 24 hours before the appointment. Its rules are shown before you book. The notice period is a self-service availability rule: it controls when you can cancel or reschedule online, it follows the business's settings at the time you cancel or reschedule, and it never creates any payment obligation for you.",
            ro: "Fiecare afacere decide dacă puteți anula sau reprograma online și stabilește un termen minim de preaviz pentru fiecare — de exemplu 24 de ore înainte de programare. Regulile ei sunt afișate înainte de rezervare. Termenul de preaviz este o regulă privind anularea și reprogramarea online: controlează când puteți anula sau reprograma online, urmează setările afacerii din momentul în care anulați sau reprogramați și nu creează niciodată vreo obligație de plată pentru dumneavoastră.",
          },
        },
      ],
    },
    {
      id: "cancelling",
      blueprintRef: "B7",
      title: {
        en: "Cancelling and rescheduling",
        ro: "Anularea și reprogramarea",
      },
      summary: {
        en: "Free online up to the notice deadline.",
        ro: "Gratuit online, până la termenul de preaviz.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Up to the notice deadline, you can cancel or reschedule from your bookings screen, free of charge.",
              "After the notice deadline, or if the business doesn't allow online changes, contact the venue directly; whether it can still accommodate you is its decision.",
              "Rescheduling depends on available slots and follows the same availability rules as a new booking.",
              "The business can also move or cancel your booking (for example if a professional becomes unavailable) — check your bookings screen for the current status.",
            ],
            ro: [
              "Până la termenul de preaviz, puteți anula sau reprograma din ecranul programărilor, gratuit.",
              "După termenul de preaviz, sau dacă afacerea nu permite modificări online, contactați direct unitatea; dacă vă mai poate primi este decizia acesteia.",
              "Reprogramarea depinde de intervalele disponibile și urmează aceleași reguli de disponibilitate ca o programare nouă.",
              "Afacerea vă poate, la rândul ei, muta sau anula programarea (de exemplu dacă un profesionist devine indisponibil) — verificați ecranul programărilor pentru starea curentă.",
            ],
          },
        },
      ],
    },
    {
      id: "no-shows",
      title: { en: "No-shows", ro: "Neprezentări" },
      summary: {
        en: "No no-show fees; repeated no-shows have consequences.",
        ro: "Fără taxe de neprezentare; neprezentările repetate au consecințe.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "If you miss an appointment booked through Zavoia, neither Zavoia nor the business may charge you a no-show fee. However, missed appointments cost businesses real time, so repeated no-shows can lead to restrictions on your ability to book through Zavoia, and a business may cancel your future bookings with it.",
            ro: "Dacă ratați o programare făcută prin Zavoia, nici Zavoia, nici afacerea nu vă pot percepe o taxă de neprezentare. Totuși, programările ratate înseamnă timp pierdut pentru afaceri, așa că neprezentările repetate pot duce la restricții asupra posibilității de a face programări prin Zavoia, iar o afacere vă poate anula programările viitoare la ea.",
          },
        },
      ],
    },
    {
      id: "withdrawal-rights",
      blueprintRef: "B3 fallback / gate D3",
      title: {
        en: "Statutory withdrawal rights",
        ro: "Dreptul legal de retragere",
      },
      summary: {
        en: "How distance-contract withdrawal rules relate to bookings.",
        ro: "Cum se raportează regulile de retragere din contractele la distanță la programări.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Because a booking on Zavoia reserves a time slot without creating a payment obligation, you lose nothing by cancelling as described in this policy. Where a service contract with a business qualifies as a distance contract, the statutory rules on the right of withdrawal apply between you and the business.",
            ro: "Deoarece o programare pe Zavoia rezervă un interval orar fără a crea o obligație de plată, nu pierdeți nimic anulând conform acestei politici. Când un contract de servicii cu o afacere se califică drept contract la distanță, regulile legale privind dreptul de retragere se aplică între dumneavoastră și afacere.",
          },
        },
      ],
    },
  ],
};
