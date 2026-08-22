import { ArticlePageSkeleton } from "@/components/ui/page-skeletons";

// Suspense boundary for this route: the locale layout's chrome (header,
// footer, tabs) paints immediately and this stands in for the page body while
// the post loads from Sanity.
export default function Loading() {
  return <ArticlePageSkeleton />;
}
