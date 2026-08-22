import { SearchPageSkeleton } from "@/components/ui/page-skeletons";

// Suspense boundary for this route: the locale layout's chrome (header,
// footer, tabs) paints immediately and this stands in for the page body while
// the initial result set and filter taxonomy load.
export default function Loading() {
  return <SearchPageSkeleton />;
}
