/** "10,000" -> 10000 */
export const toNumber = (s: string) => Number(s.replace(/,/g, ""));

/** Parse "Showing X–Y of Z records". */
export function parseSummary(raw: string) {
  const text = raw.trim();
  const m = text.match(/Showing\s+([\d,]+)\s*[–-]\s*([\d,]+)\s+of\s+([\d,]+)/);
  if (!m) throw new Error(`Unexpected summary: "${text}"`);
  return { from: toNumber(m[1]), to: toNumber(m[2]), total: toNumber(m[3]) };
}

/** Parse "Page N of M". */
export function parseIndicator(raw: string) {
  const text = raw.trim();
  const m = text.match(/Page\s+([\d,]+)\s+of\s+([\d,]+)/);
  if (!m) throw new Error(`Unexpected indicator: "${text}"`);
  return { current: toNumber(m[1]), pages: toNumber(m[2]) };
}
