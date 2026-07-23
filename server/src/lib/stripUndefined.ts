/**
 * zod's `.partial()`/`.optional()` types include explicit `| undefined`, which
 * conflicts with Prisma's input types under `exactOptionalPropertyTypes`.
 * Drop keys whose value is undefined so only present keys remain.
 */
export function stripUndefined<T extends object>(
  obj: T,
): { [K in keyof T]: Exclude<T[K], undefined> } {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined),
  ) as { [K in keyof T]: Exclude<T[K], undefined> };
}
