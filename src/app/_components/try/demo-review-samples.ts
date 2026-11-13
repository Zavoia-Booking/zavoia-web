import type {
  PreviewData,
  PreviewReview,
  RatingBars,
  T,
} from "@/features/website/components/builder/preview/shared/types";
import { createWebsiteT } from "@/features/website/i18n/translate";

/** The demo changes review labels only; booking actions keep the dashboard's shared copy. */
export function createDemoWebsiteT(locale: PreviewData["locale"]): T {
  const fallback = createWebsiteT(locale);
  const plural = new Intl.PluralRules(locale === "ro" ? "ro-RO" : "en");
  const prefix = "businessPage.builder.preview.";
  const labels: Record<string, string> = locale === "ro" ? {
    reviewsVerified: "Recenzie demonstrativă",
    reviewsVerifiedReviews: "recenzii demonstrative",
    reviewsOutOf: "Evaluare fictivă din 5",
    reviewsAverageWord: "medie fictivă",
    reviewsHeading: "Exemple de recenzii.",
    testimonialsTitle: "Exemple de recenzii",
    statRating: "Evaluare fictivă",
  } : {
    reviewsVerified: "Demo review",
    reviewsVerifiedReviews: "sample reviews",
    reviewsOutOf: "Fictional rating out of 5",
    reviewsAverageWord: "fictional average",
    reviewsHeading: "Sample reviews.",
    testimonialsTitle: "Sample reviews",
    statRating: "Fictional rating",
  };
  return (key, options) => {
    const name = key.startsWith(prefix) ? key.slice(prefix.length) : "";
    if (name === "reviewsCount" || name === "reviewsVerifiedCount") {
      const count = Number(options?.count ?? 0);
      const form = plural.select(count);
      const noun = locale === "ro"
        ? form === "one" ? "recenzie demonstrativă" : form === "few" ? "recenzii demonstrative" : "de recenzii demonstrative"
        : form === "one" ? "sample review" : "sample reviews";
      return `${count.toLocaleString(locale)} ${noun}`;
    }
    if (name === "reviewsFiveStarShare") {
      return locale === "ro" ? `${options?.pct}% exemple de 5 stele` : `${options?.pct}% five-star samples`;
    }
    return labels[name] ?? fallback(key, options);
  };
}

type SampleReview = {
  rating: 1 | 2 | 3 | 4 | 5;
  en: string;
  ro: string;
};

// Deliberately descriptive sample copy, never an endorsement of a fictional business.
// Different lengths exercise the actual cards, quote layouts and scrolling strips.
const SAMPLES: readonly SampleReview[] = [
  {
    rating: 5,
    en: "This is a short demo review.",
    ro: "Acesta este un exemplu de recenzie scurtă.",
  },
  {
    rating: 4,
    en: "This fictional review shows how a few lines of text appear in the card.",
    ro: "Această recenzie fictivă arată cum se afișează câteva rânduri de text în card.",
  },
  {
    rating: 5,
    en: "This longer sample shows how the design handles a review across several lines. The text, name and rating are fictional and do not describe a real visit.",
    ro: "Acest exemplu mai lung arată cum se afișează o recenzie pe mai multe rânduri. Textul, numele și evaluarea sunt fictive și nu descriu o vizită reală.",
  },
  {
    rating: 3,
    en: "This medium-length sample helps you compare the review layouts.",
    ro: "Acest exemplu de lungime medie te ajută să compari designurile de recenzii.",
  },
  {
    rating: 4,
    en: "This fictional entry shows how another review appears alongside the others.",
    ro: "Acest exemplu fictiv arată cum se afișează o recenzie alături de celelalte.",
  },
  {
    rating: 5,
    en: "This is demo text, not a customer review.",
    ro: "Acesta este un text demonstrativ, nu o recenzie de la un client.",
  },
  {
    rating: 4,
    en: "Use this longer sample to see how the layout adapts when a review contains more text.",
    ro: "Folosește acest exemplu mai lung pentru a vedea cum se adaptează designul atunci când recenzia conține mai mult text.",
  },
  {
    rating: 5,
    en: "Compare the designs using the same sample reviews. This longer entry lets you see the spacing and line breaks in each layout. All names, text and ratings are fictional.",
    ro: "Compară designurile folosind aceleași recenzii demonstrative. Acest exemplu mai lung îți permite să vezi spațierea și împărțirea textului pe rânduri. Toate numele, textele și evaluările sunt fictive.",
  },
];

/**
 * Add visibly fictional review content to the public design explorer only.
 *
 * Keep this adapter out of shared example data and the public website renderer:
 * marketing screenshots and customer websites must never inherit these samples.
 * The host also displays a persistent notice covering the fictional ratings.
 */
export function withDemoReviewSamples(data: PreviewData): PreviewData {
  if (data.locations.length === 0) return data;

  const locationRatings: number[][] = data.locations.map(() => []);
  const ratingDistribution: RatingBars = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  const reviews: PreviewReview[] = SAMPLES.map((sample, index) => {
    const locationIndex = index % data.locations.length;
    const location = data.locations[locationIndex];
    locationRatings[locationIndex].push(sample.rating);
    ratingDistribution[String(sample.rating) as keyof RatingBars] += 1;

    return {
      id: index + 1,
      rating: sample.rating,
      comment: sample[data.locale],
      customerName: `${data.locale === "ro" ? "Client demo" : "Demo client"} ${String(index + 1).padStart(2, "0")}`,
      locationName: location.name,
      // Fixed example dates keep server rendering, sharing and locale switches stable.
      createdAt: `2026-10-${String(24 - index * 2).padStart(2, "0")}T12:00:00.000Z`,
    };
  });

  return {
    ...data,
    reviews,
    ratingDistribution,
    locations: data.locations.map((location, index) => {
      const ratings = locationRatings[index];
      return {
        ...location,
        totalReviews: ratings.length,
        averageRating: ratings.length > 0
          ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
          : null,
      };
    }),
  };
}
