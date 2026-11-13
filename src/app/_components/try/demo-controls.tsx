"use client";

import { useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { Check, ChevronDown, LockKeyhole, Shuffle, UnlockKeyhole } from "lucide-react";
import type { Locale } from "@/i18n/locales";
import { format } from "@/i18n/format";
import { useTranslation } from "@/i18n/useTranslation";
import { Icon } from "@/components/ui/icon";
import { INDUSTRY_VISUALS, type IndustrySlug } from "@/lib/marketplace/industry-visuals";
import { TRIAL_DAYS } from "@/lib/marketing/pricing";
import { REQUIRED_TYPES, SECTION_META, SECTION_TYPES } from "@/features/website/components/builder/sectionCatalog";
import { BRAND_ACCENT_CATALOG, FONT_CATALOG, type BrandAccentOption } from "@/features/website/components/builder/theme";
import { createWebsiteT } from "@/features/website/i18n/translate";
import type { SectionType } from "@/features/website/types";
import { DEMO_EXAMPLES, type DemoExampleId } from "@/app/_components/web-studio/demo-examples";
import type { LockKey, Locks, Look } from "./shuffle-model";
import { DemoStyleThumbnail } from "./demo-style-thumbnail";
import styles from "./demo-controls.module.css";

const LOCK_KEYS: LockKey[] = ["layout", "colour", "type"];
// Same canonical industries as the marketing showcase; labels stay authored example names.
const EXAMPLE_INDUSTRIES: Record<DemoExampleId, IndustrySlug> = {
  beauty: "beauty", pets: "pets", fitness: "fitness-sports",
  music: "education-coaching", wellness: "spa-wellness", automotive: "automotive",
  tattoo: "tattoo-piercing", tailoring: "tailoring-repairs",
};
const QUICK_COLOURS = BRAND_ACCENT_CATALOG.slice(0, 5);
const EXTRA_COLOURS = BRAND_ACCENT_CATALOG.slice(5);

type DemoControlsProps = {
  locale: Locale;
  look: Look;
  example: DemoExampleId;
  businessName: string;
  hidden: SectionType[];
  locks: Locks;
  section: SectionType | null;
  visibleSection: SectionType | null;
  signupHref: string;
  onExample: (value: string) => void;
  onSection: (type: SectionType | null) => void;
  onVariant: (type: SectionType, variant: string) => void;
  onVisibility: (type: SectionType, visible: boolean) => void;
  onFont: (key: string) => void;
  onColour: (hex: string) => void;
  onLock: (key: LockKey) => void;
  onShuffle: (animate: boolean) => void;
};

/** Closed choices unmount after the exit animation and leave the tab order immediately. */
function InlineChoices({ open, animated, children }: { open: boolean; animated: boolean; children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (!open) return;
    let active = true;
    const frame = requestAnimationFrame(async () => {
      const content = contentRef.current;
      if (!content) return;
      await Promise.allSettled(content.getAnimations().map(animation => animation.finished));
      if (!active || !content.isConnected) return;
      const settings = content.closest<HTMLElement>("[data-controls-scroll]");
      const scroller = settings && getComputedStyle(settings).overflowY === "visible"
        ? content.closest<HTMLElement>("[data-controls-body]") : settings;
      const group = content.parentElement;
      if (!scroller || !group) return;
      // A visitor may already have moved to another control while this unfolded.
      if (!group.contains(document.activeElement)) return;
      const viewport = scroller.getBoundingClientRect();
      const bounds = group.getBoundingClientRect();
      const start = viewport.top + 12;
      const end = viewport.bottom - 12;
      const delta = bounds.height > end - start || bounds.top < start
        ? bounds.top - start : Math.max(0, bounds.bottom - end);
      if (Math.abs(delta) > 1) scroller.scrollBy({
        top: delta,
        behavior: animated && !matchMedia("(prefers-reduced-motion: reduce)").matches ? "smooth" : "instant",
      });
    });
    return () => { active = false; cancelAnimationFrame(frame); };
  }, [open, animated]);

  return <Collapsible.Content ref={contentRef} className={styles.reveal} data-animated={animated} inert={!open} aria-hidden={!open}>
    <div className={styles.revealBody}>{children}</div>
  </Collapsible.Content>;
}

export function DemoControls({ locale, look, example, businessName, hidden, locks, section, visibleSection, signupHref, onExample, onSection, onVariant, onVisibility, onFont, onColour, onLock, onShuffle }: DemoControlsProps) {
  const { dict } = useTranslation();
  const t = dict.tryStudio;
  const websiteT = useMemo(() => createWebsiteT(locale), [locale]);
  const id = useId();
  const [chooser, setChooser] = useState<"example" | "font" | null>(null);
  const [moreColours, setMoreColours] = useState(false);
  const [animated, setAnimated] = useState({ chooser: false, colours: false, sections: false });
  const allLocked = LOCK_KEYS.every(key => locks[key]);
  const currentFont = FONT_CATALOG.find(font => font.key === look.fontKey) ?? FONT_CATALOG[0];
  const currentAccent = BRAND_ACCENT_CATALOG.find(accent => accent.hex === look.accent) ?? BRAND_ACCENT_CATALOG[0];
  const currentExample = DEMO_EXAMPLES.find(item => item.id === example) ?? DEMO_EXAMPLES[0];
  const exampleVisual = INDUSTRY_VISUALS[EXAMPLE_INDUSTRIES[example]];
  const trialNote = format(t.trialNote, { days: String(TRIAL_DAYS) });

  const keepChoice = (key: LockKey) => <button key={key} type="button" className={`${styles.keep} zw-try-lock`}
    aria-pressed={locks[key]} aria-label={t.lock[key]} aria-describedby={`${id}-keep-explanation`}
    title={`${t.lock[key]}. ${t.keepHint}`} onClick={() => onLock(key)}>
    {locks[key] ? <LockKeyhole size={15} aria-hidden="true" /> : <UnlockKeyhole size={15} aria-hidden="true" />}<span>{t.dimension[key]}</span>
  </button>;

  const colourChoice = (accent: BrandAccentOption) => <button key={accent.key} type="button"
    className={styles.swatch} style={{ "--swatch": accent.hex } as CSSProperties}
    aria-label={websiteT(`businessPage.branding.brandColor.swatches.${accent.key}`)}
    title={websiteT(`businessPage.branding.brandColor.swatches.${accent.key}`)}
    aria-pressed={accent.hex === look.accent} onClick={() => onColour(accent.hex)}>
    <span>{accent.hex === look.accent && <Check size={15} aria-hidden="true" />}</span>
  </button>;

  const visibilitySwitch = (type: SectionType) => {
    const visible = !hidden.includes(type);
    return <button className={styles.switch} type="button" role="switch" aria-checked={visible}
      aria-label={`${t.showSection}: ${websiteT(SECTION_META[type].labelKey)}`}
      title={visible ? t.hideSection : t.showSection} onClick={() => onVisibility(type, !visible)}>
      <span className={styles.switchTrack}><span /></span>
    </button>;
  };

  return <div className={styles.controls}>
    <div className={styles.scrollArea} data-controls-scroll="">
      <div className={styles.example}>
        <Collapsible.Root open={chooser === "example"} onOpenChange={open => setChooser(open ? "example" : null)}>
          <Collapsible.Trigger asChild>
            <button type="button" className={styles.exampleTrigger} aria-label={t.changeExample}
              aria-describedby={`${id}-example`} onClick={event => setAnimated(current => ({ ...current, chooser: event.detail > 0 }))}>
              <span className={styles.exampleIcon} style={{ color: exampleVisual.accent }}><Icon name={exampleVisual.icon} size={20} /></span>
              <span className={styles.exampleCopy} id={`${id}-example`}><strong>{currentExample.label[locale]}</strong><span>{businessName}</span></span>
              <ChevronDown className={styles.chevron} size={15} aria-hidden="true" />
            </button>
          </Collapsible.Trigger>
          <InlineChoices open={chooser === "example"} animated={animated.chooser}>
            <fieldset className={styles.choiceGroup}>
              <legend className={styles.srOnly}>{t.example}</legend>
              <div className={styles.exampleGrid}>
                {DEMO_EXAMPLES.map(item => {
                  const visual = INDUSTRY_VISUALS[EXAMPLE_INDUSTRIES[item.id]];
                  return <label key={item.id} className={styles.radioChoice}>
                    <input type="radio" name={`${id}-example`} value={item.id} checked={example === item.id} onChange={() => onExample(item.id)} />
                    <span className={styles.exampleOption}><Icon name={visual.icon} size={17} color={visual.accent} /><span>{item.label[locale]}</span><Check size={12} aria-hidden="true" /></span>
                  </label>;
                })}
              </div>
            </fieldset>
          </InlineChoices>
        </Collapsible.Root>
      </div>

      <div className={styles.appearance}>
        <Collapsible.Root open={moreColours} onOpenChange={setMoreColours} role="group" aria-labelledby={`${id}-colours`}>
          <div className={styles.colourHeading}>
            <span id={`${id}-colours`}>{t.colour}</span>
            <span className={styles.currentColour} data-current-colour=""><i style={{ background: currentAccent.hex }} aria-hidden="true" />{websiteT(`businessPage.branding.brandColor.swatches.${currentAccent.key}`)}</span>
          </div>
            <div className={styles.quickColours}>
              {QUICK_COLOURS.map(colourChoice)}
              <Collapsible.Trigger asChild>
                <button type="button" className={styles.moreColours} aria-label={moreColours ? t.fewerColours : t.moreColours}
                  title={moreColours ? t.fewerColours : t.moreColours} onClick={event => setAnimated(current => ({ ...current, colours: event.detail > 0 }))}>
                  <span>+{EXTRA_COLOURS.length}</span><ChevronDown className={styles.chevron} size={12} aria-hidden="true" />
                </button>
              </Collapsible.Trigger>
            </div>
            <InlineChoices open={moreColours} animated={animated.colours}>
              <div className={styles.extraColours}>{EXTRA_COLOURS.map(colourChoice)}</div>
            </InlineChoices>
        </Collapsible.Root>

        <Collapsible.Root className={styles.fonts} open={chooser === "font"} onOpenChange={open => setChooser(open ? "font" : null)}>
          <Collapsible.Trigger asChild>
            <button type="button" className={styles.fontTrigger} aria-label={t.chooseFont} aria-describedby={`${id}-font`}
              onClick={event => setAnimated(current => ({ ...current, chooser: event.detail > 0 }))}>
              <span>{t.font}</span>
              <span className={styles.currentFont} id={`${id}-font`} style={{ fontFamily: currentFont.stack, fontWeight: currentFont.weight }}>{websiteT(currentFont.labelKey)}</span>
              <ChevronDown className={styles.chevron} size={14} aria-hidden="true" />
            </button>
          </Collapsible.Trigger>
          <InlineChoices open={chooser === "font"} animated={animated.chooser}>
            <fieldset className={styles.choiceGroup}>
              <legend className={styles.srOnly}>{t.font}</legend>
              <div className={styles.fontGrid}>
                {FONT_CATALOG.map(font => <label key={font.key} className={styles.radioChoice}>
                  <input type="radio" name={`${id}-font`} value={font.key} checked={look.fontKey === font.key} onChange={() => onFont(font.key)} />
                  <span className={styles.fontOption}><span style={{ fontFamily: font.stack, fontWeight: font.weight, letterSpacing: font.tracking }}>{websiteT(font.labelKey)}</span><Check size={12} aria-hidden="true" /></span>
                </label>)}
              </div>
            </fieldset>
          </InlineChoices>
        </Collapsible.Root>
      </div>

      <div className={styles.sectionHeading} id={`${id}-sections`}>{t.sectionsTab}</div>
      <ul className={styles.sections} aria-labelledby={`${id}-sections`}>
        {SECTION_TYPES.map(type => {
          const meta = SECTION_META[type];
          const SectionIcon = meta.icon;
          const visible = !hidden.includes(type);
          const open = section === type;
          const variant = meta.variants.find(item => item.id === look.variants[type]) ?? meta.variants[0];
          return <Collapsible.Root key={type} asChild open={open} onOpenChange={next => onSection(next ? type : null)}>
            <li className={styles.section} data-section-control={type} data-hidden={!visible || undefined}>
              <div className={styles.sectionRow}>
                <Collapsible.Trigger asChild>
                  <button className={styles.sectionButton} type="button" aria-labelledby={`${id}-section-${type}`}
                    aria-describedby={`${id}-variant-${type}${REQUIRED_TYPES.has(type) ? ` ${id}-required-${type}` : ""}`}
                    onClick={event => setAnimated(current => ({ ...current, sections: event.detail > 0 }))}>
                    <span className={styles.sectionIcon}><SectionIcon size={19} aria-hidden="true" />{visibleSection === type && <span className={styles.visibleMarker} title={t.visibleSectionLabel} />}</span>
                    <span className={styles.sectionName} id={`${id}-section-${type}`}>{websiteT(meta.labelKey)}</span>
                    <span className={styles.variantName} id={`${id}-variant-${type}`}>
                      {!visible && <span className={styles.srOnly}>{t.sectionHidden}. </span>}{websiteT(variant.labelKey)}
                    </span>
                    <ChevronDown className={styles.chevron} size={13} aria-hidden="true" />
                  </button>
                </Collapsible.Trigger>
                {REQUIRED_TYPES.has(type) ? <span className={styles.required} title={t.requiredSectionHint}><LockKeyhole size={14} aria-hidden="true" /><span className={styles.srOnly} id={`${id}-required-${type}`}>{t.requiredSectionHint}</span></span> : visibilitySwitch(type)}
              </div>
              <InlineChoices open={open} animated={animated.sections}>
                <div className={styles.sectionChoices}>
                  {!visible && <p className={styles.hiddenNote} id={`${id}-hidden-${type}`}>{t.sectionHiddenHint}</p>}
                  <fieldset className={styles.choiceGroup} aria-describedby={!visible ? `${id}-hidden-${type}` : undefined}>
                    <legend className={styles.srOnly}>{t.style}: {websiteT(meta.labelKey)}</legend>
                    <div className={styles.styleGrid}>
                      {meta.variants.map(item => <label key={item.id} className={styles.radioChoice}>
                        <input type="radio" name={`${id}-${type}-variant`} value={item.id} checked={look.variants[type] === item.id} onChange={() => onVariant(type, item.id)} />
                        <span className={styles.styleCard}>
                          <span className={styles.thumbnail}><DemoStyleThumbnail sectionType={type} variantId={item.id} accent={look.accent} /></span>
                          <span className={styles.styleName}>{websiteT(item.labelKey)}</span><Check size={12} aria-hidden="true" />
                        </span>
                      </label>)}
                    </div>
                  </fieldset>
                  <p className={styles.styleDescription}>{websiteT(`businessPage.sections.variantDescriptions.${type}.${look.variants[type]}`)}</p>
                </div>
              </InlineChoices>
            </li>
          </Collapsible.Root>;
        })}
      </ul>
      <aside className={styles.demoInfo} data-demo-info="" aria-label={t.demoInfo}>
        <p className={styles.demoInfoTitle}>{t.demoInfo}</p>
        <p>{t.demoDisclosure}</p>
        <p>{t.stylesNote}</p>
      </aside>
    </div>

    <div className={styles.footer}>
      <div className={styles.keepGroup} role="group" aria-labelledby={`${id}-keep-hint`}>
        <p id={`${id}-keep-hint`}>{t.locksLabel}</p>
        <span className={styles.srOnly} id={`${id}-keep-explanation`}>{t.keepHint}</span>
        <div className={styles.keepButtons}>{LOCK_KEYS.map(keepChoice)}</div>
      </div>
      <div className={styles.footerActions}>
        <a className={styles.signup} href={signupHref} aria-describedby={`${id}-trial-note`} title={trialNote}>{t.cta}</a>
        <button type="button" className={`${styles.shuffle} zw-try-shuffle`} disabled={allLocked} aria-describedby={allLocked ? `${id}-all-locked` : undefined} onClick={event => onShuffle(event.detail > 0)}><span>{t.shuffle}</span><Shuffle size={16} aria-hidden="true" /></button>
      </div>
      <p className={styles.trialNote} id={`${id}-trial-note`}>{trialNote}</p>
      {allLocked && <p className={styles.lockNotice} id={`${id}-all-locked`} role="status">{t.allLocked}</p>}
    </div>
  </div>;
}
