# Mobile drawer audit — 15 November 2026

Source audit of the public marketplace, including shared booking, account and appointment flows. Merchant website builders and preview controls are outside this scope.

Search, Service catalog, Map filters, Language and Booking are the dismissible bottom drawers. They share `DrawerHandle` plus downward touch dragging across their headers and eligible content. A fresh pull from the scroll top moves the drawer; a gesture starting in a scrolled pane remains native scrolling. Inputs, selections, horizontal swipes and pinch gestures keep their native behavior. Dragged buttons and links suppress the ensuing click. Dismissal and snap-back share the map's 320ms `cubic-bezier(.2, .7, .3, 1)` release motion from `src/components/ui/sheet-motion.ts`. Fade the backdrop background color rather than overlay opacity so the paper stays opaque. Keep close buttons, Escape, focus restoration, pending-work rules and nested-dialog behavior. Keyboard dismissal and reduced-motion closing remain immediate. See the [16 November interaction audit](2026-11-16-mobile-drawer-audit.md) for implementation and validation details.

Mobile Search must open without immediately raising the software keyboard: focus the drawer shell, and focus an input only after the visitor deliberately selects it. Preserve desktop autofocus and category-entry focus behavior.

All five modal drawers follow the visible viewport above the keyboard. Search uses one body scroller in cramped layouts; its focused controls and fixed actions remain reachable. Gesture cleanup preserves viewport properties rather than restoring an obsolete complete inline style.

| Surface | Breakpoint and presentation | Source |
| --- | --- | --- |
| Search | At ≤920px, a full-width bottom drawer with top clearance and rounded top corners. Pointer entrance 240ms; close-button exit 180ms; handle dismissal/snap-back 320ms. | `src/components/search/search-overlay.tsx`, `src/components/search/search-overlay.module.css` |
| Service catalog | At ≤920px, a full-width bottom drawer with at least 24px top clearance respecting the top safe area, rounded top corners and bottom safe-area padding. The shared handle, title and horizontal industry filters stay above the native services scroller. Pointer entrance 240ms; close-button exit 180ms; handle dismissal/snap-back 320ms. At ≥921px, retain the centered desktop dialog. | `src/components/search/service-catalog.tsx`, `src/components/search/service-catalog.module.css` |
| Map filters | At ≤920px, a full-width bottom drawer with at least 24px top clearance respecting the top safe area, rounded top corners and bottom safe-area padding. The shared handle/title and Reset/Show places footer stay fixed around a native body scroller. Pointer entrance 240ms; close-button exit 180ms; handle dismissal/snap-back 320ms. At ≥921px, retain the centered dialog. | `src/app/[locale]/search/_components/filters-panel.tsx`, `src/app/[locale]/search/_components/filters-panel.module.css` |
| Language | Mounted at ≤920px; bottom drawer, maximum width 560px, with safe-area padding. Pointer entrance 240ms; close-button exit 180ms; handle dismissal/snap-back 320ms. | `src/app/_components/language-disclosure.tsx`, `src/app/_components/language-switcher.module.css` |
| Booking | At ≤920px, full-width bottom drawer with at least 24px top clearance respecting the safe area, rounded top corners and a shared handle. Header/actions stay fixed around native body scrolling. Pointer entrance 240ms; close-button exit 180ms; handle release 320ms. Genuine dismissal discards the session after exit; sign-in detours preserve selections. Desktop retains its centered dialog. | `src/lib/booking/BookingDrawer.tsx`, `src/lib/booking/booking-drawer.module.css` |
| Map results | At ≤920px, a nonmodal sheet with existing down/mid/top snaps, measured peek and 320ms settling. | `src/components/search/bottom-sheet.tsx`, `src/app/[locale]/search/_components/search-content.tsx` |

Map-filter changes remain private until Show places applies the draft. Dismissing without applying discards the draft on reopening. Reset continues to apply the default filters and close the drawer.

Map results retains its handle and keyboard/pointer snap semantics: header dragging, directional flicks, Home/End and arrow keys, plus promotion to the top snap when navigating or scrolling results. Fresh downward content pulls at the scroll top also move to lower snaps. Its collapsed position remains available over the map; dragging down does not dismiss the results. Do not add a second handle or replace snapping with drag-to-close.

These surfaces are excluded because their current presentation is not a bottom drawer:

| Surface | Current presentation and source |
| --- | --- |
| Appointment actions, Help report, Account contact support | Shared centered `ActionModal`; ≤600px child styles change density only. Preserve dismissal blocking during pending submissions. `src/app/[locale]/appointments/_components/actions/action-modal.tsx`. |
| Team/professional profile | Centered card; ≤720px module styles override the older global bottom-sheet layout with 12px inset. `src/app/[locale]/business/_components/team-member-profile-modal.module.css`. |
| Authentication | Dedicated `/auth` page. The legacy `AuthModalProvider` API navigates there and renders no modal. `src/components/shell/auth-modal-provider.tsx`. |
| Location permission; account deletion; close-ticket confirmation | Centered prompts. `src/components/search/location-permission-modal.tsx`, `src/app/[locale]/account/_components/account-content.tsx`, `src/app/[locale]/account/_components/support-section.tsx`. |
| Image viewer; mobile navigation | Fullscreen viewer and horizontal Underlay menu. `src/components/ui/image-viewer.module.css`, `src/components/shell/mobile-navigation.module.css`. |
| Date picker; account/notifications | Anchored popovers. `src/components/ui/date-picker.module.css`, `src/components/shell/popover.tsx`. |
| Cookie consent; Location About | Floating nonmodal banner and static page content. `src/components/shell/cookie-banner.tsx`, `src/app/[locale]/business/_components/location-about.tsx`. |

Verify that a cancelled handle gesture settles without closing, a completed gesture follows the existing exit/focus lifecycle, content scrolling never starts a dismissal, and the language drawer closes before its parent navigation on Escape. Native share/print sheets are browser-owned and need no application handle.
