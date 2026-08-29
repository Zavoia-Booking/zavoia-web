import type { Locator, Page } from '@playwright/test'

/**
 * Locators for the review modal (src/app/[locale]/appointments/_components/actions/review-modal.tsx).
 * No data-testid anywhere in this app — everything below is a role, aria-label
 * or the exact visible English copy read straight off that component.
 */

/** The review modal dialog — "How was it?" when new, "Edit your review" when an existing review is being edited. */
export function reviewDialog(page: Page, mode: 'new' | 'edit' = 'new'): Locator {
  return page.getByRole('dialog', { name: mode === 'edit' ? 'Edit your review' : 'How was it?' })
}

/**
 * One rating target's block within the dialog ("Rate {business}" / "Rate {name}") —
 * the label `<div>`'s immediate parent, which is the SAME element that also
 * contains that target's 5 star buttons and comment textarea (RatingBlock's
 * single root element). Exact match on the label avoids ambiguity between a
 * business label and a same-named professional label.
 */
export function ratingBlock(dialog: Locator, label: string): Locator {
  return dialog.getByText(label, { exact: true }).locator('xpath=..')
}

/** Clicks the n-th star (1-5) inside a given rating block, by its `aria-label="{n} stars"`. */
export async function rateBlock(dialog: Locator, label: string, stars: number): Promise<void> {
  await ratingBlock(dialog, label)
    .getByRole('button', { name: `${stars} stars` })
    .click()
}

/** The comment textarea inside a given rating block (placeholder mentions "stood out"). */
export function blockComment(dialog: Locator, label: string): Locator {
  return ratingBlock(dialog, label).getByPlaceholder(/stood out/i)
}
