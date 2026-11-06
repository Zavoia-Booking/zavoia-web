"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent, type CSSProperties } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowLeft, ArrowRight, Check, ChevronDown, Copy, Lock, RotateCcw, Shuffle, SlidersHorizontal, Undo2, X } from "lucide-react";
import type { Locale } from "@/i18n/locales";
import { LOCALES } from "@/i18n/locales";
import { localeHref } from "@/i18n/routes";
import { format } from "@/i18n/format";
import { useTranslation } from "@/i18n/useTranslation";
import { markLocaleNavigation } from "@/i18n/locale-transition";
import { TRIAL_DAYS } from "@/lib/marketing/pricing";
import { registrationHref } from "@/app/_components/for-business/links";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { SECTION_META, SECTION_TYPES } from "@/features/website/components/builder/sectionCatalog";
import { BRAND_ACCENT_CATALOG, FONT_CATALOG } from "@/features/website/components/builder/theme";
import { createWebsiteT } from "@/features/website/i18n/translate";
import { MicrositeActionsContext } from "@/features/website/components/builder/preview/shared/actions";
import type { SectionType } from "@/features/website/types";
import { DEMO_EXAMPLES, demoExampleData, type DemoExampleId } from "@/app/_components/web-studio/demo-examples";
import { NO_LOCKS, OPENING_LOOK, decodeLook, encodeLook, layoutFor, shuffleLook, type LockKey, type Locks, type Look } from "./shuffle-model";
import styles from "./demo.module.css";

const LivePreview = dynamic(() => import("@/features/website/components/builder/preview/Microsite").then(module => module.LivePreview), {
  loading: () => <Skeleton h="100dvh" r={0} />,
});
const LOCK_KEYS: LockKey[] = ["layout", "colour", "type"];
type Snapshot = { look: Look; example: DemoExampleId; hidden: SectionType[] };
const exampleId = (value: string | null): DemoExampleId => DEMO_EXAMPLES.find(example => example.id === value)?.id ?? "beauty";
const DEFAULT_HIDDEN: SectionType[] = ["testimonials"];
const hiddenSections = (value: string | null): SectionType[] => value === null
  ? DEFAULT_HIDDEN
  : SECTION_TYPES.filter(type => value.split(",").includes(type));

export function ShuffleExperience({ locale, initialCode, source, initialExample = null, initialHidden = null }: {
  locale: Locale;
  initialCode: string | null;
  source: string | null;
  initialExample?: string | null;
  initialHidden?: string | null;
}) {
  const { dict } = useTranslation();
  const t = dict.tryStudio;
  const websiteT = useMemo(() => createWebsiteT(locale), [locale]);
  const toast = useToast();
  const [snapshot, setSnapshot] = useState<Snapshot>(() => ({ look: (initialCode ? decodeLook(initialCode) : null) ?? OPENING_LOOK, example: exampleId(initialExample), hidden: hiddenSections(initialHidden) }));
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [locks, setLocks] = useState<Locks>(NO_LOCKS);
  const [customizing, setCustomizing] = useState(false);
  const [section, setSection] = useState<SectionType>("hero");
  const [shuffling, setShuffling] = useState(false);
  const [copied, setCopied] = useState(false);
  const scrollerRef = useRef<HTMLElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const customizeRef = useRef<HTMLButtonElement>(null);
  const { look, example, hidden } = snapshot;
  const allLocked = LOCK_KEYS.every(key => locks[key]);
  const data = useMemo(() => demoExampleData(locale, look.accent, look.fontKey, example), [locale, look.accent, look.fontKey, example]);
  const layout = useMemo(() => layoutFor(look).map(entry => ({ ...entry, visible: !hidden.some(type => type === entry.type) })), [look, hidden]);
  const currentSection = SECTION_META[section];
  const selectedStyle = currentSection.variants.find(variant => variant.id === look.variants[section]) ?? currentSection.variants[0];
  const currentFont = FONT_CATALOG.find(font => font.key === look.fontKey) ?? FONT_CATALOG[0];
  const currentAccent = BRAND_ACCENT_CATALOG.find(accent => accent.hex === look.accent) ?? BRAND_ACCENT_CATALOG[0];

  // Keep existing compact look codes unchanged so old printed links still open the same design.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("s", encodeLook(look));
    if (example === "beauty") url.searchParams.delete("example");
    else url.searchParams.set("example", example);
    if (hidden.join(",") === DEFAULT_HIDDEN.join(",")) url.searchParams.delete("hide");
    else url.searchParams.set("hide", hidden.join(","));
    window.history.replaceState(window.history.state, "", url);
  }, [look, example, hidden]);

  // The preview's final content can always scroll clear of the dock, including at text zoom.
  useEffect(() => {
    const stage = scrollerRef.current;
    const dock = dockRef.current;
    if (!stage || !dock) return;
    const update = () => stage.style.setProperty("--demo-dock-height", `${Math.ceil(dock.getBoundingClientRect().height) + 16}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(dock);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shuffling) return;
    const timer = window.setTimeout(() => setShuffling(false), 240);
    return () => window.clearTimeout(timer);
  }, [shuffling]);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(timer);
  }, [copied]);

  const commit = useCallback((next: Snapshot, animate = false) => {
    if (encodeLook(next.look) === encodeLook(snapshot.look) && next.example === snapshot.example && next.hidden.join(",") === snapshot.hidden.join(",")) return;
    setHistory(previous => [...previous.slice(-19), snapshot]);
    setSnapshot(next);
    setShuffling(animate);
    setCopied(false);
  }, [snapshot]);
  const onShuffle = useCallback((animate = false) => {
    if (!allLocked) commit({ ...snapshot, look: shuffleLook(look, locks) }, animate);
  }, [allLocked, commit, snapshot, look, locks]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && customizing) {
        setCustomizing(false);
        customizeRef.current?.focus({ preventScroll: true });
        return;
      }
      if (event.key.toLowerCase() !== "s" || event.metaKey || event.ctrlKey || event.altKey) return;
      const element = document.activeElement;
      if (element instanceof HTMLElement && (element.isContentEditable || element.closest("a, button, input, textarea, select, [tabindex]"))) return;
      event.preventDefault();
      onShuffle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [customizing, onShuffle]);

  const demoFeedback = useCallback(() => toast(t.demoFeedback, "info", undefined, "default", { interrupt: true }), [toast, t.demoFeedback]);
  const actions = useMemo(() => ({ book: demoFeedback, pending: false }), [demoFeedback]);
  const interceptDemoLink = (event: MouseEvent<HTMLElement>) => {
    const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
    if (!anchor) return;
    const href = anchor.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    // Gallery/navigation controls remain interactive; fictional businesses cannot be contacted.
    event.preventDefault();
    event.stopPropagation();
    demoFeedback();
  };
  const signup = new URL(registrationHref(locale));
  if (source) signup.searchParams.set("src", source);

  const demoHref = (nextLocale: Locale) => {
    const query = new URLSearchParams({ s: encodeLook(look) });
    if (source) query.set("src", source);
    if (example !== "beauty") query.set("example", example);
    if (hidden.join(",") !== DEFAULT_HIDDEN.join(",")) query.set("hide", hidden.join(","));
    return `${localeHref(nextLocale, "web-studio", "demo")}?${query}`;
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
    } catch {
      toast(t.copyError, "warn", undefined, "error");
    }
  };
  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    setSnapshot(previous);
    setHistory(items => items.slice(0, -1));
    setShuffling(false);
  };
  const selectSection = (type: SectionType) => {
    setSection(type);
    if (type === "nav" || type === "announcement") {
      scrollerRef.current?.scrollTo({ top: 0, behavior: "instant" });
      return;
    }
    const target = scrollerRef.current?.querySelector(type === "footer" ? "footer" : `[data-preview-section="${type}"]`);
    target?.scrollIntoView({ behavior: "instant", block: "start" });
  };
  const selectExample = (value: string) => {
    const nextExample = exampleId(value);
    const nextHidden = new Set<SectionType>(hidden.filter(type => type !== "testimonials"));
    for (const type of DEFAULT_HIDDEN) nextHidden.add(type);
    commit({ ...snapshot, example: nextExample, hidden: SECTION_TYPES.filter(type => nextHidden.has(type)) });
  };

  return (
    <>
      <main ref={scrollerRef} data-locale-scroll="website-demo" data-try-stage="" className={styles.stage} aria-label={t.previewLabel} onClickCapture={interceptDemoLink} onAuxClickCapture={interceptDemoLink}>
        <div data-try-shuffling={shuffling ? "1" : undefined} className={styles.preview}>
          <MicrositeActionsContext.Provider value={actions}>
            <LivePreview layout={layout} data={data} chrome />
          </MicrositeActionsContext.Provider>
        </div>
      </main>

      <div ref={dockRef} data-try-dock="" className={styles.dock}>
        {customizing && <section className={styles.panel} id="demo-customize" aria-label={t.customize}>
          <div className={styles.panelHeader}>
            <h2>{t.customize}</h2>
            <button type="button" className={styles.iconButton} onClick={() => { setCustomizing(false); customizeRef.current?.focus(); }} aria-label={t.closeCustomization}><X size={18} /></button>
          </div>
          <div className={styles.fields}>
            <label className={styles.field}>{t.example}<select value={example} onChange={event => selectExample(event.target.value)}>{DEMO_EXAMPLES.map(item => <option key={item.id} value={item.id}>{item.label[locale]}</option>)}</select></label>
            <label className={styles.field}>{t.section}<select value={section} onChange={event => selectSection(event.target.value as SectionType)}>{SECTION_TYPES.map(type => <option key={type} value={type}>{websiteT(SECTION_META[type].labelKey)}</option>)}</select></label>
            <label className={styles.field}>{t.style}<select value={look.variants[section]} onChange={event => commit({ ...snapshot, look: { ...look, variants: { ...look.variants, [section]: event.target.value } } })}>{currentSection.variants.map(variant => <option key={variant.id} value={variant.id}>{websiteT(variant.labelKey)}</option>)}</select></label>
            <label className={styles.field}>{t.font}<select value={look.fontKey} onChange={event => commit({ ...snapshot, look: { ...look, fontKey: event.target.value } })}>{FONT_CATALOG.map(font => <option key={font.key} value={font.key}>{t.fontNames[font.key] ?? font.name}</option>)}</select></label>
          </div>
          <label className={styles.visibility}><input type="checkbox" checked={!hidden.includes(section)} onChange={event => commit({ ...snapshot, hidden: SECTION_TYPES.filter(type => type === section ? !event.target.checked : hidden.includes(type)) })} />{t.showSection}</label>
          {section === "testimonials" && <p className={styles.trialNote}>{t.noExampleReviews}</p>}
          <fieldset className={styles.colours}>
            <legend>{t.colour}<span>{t.accentNames[currentAccent.key] ?? currentAccent.name}</span></legend>
            <div className={styles.swatches}>{BRAND_ACCENT_CATALOG.map(accent => <button key={accent.key} type="button" className={styles.swatch} style={{ "--swatch": accent.hex } as CSSProperties} aria-label={t.accentNames[accent.key] ?? accent.name} aria-pressed={accent.hex === look.accent} onClick={() => commit({ ...snapshot, look: { ...look, accent: accent.hex } })}><span>{accent.hex === look.accent && <Check size={15} />}</span></button>)}</div>
          </fieldset>
          <div className={styles.panelBottom}>
            <div className={styles.locks} role="group" aria-label={t.locksLabel}>
              <span>{t.locksLabel}</span>
              {LOCK_KEYS.map(key => <button key={key} type="button" className={`${styles.lock} zw-try-lock`} aria-pressed={locks[key]} aria-label={locks[key] ? t.locked[key] : t.lock[key]} onClick={() => setLocks(current => ({ ...current, [key]: !current[key] }))}><Lock size={13} />{t.dimension[key]}</button>)}
            </div>
            <button type="button" className={styles.reset} disabled={encodeLook(look) === encodeLook(OPENING_LOOK) && hidden.join(",") === DEFAULT_HIDDEN.join(",")} onClick={() => commit({ ...snapshot, look: OPENING_LOOK, hidden: DEFAULT_HIDDEN })}><RotateCcw size={15} />{t.reset}</button>
          </div>
          <p className={styles.note}>{t.stylesNote}</p>
          <p className={styles.trialNote}>{format(t.trialNote, { days: String(TRIAL_DAYS) })}</p>
        </section>}

        <div className={styles.bar}>
          <div className={styles.identity}>
            <Link href={localeHref(locale, "web-studio")} className={styles.back} aria-label={t.back}><ArrowLeft size={16} /><span>Web Studio</span><span className={styles.demoLabel}>{t.demo}</span></Link>
            <span className={`${styles.readout} zw-try-look`} aria-live="polite">{websiteT(selectedStyle.labelKey)}<span aria-hidden="true"> · </span>{t.fontNames[currentFont.key] ?? currentFont.name}</span>
          </div>
          <div className={styles.tools}>
            <button ref={customizeRef} type="button" className={styles.customize} aria-label={t.customize} aria-expanded={customizing} aria-controls="demo-customize" onClick={() => setCustomizing(value => !value)}><SlidersHorizontal size={16} /><span>{t.customize}</span><ChevronDown size={13} className={customizing ? styles.chevronOpen : undefined} /></button>
            <button type="button" className={styles.iconButton} disabled={!history.length} onClick={undo} aria-label={t.previous} title={t.previous}><Undo2 size={17} /></button>
            <button type="button" className={styles.iconButton} onClick={copyLink} aria-label={copied ? t.copied : t.copyLink} title={copied ? t.copied : t.copyLink}>{copied ? <Check size={17} /> : <Copy size={17} />}</button>
            <nav className={styles.languages} aria-label={dict.language.label}>{LOCALES.map(language => <Link key={language} href={demoHref(language)} lang={language} hrefLang={language} aria-label={dict.localeNames[language]} aria-current={locale === language ? "page" : undefined} prefetch={false} scroll={false} onNavigate={() => markLocaleNavigation(demoHref(language))}>{language.toUpperCase()}</Link>)}</nav>
          </div>
          <div className={styles.actions}>
            <button type="button" className={`${styles.shuffle} zw-try-shuffle`} disabled={allLocked} aria-describedby={allLocked ? "demo-all-locked" : undefined} onClick={event => onShuffle(event.detail > 0)}><Shuffle size={17} />{t.shuffle}</button>
            <a href={signup.toString()} className={styles.signup}>{t.cta}<ArrowRight size={16} /></a>
          </div>
          {allLocked && <p id="demo-all-locked" className={styles.lockNotice} role="status">{t.allLocked}</p>}
          <span role="status" className={styles.srOnly}>{copied ? t.copied : ""}</span>
        </div>
      </div>
    </>
  );
}
