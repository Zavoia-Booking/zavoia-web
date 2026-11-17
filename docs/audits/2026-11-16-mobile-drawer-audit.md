# Mobile drawer interaction audit — 16 November 2026

Scope: public marketplace drawers, shared booking, and the map results sheet.
This records the source baseline, implemented corrections, and local browser verification.
The five modal drawers and map sheet have passed native Chromium touch checks; keyboard geometry has been checked with controlled visual-viewport changes.
The production screenshot is evidence of a keyboard-obstructed experience; its original device state and initiating focus path remain unknown.

## Before / After

| Surface | Before: audited behavior | After: implemented locally |
| --- | --- | --- |
| Search | Only the 44px top handle drags. The active What/Where/When section scrolls; header/footer remain outside it. | Header and eligible content pulls dismiss; native scrolling and control taps remain independent. Keyboard layouts use one body scroller. |
| Service catalog | Only the handle drags. Industry filters scroll horizontally; services scroll vertically. | Content pulls dismiss without activating the touched service; industry swipes remain horizontal. |
| Map filters | Only the handle drags. Edits remain a private draft until Show places or Reset. | Content pulls dismiss through the existing draft-discard path, without applying choices. |
| Language | Only the handle drags. It is a nested modal when opened from the mobile Underlay. | Locale-row pulls dismiss only Language, preserving the menu and avoiding accidental navigation. |
| Booking | Only the handle drags. Availability, validation, submission, auth detours, and exit animation have separate lifecycles. | Content pulls use the existing close/invalidation contract; dragged service buttons do not activate. |
| Map results | The noninteractive header already drags. Body swipes can promote the sheet to top; there is no downward content handoff. | Implemented and locally verified with native Chrome CDP touch: eligible body pulls change snaps, scrolled content retains native scrolling, cancellation restores rest, and the sheet stays mounted. |
| Keyboard sizing | Drawer geometry relies on `100dvh`; no audited drawer observes the visual viewport. | All five drawers follow visible viewport bounds; controlled keyboard-sized geometry keeps Search's X, inputs and footer reachable. Physical Safari acceptance remains open. |

## Inventory and integration points

- [Shared DrawerHandle](../../src/components/ui/drawer-handle.tsx) owns capture, direction rejection, cancellation, velocity/distance dismissal, click suppression, and release animation.
  Its [CSS](../../src/components/ui/drawer-handle.module.css) restricts `touch-action: none` to the dedicated handle at ≤920px.
  [Shared sheet motion](../../src/components/ui/sheet-motion.ts) defines the current 320ms release and easing.
- [Shared content gestures](../../src/components/ui/use-sheet-touch-gesture.ts) arbitrate native touch movement, scroll boundaries and click suppression.
  [Shared viewport tracking](../../src/components/ui/use-drawer-viewport.ts) owns visible-height/offset properties, without adding body locks or replacing gesture styles.
- [Search](../../src/components/search/search-overlay.tsx): `contentRef` and `overlayRef`; `[data-search-section-scroll]` inside the active `[data-search-section][data-open="true"]`.
  Preserve the sticky `[data-search-what-field-shell]`, collapsed section headers, suggestions, calendar dates, and preset actions.
- [Service catalog](../../src/components/search/service-catalog.tsx): `contentRef`, `overlayRef`, `servicesRef`, and `filtersRef`.
  The Services region is the vertical scroller; the Industries group is a horizontal scroller on mobile.
- [Filters](../../src/app/[locale]/search/_components/filters-panel.tsx): `contentRef`, `overlayRef`, and `[data-filter-header]`, `[data-filter-body]`, `[data-filter-footer]`.
  The wrapper creates a fresh keyed draft session for each opening and retains the shell through its exit.
- [Language](../../src/app/_components/language-disclosure.tsx): `content`, `overlay`, and `trigger` refs; the options list scrolls vertically when necessary.
  Locale links preserve query/hash, registered translations, pending state, and unavailable destinations.
- [Booking](../../src/lib/booking/BookingDrawer.tsx): `dialogRef`, `overlayRef`, `[data-booking-dialog]`, and `[data-booking-body]`.
  Normal steps use the body scroller; success/blocked states use separate scrollable state layouts.
  Date strips scroll horizontally; notes, consent, service search, choices, Back, and confirmation controls remain interactive.
- [Map BottomSheet](../../src/components/search/bottom-sheet.tsx): `rootRef`, `headerRef`, `[data-sheet-position]`, and the keyboard-accessible separator.
  Its results scroller is `[data-locale-scroll="search-results"]` in [Search content](../../src/app/[locale]/search/_components/search-content.tsx).
  It publishes sheet geometry to map/card positioning and keeps exposed map space interactive.

## Implemented gesture ownership

1. Use one shared controller per dismissible drawer; retain the visible, keyboard-operable handle.
2. Let blank header space drag without stealing close, Back, or other control activation.
3. Determine the nearest eligible scroll container from the original touch target, bounded by that drawer.
4. If a gesture starts with content above the current scroll position, leave that entire gesture to native scrolling.
5. Claim a fresh downward pull from the top after clear vertical intent; upward scrolling remains native.
6. Preserve horizontal movement in industry filters, booking dates, carousels, and other horizontal regions.
7. Preserve editable fields, caret placement, native selects/ranges, text selection, pinch gestures, and multi-touch.
8. Ordinary links/buttons must retain taps; a recognized swipe must suppress the resulting click so it cannot choose a service, navigate, or submit.
9. Cancel unfinished gestures to their resting position. Complete an already committed dismissal when resizing to desktop, preserving Booking's invalidation contract. Cache the distance threshold before keyboard dismissal changes drawer height.
10. Keep desktop behavior outside the mobile breakpoint unchanged.

Moving the existing handle's immediate capture/prevention and `touch-action: none` onto the whole dialog would disable native panning there.
Changing `touch-action` after a gesture begins cannot reliably transfer browser-owned panning into application dragging.
Pointer capture alone does not resolve that arbitration; content handoff needs an explicit touch-aware strategy, such as narrowly scoped non-passive touch-move handling, verified on native browsers.
These constraints follow [W3C Pointer Events 3: touch-action and gesture determination](https://www.w3.org/TR/pointerevents3/#the-touch-action-css-property).

The map requires a separate snap controller rather than the modal close controller.
Keep its measured peek, directional flicks, cancellation-to-rest behavior, keyboard Home/End/arrows, and focus/scroll promotion to top.
An eligible downward gesture should settle at mid/down while retaining the results and usable map.

## Keyboard and viewport findings

- **Already present in committed source:** Search prevents Radix input autofocus at ≤920px and focuses the shell instead.
  Its delayed What-input focus checks the same breakpoint both before scheduling and before focusing; category entry focuses its disclosure.
  Desktop autofocus remains intentional. The production screenshot therefore does not establish that this committed guard is absent or malfunctioning in production.
- **Production Chrome follow-up:** opening Search did not autofocus an input, the mobile input computed to 16px, and Close/X cleanup was confirmed.
  This inspection did not reproduce the original software-keyboard obstruction; physical-device keyboard acceptance remains pending.
- **Corrected baseline gap:** all five drawers previously used fixed/full-height geometry without `visualViewport` observation.
  A software keyboard may shrink only the visual viewport while leaving layout-based fixed elements and viewport sizing unchanged, obscuring actions; `dvh` alone is insufficient.
  See [Chrome's keyboard viewport-resize explanation](https://developer.chrome.com/blog/viewport-resize-behavior/).
- **Typography dependency:** Where's city input has inline `fontSize: 14` in [Search](../../src/components/search/search-overlay.tsx).
  [Global CSS](../../src/styles/globals.css) already forced fields to 16px at ≤640px; the city field previously relied on that external override, while 641–920px was not covered by it.
  Search and Booking now normalize editable controls to 16px through the mobile breakpoint, while preserving desktop sizing.
- **Implemented:** derive visible height/offset from the visual viewport, retain safe areas, update on resize/scroll/focus events, and retain a viewport fallback.
  The hook respects deliberate pinch zoom and restores owned properties on desktop/unmount. Cramped Search layouts use the body as their one scroller; focus reveal follows whichever pane currently scrolls.
  [MDN VisualViewport](https://developer.mozilla.org/en-US/docs/Web/API/VisualViewport) documents `height`, `offsetTop`, `scale`, and viewport events.
- Preserve intentional input focus while editing. A deliberate drawer dismissal should end editing cleanly; cancellation must retain the draft and caret usability.
  Gesture cleanup restores only its own CSS properties, preserving live viewport measurements rather than replacing complete inline styles.

## Close, pending-work, and nesting contracts

- Keep Radix focus trapping, background scroll lock, Escape, close buttons, reduced-motion behavior, and return focus.
- Search/Catalog/Filters retain content for CSS exit; do not bypass their controlled `open`/presence paths.
- Filters: drag dismissal never calls `onApply`; Reset and Show places retain their explicit application behavior.
- Catalog: after service selection, focus may belong to the newly visible selection pill rather than the now-inert More opener.
- Language: dismiss the child before its parent Underlay; never let a bubbling gesture close both or bypass locale-link pending behavior.
- Booking: preserve `requestClose`, `onDismissStart={invalidatePendingWork}`, and [BookingProvider](../../src/lib/booking/BookingProvider.tsx) session teardown/auth detours.
  Validation/calendar/slot work is invalidated before release completes; the existing Close policy differs from the disabled Back policy during pending work.
  Broader dragging must not silently change submission eligibility or assume an already-sent booking request can be cancelled.
- Suppress action/navigation clicks once a drag is committed; keep the paper opaque while fading only backdrop paint.
  Preserve dialog-scoped toast interactions and avoid a second exit animation after the shared release has already finished.

## Exclusions and review status

Centered appointment action dialogs, professional profiles, confirmation prompts, anchored popovers, the fullscreen image viewer, and the horizontal Underlay are not newly converted drawers.
The professional profile's [scoped mobile CSS](../../src/app/[locale]/business/_components/team-member-profile-modal.module.css) overrides the older global sheet styling with a centered floating card.
Native share/print sheets remain browser-owned.

## Verification follow-up

Local Chrome CDP native-touch review used the running public search at 393 × 852, with normal motion and no marketplace writes or favorite actions.
An initial mid-sheet body pull settled at down without result activation, camera focus, or URL navigation; map zoom stayed 11 and selection stayed empty.
Header drags reached top. A native body scroll reached 131px; a subsequent downward gesture scrolled back to 86px while the sheet stayed at top.
A fresh downward pull after returning the list to zero settled at mid. Touch cancellation restored mid, and an upward body swipe promoted it to top.
The horizontal teaser rail scrolled from 0 to 205px. A later ordinary result tap still selected a venue, focused the map at zoom 14, and retained the URL.

Native touch checks also passed Search header/body pulls, cancelled and short pulls, scrolled-content ownership, the original handle, and opener focus restoration.
Catalog service-button dragging suppressed activation, its horizontal industry rail remained native, Filters dismissed from its body, and Language locale-row dragging closed only the child drawer without navigation.
Booking body/service-button dragging closed through its normal flow without activating or confirming a booking. An intentional tap after a cancelled short pull still worked; reduced-motion dismissal and Radix body-lock cleanup passed.

For keyboard geometry, a controlled visual-viewport proxy retained `innerHeight = clientHeight = 852` while setting visible height 460 and offset 80.
Search's paper occupied 104–540, X occupied 161–205, and footer occupied 461–540. Its body scrolled natively, What/Where remained reachable, and cancelled pulling preserved updated viewport properties.
Restoring height 852/offset 0 restored normal geometry and inner-section scrolling. A content pull with an input focused moved focus to the shell, dismissed the drawer and cleaned up its body lock.
This verifies the geometry response to visual-only resizing, not a physical Safari software keyboard.

Physical iOS Safari and Android software-keyboard acceptance remains **unverified**. The original reported obstruction was not reproduced in fresh production Chromium; deployment and real-device follow-up should retain that distinction.
No spec files were changed for this verification; browser inspection used temporary scripts and Chrome's native touch dispatch.
