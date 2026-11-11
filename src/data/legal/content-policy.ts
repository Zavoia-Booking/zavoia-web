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
            en: "DEC + IMPL (re-verified 11 Nov 2026): the completed-appointment rule and one review per appointment are enforced by the server (customer.service.ts), so those statements are accurate. Customers can only create reviews — there is no edit or delete in the product, so removal on request is a manual commitment support must honour. Still open: the [3 months] window is NOT enforced in code — decide it and build it, or delete the window sentence. Marking an appointment COMPLETED is a manual action by the business (decisions doc §6.4).",
            ro: "DEC + IMPL (re-verificat 11 nov. 2026): regula programării finalizate și o recenzie per programare sunt impuse de server (customer.service.ts), deci aceste afirmații sunt exacte. Clienții pot doar crea recenzii — nu există editare sau ștergere în produs, așa că eliminarea la cerere este un angajament manual pe care asistența trebuie să îl onoreze. Rămâne deschis: fereastra de [3 luni] NU este impusă în cod — decideți-o și implementați-o, sau ștergeți propoziția despre fereastră. Marcarea unei programări ca FINALIZATĂ este o acțiune manuală a afacerii (documentul de decizii §6.4).",
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
            en: "DEC + IMPL (re-verified 11 Nov 2026): “Report a problem” exists on listings, professional profiles and appointments, on the web and in the app, and opens a support ticket with context (create-support-ticket.dto.ts). Gaps: reviews cannot be reported; ticket categories are only “bug” and “question” (ticket.entity.ts); there is no notice form for illegal content open to people without an account. DSA art. 16 requires an easy, electronic notice mechanism: either add a report option on reviews plus an illegal-content form, or name a monitored email address (for example support@zavoia.com) in [report channel] above.",
            ro: "DEC + IMPL (re-verificat 11 nov. 2026): „Raportează o problemă” există pe profilurile din marketplace, pe profilurile profesioniștilor și pe programări, pe web și în aplicație, și deschide un tichet de asistență cu context (create-support-ticket.dto.ts). Lacune: recenziile nu pot fi raportate; categoriile de tichete sunt doar „bug” și „întrebare” (ticket.entity.ts); nu există un formular de notificare pentru conținut ilegal deschis persoanelor fără cont. Art. 16 DSA cere un mecanism electronic de notificare ușor de folosit: fie adăugați raportarea recenziilor și un formular pentru conținut ilegal, fie indicați o adresă de email monitorizată (de exemplu support@zavoia.com) în [canalul de raportare] de mai sus.",
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
