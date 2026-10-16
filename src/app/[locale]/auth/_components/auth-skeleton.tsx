import { Skeleton } from "@/components/ui";
import { AuthShell } from "./auth-shell";

/** The fallback shares the live card's minimum height and breakpoint. */
export function AuthSkeleton({ showHeading = true }: { showHeading?: boolean }) {
  return (
    <AuthShell>
      <div className="auth-card" aria-hidden="true">
        <div className="auth-card-form">
          <Skeleton h={52} r={9999} />
          {showHeading && (
            <div className="auth-card-heading space-y-3">
              <Skeleton w="55%" h={34} />
            </div>
          )}
          <div className="auth-card-body">
            <div className="auth-card-content">
              {[0, 1].map((index) => (
                <div key={index} className="space-y-2">
                  <Skeleton w={72} h={20} />
                  <Skeleton h={48} r={10} />
                </div>
              ))}
              <Skeleton h={48} r={9999} />
              <Skeleton h={20} w="40%" className="mx-auto" />
              <Skeleton h={1} r={0} />
              <Skeleton h={44} r={10} />
            </div>
          </div>
        </div>
        <div className="auth-card-hero bg-canvas" />
      </div>
    </AuthShell>
  );
}
