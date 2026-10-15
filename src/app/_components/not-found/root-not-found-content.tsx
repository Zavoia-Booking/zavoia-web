import type { ComponentProps } from "react";
import "@/styles/globals.css";
import { fontVariables } from "@/styles/fonts";
import { NotFoundPage } from "./not-found-page";

// A root-layout failure can reach this fallback without the locale layout's
// stylesheet or body. Keep those assets with the standalone presentation.
export default function RootNotFoundContent(props: ComponentProps<typeof NotFoundPage>) {
  return (
    <div className={`${fontVariables} antialiased`}>
      <NotFoundPage {...props} />
    </div>
  );
}
