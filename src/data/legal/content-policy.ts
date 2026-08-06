import type { LegalDocument } from "./types";

export const contentPolicy: LegalDocument = {
  slug: "content-policy",
  audience: "general",
  title: {
    en: "Reviews, Content & Moderation Policy",
    ro: "Politica de recenzii, conținut și moderare",
  },
  shortTitle: { en: "Content policy", ro: "Politica de conținut" },
  description: {
    en: "Who can leave reviews and how they are verified, what content is prohibited, how moderation works, and how to report content.",
    ro: "Cine poate lăsa recenzii și cum sunt verificate, ce conținut este interzis, cum funcționează moderarea și cum raportați conținut.",
  },
  status: "draft",
  sections: [
    {
      id: "review-rules",
      blueprintRef: "B6",
      title: {
        en: "Who can review and when",
        ro: "Cine poate lăsa recenzii și când",
      },
      summary: {
        en: "Reviews are tied to real appointments booked through Zavoia.",
        ro: "Recenziile sunt legate de programări reale făcute prin Zavoia.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "You can review a venue or professional after a completed appointment there, booked through Zavoia — the system only accepts a review once the appointment is marked completed. One review per appointment; reviews cannot currently be edited after submission, and you can ask our support team to remove a review you wrote. Reviews can be left within [3 months] after the appointment.",
            ro: "Puteți lăsa o recenzie unei unități sau unui profesionist după o programare finalizată acolo, făcută prin Zavoia — sistemul acceptă o recenzie doar după ce programarea este marcată ca finalizată. O recenzie per programare; recenziile nu pot fi în prezent editate după trimitere, iar echipa noastră de asistență poate elimina, la cerere, o recenzie scrisă de dumneavoastră. Recenziile pot fi lăsate în termen de [3 luni] după programare.",
          },
        },
        {
          kind: "note",
          text: {
            en: "Code check 1 Aug 2026 (supersedes the blueprint B6 'absent' note, which is stale): the server DOES enforce COMPLETED-appointment status and one-review-per-appointment (customer.service.ts:65,94-109) — the completed-appointment claim above is accurate; confirm the deployed build matches before publication. No edit/delete endpoints exist — the support-removal route is a manual policy commitment support must actually honour. The [3 months] window is NOT enforced in code: decide it and implement it, or remove the window claim. Note also: a business marking appointments COMPLETED is manual — decisions doc §6.4 flags reliability of that status.",
            ro: "Verificare cod 1 aug. 2026 (înlocuiește nota „lipsește” din blueprint B6, care este depășită): serverul CHIAR impune statutul de programare FINALIZATĂ și o-recenzie-per-programare (customer.service.ts:65,94-109) — afirmația de mai sus despre programarea finalizată este exactă; confirmați că versiunea publicată corespunde înainte de publicare. Nu există endpoint-uri de editare/ștergere — eliminarea prin asistență este un angajament de politică pe care asistența trebuie să îl onoreze efectiv. Fereastra de [3 luni] NU este impusă în cod: decideți-o și implementați-o, sau eliminați afirmația. De notat: marcarea programărilor ca FINALIZATE de către afacere este manuală — documentul de decizii §6.4 semnalează fiabilitatea acestui statut.",
          },
        },
      ],
    },
    {
      id: "review-verification",
      blueprintRef: "B6",
      title: {
        en: "How reviews are verified",
        ro: "Cum sunt verificate recenziile",
      },
      summary: {
        en: "An honest statement of what our verification does and does not check.",
        ro: "O declarație onestă despre ce verifică și ce nu verifică sistemul nostru.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Reviews on Zavoia can only be submitted from the customer account that booked the appointment through the platform, and only after that appointment is marked completed — they cannot be submitted by unregistered visitors. We do not accept paid or incentivized reviews, and businesses cannot pay to change or remove reviews. Beyond this link to a completed booking, we do not independently verify the opinions expressed.",
            ro: "Recenziile pe Zavoia pot fi trimise doar din contul de client care a făcut programarea prin platformă și doar după ce acea programare este marcată ca finalizată — nu pot fi trimise de vizitatori neînregistrați. Nu acceptăm recenzii plătite sau stimulate, iar afacerile nu pot plăti pentru modificarea sau eliminarea recenziilor. Dincolo de această legătură cu o programare finalizată, nu verificăm independent opiniile exprimate.",
          },
        },
        {
          kind: "p",
          text: {
            en: "This statement is required to be accurate under Romanian consumer law (Legea 363/2007): we tell you exactly what 'verified' means here, and nothing more.",
            ro: "Această declarație trebuie să fie exactă conform legislației române de protecție a consumatorilor (Legea 363/2007): vă spunem exact ce înseamnă „verificat” aici, și nimic mai mult.",
          },
        },
      ],
    },
    {
      id: "prohibited-content",
      title: { en: "Prohibited content", ro: "Conținut interzis" },
      summary: {
        en: "What may not be posted anywhere on the platform.",
        ro: "Ce nu poate fi publicat nicăieri pe platformă.",
      },
      body: [
        {
          kind: "list",
          items: {
            en: [
              "Illegal content of any kind.",
              "Hate speech, threats, harassment or content demeaning a person.",
              "Other people's personal data (phone numbers, addresses, health details) posted without their consent.",
              "False, misleading, paid-for or incentivized reviews; reviews written by the business about itself or by competitors.",
              "Spam, advertising unrelated to the venue, or content designed to manipulate rankings.",
              "Malware, phishing or content that compromises security.",
              "Content that infringes intellectual property rights, including photos you have no right to use.",
            ],
            ro: [
              "Conținut ilegal de orice fel.",
              "Discurs instigator la ură, amenințări, hărțuire sau conținut care înjosește o persoană.",
              "Datele personale ale altora (numere de telefon, adrese, detalii de sănătate) publicate fără consimțământul lor.",
              "Recenzii false, înșelătoare, plătite sau stimulate; recenzii scrise de afacere despre sine sau de concurenți.",
              "Spam, publicitate fără legătură cu unitatea sau conținut menit să manipuleze ierarhizarea.",
              "Malware, phishing sau conținut care compromite securitatea.",
              "Conținut care încalcă drepturi de proprietate intelectuală, inclusiv fotografii pe care nu aveți dreptul să le folosiți.",
            ],
          },
        },
      ],
    },
    {
      id: "moderation",
      blueprintRef: "A9 / DSA art. 14",
      title: { en: "How moderation works", ro: "Cum funcționează moderarea" },
      summary: {
        en: "Our moderation procedures and tools, as the DSA requires us to describe.",
        ro: "Procedurile și instrumentele noastre de moderare, așa cum ne cere DSA să le descriem.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Content moderation on Zavoia is performed by our team (human review), acting on reports we receive and on checks of reported or flagged content. We do not currently use automated decision-making to remove content; if we introduce automated tools, we will describe them here first. Moderation decisions apply the rules in this policy and the law — not the commercial interests of any business.",
            ro: "Moderarea conținutului pe Zavoia este realizată de echipa noastră (verificare umană), pe baza raportărilor primite și a verificării conținutului raportat sau semnalat. Nu folosim în prezent decizii automate pentru eliminarea conținutului; dacă introducem instrumente automate, le vom descrie aici mai întâi. Deciziile de moderare aplică regulile din această politică și legea — nu interesele comerciale ale vreunei afaceri.",
          },
        },
        {
          kind: "note",
          text: {
            en: "Verify before publication: confirm with the team that no automated moderation/filtering runs in production (the capabilities audit shows an internal moderation console in the CRM; no automated pipeline was found). DSA art. 14 requires this description to be accurate, including algorithmic vs human review.",
            ro: "De verificat înainte de publicare: confirmați cu echipa că nicio moderare/filtrare automată nu rulează în producție (auditul de capabilități arată o consolă internă de moderare în CRM; nu a fost găsit un flux automat). Art. 14 DSA cere ca această descriere să fie exactă, inclusiv privind verificarea algoritmică vs umană.",
          },
        },
      ],
    },
    {
      id: "reporting",
      blueprintRef: "doc 7 / DSA art. 16",
      title: { en: "Reporting content", ro: "Raportarea conținutului" },
      summary: {
        en: "The notice-and-action route, open to anyone.",
        ro: "Mecanismul de notificare și acțiune, deschis oricui.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "Anyone — with or without an account — can report content they consider illegal or in breach of this policy, at [report channel: form/email]. A useful report includes: where the content is (link), why you consider it illegal or non-compliant, your name and email (unless the report concerns content where anonymity is legally protected), and a statement that your report is made in good faith. We confirm receipt and tell you the outcome.",
            ro: "Oricine — cu sau fără cont — poate raporta conținut pe care îl consideră ilegal sau contrar acestei politici, la [canalul de raportare: formular/email]. O raportare utilă include: unde se află conținutul (link), de ce îl considerați ilegal sau neconform, numele și emailul dumneavoastră (cu excepția cazurilor în care anonimatul este protejat legal) și o declarație că raportarea este făcută cu bună-credință. Confirmăm primirea și vă comunicăm rezultatul.",
          },
        },
        {
          kind: "note",
          text: {
            en: "IMPL: a dedicated report form (or at minimum a monitored email address) must exist before publication — DSA art. 16 requires an easy-to-access, electronic notice mechanism. Decide the channel and insert it above.",
            ro: "IMPL: un formular de raportare dedicat (sau cel puțin o adresă de email monitorizată) trebuie să existe înainte de publicare — art. 16 DSA cere un mecanism electronic de notificare ușor accesibil. Decideți canalul și inserați-l mai sus.",
          },
        },
      ],
    },
    {
      id: "decisions-appeals",
      blueprintRef: "A9 / DSA art. 17",
      title: {
        en: "Decisions, statements of reasons and appeals",
        ro: "Decizii, motivare și contestații",
      },
      summary: {
        en: "We explain removals and you can appeal.",
        ro: "Explicăm eliminările și puteți contesta.",
      },
      body: [
        {
          kind: "p",
          text: {
            en: "If we remove or restrict your content, restrict your account's ability to post, or decline to act on your report, we tell you the decision and the reasons: which rule or law applied, the facts relied on, and whether the decision was made by a human. You can appeal within [14 days] by replying to the decision notice; an appeal is reviewed by a person not involved in the original decision.",
            ro: "Dacă vă eliminăm sau restricționăm conținutul, restricționăm posibilitatea contului de a publica sau decidem să nu acționăm la raportarea dumneavoastră, vă comunicăm decizia și motivele: ce regulă sau lege s-a aplicat, faptele avute în vedere și dacă decizia a fost luată de un om. Puteți contesta în termen de [14 zile] răspunzând la notificarea deciziei; contestația este analizată de o persoană neimplicată în decizia inițială.",
          },
        },
      ],
    },
  ],
};
