"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { Button, Icon } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import type { BundleSummary, ListingDetail, ServiceSummary } from "@/lib/api/marketplace/types";
import { formatMoney, formatServiceSpread } from "@/lib/format/money-time";
import { EmptyState } from "./empty-state";
import styles from "./business-detail.module.css";

interface Props {
  listing: ListingDetail;
  locale: Locale;
  picked: Set<number>;
  pickedBundles: Set<number>;
  togglePick: (id: number) => void;
  toggleBundle: (id: number) => void;
  canSelect: boolean;
  showPricing: boolean;
}

type MenuSection = { key: string; name: string };

const normalize = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLocaleLowerCase();

export function LocationServices({ listing, locale, picked, pickedBundles, togglePick, toggleBundle, canSelect, showPricing }: Props) {
  const { dict } = useTranslation();
  const t = dict.business;
  const copy = dict.locationPage;
  const [query, setQuery] = useState("");
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const searchId = useId();
  const searchInput = useRef<HTMLInputElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const mobileIndex = useRef<HTMLDetailsElement>(null);
  const spy = useRef<{ hold: (key: string) => void } | null>(null);
  const needle = normalize(query.trim());
  const matches = (name: string, description: string | null) => !needle || normalize(`${name} ${description ?? ""}`).includes(needle);
  const categories = useMemo(() => {
    const groups = new Map<string, { name: string; color: string; items: ServiceSummary[] }>();
    for (const c of listing.serviceCategories) groups.set(String(c.id), { name: c.name, color: c.color, items: [] });
    for (const service of listing.services) {
      const key = String(service.categoryId ?? "uncategorized");
      if (!groups.has(key)) groups.set(key, { name: service.category?.name ?? t.services, color: service.category?.color ?? "var(--c-600)", items: [] });
      groups.get(key)!.items.push(service);
    }
    return [...groups.entries()].filter(([, group]) => group.items.length > 0);
  }, [listing.serviceCategories, listing.services, t.services]);
  const groups = categories
    .map(([key, group]) => ({ key, ...group, items: group.items.filter(service => matches(service.name, service.description)) }))
    .filter(group => group.items.length > 0);
  const bundles = listing.bundles.filter(bundle => matches(bundle.name, bundle.description) || (!!needle && bundle.services.some(service => matches(service.name, service.description))));
  const sections: MenuSection[] = [
    ...(bundles.length > 0 ? [{ key: "packages", name: t.bundles }] : []),
    ...groups.map(group => ({ key: group.key, name: group.name })),
  ];
  const currentKey = sections.some(section => section.key === activeKey) ? activeKey : sections[0]?.key ?? null;
  const sectionKeys = sections.map(section => section.key).join(" ");
  const headingId = (key: string) => `${searchId}-${key}`;

  // The index follows the section being read. Observe intersections rather
  // than updating React on every scroll event.
  useEffect(() => {
    const root = menu.current;
    if (!root || !("IntersectionObserver" in window)) return;
    const elements = Array.from(root.querySelectorAll<HTMLElement>("section[data-section]"));
    const inView = new Set<Element>();
    let held: HTMLElement | undefined;
    let settle = 0;
    const follow = () => {
      if (held) return;
      const first = elements.find(element => inView.has(element));
      if (first?.dataset.section) setActiveKey(first.dataset.section);
    };
    // A jump keeps its section current while the page scrolls past the others,
    // so the marker moves once. It lets go when scrolling settles, or as soon
    // as the visitor scrolls for themselves.
    const release = () => {
      window.clearTimeout(settle);
      window.removeEventListener("scroll", wait);
      window.removeEventListener("wheel", takeOver);
      window.removeEventListener("touchstart", takeOver);
      window.removeEventListener("keydown", takeOver);
      held = undefined;
    };
    const wait = () => {
      window.clearTimeout(settle);
      settle = window.setTimeout(() => {
        const target = held;
        release();
        if (!target || !inView.has(target)) follow();
      }, 150);
    };
    const takeOver = () => {
      release();
      follow();
    };
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) inView.add(entry.target);
        else inView.delete(entry.target);
      }
      follow();
    }, { rootMargin: "-160px 0px -55% 0px" });
    elements.forEach(element => observer.observe(element));
    spy.current = {
      hold: key => {
        held = elements.find(element => element.dataset.section === key);
        if (!held) return;
        window.addEventListener("scroll", wait, { passive: true });
        window.addEventListener("wheel", takeOver, { passive: true });
        window.addEventListener("touchstart", takeOver, { passive: true });
        window.addEventListener("keydown", takeOver);
        wait();
      },
    };
    return () => {
      release();
      observer.disconnect();
      spy.current = null;
    };
  }, [sectionKeys]);

  const jumpTo = (event: MouseEvent<HTMLAnchorElement>, key: string) => {
    // Keep native new-tab and modified clicks.
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const heading = document.getElementById(headingId(key));
    if (!heading) return;
    event.preventDefault();
    // Closing the phone index moves the target, so close it before scrolling.
    if (mobileIndex.current) mobileIndex.current.open = false;
    setActiveKey(key);
    spy.current?.hold(key);
    heading.focus({ preventScroll: true });
    const instant = event.detail === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    heading.scrollIntoView({ behavior: instant ? "instant" : "smooth", block: "start" });
  };

  if (listing.services.length === 0 && listing.bundles.length === 0) {
    return <EmptyState icon="scissors" title={t.servicesEmptyTitle} body={t.servicesEmptyBody} />;
  }

  const hasIndex = sections.length > 1;
  return <div className={styles.services} data-empty={sections.length === 0 || undefined}>
    <div className={styles.serviceAside}>
      <div className={styles.serviceSearch}>
        <label htmlFor={searchId}>
          <Icon name="search" size={17} />
          <span className="sr-only">{copy.searchServices}</span>
          <input ref={searchInput} id={searchId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={copy.searchServices} autoComplete="off" />
        </label>
        {query && <button type="button" className={styles.searchClear} aria-label={copy.clearSearch} onClick={() => { setQuery(""); searchInput.current?.focus(); }}><Icon name="x" size={18} /></button>}
      </div>
      {hasIndex && <nav className={styles.serviceIndex} aria-label={copy.serviceCategories}>
        <CategoryIndex sections={sections} currentKey={currentKey} headingId={headingId} onJump={jumpTo} />
      </nav>}
      {hasIndex && <details ref={mobileIndex} className={styles.serviceIndexMobile}>
        <summary>{copy.serviceCategories}<span className={styles.indexCount}>{sections.length}</span><Icon name="chevD" size={18} /></summary>
        <nav aria-label={copy.serviceCategories}>
          <CategoryIndex sections={sections} currentKey={currentKey} headingId={headingId} onJump={jumpTo} />
        </nav>
      </details>}
    </div>
    <div ref={menu} className={styles.serviceMenu}>
      {sections.length === 0 && <EmptyState icon="search" title={copy.noResultsTitle} body={copy.noResultsBody} action={<Button kind="secondary" onClick={() => { setQuery(""); searchInput.current?.focus(); }}>{copy.clearSearch}</Button>} />}
      {bundles.length > 0 && <section data-section="packages" className={styles.serviceGroup} aria-labelledby={headingId("packages")}>
        <div className={styles.groupHeading}><h2 id={headingId("packages")} tabIndex={-1} className={styles.groupTitle}>{t.bundles}</h2><span className={styles.groupCount} aria-hidden="true">{bundles.length}</span></div>
        <div className={styles.ticketList}>
          {bundles.map(bundle => <BundleTicket key={bundle.id} bundle={bundle} currency={listing.businessCurrency} locale={locale} showPricing={showPricing} on={pickedBundles.has(bundle.id)} onToggle={() => toggleBundle(bundle.id)} canSelect={canSelect} />)}
        </div>
      </section>}
      {groups.map(group => <section key={group.key} data-section={group.key} className={styles.serviceGroup} aria-labelledby={headingId(group.key)}>
        <div className={styles.groupHeading}><h2 id={headingId(group.key)} tabIndex={-1} className={styles.groupTitle}><span className={styles.categoryDot} style={{ backgroundColor: group.color }} aria-hidden="true" />{group.name}</h2><span className={styles.groupCount} aria-hidden="true">{group.items.length}</span></div>
        <div className={styles.ticketList}>
          {group.items.map(service => <Ticket key={service.id} name={service.name} description={service.description} meta={formatServiceSpread(service, listing.businessCurrency, locale)} showPricing={showPricing} on={picked.has(service.id)} onToggle={() => togglePick(service.id)} canSelect={canSelect} />)}
        </div>
      </section>)}
    </div>
    <span className="sr-only" aria-live="polite">{format(copy.selectionCount, { count: String(picked.size + pickedBundles.size) })}</span>
  </div>;
}

function CategoryIndex({ sections, currentKey, headingId, onJump }: { sections: MenuSection[]; currentKey: string | null; headingId: (key: string) => string; onJump: (event: MouseEvent<HTMLAnchorElement>, key: string) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [marker, setMarker] = useState<{ y: number; scale: number } | null>(null);
  const layoutKey = sections.map(section => section.key).join(" ");

  // An ink marker slides to the current section, as the tab indicator does.
  // A hidden copy measures nothing until the observer sees it shown.
  useLayoutEffect(() => {
    const element = track.current;
    if (!element) return;
    const measure = () => {
      const link = element.querySelector<HTMLElement>('a[aria-current="location"]');
      if (!link || !element.offsetHeight) return;
      const y = link.offsetTop;
      const scale = link.offsetHeight / element.offsetHeight;
      setMarker(previous => previous?.y === y && previous.scale === scale ? previous : { y, scale });
      // Keep the current entry in view when the index scrolls on its own.
      const scroller = element.parentElement;
      if (scroller && scroller.scrollHeight > scroller.clientHeight) {
        if (y < scroller.scrollTop) scroller.scrollTop = y;
        else if (y + link.offsetHeight > scroller.scrollTop + scroller.clientHeight) scroller.scrollTop = y + link.offsetHeight - scroller.clientHeight;
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [currentKey, layoutKey]);

  return <div ref={track} className={styles.indexTrack}>
    <ul role="list" className={styles.indexList}>
      {sections.map(section => <li key={section.key}>
        <a href={`#${headingId(section.key)}`} aria-current={section.key === currentKey ? "location" : undefined} onClick={event => onJump(event, section.key)}>
          <span className={styles.indexName}>{section.name}</span>
        </a>
      </li>)}
    </ul>
    {marker && <span aria-hidden="true" className={styles.indexMarker} style={{ transform: `translateY(${marker.y}px) scaleY(${marker.scale})` }} />}
  </div>;
}

type TicketProps = {
  name: string;
  description: string | null;
  meta: ReturnType<typeof formatServiceSpread>;
  kicker?: string;
  tag?: string;
  lines?: { id: number; name: string; price: string }[];
  was?: string;
  saving?: string;
  showPricing: boolean;
  on: boolean;
  onToggle: () => void;
  canSelect: boolean;
};

// Every menu item prints as a ticket: what it is above the perforation, its
// price and the add action on the stub. The whole ticket is one toggle.
function Ticket({ name, description, meta, kicker = meta.duration, tag, lines = [], was, saving, showPricing, on, onToggle, canSelect }: TicketProps) {
  const { dict } = useTranslation();
  const headId = useId();
  const detailsId = useId();
  const priceId = useId();
  const details = !!description || lines.length > 0;
  const contents = <>
    <span className={styles.ticketBody}>
      <span id={headId} className={styles.ticketHead}>
        <span className={styles.ticketKicker}>{kicker}</span>
        {tag && <span className={styles.ticketTag}>{tag}</span>}
      </span>
      <span className={styles.serviceName}>{name}</span>
      {details && <span id={detailsId} className={styles.serviceDetails}>
        {description && <span className={styles.serviceDescription}>{description}</span>}
        {lines.length > 0 && <span className={styles.ticketLines}>{lines.map(line => <span key={line.id} className={styles.ticketLine}>
          <span>{line.name}</span>
          {showPricing && <span className={styles.linePrice}>{line.price}</span>}
        </span>)}</span>}
      </span>}
    </span>
    <span className={styles.ticketStub}>
      <span className={styles.perforation} aria-hidden="true" />
      <span id={priceId} className={styles.ticketPrice}>
        {showPricing ? <>
          <span className={styles.ticketAmount}>{meta.priceVaries && <span className={styles.priceFrom}>{dict.business.priceFrom} </span>}{meta.price}{was && <s aria-hidden="true">{was}</s>}</span>
          {saving && <span className={styles.ticketSaving}>{saving}</span>}
        </> : <span className={styles.quote}>{dict.locationPage.requestQuote}</span>}
      </span>
      {canSelect && <span className={styles.addAction} aria-hidden="true"><Icon name={on ? "check" : "plus"} size={18} /></span>}
    </span>
  </>;
  return canSelect
    ? <button type="button" className={styles.ticket} aria-label={`${on ? dict.business.remove : dict.business.add} ${name}`} aria-describedby={details ? `${headId} ${detailsId} ${priceId}` : `${headId} ${priceId}`} aria-pressed={on} onClick={onToggle}>{contents}</button>
    : <div className={styles.ticket}>{contents}</div>;
}

// A bundle adds a tag and itemises its services. Separate prices are the
// services' list prices, the same figures the bundle's price is worked out from.
function BundleTicket({ bundle, currency, locale, showPricing, on, onToggle, canSelect }: { bundle: BundleSummary; currency: string; locale: Locale; showPricing: boolean; on: boolean; onToggle: () => void; canSelect: boolean }) {
  const { dict } = useTranslation();
  const t = dict.business;
  const meta = formatServiceSpread(bundle, currency, locale);
  const count = bundle.services.length;
  const separately = bundle.services.reduce((sum, service) => sum + service.priceAmountMinor, 0);
  const saving = separately - bundle.priceAmountMinor;
  const percent = bundle.priceType === "discount" && separately > 0 ? new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }).format(saving / separately) : null;
  return <Ticket
    name={bundle.name}
    description={bundle.description}
    meta={meta}
    kicker={format(count === 1 ? dict.booking.serviceCountOne : dict.booking.serviceCount, { count: String(count), duration: meta.duration })}
    tag={t.bundleTag}
    lines={bundle.services.map(service => ({ id: service.id, name: service.name, price: formatMoney(service.priceAmountMinor, currency, locale) }))}
    was={saving > 0 ? formatMoney(separately, currency, locale) : undefined}
    saving={saving > 0 ? `${t.bundleSave} ${formatMoney(saving, currency, locale)}${percent ? ` · ${percent}` : ""}` : undefined}
    showPricing={showPricing}
    on={on}
    onToggle={onToggle}
    canSelect={canSelect}
  />;
}
