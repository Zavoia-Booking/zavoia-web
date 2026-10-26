<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Inline error messages

Use `src/components/ui/inline-error.tsx` for field validation and field-specific API rejections. Use the shared toast for non-blocking action/request failures, preserving usable content and drafts; use `PageError` for failures that block the page, with relevant recovery actions. Follow the error-feedback and inline-error rules in `DESIGN.md` under **Inputs / Fields**, including the explicit text-only sign-in exception and error messages that grow the layout without reserved blank rows.

## Loading feedback

Before changing loading UI, inspect the shared `Skeleton` and `Spinner` components and their existing consumers. Follow the loading-feedback rule in `DESIGN.md`: use skeletons for initial content and spinners for pending actions. Never show visible loading text. Preserve accessible action names and screen-reader-only status announcements, and reuse the existing motion rules.
