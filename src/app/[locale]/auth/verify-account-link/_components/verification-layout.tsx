"use client";

import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthMessages } from "../../_components/auth-messages";
import { AccountAccessArt } from "./account-access-art";
import styles from "./verification.module.css";

export function VerificationLayout({ title, body, icon, tone, busy, children }: {
  title: string;
  body: ReactNode;
  icon?: ReactNode;
  tone?: "success" | "warning";
  busy?: boolean;
  children: ReactNode;
}) {
  return (
    <main className={styles.page} aria-busy={busy || undefined}>
      <section className={styles.content} aria-labelledby="verify-link-heading">
        <header className={styles.header}>
          {icon ? (
            <div className={styles.mark} data-tone={tone} aria-hidden="true">{icon}</div>
          ) : (
            <AccountAccessArt className={styles.artwork} />
          )}
          <h1 id="verify-link-heading">{title}</h1>
          <div className={styles.description}>{body}</div>
        </header>
        {children}
      </section>
    </main>
  );
}

/** Route Suspense and token validation share the resolved form's geometry. */
export function VerificationLoading() {
  const { auth: { verifyLink: t } } = useAuthMessages();
  return (
    <VerificationLayout title={t.confirmHeading} busy body={
      <div aria-hidden="true" className={styles.copySkeleton}>
        <Skeleton w="94%" h={16} r={4} />
        <Skeleton w="66%" h={16} r={4} />
      </div>
    }>
      <div className={styles.identity} aria-hidden="true">
        <Skeleton w={20} h={20} r={5} style={{ flexShrink: 0 }} />
        <div className={styles.identityCopy}>
          <span className={styles.accountLabel}>{t.accountLabel}</span>
          <Skeleton w="84%" h={22} r={4} />
        </div>
      </div>
      <div className={styles.form} aria-hidden="true">
        <div className={styles.fieldSkeleton}>
          <Skeleton w={60} h={18} r={4} />
          <Skeleton h={52} r={10} />
        </div>
        <Skeleton h={54} r={999} />
        <Skeleton w="52%" h={44} r={999} style={{ marginInline: "auto" }} />
      </div>
      <p className="sr-only" role="status">{t.verifying}</p>
    </VerificationLayout>
  );
}
