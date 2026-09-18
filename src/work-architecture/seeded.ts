export function seeded(index: number, salt: number): number {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43_758.545_312_3;
  return value - Math.floor(value);
}
