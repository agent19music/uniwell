export type ParseJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: Error; raw: string };

export function parseJson<T>(
  raw: string,
  parse: (value: unknown) => T,
  label = 'persisted JSON',
): ParseJsonResult<T> {
  try {
    // This helper is the allowed JSON.parse boundary.
    const value: unknown = JSON.parse(raw); // eslint-disable-line no-restricted-syntax
    return { ok: true, data: parse(value) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error : new Error(`Failed to parse ${label}`),
      raw,
    };
  }
}

export function parseJsonOrNull<T>(
  raw: string | null,
  parse: (value: unknown) => T,
  label = 'persisted JSON',
): T | null {
  if (raw == null) return null;
  const result = parseJson(raw, parse, label);
  if (!result.ok) {
    console.warn(`[contracts] discarded corrupt ${label}:`, result.error.message);
    return null;
  }
  return result.data;
}
