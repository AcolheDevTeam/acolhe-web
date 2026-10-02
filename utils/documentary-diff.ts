// Compare a single changed span in linear time, preserving whitespace and Unicode.
// The unchanged prefix/suffix give context without quadratic work on large notebooks.
export function documentaryDiff(before: string, after: string) {
  const a = Array.from(before),
    b = Array.from(after)
  let start = 0
  while (start < a.length && start < b.length && a[start] === b[start]) start++
  let endA = a.length,
    endB = b.length
  while (endA > start && endB > start && a[endA - 1] === b[endB - 1]) {
    endA--
    endB--
  }
  return {
    prefix: a.slice(0, start).join(''),
    removed: a.slice(start, endA).join(''),
    added: b.slice(start, endB).join(''),
    suffix: a.slice(endA).join(''),
  }
}
