"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type MouseEvent, type CSSProperties } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Check, ChevronLeft, Copy, Minus, Monitor, RotateCcw, Shuffle, SlidersHorizontal, Smartphone, Tablet, Undo2 } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import type { Locale } from "@/i18n/locales";
import { useTranslation } from "@/i18n/useTranslation";
import { registrationHref } from "@/app/_components/for-business/links";
import { useToast } from "@/components/ui/toast";
import { REQUIRED_TYPES, SECTION_TYPES } from "@/features/website/components/builder/sectionCatalog";
import { createWebsiteT } from "@/features/website/i18n/translate";
import { MicrositeActionsContext } from "@/features/website/components/builder/preview/shared/actions";
import { prefersReducedMotion } from "@/features/website/components/builder/preview/shared/util";
import type { SectionType } from "@/features/website/types";
import { DEMO_EXAMPLES, demoExampleData, type DemoExampleId } from "@/app/_components/web-studio/demo-examples";
import { withDemoSectionCopy } from "@/app/_components/web-studio/demo-catalog";
import { NO_LOCKS, OPENING_LOOK, decodeLook, encodeLook, layoutFor, shuffleLook, type LockKey, type Locks, type Look, type ShuffleCycle } from "./shuffle-model";
import { createDemoWebsiteT, withDemoReviewSamples } from "./demo-review-samples";
import { DemoControls } from "./demo-controls";
import { DemoPreviewSkeleton } from "./demo-loading";
import { DemoMoveHandle } from "./demo-move-handle";
import { DemoLanguagePicker } from "./demo-language-picker";
import { useDraggableControls } from "./use-draggable-controls";
import styles from "./demo.module.css";

const LivePreview = dynamic(() => import("@/features/website/components/builder/preview/Microsite").then(module => module.LivePreview), {
  loading: () => <DemoPreviewSkeleton />,
});
const LOCK_KEYS: LockKey[] = ["layout", "colour", "type"];
type PreviewDevice = "desktop" | "tablet" | "mobile";
const DEVICES = [
  { id: "desktop", labelKey: "deviceDesktop", Icon: Monitor },
  { id: "tablet", labelKey: "deviceTablet", Icon: Tablet },
  { id: "mobile", labelKey: "deviceMobile", Icon: Smartphone },
] as const;
const previewDevice = (value: string | null): PreviewDevice | null =>
  DEVICES.some(device => device.id === value) ? value as PreviewDevice : null;
type Snapshot = { look: Look; example: DemoExampleId; hidden: SectionType[] };
const exampleId = (value: string | null): DemoExampleId => DEMO_EXAMPLES.find(example => example.id === value)?.id ?? "beauty";
const DEFAULT_HIDDEN: SectionType[] = ["announcement", "marquee"];
const hiddenSections = (value: string | null): SectionType[] => value === null
  ? DEFAULT_HIDDEN
  : SECTION_TYPES.filter(type => !REQUIRED_TYPES.has(type) && value.split(",").includes(type));

export function ShuffleExperience({ locale, backHref, initialCode, source, initialExample = null, initialHidden = null, initialDevice = null }: {
  locale: Locale;
  backHref: string;
  initialCode: string | null;
  source: string | null;
  initialExample?: string | null;
  initialHidden?: string | null;
  initialDevice?: string | null;
}) {
  const { dict } = useTranslation();
  const t = dict.tryStudio;
  const websiteT = useMemo(() => createWebsiteT(locale), [locale]);
  const toast = useToast();
  const [snapshot, setSnapshot] = useState<Snapshot>(() => ({ look: (initialCode ? decodeLook(initialCode) : null) ?? OPENING_LOOK, example: exampleId(initialExample), hidden: hiddenSections(initialHidden) }));
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [locks, setLocks] = useState<Locks>(NO_LOCKS);
  const [requestedControls, setRequestedControls] = useState<boolean | null>(null);
  const [controlsAnimated, setControlsAnimated] = useState(false);
  const [visibleSection, setVisibleSection] = useState<SectionType | null>("hero");
  const [section, setSection] = useState<SectionType | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ section: SectionType } | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [requestedDevice, setRequestedDevice] = useState(() => previewDevice(initialDevice));
  const [viewport, setViewport] = useState({ width: 0, height: 0, browserWidth: 0 });
  const shellRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const launcherRef = useRef<HTMLDivElement>(null);
  const floating = useDraggableControls(panelRef, launcherRef);
  const shuffleCycleRef = useRef<ShuffleCycle>({});
  const scrollAnchorRef = useRef<{ section: string; fraction: number } | { end: true } | null>(null);
  const customizeRef = useRef<HTMLButtonElement>(null);
  const controlsMotionRef = useRef(false);
  const previewMotionRef = useRef(false);
  const { look, example, hidden } = snapshot;
  const allLocked = LOCK_KEYS.every(key => locks[key]);
  const showingSampleReviews = !hidden.includes("testimonials");
  const data = useMemo(() => {
    const exampleData = demoExampleData(locale, look.accent, look.fontKey, example);
    return showingSampleReviews ? withDemoReviewSamples(exampleData) : exampleData;
  }, [locale, look.accent, look.fontKey, example, showingSampleReviews]);
  const layout = useMemo(() => withDemoSectionCopy(layoutFor(look), example).map(entry => ({ ...entry, visible: REQUIRED_TYPES.has(entry.type) || !hidden.some(type => type === entry.type) })), [look, hidden, example]);
  const demoT = useMemo(() => createDemoWebsiteT(locale), [locale]);
  const resetDisabled = encodeLook(look) === encodeLook(OPENING_LOOK) && hidden.join(",") === DEFAULT_HIDDEN.join(",");
  const compact = viewport.browserWidth > 0 && viewport.browserWidth < 1024;
  const phone = viewport.browserWidth > 0 && viewport.browserWidth <= 600;
  const controlsOpen = requestedControls ?? viewport.browserWidth >= 1024;
  const device = phone && requestedDevice === "tablet" ? "mobile" : requestedDevice ?? (phone ? "mobile" : viewport.browserWidth > 0 && viewport.browserWidth <= 980 ? "tablet" : "desktop");
  const devices = phone ? DEVICES.filter(option => option.id !== "tablet") : DEVICES;
  const framed = !phone && device !== "desktop";
  // Desktop fills the browser so section backgrounds stay edge-to-edge. Content limits belong
  // inside each section. Narrow desktop previews retain the dashboard's 1280px logical canvas;
  // a real phone renders mobile at 1:1, while framed tablet/phone previews keep their device widths.
  const logicalWidth = device === "desktop" ? (viewport.width > 980 ? viewport.width : 1280) : device === "tablet" ? 834 : phone ? viewport.width : 390;
  const ready = viewport.width > 0 && viewport.height > 0;
  const scale = ready ? Math.min(1, Math.max(1, viewport.width - (framed ? 32 : 0)) / logicalWidth) : 1;
  const availableHeight = Math.max(1, viewport.height - (framed ? 32 : 0));
  const frameHeight = framed ? Math.min(availableHeight, (device === "tablet" ? 1080 : 800) * scale) : availableHeight;
  const logicalHeight = frameHeight / scale;
  const frameStyle = ready ? {
    width: logicalWidth * scale,
    height: frameHeight,
    marginTop: framed ? 16 + (availableHeight - frameHeight) / 2 : 0,
  } : undefined;
  const stageStyle = ready ? {
    width: logicalWidth,
    height: logicalHeight,
    transform: scale === 1 ? undefined : `scale(${scale})`,
    "--mc-vph": `${logicalHeight}px`,
  } as CSSProperties : undefined;

  const focusPreviewSection = useCallback((type: SectionType, animate: boolean) => {
    const scroller = scrollerRef.current;
    if (!scroller?.querySelector(".mc-root")) return false;
    const behavior = animate && !prefersReducedMotion() ? "smooth" : "instant";
    const maxTop = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
    if (type === "nav" || type === "announcement" || type === "hero") {
      scroller.scrollTo({ top: 0, behavior });
      return true;
    }
    if (type === "footer") {
      scroller.scrollTo({ top: maxTop, behavior });
      return true;
    }
    const target = scroller.querySelector<HTMLElement>(`[data-preview-section="${type}"]`);
    if (!target) return false;
    const bounds = scroller.getBoundingClientRect();
    const measuredScale = bounds.width / scroller.clientWidth;
    const currentScale = Number.isFinite(measuredScale) && measuredScale > 0 ? measuredScale : 1;
    const chrome = scroller.querySelectorAll<HTMLElement>("[data-nav-variant], .mc-anno--lay-pill .mc-anno-in");
    const chromeBottom = Array.from(chrome).reduce((bottom, node) => Math.max(bottom, node.getBoundingClientRect().bottom), bounds.top);
    const context = type === "marquee"
      ? scroller.clientHeight * .38 - target.offsetHeight / 2
      : Math.max(56, (chromeBottom - bounds.top) / currentScale + 20);
    const readingStart = type === "marquee" ? target : target.querySelector<HTMLElement>("h2, h1") ?? target;
    const top = scroller.scrollTop + (readingStart.getBoundingClientRect().top - bounds.top) / currentScale - context;
    scroller.scrollTo({ top: Math.min(maxTop, Math.max(0, top)), behavior });
    return true;
  }, []);
  useEffect(() => {
    if (!focusRequest || !ready) return;
    let frame = 0;
    let retries = 2;
    const focus = () => {
      if (focusPreviewSection(focusRequest.section, previewMotionRef.current) || retries-- <= 0) return;
      frame = requestAnimationFrame(focus);
    };
    // Match the dashboard's two-frame wait: variant layout effects must commit before measuring.
    frame = requestAnimationFrame(() => { frame = requestAnimationFrame(focus); });
    return () => cancelAnimationFrame(frame);
  }, [focusRequest, ready, focusPreviewSection]);

  // Keep existing compact look codes unchanged so old printed links still open the same design.
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("s", encodeLook(look));
    if (example === "beauty") url.searchParams.delete("example");
    else url.searchParams.set("example", example);
    if (hidden.join(",") === DEFAULT_HIDDEN.join(",")) url.searchParams.delete("hide");
    else url.searchParams.set("hide", hidden.join(","));
    if (requestedDevice) url.searchParams.set("device", device);
    else url.searchParams.delete("device");
    // Next copies its router state; passing it back bypasses query subscribers
    // and leaves the language switcher's destination on the previous example.
    window.history.replaceState(null, "", url);
  }, [look, example, hidden, requestedDevice, device]);

  // Floating controls never resize the website. Measure the canvas independently of its scaled page.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const shell = shellRef.current;
    if (!canvas || !shell) return;
    const update = () => {
      const next = { width: canvas.clientWidth, height: canvas.clientHeight, browserWidth: shell.clientWidth };
      setViewport(current => current.width === next.width && current.height === next.height && current.browserWidth === next.browserWidth ? current : next);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(canvas);
    observer.observe(shell);
    return () => observer.disconnect();
  }, []);

  const rememberPosition = useCallback(() => {
    const scroller = scrollerRef.current;
    if (scroller && !scrollAnchorRef.current) {
      if (scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop <= 2) {
        scrollAnchorRef.current = { end: true };
      } else {
        const bounds = scroller.getBoundingClientRect();
        const currentScale = bounds.width / scroller.clientWidth;
        const sections = Array.from(scroller.querySelectorAll<HTMLElement>(".mc-page-flow > [data-preview-section], footer[data-preview-section]"))
          .filter(node => getComputedStyle(node).position !== "sticky");
        const readingEdge = bounds.top + Math.min(144, scroller.clientHeight / 4) * currentScale;
        const current = sections.findLast(node => node.getBoundingClientRect().top <= readingEdge) ?? sections[0];
        if (current) {
          const rect = current.getBoundingClientRect();
          scrollAnchorRef.current = { section: current.dataset.previewSection!, fraction: (bounds.top - rect.top) / Math.max(1, current.offsetHeight * currentScale) };
        }
      }
    }
  }, []);

  const changeControls = (open: boolean) => {
    floating.stop();
    setControlsAnimated(controlsMotionRef.current);
    setRequestedControls(open);
  };

  const prepareControlsToggle = (event: MouseEvent<HTMLButtonElement>) => {
    controlsMotionRef.current = event.detail > 0;
  };

  const selectDevice = (next: PreviewDevice) => {
    if (next !== device) rememberPosition();
    setRequestedDevice(next);
  };

  useLayoutEffect(() => {
    const scroller = scrollerRef.current;
    if (!scrollAnchorRef.current || !ready || !scroller) return;
    let frame = 0;
    const restore = () => {
      const anchor = scrollAnchorRef.current;
      if (!anchor) return;
      const target = "end" in anchor ? null : scroller.querySelector<HTMLElement>(`.mc-page-flow > [data-preview-section="${anchor.section}"], footer[data-preview-section="${anchor.section}"]`);
      if (!("end" in anchor) && !target) {
        // Hiding a section or switching examples may remove it altogether. A missing
        // target must not leave an old anchor active for the next design change.
        scrollAnchorRef.current = null;
        observer.disconnect();
        return;
      }
      const bounds = scroller.getBoundingClientRect();
      const currentScale = bounds.width / scroller.clientWidth;
      const top = target ? scroller.scrollTop + (target.getBoundingClientRect().top - bounds.top) / currentScale : 0;
      const nextTop = "end" in anchor ? scroller.scrollHeight - scroller.clientHeight : top + anchor.fraction * target!.offsetHeight;
      if (Math.abs(scroller.scrollTop - nextTop) > 1) scroller.scrollTo({ top: nextTop, behavior: "instant" });
    };
    const queueRestore = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(restore);
    };
    // Section measurement effects can resize the page after container queries settle. Keep the
    // reading anchor through those reflows, but release it as soon as the visitor interacts.
    const observer = new ResizeObserver(queueRestore);
    observer.observe(scroller);
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
    scroller.querySelectorAll(".mc-page-flow > [data-preview-section]").forEach(node => observer.observe(node));
    const cancel = () => {
      scrollAnchorRef.current = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
    const events = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    events.forEach(event => scroller.addEventListener(event, cancel, { passive: true }));
    queueRestore();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      events.forEach(event => scroller.removeEventListener(event, cancel));
    };
  }, [snapshot, device, logicalWidth, logicalHeight, ready]);

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    let frame = 0;
    const update = () => {
      const bounds = scroller.getBoundingClientRect();
      const currentScale = bounds.width / scroller.clientWidth;
      const edge = bounds.top + Math.min(160, scroller.clientHeight * .3) * currentScale;
      const sections = Array.from(scroller.querySelectorAll<HTMLElement>(".mc-page-flow > [data-preview-section]"));
      const current = sections.findLast(node => node.getBoundingClientRect().top <= edge) ?? sections[0];
      const atEnd = scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop < 8;
      setVisibleSection(atEnd && scroller.querySelector("footer") ? "footer" : (current?.dataset.previewSection as SectionType | undefined) ?? null);
    };
    const queue = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(update); };
    const observer = new ResizeObserver(queue);
    observer.observe(scroller);
    if (scroller.firstElementChild) observer.observe(scroller.firstElementChild);
    scroller.addEventListener("scroll", queue, { passive: true });
    queue();
    return () => { cancelAnimationFrame(frame); observer.disconnect(); scroller.removeEventListener("scroll", queue); };
  }, [layout]);

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

  const commit = useCallback((next: Snapshot, animate = false, preservePosition = true) => {
    if (encodeLook(next.look) === encodeLook(snapshot.look) && next.example === snapshot.example && next.hidden.join(",") === snapshot.hidden.join(",")) return;
    if (preservePosition) rememberPosition();
    else scrollAnchorRef.current = null;
    // Only an explicit section/style selection navigates the preview. A shuffle must not
    // re-focus whichever inspector happens to be open while the visitor reads elsewhere.
    setFocusRequest(null);
    setHistory(previous => [...previous.slice(-19), snapshot]);
    setSnapshot(next);
    setShuffling(animate);
    setCopied(false);
  }, [snapshot, rememberPosition]);
  const onShuffle = useCallback((animate = false) => {
    if (allLocked) return;
    const next = shuffleLook(look, locks, shuffleCycleRef.current);
    shuffleCycleRef.current = next.cycle;
    commit({ ...snapshot, look: next.look }, animate);
  }, [allLocked, commit, snapshot, look, locks]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const element = document.activeElement;
      if (event.key.toLowerCase() !== "s" || event.metaKey || event.ctrlKey || event.altKey) return;
      if (element instanceof HTMLElement && element !== scrollerRef.current && (element.isContentEditable || element.closest("a, button, input, textarea, select, [tabindex]"))) return;
      event.preventDefault();
      onShuffle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onShuffle]);

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

  const copyLink = async () => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete("returnTo");
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
    } catch {
      toast(t.copyError, "warn", undefined, "error");
    }
  };
  const undo = () => {
    const previous = history.at(-1);
    if (!previous) return;
    rememberPosition();
    setFocusRequest(null);
    setSnapshot(previous);
    setHistory(items => items.slice(0, -1));
    setShuffling(false);
  };
  const selectSection = (type: SectionType | null) => {
    scrollAnchorRef.current = null;
    setSection(type);
    setFocusRequest(type ? { section: type } : null);
  };
  const selectVariant = (type: SectionType, variant: string) => {
    commit({ ...snapshot, look: { ...look, variants: { ...look.variants, [type]: variant } } }, false, false);
    setFocusRequest({ section: type });
  };
  const selectVisibility = (type: SectionType, visible: boolean) => {
    commit({ ...snapshot, hidden: SECTION_TYPES.filter(item => !REQUIRED_TYPES.has(item) && (item === type ? !visible : hidden.includes(item))) }, false, !visible);
    if (visible) setFocusRequest({ section: type });
  };
  const selectExample = (value: string) => {
    const nextExample = exampleId(value);
    commit({ ...snapshot, example: nextExample });
  };

  const controls = <DemoControls
    locale={locale} look={look} example={example} hidden={hidden} locks={locks}
    businessName={data.businessName} section={section} visibleSection={visibleSection} signupHref={signup.toString()}
    onExample={selectExample} onSection={selectSection}
    onVariant={selectVariant}
    onVisibility={selectVisibility}
    onFont={fontKey => commit({ ...snapshot, look: { ...look, fontKey } })}
    onColour={accent => commit({ ...snapshot, look: { ...look, accent } })}
    onLock={key => setLocks(current => ({ ...current, [key]: !current[key] }))}
    onShuffle={onShuffle}
  />;

  return (
    <Dialog.Root open={controlsOpen} onOpenChange={changeControls} modal={compact}>
      <div ref={shellRef} className={styles.shell}>
        <div ref={canvasRef} className={styles.canvas} data-preview-device={device} data-preview-framed={framed}>
          <div className={styles.viewport} style={frameStyle}>
            <main ref={scrollerRef} data-locale-scroll="website-demo" data-try-stage="" className={styles.stage} style={stageStyle} aria-label={t.previewLabel} tabIndex={0} onClickCapture={interceptDemoLink} onAuxClickCapture={interceptDemoLink}>
              <div data-try-shuffling={shuffling ? "1" : undefined} className={styles.preview}>
                <MicrositeActionsContext.Provider value={actions}>
                  <LivePreview layout={layout} data={data} translate={showingSampleReviews ? demoT : undefined} chrome />
                </MicrositeActionsContext.Provider>
              </div>
            </main>
          </div>
        </div>
      </div>

      <div ref={launcherRef} className={styles.launcher} data-try-launcher="" data-open={controlsOpen} data-animated={controlsAnimated} aria-hidden={controlsOpen} inert={controlsOpen} style={floating.style} {...floating.dragHandlers}>
        <DemoMoveHandle floating={floating} />
        <Link href={backHref} replace className={styles.back} aria-label={t.back} title={t.back}><ChevronLeft size={22} aria-hidden="true" /></Link>
        <Dialog.Trigger asChild>
          <button type="button" className={styles.headerToggle} aria-label={`Web Studio: ${t.customize}`} title={t.customize} onClick={prepareControlsToggle}>
            <span className={styles.headerLabel}>Web Studio</span>
          </button>
        </Dialog.Trigger>
        <button type="button" className={`${styles.launcherShuffle} zw-try-shuffle`} disabled={allLocked} onClick={event => onShuffle(event.detail > 0)} aria-describedby={allLocked ? "demo-lock-hint" : undefined} title={allLocked ? t.allLocked : t.shuffle}>
          <span>{t.shuffleCompact}</span><Shuffle size={16} aria-hidden="true" />
        </button>
        <Dialog.Trigger asChild>
          <button ref={customizeRef} type="button" className={`${styles.customize} ${styles.launcherCustomize}`} aria-label={t.customize} title={t.customize} onClick={prepareControlsToggle}>
            <SlidersHorizontal size={18} aria-hidden="true" />
          </button>
        </Dialog.Trigger>
      </div>

      <Dialog.Portal>
        {compact && <Dialog.Overlay className={styles.overlay} data-animated={controlsAnimated} />}
        <Dialog.Content
          ref={panelRef} id="demo-customize" data-try-controls="" className={styles.floatingPanel}
          style={floating.style}
          data-animated={controlsAnimated} inert={!controlsOpen} aria-describedby={undefined}
          onPointerDownCapture={() => { previewMotionRef.current = true; }}
          onKeyDownCapture={() => { previewMotionRef.current = false; }}
          onOpenAutoFocus={event => {
            event.preventDefault();
            if (requestedControls !== null || compact) panelRef.current?.querySelector<HTMLButtonElement>("[data-controls-scroll] button")?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={event => {
            event.preventDefault();
            const launcher = launcherRef.current;
            if (!launcher) return;
            // The returning pill may still be hidden when the dialog unmounts.
            requestAnimationFrame(async () => {
              await Promise.allSettled(launcher.getAnimations().map(animation => animation.finished));
              if (launcher.isConnected && !launcher.inert) customizeRef.current?.focus({ preventScroll: true });
            });
          }}
          onEscapeKeyDown={event => {
            if (event.target instanceof Element && event.target.closest('[data-position-controls], [data-controls-drag-handle][aria-expanded="true"], [data-demo-language] details[open]')) event.preventDefault();
            else controlsMotionRef.current = false;
          }}
          onPointerDownOutside={() => { controlsMotionRef.current = true; }}
          onInteractOutside={event => { if (!compact) event.preventDefault(); }}
        >
          <header className={styles.panelHeader} {...floating.dragHandlers}>
            <Link href={backHref} replace className={styles.back} aria-label={t.back} title={t.back}><ChevronLeft size={22} aria-hidden="true" /></Link>
            <Dialog.Title className={styles.srOnly}>{t.panelTitle}</Dialog.Title>
            <DemoMoveHandle floating={floating} />
            <Dialog.Close className={styles.headerToggle} aria-label={`${t.panelTitle}: ${t.minimizeControls}`} aria-expanded={controlsOpen} aria-controls="demo-customize" title={t.minimizeControls} onClick={prepareControlsToggle}>
              <span className={styles.headerLabel}>{t.panelTitle}</span>
              <span className={styles.customize} aria-hidden="true"><Minus size={18} /></span>
            </Dialog.Close>
          </header>
          <div className={styles.panelBody} data-controls-body="">
            <div className={styles.previewTools} aria-label={t.previewSettings}>
              <div className={styles.devices} role="group" aria-label={websiteT("businessPage.builder.deviceGroup")}>
                {devices.map(({ id, labelKey, Icon }) => <button key={id} type="button" className={styles.deviceButton} aria-label={websiteT(`businessPage.builder.${labelKey}`)} title={websiteT(`businessPage.builder.${labelKey}`)} aria-pressed={device === id} onClick={() => selectDevice(id)}><Icon size={17} aria-hidden="true" /></button>)}
              </div>
              <div className={styles.tools}>
                <button type="button" className={styles.iconButton} disabled={!history.length} onClick={undo} aria-label={t.previous} title={t.previous}><Undo2 size={17} /></button>
                <button type="button" className={styles.iconButton} disabled={resetDisabled} onClick={() => commit({ ...snapshot, look: OPENING_LOOK, hidden: DEFAULT_HIDDEN })} aria-label={t.reset} title={t.reset}><RotateCcw size={16} /></button>
                <button type="button" className={styles.iconButton} onClick={copyLink} aria-label={copied ? t.copied : t.copyLink} title={copied ? t.copied : t.copyLink}>{copied ? <Check size={17} /> : <Copy size={17} />}</button>
                <DemoLanguagePicker locale={locale} />
              </div>
            </div>
            {controls}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
      <span role="status" className={styles.srOnly}>{copied ? t.copied : ""}</span>
      <span id="demo-move-hint" className={styles.srOnly}>{t.moveControlsHint}</span>
      <span id="demo-lock-hint" className={styles.srOnly}>{allLocked ? t.allLocked : ""}</span>
    </Dialog.Root>
  );
}
