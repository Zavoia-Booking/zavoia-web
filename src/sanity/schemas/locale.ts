import { defineField, defineType } from "sanity";
import { LOCALES } from "@/i18n/locales";
import { isReservedBlogSlug } from "@/lib/blog/category-routes";

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
      validation: (Rule) => Rule.custom((value, context) => {
        if (context.document?._type !== "post" || !value?.current) return true;
        return isReservedBlogSlug(value.current)
          ? "This address is reserved for a blog category. Choose another article slug."
          : true;
      }),
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
        {
          type: "block",
          styles: [
            { title: "Normal", value: "normal" },
            { title: "Heading 2", value: "h2" },
            { title: "Heading 3", value: "h3" },
            { title: "Heading 4", value: "h4" },
            { title: "Heading 5", value: "h5" },
            { title: "Heading 6", value: "h6" },
            { title: "Quote", value: "blockquote" },
          ],
        },
        {
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
              name: "alt",
              type: "string",
              title: "Alt text",
              description: `Describe the image in ${locale.toUpperCase()}. Explain the information a reader would miss if the image could not be seen.`,
              hidden: ({ parent }) => parent?.decorative === true,
              validation: (Rule) => Rule.custom((value, context) => {
                const image = context.parent as { decorative?: boolean; asset?: { _ref?: string } } | undefined;
                return image?.decorative || !image?.asset?._ref || (typeof value === "string" && value.trim())
                  ? true
                  : "Add a description for this informative image, or mark it decorative.";
              }).warning(),
            },
            {
              name: "caption",
              type: "text",
              title: "Caption",
              rows: 2,
              description: `Optional visible context or image credit in ${locale.toUpperCase()}.`,
            },
          ],
        },
      ],
    }),
  ),
});
