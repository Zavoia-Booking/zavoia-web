import { Skeleton } from "@/components/ui";

/**
 * Server-rendered Suspense fallback for the auth pages. Mirrors the
 * AuthCard geometry (centered shell, two-column card, toggle pill,
 * heading, fields, pill button) so the page paints instantly with the
 * final layout instead of flashing blank until the client component
 * (which needs useSearchParams) hydrates.
 */
export function AuthSkeleton() {
  return (
    <main
      className="flex flex-col items-center justify-center px-4 py-10"
      style={{ minHeight: "calc(100svh - var(--nav-h))" }}
    >
      <div className="w-full max-w-sm md:max-w-[62.5rem]">
        <div className="w-full overflow-hidden rounded-[var(--r-2xl)] border border-[rgba(28,28,26,0.08)] bg-white shadow-[var(--sh-lg)]">
          <div className="grid md:grid-cols-2">
            <div className="p-5 sm:p-6 md:min-h-[45rem] md:p-8">
              <div className="flex flex-col gap-8">
                {/* Toggle pill */}
                <Skeleton h={44} r={9999} />
                {/* Heading + subtitle */}
                <div className="space-y-3">
                  <Skeleton w="55%" h={28} />
                  <Skeleton w="80%" h={16} />
                </div>
                {/* Fields */}
                <div className="space-y-5">
                  <div className="space-y-2">
                    <Skeleton w={72} h={14} />
                    <Skeleton h={44} r={10} />
                  </div>
                  <div className="space-y-2">
                    <Skeleton w={72} h={14} />
                    <Skeleton h={44} r={10} />
                  </div>
                  {/* Submit button */}
                  <Skeleton h={44} r={9999} className="!mt-8" />
                </div>
                {/* Divider + Google button */}
                <div className="space-y-5">
                  <Skeleton h={1} r={0} />
                  <Skeleton h={44} r={10} />
                </div>
              </div>
            </div>
            {/* Hero panel placeholder — plain cream surface, same as the
                hero's background, so the reveal doesn't shift or recolor. */}
            <div className="hidden bg-canvas md:block" />
          </div>
        </div>
      </div>
    </main>
  );
}
