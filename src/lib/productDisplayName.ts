export function productDisplayName(name: string): string {
  return name.replace(/^\s*Gefriergetrocknete\s+/i, '').trim() || name;
}
