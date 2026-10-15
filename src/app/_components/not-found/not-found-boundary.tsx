"use client";

import dynamic from "next/dynamic";

// Next includes fallback components in successful route trees. Load their
// presentation only when the boundary renders. Keep SSR enabled; this split
// controls asset loading without opting the fallback out of server rendering.
export const NotFoundBoundary = dynamic(() =>
  import("./not-found-page").then((module) => module.NotFoundPage),
);

export const RootNotFoundBoundary = dynamic(() => import("./root-not-found-content"));
