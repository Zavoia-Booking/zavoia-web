import type { ReactNode } from "react";
import "./auth-card.css";

/** Shared geometry for skeletons, sign-in, recovery and callbacks. */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="auth-page">
      <div className="zw-container">
        <div className="auth-shell">{children}</div>
      </div>
    </main>
  );
}
