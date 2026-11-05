"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";
import { INDUSTRY_VISUALS, type IndustrySlug } from "@/lib/marketplace/industry-visuals";
import { STREET_BUSINESSES, STREET_GROUND, STREET_HEIGHT } from "./street-data";
import styles from "./for-business.module.css";

export function StreetInteraction({ children, label, labels }: {
  children: ReactNode;
  label: string;
  labels: Record<IndustrySlug, string>;
}) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const labelScrollRef = useRef(0);
  const dragRef = useRef({ x: 0, y: 0, moved: false });
  const [hovered, setHovered] = useState<IndustrySlug | null>(null);
  const [focused, setFocused] = useState<IndustrySlug | null>(null);
  const [pinned, setPinned] = useState<IndustrySlug | null>(null);
  const [suppressed, setSuppressed] = useState(false);
  const [labelShift, setLabelShift] = useState(0);
  const active = suppressed ? null : hovered ?? focused ?? pinned;

  // Measure only when a label opens, never on continuous pointer movement.
  const placeLabel = (button: HTMLButtonElement) => {
    const pin = button.querySelector<HTMLElement>("[data-street-pin]");
    const bubble = button.querySelector<HTMLElement>("[data-industry-label]");
    const rail = railRef.current;
    if (!pin || !bubble || !rail) return;
    labelScrollRef.current = rail.scrollLeft;
    const bounds = rail.getBoundingClientRect();
    const marker = pin.getBoundingClientRect();
    const center = marker.left + marker.width / 2;
    const half = bubble.offsetWidth / 2;
    const clamped = Math.max(bounds.left + half + 8, Math.min(center, bounds.right - half - 8));
    setLabelShift(clamped - center);
  };

  useEffect(() => {
    if (!active) return;
    const dismiss = () => {
      setHovered(null);
      setFocused(null);
      setPinned(null);
      setSuppressed(true);
    };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") dismiss(); };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !sceneRef.current?.contains(event.target)) dismiss();
    };
    document.addEventListener("keydown", escape);
    document.addEventListener("pointerdown", outside);
    return () => {
      document.removeEventListener("keydown", escape);
      document.removeEventListener("pointerdown", outside);
    };
  }, [active]);

  return (
    <div ref={sceneRef} className={styles.scene} role="group" aria-label={label}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocused(null);
          setPinned(null);
          setHovered(null);
        }
      }}
    >
      <div ref={railRef} className={styles.streetRail}
        onScroll={(event) => {
          // Ignore a queued scroll event from before the visitor opened a label.
          if (active && Math.abs(event.currentTarget.scrollLeft - labelScrollRef.current) > 1) {
            setHovered(null);
            setFocused(null);
            setPinned(null);
          }
        }}
        onPointerDown={(event) => {
          dragRef.current = { x: event.clientX, y: event.clientY, moved: false };
          if (event.pointerType === "touch") setFocused(null);
        }}
        onPointerMove={(event) => {
          if (event.pointerType === "touch" && !dragRef.current.moved && Math.hypot(event.clientX - dragRef.current.x, event.clientY - dragRef.current.y) > 8) {
            dragRef.current.moved = true;
            setPinned(null);
          }
        }}
      >
        <div className={styles.streetCanvas} data-active-industry={active ?? undefined} data-keyboard={focused ? "true" : undefined}
          style={{ "--active-industry-accent": active ? INDUSTRY_VISUALS[active].accent : undefined } as CSSProperties}
        >
          {children}
          {STREET_BUSINESSES.map(({ industry, pinX, pinY }, index) => {
            const top = pinY - 48;
            const height = STREET_GROUND - top;
            return (
              <button key={industry} type="button" className={styles.streetSpot} data-industry={industry}
                data-active={active === industry ? "true" : undefined} aria-label={labels[industry]}
                style={{ left: `${index * 12.5}%`, width: "12.5%", top: `${top / STREET_HEIGHT * 100}%`, height: `${height / STREET_HEIGHT * 100}%` }}
                onPointerEnter={(event) => {
                  if (event.pointerType !== "touch" && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
                    placeLabel(event.currentTarget);
                    setFocused(null);
                    setHovered(industry);
                    setSuppressed(false);
                  }
                }}
                onPointerLeave={() => setHovered((value) => value === industry ? null : value)}
                onFocus={(event) => {
                  if (event.currentTarget.matches(":focus-visible")) {
                    event.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
                    placeLabel(event.currentTarget);
                    setFocused(industry);
                    setSuppressed(false);
                  }
                }}
                onClick={(event) => {
                  if (event.detail > 0 && dragRef.current.moved) return;
                  placeLabel(event.currentTarget);
                  setHovered(null);
                  if (event.detail > 0) setFocused(null);
                  if (pinned === industry && !suppressed) {
                    setPinned(null);
                    setSuppressed(true);
                  } else {
                    setPinned(industry);
                    setSuppressed(false);
                  }
                }}
              >
                <span className={styles.streetPinWrap} aria-hidden="true"
                  style={{ left: `${(pinX - index * 200) / 200 * 100}%`, top: `${48 / height * 100}%` }}
                >
                  <span className={styles.streetPin} data-street-pin="" style={{ backgroundColor: INDUSTRY_VISUALS[industry].accent }}>
                    <Icon name={INDUSTRY_VISUALS[industry].icon} size={24} color="var(--c-canvas)" />
                  </span>
                  <span className={styles.streetLabel} data-industry-label=""
                    style={{ "--label-shift": `${active === industry ? labelShift : 0}px` } as CSSProperties}
                  >{labels[industry]}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
