import { defineField, defineType } from "sanity";
import { LOCALES } from "@/i18n/locales";

export const localeString = defineType({
  name: "localeString",
  title: "Localized string",
  type: "object",
  fields: LOCALES.map((locale) =>
    defineField({
      name: locale,
      type: "string",
      title: locale.toUpperCase(),
    }),
  ),
});

export const localeText = defineType({
  name: "localeText",
  title: "Localized text",
  type: "object",
  fields: LOCALES.map((locale) =>
    defineField({
      name: locale,
      type: "text",
      rows: 3,
      title: locale.toUpperCase(),
    }),
  ),
});

export const localeSlug = defineType({
  name: "localeSlug",
  title: "Localized slug",
  type: "object",
  fields: LOCALES.map((locale) =>
    defineField({
      name: locale,
      type: "slug",
      title: locale.toUpperCase(),
      options: { source: `title.${locale}`, maxLength: 96 },
    }),
  ),
});

export const localeBlockContent = defineType({
  name: "localeBlockContent",
  title: "Localized content",
  type: "object",
  fields: LOCALES.map((locale) =>
    defineField({
      name: locale,
      type: "array",
      title: locale.toUpperCase(),
      of: [
        { type: "block" },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "alt",
              type: "string",
              title: "Alt text",
            },
          ],
        },
      ],
    }),
  ),
});
