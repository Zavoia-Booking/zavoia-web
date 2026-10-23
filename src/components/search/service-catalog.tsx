"use client";

import { useEffect, useId, useMemo, useRef, useState, type RefObject } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { InlineError } from "@/components/ui/inline-error";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/i18n/useTranslation";
import { getIndustries } from "@/lib/api/marketplace/public";
import type { Industry, IndustryTag } from "@/lib/api/marketplace/types";
import { taxonomyLabel } from "@/lib/marketplace/card-mappers";
import { otherIndustryLast } from "@/lib/marketplace/industry-order";
import { industryAccent, industryIcon } from "@/lib/marketplace/industry-visuals";
import styles from "./service-catalog.module.css";

interface ServiceCatalogProps {
  open: boolean;
  initialIndustries?: Industry[];
  initialIndustry?: string;
  returnFocusRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  onSelect: (industry: Industry, tag: IndustryTag) => void;
}

/** One in-context catalog for homepage discovery and the map's More action. */
export function ServiceCatalog({ open, initialIndustries, initialIndustry, returnFocusRef, onClose, onSelect }: ServiceCatalogProps) {
  const { dict } = useTranslation();
  const contentRef = useRef<HTMLDivElement>(null);
  return (
    <Dialog.Root open={open} onOpenChange={next => { if (!next) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className={styles.overlay} />
        <Dialog.Content
          ref={contentRef}
          className={styles.dialog}
          onOpenAutoFocus={event => {
            event.preventDefault();
            const active = contentRef.current?.querySelector<HTMLButtonElement>('[data-catalog-industry][aria-pressed="true"]:not(:disabled)');
            (active ?? contentRef.current)?.focus({ preventScroll: true });
          }}
          onCloseAutoFocus={event => {
            event.preventDefault();
            const opener = returnFocusRef.current;
            if (!opener?.isConnected) return;
            requestAnimationFrame(() => {
              // Selecting a service replaces the map's More action with its
              // clearable selection. Resolve the target after that DOM commit.
              const target = opener.closest("[inert]")
                ? opener.closest("[data-service-rail]")?.querySelector<HTMLButtonElement>("[data-selection-clear]")
                : opener;
              if (target?.isConnected && !target.closest("[inert]")) target.focus({ preventScroll: true });
            });
          }}
        >
          <header className={styles.header}>
            <Dialog.Title className={styles.title}>{dict.serviceCatalog.title}</Dialog.Title>
            <Dialog.Close className={`${styles.close} tap`} aria-label={dict.serviceCatalog.close}>
              <Icon name="x" size={20} />
            </Dialog.Close>
            <Dialog.Description className="sr-only">{dict.serviceCatalog.description}</Dialog.Description>
          </header>
          <CatalogBody initialIndustries={initialIndustries} initialIndustry={initialIndustry} onSelect={onSelect} />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CatalogBody({ initialIndustries, initialIndustry, onSelect }: Pick<ServiceCatalogProps, "initialIndustries" | "initialIndustry" | "onSelect">) {
  const { dict, locale } = useTranslation();
  const t = dict.serviceCatalog;
  const id = useId();
  const servicesRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const pointerInputRef = useRef(false);
  const [industries, setIndustries] = useState(initialIndustries ?? []);
  const [loading, setLoading] = useState(initialIndustries === undefined);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState(initialIndustry);

  useEffect(() => {
    if (initialIndustries !== undefined) return;
    let cancelled = false;
    getIndustries().then(
      data => { if (!cancelled) { setIndustries(data); setFailed(false); setLoading(false); } },
      () => { if (!cancelled) { setFailed(true); setLoading(false); } },
    );
    return () => { cancelled = true; };
  }, [initialIndustries, attempt]);

  const catalog = useMemo(() => otherIndustryLast(
    industries.filter(industry => industry.tags.length > 0),
    industry => industry.slug,
  ), [industries]);
  // Freeze the opening industry's position. Filtering changes state, not order.
  const ordered = useMemo(() => initialIndustry
    ? [...catalog.filter(industry => industry.slug === initialIndustry), ...catalog.filter(industry => industry.slug !== initialIndustry)]
    : catalog, [catalog, initialIndustry]);
  const selectedIndustry = catalog.find(industry => industry.slug === selected);
  const all = !selectedIndustry;
  const visible = selectedIndustry ? [selectedIndustry] : catalog;

  // The preselected filter can be outside the phone's horizontal viewport.
  useEffect(() => {
    const active = filtersRef.current?.querySelector<HTMLButtonElement>('[aria-pressed="true"]');
    if (active) filtersRef.current?.scrollTo({ left: Math.max(0, active.offsetLeft - 16), behavior: "instant" });
    const pointer = () => { pointerInputRef.current = true; };
    const keyboard = () => { pointerInputRef.current = false; };
    document.addEventListener("pointerdown", pointer, true);
    document.addEventListener("keydown", keyboard, true);
    return () => {
      document.removeEventListener("pointerdown", pointer, true);
      document.removeEventListener("keydown", keyboard, true);
    };
  }, []);

  const filter = (slug?: string) => {
    if (slug === selected) return;
    setSelected(slug);
    servicesRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };

  return (
    <div className={styles.body}>
      <aside className={styles.sidebar} aria-label={t.industries}>
        <h3 className={styles.eyebrow}>{t.industries}</h3>
        <div ref={filtersRef} className={styles.filters} role="group" aria-label={t.industries}>
          <button type="button" className={`${styles.industry} tap`} data-catalog-industry aria-pressed={all} onClick={() => filter()}>
            <Icon name="grid" size={17} />
            <span>{t.allIndustries}</span>
            <span className={styles.selectionIndicator} aria-hidden="true"><Icon name="chevR" size={15} /></span>
          </button>
          {ordered.map(industry => {
            const active = selected === industry.slug;
            return (
              <button
                key={industry.id}
                type="button"
                className={`${styles.industry} tap`}
                data-catalog-industry
                aria-pressed={active}
                onClick={() => filter(industry.slug)}
              >
                <Icon name={industryIcon(industry.slug)} size={17} color={industryAccent(industry.slug)} />
                <span>{taxonomyLabel(industry, locale, dict.industries)}</span>
                <span className={styles.selectionIndicator} aria-hidden="true"><Icon name="chevR" size={15} /></span>
              </button>
            );
          })}
          {loading && !failed && <div className={styles.filterSkeletons} aria-hidden="true">{[0, 1, 2, 3, 4, 5].map(item => <Skeleton key={item} w="100%" h={44} r={10} />)}</div>}
        </div>
      </aside>
      <div
        ref={servicesRef}
        className={styles.services}
        role="region"
        aria-label={t.services}
        aria-busy={loading}
        onFocusCapture={event => {
          if (pointerInputRef.current || !(event.target instanceof HTMLElement)) return;
          // Radix deliberately prevents document scrolling when focus wraps.
          // Reveal the focused service inside this pane without moving the page.
          const container = event.currentTarget;
          const frame = container.getBoundingClientRect();
          const target = event.target.getBoundingClientRect();
          const top = frame.top + 6;
          const bottom = frame.bottom - 6;
          if (target.top < top) container.scrollBy({ top: target.top - top, behavior: "instant" });
          else if (target.bottom > bottom) container.scrollBy({ top: target.bottom - bottom, behavior: "instant" });
        }}
      >
        <span role="status" className="sr-only">{loading ? dict.search.updating : ""}</span>
        {failed ? (
          <div className={styles.feedback}>
            <InlineError>{t.loadError}</InlineError>
            <Button kind="secondary" size="sm" loading={loading} onClick={() => { setLoading(true); setAttempt(previous => previous + 1); }}>{dict.search.retry}</Button>
          </div>
        ) : loading ? (
          <div className={styles.groups} aria-hidden="true">
            {[0, 1, 2, 3].map(group => <section className={styles.section} key={group}>
              <div className={styles.groupHeading}><Skeleton w={20} h={20} r={4} /><Skeleton w="62%" h={23} /></div>
              <div className={styles.serviceList}>{["82%", "67%", "76%", "58%"].map(width => <div className={styles.service} key={width}><Skeleton w={width} h={16} /><Skeleton w={14} h={14} r={3} /></div>)}</div>
            </section>)}
          </div>
        ) : visible.length === 0 ? (
          <div className={styles.feedback}>
            <h3 className={styles.emptyTitle}>{t.emptyTitle}</h3>
            <p className={styles.emptyBody}>{t.emptyBody}</p>
          </div>
        ) : (
          <div className={styles.groups} data-single={visible.length === 1 || undefined}>
            {visible.map(industry => (
              <section key={industry.id} className={styles.section} aria-labelledby={`${id}-${industry.id}`}>
                <h3 id={`${id}-${industry.id}`} className={styles.groupHeading}>
                  <Icon name={industryIcon(industry.slug)} size={21} color={industryAccent(industry.slug)} />
                  {taxonomyLabel(industry, locale, dict.industries)}
                </h3>
                <ul className={styles.serviceList}>
                  {industry.tags.map(tag => (
                    <li key={tag.id}>
                      <button type="button" className={`${styles.service} tap`} onClick={() => onSelect(industry, tag)}>
                        <span>{taxonomyLabel(tag, locale, dict.industryTags)}</span>
                        <Icon name="chevR" size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
