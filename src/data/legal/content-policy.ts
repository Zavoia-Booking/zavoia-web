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
  status: "published",
  effectiveDate: "2026-11-15",
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
            en: "You can review a venue or professional after a completed appointment there, whether you booked it through Zavoia or the business booked it for you in Zavoia — the system only accepts a review once the appointment is marked completed. One review per appointment; reviews cannot currently be edited after submission, and you can ask our support team to remove a review you wrote. Your review is public: it shows your first name, the initial of your last name, your profile photo if you added one, your star rating, your comment and the date. A review of a Health & Medical venue also shows that you visited it, so leave health details out of your comment.",
            ro: "Puteți lăsa o recenzie unei unități sau unui profesionist după o programare finalizată acolo, fie că ați făcut-o prin Zavoia, fie că afacerea a făcut-o pentru dumneavoastră în Zavoia — sistemul acceptă o recenzie doar după ce programarea este marcată ca finalizată. O recenzie per programare; recenziile nu pot fi în prezent editate după trimitere, iar echipa noastră de asistență poate elimina, la cerere, o recenzie scrisă de dumneavoastră. Recenzia dumneavoastră este publică: afișează prenumele, inițiala numelui de familie, fotografia de profil, dacă ați adăugat una, numărul de stele, comentariul și data. O recenzie la o unitate din categoria Sănătate & Medical arată și că ați vizitat-o, așa că nu includeți detalii despre sănătate în comentariu.",
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
            en: "Reviews on Zavoia can only be submitted from the Zavoia customer account an appointment belongs to — whether the customer booked it through Zavoia or the business booked it for them in Zavoia — and only after the business marks that appointment as completed. Unregistered visitors cannot submit reviews. We do not accept paid or incentivized reviews, and businesses cannot pay to change or remove reviews. Beyond this link to a completed booking, we do not independently verify the opinions expressed. Star ratings are simple averages of all published reviews, rounded to one decimal: a venue's rating counts the reviews of the venue and of its professionals, a brand's rating counts those of all its venues, and a professional's rating counts the reviews of that professional.",
            ro: "Recenziile de pe Zavoia pot fi trimise doar din contul de client Zavoia căruia îi aparține programarea — fie că clientul a făcut-o prin Zavoia, fie că afacerea a făcut-o pentru el în Zavoia — și doar după ce afacerea marchează acea programare ca finalizată. Vizitatorii neînregistrați nu pot trimite recenzii. Nu acceptăm recenzii plătite sau stimulate, iar afacerile nu pot plăti pentru modificarea sau eliminarea recenziilor. Dincolo de această legătură cu o programare finalizată, nu verificăm independent opiniile exprimate. Ratingurile sunt medii simple ale tuturor recenziilor publicate, rotunjite la o zecimală: ratingul unei unități include recenziile unității și ale profesioniștilor ei, ratingul unui brand include recenziile tuturor unităților lui, iar ratingul unui profesionist include recenziile acelui profesionist.",
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
            en: "Anyone — with or without an account — can report content they consider illegal or in breach of this policy, using the “Report an issue” form in our Help Centre (zavoia.com/help) or by email to support@zavoia.com. A useful report includes: where the content is (link), why you consider it illegal or non-compliant, your name and email (unless the report concerns content where anonymity is legally protected), and a statement that your report is made in good faith. We confirm receipt and tell you the outcome.",
            ro: "Oricine — cu sau fără cont — poate raporta conținut pe care îl consideră ilegal sau contrar acestei politici, prin formularul „Raportează o problemă” din Centrul de ajutor (zavoia.com/help) sau prin email la support@zavoia.com. O raportare utilă include: unde se află conținutul (link), de ce îl considerați ilegal sau neconform, numele și emailul dumneavoastră (cu excepția cazurilor în care anonimatul este protejat legal) și o declarație că raportarea este făcută cu bună-credință. Confirmăm primirea și vă comunicăm rezultatul.",
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
            en: "If we remove or restrict your content, restrict your account's ability to post, or decline to act on your report, we tell you the decision and the reasons: what we did and, if it is temporary, for how long; which rule or law applied; the facts relied on; and whether the decision was made by a human. You can appeal within 6 months by replying to the decision notice; an appeal is reviewed by a person not involved in the original decision. You can also take the matter to the competent courts.",
            ro: "Dacă vă eliminăm sau restricționăm conținutul, restricționăm posibilitatea contului de a publica sau decidem să nu dăm curs raportării dumneavoastră, vă comunicăm decizia și motivele: ce măsură am luat și, dacă este temporară, pe ce durată; ce regulă sau lege s-a aplicat; faptele avute în vedere; și dacă decizia a fost luată de un om. Puteți contesta în termen de 6 luni răspunzând la notificarea deciziei; contestația este analizată de o persoană neimplicată în decizia inițială. Vă puteți adresa, de asemenea, instanțelor competente.",
          },
        },
      ],
    },
  ],
};
