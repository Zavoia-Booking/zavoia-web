import { DetailPageSkeleton } from "@/components/ui/page-skeletons";

// Suspense boundary for this route: the locale layout's chrome (header,
// footer, tabs) paints immediately and this stands in for the page body while
// the showcase site loads.
export default function Loading() {
  return <DetailPageSkeleton />;
}
