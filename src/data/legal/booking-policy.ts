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
  status: "draft",
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
            en: "You choose a venue, one or more services (optionally a specific professional), and an available time. Before submitting, the summary screen lets you check and correct your selection. After you submit, the booking reserves the slot in the business's calendar; “confirmed” means the business accepted the slot. Your bookings screen always shows the current status of each booking.",
            ro: "Alegeți o unitate, unul sau mai multe servicii (opțional un anumit profesionist) și un interval disponibil. Înainte de trimitere, ecranul de sumar vă permite să verificați și să corectați selecția. După trimitere, programarea rezervă intervalul în calendarul afacerii; „confirmat” înseamnă că afacerea a acceptat intervalul. Ecranul programărilor arată întotdeauna starea curentă a fiecărei programări.",
          },
        },
        {
          kind: "note",
          text: {
            en: "IMPL (audit §6.20): notification promises were deliberately removed — verified gaps: auto-confirmed bookings send no confirmation message, pending bookings send no 'received' message, bulk/generic cancellations send nothing, email/SMS channel preference is ignored, web inbox and fresh-install push are unwired. Fix the notification layer before the terms may promise notifications. Also per decisions doc §2.4.B, UI copy ('Confirm booking', 'You're booked') must change to request/reserve language.",
            ro: "IMPL (audit §6.20): promisiunile de notificare au fost eliminate deliberat — lacune verificate: programările auto-confirmate nu trimit confirmare, cele în așteptare nu trimit mesaj de primire, anulările în masă/generice nu trimit nimic, preferința de canal email/SMS este ignorată, inbox-ul web și push-ul la instalare nouă sunt neconectate. Reparați stratul de notificări înainte ca termenii să poată promite notificări. De asemenea, conform documentului de decizii §2.4.B, textele din interfață („Confirmă programarea”, „Ești programat”) trebuie schimbate în limbaj de cerere/rezervare.",
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
            en: "Each business sets a minimum notice period for cancelling and (where different) for rescheduling — for example 24 hours before the appointment. The applicable periods are shown before you book. The notice period is a self-service availability rule: it controls when you can cancel or reschedule online, it reflects the business's current settings, and it never creates any payment obligation for you.",
            ro: "Fiecare afacere stabilește un termen minim de preaviz pentru anulare și (unde diferă) pentru reprogramare — de exemplu 24 de ore înainte de programare. Termenele aplicabile sunt afișate înainte de rezervare. Termenul de preaviz este o regulă de disponibilitate a auto-servirii: controlează când puteți anula sau reprograma online, reflectă setările curente ale afacerii și nu creează niciodată vreo obligație de plată pentru dumneavoastră.",
          },
        },
        {
          kind: "note",
          text: {
            en: "Verified 1 Aug 2026: the policy shown at booking is NOT snapshotted — the API applies the business's current settings to existing appointments (appointments.service.ts; decisions doc §2.4.D). The wording above uses the decisions doc's honest fallback ('current self-service availability rule'). Once per-booking policy snapshotting ships (blueprint §0.2 [IMPL]), upgrade this section and customer-terms to the version-recorded + grandfathering wording.",
            ro: "Verificat 1 aug. 2026: politica afișată la rezervare NU este înregistrată per programare — API-ul aplică setările curente ale afacerii programărilor existente (appointments.service.ts; documentul de decizii §2.4.D). Formularea de mai sus folosește varianta onestă din documentul de decizii („regulă curentă de disponibilitate a auto-servirii”). Când înregistrarea politicii per programare va fi implementată (blueprint §0.2 [IMPL]), actualizați această secțiune și termenii pentru clienți la formularea cu versiune înregistrată + protejarea programărilor existente.",
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
        en: "Free through the app outside the notice period.",
        ro: "Gratuit din aplicație, în afara termenului de preaviz.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Outside the notice period, you can cancel or reschedule from your bookings screen, free of charge.",
              "Inside the notice period, online cancellation and rescheduling are no longer available — contact the venue directly; whether it can still accommodate you is its decision.",
              "Rescheduling depends on available slots and follows the same availability rules as a new booking.",
              "The business can also cancel or propose changes (for example if a professional becomes unavailable) — check your bookings screen for the current status.",
            ],
            ro: [
              "În afara termenului de preaviz, puteți anula sau reprograma din ecranul programărilor, gratuit.",
              "În interiorul termenului de preaviz, anularea și reprogramarea online nu mai sunt disponibile — contactați direct unitatea; dacă vă mai poate acomoda este decizia acesteia.",
              "Reprogramarea depinde de intervalele disponibile și urmează aceleași reguli de disponibilitate ca o programare nouă.",
              "Afacerea poate, la rândul ei, anula sau propune modificări (de exemplu dacă un profesionist devine indisponibil) — verificați ecranul programărilor pentru starea curentă.",
            ],
          },
        },
      ],
    },
    {
      id: "no-shows",
      title: { en: "No-shows", ro: "Neprezentări" },
      summary: {
        en: "No fees through Zavoia; repeated no-shows have consequences.",
        ro: "Fără taxe prin Zavoia; neprezentările repetate au consecințe.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "If you miss an appointment, Zavoia does not charge you anything — there are no no-show fees on the platform. However, missed appointments cost businesses real time, so repeated no-shows can lead to restrictions on your ability to book through Zavoia, and a business may decline your future bookings.",
            ro: "Dacă ratați o programare, Zavoia nu vă percepe nimic — nu există taxe de neprezentare pe platformă. Totuși, programările ratate costă afacerile timp real, așa că neprezentările repetate pot duce la restricții asupra posibilității de a face programări prin Zavoia, iar o afacere poate refuza programările dumneavoastră viitoare.",
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
            en: "Because a booking on Zavoia reserves a time slot without creating a payment obligation through the platform, you lose nothing by cancelling per this policy. Where a service contract with a business qualifies as a distance contract, the legal withdrawal regime for services on specific dates may apply between you and the business.",
            ro: "Deoarece o programare pe Zavoia rezervă un interval orar fără a crea o obligație de plată prin platformă, nu pierdeți nimic anulând conform acestei politici. Când un contract de servicii cu o afacere se califică drept contract la distanță, regimul legal de retragere pentru servicii la date specifice se poate aplica între dumneavoastră și afacere.",
          },
        },
        {
          kind: "note",
          text: {
            en: "COUNSEL GATE (blueprint B3 fallback / D3): the final text of this section depends on the booking classification. If the flow is classified as contract-forming, this section must implement the OUG 34/2014 information set, per-venue-type art. 16 exemption mapping and the art. 11¹ withdrawal function. Do not publish before that decision.",
            ro: "GATE JURIDIC (blueprint B3 varianta de rezervă / D3): textul final al acestei secțiuni depinde de clasificarea programării. Dacă fluxul este clasificat ca formator de contract, secțiunea trebuie să implementeze setul de informații OUG 34/2014, maparea excepțiilor art. 16 pe tipuri de unități și funcția de retragere art. 11¹. Nu publicați înainte de această decizie.",
          },
        },
      ],
    },
  ],
};
