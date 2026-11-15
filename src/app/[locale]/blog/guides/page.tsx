import { archiveMetadata, renderBlogArchive } from "@/app/_components/blog/blog-archive";
import type { BlogSearchParams } from "@/lib/blog/listing";

// CMS data keeps its one-hour cache and shared post invalidation tag.
export const revalidate = 3600;

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<BlogSearchParams>;
};

export async function generateMetadata({ params, searchParams }: Props) {
  const { locale } = await params;
  return archiveMetadata(locale, "guides", await searchParams);
}

export default async function BlogArchivePage({ params, searchParams }: Props) {
  const { locale } = await params;
  return renderBlogArchive(locale, "guides", await searchParams);
}
