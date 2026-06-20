import { describe, it, expect } from 'vitest';
import { formatINR, formatINRCompact, formatPhone, formatDate, formatPct, formatGST } from '../services/formatters';

describe('formatINR', () => {
  it('formats zero',        () => expect(formatINR(0)).toBe('₹0'));
  it('formats 1000',        () => expect(formatINR(1000)).toBe('₹1,000'));
  it('formats 100000',      () => expect(formatINR(100000)).toBe('₹1,00,000'));
  it('handles null/undefined', () => expect(formatINR(null)).toBe('₹0'));
});

describe('formatINRCompact', () => {
  it('formats crores',  () => expect(formatINRCompact(10_000_000)).toBe('₹1.00Cr'));
  it('formats lakhs',   () => expect(formatINRCompact(500_000)).toBe('₹5.00L'));
  it('formats thousands', () => expect(formatINRCompact(5000)).toBe('₹5.0K'));
});

describe('formatPhone', () => {
  it('formats 10 digit',  () => expect(formatPhone('9876543210')).toBe('+91 98765 43210'));
  it('handles missing',   () => expect(formatPhone(null)).toBe('—'));
});

describe('formatPct', () => {
  it('formats percentage', () => expect(formatPct(85.567)).toBe('85.6%'));
});

describe('formatGST', () => {
  it('formats GSTIN',     () => expect(formatGST('29ABCDE1234F1Z5')).toBe('29 ABCDE1234 F 1 Z5'));
  it('handles null',      () => expect(formatGST(null)).toBe('—'));
});
