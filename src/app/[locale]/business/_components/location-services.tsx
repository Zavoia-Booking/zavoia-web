"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import { Button, Icon } from "@/components/ui";
import { useTranslation } from "@/i18n/useTranslation";
import { format } from "@/i18n/format";
import type { Locale } from "@/i18n/locales";
import type { ListingDetail, ServiceSummary } from "@/lib/api/marketplace/types";
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

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();

export function LocationServices({ listing, locale, picked, pickedBundles, togglePick, toggleBundle, canSelect, showPricing }: Props) {
  const { dict } = useTranslation();
  const t = dict.business;
  const copy = dict.locationPage;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const searchId = useId();
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
    .filter(([key]) => category === "all" || category === key)
    .map(([key, group]) => ({ key, ...group, items: group.items.filter(service => matches(service.name, service.description)) }))
    .filter(group => group.items.length > 0);
  const bundles = (category === "all" || category === "packages")
    ? listing.bundles.filter(bundle => matches(bundle.name, bundle.description) || (!!needle && bundle.services.some(service => matches(service.name, service.description))))
    : [];

  if (listing.services.length === 0 && listing.bundles.length === 0) {
    return <EmptyState icon="scissors" title={t.servicesEmptyTitle} body={t.servicesEmptyBody} />;
  }

  const price = (service: Parameters<typeof formatServiceSpread>[0]) => {
    const meta = formatServiceSpread(service, listing.businessCurrency, locale);
    return <span className={styles.serviceMeta}>{meta.duration}<span aria-hidden="true"> · </span>{showPricing ? <><span className={styles.priceFrom}>{meta.priceVaries ? `${t.priceFrom} ` : ""}</span>{meta.price}</> : copy.requestQuote}</span>;
  };

  return <div className={styles.services}>
    <div className={styles.serviceToolbar}>
      <label htmlFor={searchId} className={styles.serviceSearch}>
        <Icon name="search" size={17} />
        <span className="sr-only">{copy.searchServices}</span>
        <input id={searchId} type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder={copy.searchPlaceholder} autoComplete="off" />
      </label>
      <div className={styles.categoryFilters} role="group" aria-label={copy.searchServices}>
        <button type="button" aria-pressed={category === "all"} onClick={() => setCategory("all")}>{copy.allServices}<span>{listing.services.length + listing.bundles.length}</span></button>
        {categories.map(([key, group]) => <button key={key} type="button" aria-pressed={category === key} onClick={() => setCategory(key)}>{group.name}<span>{group.items.length}</span></button>)}
        {listing.bundles.length > 0 && <button type="button" aria-pressed={category === "packages"} onClick={() => setCategory("packages")}>{t.bundles}<span>{listing.bundles.length}</span></button>}
      </div>
    </div>
    {groups.length === 0 && bundles.length === 0 && <div className={styles.noResults}>
      <EmptyState icon="search" title={copy.noResultsTitle} body={copy.noResultsBody} />
      <Button kind="secondary" onClick={() => { setQuery(""); setCategory("all"); }}>{copy.clearFilters}</Button>
    </div>}
    {bundles.length > 0 && <section className={styles.serviceGroup} aria-labelledby={`${searchId}-packages`}>
      <h2 id={`${searchId}-packages`} className={styles.groupHeading}>{t.bundles}<span>{bundles.length}</span></h2>
      {bundles.map(bundle => {
        const original = bundle.services.reduce((sum, service) => sum + service.priceAmountMinor, 0);
        const saving = original - bundle.priceAmountMinor;
        return <ServiceCard key={bundle.id} name={bundle.name} description={bundle.description} on={pickedBundles.has(bundle.id)} onToggle={() => toggleBundle(bundle.id)} canSelect={canSelect}>
          {bundle.services.length > 0 && <span className={styles.bundleContents}>{bundle.services.map(service => <span key={service.id}><Icon name="check" size={13} />{service.name}</span>)}</span>}
          {price(bundle)}
          {showPricing && saving > 0 && <span className={styles.bundleSaving}>{t.bundleSave} {formatMoney(saving, listing.businessCurrency, locale)}<span className={styles.originalPrice}>{formatMoney(original, listing.businessCurrency, locale)}</span></span>}
        </ServiceCard>;
      })}
    </section>}
    {groups.map(group => <section key={group.key} className={styles.serviceGroup} aria-labelledby={`${searchId}-${group.key}`}>
      <h2 id={`${searchId}-${group.key}`} className={styles.groupHeading}><span className={styles.categoryDot} style={{ backgroundColor: group.color }} aria-hidden="true" />{group.name}<span>{group.items.length}</span></h2>
      {group.items.map(service => <ServiceCard key={service.id} name={service.name} description={service.description} on={picked.has(service.id)} onToggle={() => togglePick(service.id)} canSelect={canSelect}>{price(service)}</ServiceCard>)}
    </section>)}
    <span className="sr-only" aria-live="polite">{format(copy.selectionCount, { count: String(picked.size + pickedBundles.size) })}</span>
  </div>;
}

function ServiceCard({ name, description, on, onToggle, canSelect, children }: { name: string; description: string | null; on: boolean; onToggle: () => void; canSelect: boolean; children: ReactNode }) {
  const { dict } = useTranslation();
  const descriptionId = useId();
  const contents = <>
    <span className={styles.serviceContent}><span className={styles.serviceName}>{name}</span><span id={descriptionId} className={styles.serviceContent}>{description && <span className={styles.serviceDescription}>{description}</span>}{children}</span></span>
    {canSelect && <span className={styles.addAction} aria-hidden="true"><Icon name={on ? "check" : "plus"} size={15} />{on ? dict.locationPage.added : dict.business.add}</span>}
  </>;
  return canSelect
    ? <button type="button" className={`${styles.serviceRow} ${on ? styles.serviceSelected : ""}`} aria-label={`${on ? dict.business.remove : dict.business.add} ${name}`} aria-describedby={descriptionId} aria-pressed={on} onClick={onToggle}>{contents}</button>
    : <div className={styles.serviceRow}>{contents}</div>;
}
