import { defineField, defineType, type CustomValidator } from "sanity";
import { LOCALES } from "@/i18n/locales";

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
          { title: "For business", value: "business" },
          { title: "Product news", value: "product" },
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
          name: "alt",
          type: "string",
          title: "Alt text",
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
      title: "FAQ",
      type: "array",
      description:
        "Questions and answers related to this post. Shown at the end of the article and emitted as FAQPage structured data for SEO.",
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
      name: "publishedAt",
      title: "Published at",
      type: "datetime",
      initialValue: () => new Date().toISOString(),
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "seo",
      title: "SEO",
      type: "object",
      fields: [
        { name: "title", type: "localeString", title: "Meta title" },
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
