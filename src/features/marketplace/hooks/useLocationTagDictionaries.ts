/**
 * Trimmed copy of admin-dashboard's tag-dictionaries hook module: the microsite only
 * consumes the two types below (`PreviewData.tagDictionaries`). On the public site the
 * resolved dictionaries are supplied by the published-website payload instead of the
 * authenticated fetch this hook performs in the dashboard.
 */

export type ChipOption = { id: number; label: string; slug: string };

export type ResolvedTagDictionaries = {
  amenities: ChipOption[];
  paymentMethods: ChipOption[];
  languages: ChipOption[];
};
