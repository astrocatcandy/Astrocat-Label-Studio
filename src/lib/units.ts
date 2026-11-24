/** Keep stored quantities compatible with existing backups while making the input numeric-only. */
export type MeasurementUnit = 'g' | 'kJ' | 'kcal';

export function numericInput(value: string | number | undefined | null): string {
  return String(value ?? '').trim().replace(/\s*(?:kcal|kj|g)\s*$/i, '').trim();
}

export function formatMeasurement(value: string | number | undefined | null, unit: MeasurementUnit): string {
  const number = numericInput(value);
  return number ? `${number} ${unit}` : '–';
}

export function normalizeGrams(value: string): string {
  const number = numericInput(value);
  return number ? `${number} g` : '';
}
