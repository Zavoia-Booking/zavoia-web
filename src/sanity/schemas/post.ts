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
    },
    prepare({ titleEn, titleRo, media, publishedAt }) {
      return {
        title: titleEn || titleRo || "Untitled",
        subtitle: publishedAt
          ? new Date(publishedAt).toLocaleDateString()
          : "Unpublished",
        media,
      };
    },
  },
});
