/**
 * Allow only same-origin relative paths to prevent open redirects.
 */
export function safeNextPath(next: string | null | undefined, fallback = '/'): string {
  if (!next) return fallback;
  if (!next.startsWith('/') || next.startsWith('//')) return fallback;
  if (next.includes('://')) return fallback;
  return next;
}
