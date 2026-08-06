"use client";

import { Icon } from "@/components/ui";

// Legal documents get saved and filed, so the page offers the browser's own
// print/save-to-PDF sheet. The print stylesheet in globals.css drops the site
// chrome, the contents rail and this button before the sheet renders.
export function PrintButton({ label }: { label: string }) {
  return (
    <button
      type="button"
      className="zw-legal-print zw-legal-noprint tap"
      onClick={() => window.print()}
    >
      <Icon name="doc" size={13} color="currentColor" />
      {label}
    </button>
  );
}
