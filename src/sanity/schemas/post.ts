import { defineField, defineType } from "sanity";

export const post = defineType({
  name: "post",
  title: "Blog post",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "localeString",
      validation: (Rule) => Rule.required(),
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
