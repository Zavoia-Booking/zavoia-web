import { defineField, defineType, type CustomValidator } from "sanity";
import { LOCALES } from "@/i18n/locales";
import { getArticleLinkHref } from "@/lib/blog/useful-links";

/** A non-empty string, or a non-empty array of blocks. */
function filled(value: unknown): boolean {
  if (typeof value === "string") return value.trim().length > 0;
  return Array.isArray(value) && value.length > 0;
}

/**
 * A language version of a post exists once it has a title and a slug: it is
 * then listed, linked and indexed. Require its text as well, so a half-written
 * language cannot be published.
 */
function completeWhereSlugged(label: string): CustomValidator<unknown> {
  return (value, context) => {
    const slugs = (context.document?.slug ?? {}) as Partial<Record<string, { current?: string }>>;
    const texts = (value ?? {}) as Partial<Record<string, unknown>>;
    const missing = LOCALES.filter((locale) => slugs[locale]?.current?.trim() && !filled(texts[locale]));
    return missing.length === 0
      ? true
      : `${label} is required in ${missing.map((locale) => locale.toUpperCase()).join(" and ")}, because that language has a slug.`;
  };
}

export const post = defineType({
  name: "post",
  title: "Blog post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "localeString",
      validation: (Rule) => Rule.required().custom(completeWhereSlugged("Title")),
    }),
    defineField({
      name: "slug",
      title: "Slug",
      type: "localeSlug",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "category",
      title: "Category",
      type: "string",
      options: {
        layout: "radio",
        list: [
          { title: "Guides", value: "guides" },
          { title: "Business advice", value: "business" },
          { title: "Zavoia updates", value: "product" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "excerpt",
      title: "Excerpt",
      type: "localeText",
      description:
        "Short summary shown on the blog index and used as meta description fallback.",
      validation: (Rule) => Rule.custom(completeWhereSlugged("Excerpt")),
    }),
    defineField({
      name: "coverImage",
      title: "Cover image",
      type: "image",
      options: { hotspot: true },
      fields: [
        {
          name: "decorative",
          type: "boolean",
          title: "Decorative image",
          description: "Use only when the image adds no information. Decorative images have empty alternative text.",
          initialValue: false,
        },
        {
          name: "altLocalized",
          type: "localeString",
          title: "Alt text by language",
          description: "Describe what the image shows in each published language. Do not copy the article headline or add a list of keywords.",
          hidden: ({ parent }) => parent?.decorative === true,
          validation: (Rule) => Rule.custom((value, context) => {
            const image = context.parent as { decorative?: boolean; asset?: { _ref?: string } } | undefined;
            if (image?.decorative || !image?.asset?._ref) return true;
            const slugs = (context.document?.slug ?? {}) as Partial<Record<string, { current?: string }>>;
            const alts = (value ?? {}) as Partial<Record<string, unknown>>;
            const missing = LOCALES.filter((locale) => slugs[locale]?.current?.trim() && !filled(alts[locale]));
            return missing.length === 0
              ? true
              : `Add an image description in ${missing.map((locale) => locale.toUpperCase()).join(" and ")} for the published language versions.`;
          }).warning(),
        },
        {
          name: "alt",
          type: "string",
          title: "Legacy alt text",
          description: "Existing text is retained for older posts. Add language-specific descriptions in Alt text by language above.",
          readOnly: true,
          hidden: ({ value }) => !value,
        },
      ],
    }),
    defineField({
      name: "body",
      title: "Body",
      type: "localeBlockContent",
      validation: (Rule) => Rule.custom(completeWhereSlugged("Body")),
    }),
    defineField({
      name: "faq",
      title: "Questions and answers",
      type: "array",
      description:
        "Answer the reader's follow-up questions about this article. Add the question and answer in each language used by the post. Shown after the article and included in its FAQ structured data.",
      of: [
        {
          type: "object",
          name: "faqItem",
          title: "FAQ item",
          fields: [
            defineField({
              name: "question",
              title: "Question",
              type: "localeString",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "answer",
              title: "Answer",
              type: "localeText",
              validation: (Rule) => Rule.required(),
            }),
          ],
          preview: {
            select: { questionEn: "question.en", questionRo: "question.ro" },
            prepare({ questionEn, questionRo }) {
              return { title: questionEn || questionRo || "Untitled question" };
            },
          },
        },
      ],
    }),
    defineField({
      name: "usefulLinks",
      title: "Useful links",
      type: "array",
      description:
        "Resources that help the reader act on this article: relevant guides, Zavoia pages or external sources. Use the exact destination for each language, including translated article slugs.",
      of: [
        {
          type: "object",
          name: "usefulLink",
          title: "Useful link",
          fields: [
            defineField({
              name: "label",
              title: "Link label",
              type: "localeString",
              description: "A clear name for the resource in each article language.",
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "href",
              title: "Destination",
              type: "localeString",
              description:
                "Use a site path such as /help (EN) or /ro/help (RO), or a full https:// URL. Preserve the destination's translated slug, query and anchor where needed.",
              validation: (Rule) => Rule.required().custom((value) => {
                const links = (value ?? {}) as Partial<Record<string, unknown>>;
                const invalid = LOCALES.filter((locale) => {
                  const href = links[locale];
                  return filled(href) && !getArticleLinkHref(href);
                });
                return invalid.length === 0
                  ? true
                  : `Use a site path starting with / or a full http(s) URL without credentials in ${invalid.map((locale) => locale.toUpperCase()).join(" and ")}.`;
              }),
            }),
          ],
          preview: {
            select: { labelEn: "label.en", labelRo: "label.ro", hrefEn: "href.en", hrefRo: "href.ro" },
            prepare({ labelEn, labelRo, hrefEn, hrefRo }) {
              return { title: labelEn || labelRo || "Untitled link", subtitle: hrefEn || hrefRo || "" };
            },
          },
        },
      ],
    }),
    defineField({
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "modifiedAt",
      title: "Last significant update",
      type: "datetime",
      description: "Optional. Set this after a substantial article revision. Keep the original publication date; do not change this for minor formatting edits.",
      validation: (Rule) => Rule.custom((value, context) => {
        if (!value) return true;
        const modified = Date.parse(value);
        if (!Number.isFinite(modified)) return "Enter a valid update date.";
        if (modified > Date.now()) return "The update date cannot be in the future.";
        const publishedValue = context.document?.publishedAt;
        const published = typeof publishedValue === "string" ? Date.parse(publishedValue) : NaN;
        return !Number.isFinite(published) || modified >= published
          ? true
          : "The update date cannot be before the publication date.";
      }),
    }),
    defineField({
      name: "author",
      title: "Author",
      type: "object",
      description: "Optional. Leave empty to retain the existing Carmen byline. Use confirmed author details only.",
      fields: [
        defineField({
          name: "name",
          title: "Public name",
          type: "string",
          validation: (Rule) => Rule.required().custom((value) =>
            typeof value === "string" && value.trim() ? true : "Enter the author's public name.",
          ),
        }),
        defineField({
          name: "url",
          title: "Profile or biography URL",
          type: "url",
          description: "Optional. An existing public page that identifies this author, using a full http(s) URL.",
          validation: (Rule) => Rule.custom((value) => {
            if (!value) return true;
            const href = getArticleLinkHref(value);
            return href && /^https?:\/\//i.test(href)
              ? true
              : "Use a full http(s) profile URL without credentials.";
          }),
        }),
      ],
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      fields: [
        {
          name: "title",
          type: "localeString",
          title: "Meta title",
          description: "The complete title for search results and link previews, including Zavoia if wanted. Leave blank to use the article title followed by | Zavoia.",
        },
        { name: "description", type: "localeText", title: "Meta description" },
      ],
    }),
  ],
  preview: {
    select: {
      titleEn: "title.en",
      titleRo: "title.ro",
      media: "coverImage",
      publishedAt: "publishedAt",
      category: "category",
    },
    prepare({ titleEn, titleRo, media, publishedAt, category }) {
      const date = publishedAt
        ? new Date(publishedAt).toLocaleDateString()
        : "Unpublished";
      return {
        title: titleEn || titleRo || "Untitled",
        subtitle: category ? `${category} · ${date}` : date,
        media,
      };
    },
  },
});
