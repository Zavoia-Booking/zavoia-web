import type { CategoryKey } from "@/components/ui/cat-dot";

// Shared UI shape for business cards. Pages (later slices) map real API
// responses into this shape. Cards navigate via `href` (next/link) when
// provided, otherwise call their onClick handler.
export interface BusinessCardData {
  id: string | number;
  /** Non-enumerable location slug — the detail-route nav target (absent for slug-less business cards). */
  slug?: string;
  name: string;
  cat: CategoryKey | string;
  catLabel?: string;
  rating?: number;
  reviews?: number;
  image?: string;
  blurb?: string;
  distance?: string;
  status?: "open" | "closed" | "24-7" | string;
  closesAt?: string;
  href?: string;
  city?: string;
}
