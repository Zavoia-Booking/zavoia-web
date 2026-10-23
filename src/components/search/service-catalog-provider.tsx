"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import type { Industry, IndustryTag } from "@/lib/api/marketplace/types";
import { ServiceCatalog } from "./service-catalog";

export interface OpenServiceCatalogOptions {
  /** Reuse taxonomy already loaded by the opening page. */
  industries?: Industry[];
  /** Open All by default, or a particular industry's service group. */
  initialIndustry?: string;
  onSelect: (industry: Industry, tag: IndustryTag) => void;
}

interface ServiceCatalogContextValue {
  openCatalog: (options: OpenServiceCatalogOptions) => void;
  closeCatalog: () => void;
}

const ServiceCatalogContext = createContext<ServiceCatalogContextValue | null>(null);

/** One catalog serves the homepage and map while each owns its selection action. */
export function ServiceCatalogProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [pathnameAtOpen, setPathnameAtOpen] = useState(pathname);
  const [industries, setIndustries] = useState<Industry[]>();
  const [initialIndustry, setInitialIndustry] = useState<string>();
  const [openSequence, setOpenSequence] = useState(0);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onSelectRef = useRef<OpenServiceCatalogOptions["onSelect"] | null>(null);

  // The locale layout persists across navigation. Dismiss the previous page's
  // catalog before rendering a new route, including browser Back/Forward.
  if (open && pathnameAtOpen !== pathname) setOpen(false);

  const openCatalog = useCallback((options: OpenServiceCatalogOptions) => {
    returnFocusRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    onSelectRef.current = options.onSelect;
    // Empty failed taxonomy must remain retryable by the catalog itself.
    setIndustries(options.industries?.length ? options.industries : undefined);
    setInitialIndustry(options.initialIndustry);
    setPathnameAtOpen(pathname);
    setOpenSequence((sequence) => sequence + 1);
    setOpen(true);
  }, [pathname]);

  const closeCatalog = useCallback(() => setOpen(false), []);
  const selectService = useCallback((industry: Industry, tag: IndustryTag) => {
    if (!open || pathnameAtOpen !== pathname) return;
    setOpen(false);
    onSelectRef.current?.(industry, tag);
  }, [open, pathnameAtOpen, pathname]);
  const value = useMemo(
    () => ({ openCatalog, closeCatalog }),
    [openCatalog, closeCatalog],
  );

  return (
    <ServiceCatalogContext.Provider value={value}>
      {children}
      <ServiceCatalog
        key={openSequence}
        open={open}
        initialIndustries={industries}
        initialIndustry={initialIndustry}
        returnFocusRef={returnFocusRef}
        onClose={closeCatalog}
        onSelect={selectService}
      />
    </ServiceCatalogContext.Provider>
  );
}

export function useServiceCatalog(): ServiceCatalogContextValue {
  const context = useContext(ServiceCatalogContext);
  if (!context) throw new Error("useServiceCatalog must be used inside ServiceCatalogProvider");
  return context;
}
