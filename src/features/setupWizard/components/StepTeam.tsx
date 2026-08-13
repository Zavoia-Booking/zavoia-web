/**
 * Trimmed copy of admin-dashboard's StepTeam module: the microsite Team section only
 * consumes `getAvatarBgColor` (hash-derived pastel avatar background). The body is
 * copied verbatim from the dashboard; the wizard component itself is not part of the
 * public renderer.
 */

export function getAvatarBgColor(email: string | undefined): string {
  const str = (email || "").toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} 60% 92%)`;
}
