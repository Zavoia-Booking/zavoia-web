/**
 * Trimmed copy of admin-dashboard's PersonAvatar module: the microsite Team section
 * only consumes the two pure helpers below (the avatar component itself is not used
 * by the public renderer). Bodies are copied verbatim from the dashboard.
 */

export function getPersonInitials(firstName?: string, lastName?: string): string {
  const a = firstName?.trim()?.[0] ?? "";
  const b = lastName?.trim()?.[0] ?? "";
  return (a + b).toUpperCase();
}

export function getPersonColorKey(
  id: number | string,
  firstName?: string,
  lastName?: string,
): string {
  return `${id}-${firstName ?? ""}-${lastName ?? ""}`;
}
