/**
 * Compare two dotted numeric versions (e.g. "1.8.0" vs "1.10.2").
 * Prerelease/build suffixes are ignored ("1.8.0-beta" compares as "1.8.0").
 * Returns negative when a < b, positive when a > b, 0 when equal.
 */
export function compareAppVersions(a: string, b: string): number {
  const parse = (version: string): number[] =>
    version
      .trim()
      .split(".")
      .map((segment) => parseInt(segment, 10) || 0);
  const left = parse(a);
  const right = parse(b);
  const length = Math.max(left.length, right.length);
  for (let i = 0; i < length; i += 1) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}
