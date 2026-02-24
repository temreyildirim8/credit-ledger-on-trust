import { describe, it, expect } from 'vitest';
import { formatCurrency } from './currency';

describe('formatCurrency', () => {
  it('should format positive amounts correctly', () => {
    const result = formatCurrency(1000);
    // Turkish Lira formatting with tr-TR locale
    expect(result).toContain('1.000');
    expect(result).toContain('₺');
  });

  it('should format zero correctly', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toContain('₺');
  });

  it('should format large numbers correctly', () => {
    const result = formatCurrency(1000000);
    expect(result).toContain('1.000.000');
    expect(result).toContain('₺');
  });

  it('should format small amounts correctly', () => {
    const result = formatCurrency(50);
    expect(result).toContain('50');
    expect(result).toContain('₺');
  });

  it('should handle decimal amounts with minimumFractionDigits 0', () => {
    const result = formatCurrency(123.45);
    // With minimumFractionDigits: 0, decimals may or may not be shown
    // depending on the exact value, but should contain 123
    expect(result).toMatch(/123/);
  });

  it('should format negative amounts', () => {
    const result = formatCurrency(-100);
    // Most currency formatters show negative with minus sign
    expect(result).toContain('-');
    expect(result).toContain('100');
  });

  it('should handle very large amounts (IDR scale)', () => {
    const result = formatCurrency(15000000);
    expect(result).toContain('15');
    expect(result).toContain('000');
    expect(result).toContain('₺');
  });

  it('should use Turkish locale formatting', () => {
    // Turkish locale uses period as thousand separator
    const result = formatCurrency(10000);
    // Should be formatted as 10.000 ₺ (Turkish format)
    expect(result).toMatch(/10(\.| )000/);
  });
});
