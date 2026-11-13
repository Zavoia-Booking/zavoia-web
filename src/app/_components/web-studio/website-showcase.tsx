import Link from "next/link";
import type { CSSProperties } from "react";
import { Icon } from "@/components/ui/icon";
import type { Locale } from "@/i18n/locales";
import type { Dictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { localeHref } from "@/i18n/routes";
import { encodeLook, layoutFor, type Look } from "@/app/_components/try/shuffle-model";
import { INDUSTRY_VISUALS } from "@/lib/marketplace/industry-visuals";
import { createWebsiteT } from "@/features/website/i18n/translate";
import { WebsitePreview } from "./website-preview";
import note from "../marketing-example-note.module.css";
import styles from "./showcase.module.css";

const examples = [
  { id: "fitness", industry: "fitness-sports", business: "Forma Studio", portrait: false, look: {
    variants: { announcement: "hairline", nav: "capsule", hero: "cinematic", marquee: "scroll", about: "manifesto", services: "bento", locations: "showcase", gallery: "carousel", team: "portraits", testimonials: "wall", faq: "accordion", footer: "masthead" },
    fontKey: "grotesk", accent: "#283B52",
  } },
  { id: "pets", industry: "pets", business: "Paw & Co", portrait: true, look: {
    variants: { announcement: "bar", nav: "default", hero: "default", marquee: "loop", about: "sticky", services: "grid", locations: "panorama", gallery: "masonry", team: "columns", testimonials: "default", faq: "grid", footer: "editorial" },
    fontKey: "friendly", accent: "#2F5D4A",
  } },
  { id: "music", industry: "education-coaching", business: "Tempo Music", portrait: true, look: {
    variants: { announcement: "split", nav: "underlay", hero: "portal", marquee: "scroll", about: "editorial", services: "feature", locations: "atlas", gallery: "fan", team: "roster", testimonials: "deck", faq: "index", footer: "signature" },
    fontKey: "classic", accent: "#47617C",
  } },
  { id: "wellness", industry: "spa-wellness", business: "Serein Studio", portrait: false, look: {
    variants: { announcement: "hairline", nav: "split", hero: "tumble", marquee: "loop", about: "editorial", services: "grid", locations: "cards", gallery: "bento", team: "carousel", testimonials: "spotlight", faq: "accordion", footer: "directory" },
    fontKey: "cormorant", accent: "#71722F",
  } },
  { id: "tattoo", industry: "tattoo-piercing", business: "Contur Ink", portrait: false, look: {
    variants: { announcement: "split", nav: "underlay", hero: "cinematic", marquee: "loop", about: "manifesto", services: "feature", locations: "panorama", gallery: "index", team: "columns", testimonials: "deck", faq: "index", footer: "signature" },
    fontKey: "unbounded", accent: "#7A3B57",
  } },
  { id: "tailoring", industry: "tailoring-repairs", business: "Fir Atelier", portrait: true, look: {
    variants: { announcement: "hairline", nav: "capsule", hero: "portal", marquee: "scroll", about: "sticky", services: "bento", locations: "atlas", gallery: "masonry", team: "carousel", testimonials: "spotlight", faq: "accordion", footer: "editorial" },
    fontKey: "italiana", accent: "#5A4335",
  } },
  { id: "automotive", industry: "automotive", business: "Nord Auto", portrait: false, look: {
    variants: { announcement: "bar", nav: "default", hero: "drift", marquee: "scroll", about: "sticky", services: "grid", locations: "showcase", gallery: "fan", team: "roster", testimonials: "wall", faq: "index", footer: "marque" },
    fontKey: "dmserif", accent: "#206E78",
  } },
] as const;
const hidden = ["announcement", "marquee", "testimonials"];
// Each trail has its own loose pen gesture, from the industry pin to the screen.
const connectorPaths = {
  fitness: "M23 2 C21 25 80 14 82 39 S49 72 108 94",
  pets: "M23 2 C26 24 85 12 91 40 C99 73 38 56 61 37 C80 21 123 53 110 94",
  music: "M23 2 C17 30 74 16 82 40 S45 73 90 94",
  wellness: "M23 2 C28 27 102 7 108 38 C114 61 61 55 76 38 C93 20 136 55 120 94",
  tattoo: "M23 2 C12 26 76 16 95 38 C118 63 59 73 111 94",
  tailoring: "M23 2 C35 22 91 13 88 42 S54 73 111 94",
  automotive: "M23 2 C11 28 68 18 88 40 S56 76 115 94",
} as const;

/** Finished websites explain the product; design controls belong in the demo. */
export function WebsiteShowcase({ locale, copy, industries, exampleNote, pending = false }: {
  locale: Locale;
  copy: Dictionary["webStudio"]["showcase"];
  industries: Dictionary["industries"];
  exampleNote: string;
  pending?: boolean;
}) {
  const websiteT = createWebsiteT(locale);
  return (
    <section className={styles.showcase} aria-labelledby="studio-examples-title" data-studio-gallery="">
      <h2 id="studio-examples-title" className="sr-only">{copy.title}</h2>
      <div className={styles.notes}>
        <div className={`${note.note} ${styles.exampleNote}`} data-marketing-example-note=""><p>{exampleNote}</p></div>
        <p>{copy.stylesNote}</p>
      </div>
      <div className={styles.examples}>
        {examples.map(example => {
          const look: Look = example.look;
          const layout = layoutFor(look).map(section => ({ ...section, visible: !hidden.includes(section.type) }));
          const query = new URLSearchParams({ example: example.id, s: encodeLook(look), hide: hidden.join(",") });
          const story = copy.examples[example.id];
          const industry = INDUSTRY_VISUALS[example.industry];
          return (
            <article key={example.id} className={styles.example} data-example={example.id} data-format={example.portrait ? "phone" : "browser"} style={{ "--industry-accent": industry.accent } as CSSProperties}>
              <div className={styles.industry}>
                <svg className={styles.connector} viewBox="0 0 148 96" aria-hidden="true" focusable="false">
                  <path d={connectorPaths[example.id]} />
                </svg>
                <span className={styles.marker} aria-hidden="true"><Icon name={industry.icon} size={23} /></span>
                <h3>{industries[example.industry]}</h3>
              </div>
              {example.id === "automotive" ? (
                <div className={styles.autoScreens}>
                  {(["hero", "gallery", "services"] as const).map(section => (
                    <div className={styles.autoScene} data-auto-scene={section} key={section}>
                      <div className={styles.screen}>
                        <WebsitePreview
                          locale={locale}
                          example={example.id}
                          variant={look.variants.hero}
                          font={look.fontKey}
                          accent={look.accent}
                          layout={layout}
                          section={section}
                          browser
                          frameRatio={section === "gallery" ? 1.4 : section === "services" ? 1.6 : 2}
                          label={`${format(story.previewAlt, { business: example.business })} ${websiteT(`businessPage.sections.${section}.label`)}`}
                          pending={pending}
                        />
                        <Link
                          className={styles.previewLink}
                          href={`${localeHref(locale, "web-studio", "demo")}?${query}`}
                          aria-label={section === "hero"
                            ? format(copy.previewLink, { business: example.business })
                            : `${format(copy.previewLink, { business: example.business })} — ${websiteT(`businessPage.sections.${section}.label`)}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : <div className={styles.screen}>
                <WebsitePreview
                  locale={locale}
                  example={example.id}
                  variant={look.variants.hero}
                  font={look.fontKey}
                  accent={look.accent}
                  layout={layout}
                  portrait={example.portrait}
                  label={format(story.previewAlt, { business: example.business })}
                  pending={pending}
                />
                <Link
                  className={styles.previewLink}
                  href={`${localeHref(locale, "web-studio", "demo")}?${query}`}
                  aria-label={format(copy.previewLink, { business: example.business })}
                />
              </div>}
              <div className={styles.story}>
                <p>{story.body}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
