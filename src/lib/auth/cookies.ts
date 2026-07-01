export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export function clearCookie(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; Path=/`;
}

export const CSRF_COOKIE_NAME = "customerCsrfToken";
