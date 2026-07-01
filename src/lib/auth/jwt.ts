type JwtPayload = {
  exp?: number;
  iat?: number;
  userId?: number;
  userGuid?: string;
  userRole?: string;
  tokenType?: string;
};

export function decodeJwt<T = JwtPayload>(token: string): T | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf-8");
    return JSON.parse(decoded) as T;
  } catch {
    return null;
  }
}

export function getJwtExpiryMs(token: string): number | null {
  const payload = decodeJwt<JwtPayload>(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}
