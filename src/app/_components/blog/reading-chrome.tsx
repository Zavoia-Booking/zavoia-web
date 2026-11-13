"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useTranslation } from "@/i18n/useTranslation";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import styles from "./blog-post.module.css";

/** Progress ends with the article, before related posts and the site footer. */
export function ReadingChrome({ articleId }: { articleId: string }) {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const article = document.getElementById(articleId);
    if (!article) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = article.getBoundingClientRect();
      const navHeight =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 0;
      const start = Math.max(0, rect.top + window.scrollY - navHeight);
      const end = Math.max(start, rect.bottom + window.scrollY - window.innerHeight);
      const progress =
        end > start
          ? Math.min(1, Math.max(0, (window.scrollY - start) / (end - start)))
          : Number(window.scrollY >= start);
      if (fillRef.current) fillRef.current.style.transform = `scaleX(${progress})`;
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const observer = new ResizeObserver(schedule);
    observer.observe(article);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [articleId]);

  return (
    <div className={styles.progress} aria-hidden="true">
      <div ref={fillRef} className={styles.progressFill} />
    </div>
  );
}

function supportsNativeShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

function subscribeSharingCapability(onChange: () => void) {
  window.addEventListener("focus", onChange);
  window.addEventListener("pageshow", onChange);
  return () => {
    window.removeEventListener("focus", onChange);
    window.removeEventListener("pageshow", onChange);
  };
}

function serverSharingCapability() { return false; }

/** One action uses the native share sheet when available, or copies the link.
 * It shares the post's canonical path on the current origin, without the
 * visitor's query string or hash, as the location page does. */
export function ArticleActions({ title, path }: { title: string; path?: string }) {
  const { dict } = useTranslation();
  const toast = useToast();
  const nativeShare = useSyncExternalStore(
    subscribeSharingCapability,
    supportsNativeShare,
    serverSharingCapability,
  );
  const pendingRef = useRef(false);
  const [pending, setPending] = useState(false);

  const act = async () => {
    if (pendingRef.current) return;
    const useNativeShare = supportsNativeShare();
    const url = path ? new URL(path, window.location.origin).href : window.location.href;
    pendingRef.current = true;
    setPending(true);
    try {
      if (useNativeShare) {
        await navigator.share({ title, url });
      } else {
        if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
        await navigator.clipboard.writeText(url);
        toast(dict.blog.linkCopied, "check");
      }
    } catch (error) {
      // Dismissing the native share sheet is an intentional cancellation.
      if (!(useNativeShare && error instanceof Error && error.name === "AbortError")) {
        toast(useNativeShare ? dict.blog.shareFailed : dict.blog.copyFailed, undefined, undefined, "error");
      }
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  return (
    <div className={styles.actions}>
      <Button
        kind="ghost"
        size="sm"
        className={styles.shareAction}
        style={{
          background: "var(--article-action-bg, transparent)",
          padding: "8px 10px",
          fontSize: 13.5,
        }}
        loading={pending}
        onClick={() => void act()}
      >
        <Icon name={nativeShare ? "share" : "link"} size={16} />
        {nativeShare ? dict.blog.shareLabel : dict.blog.copyLink}
      </Button>
    </div>
  );
}
