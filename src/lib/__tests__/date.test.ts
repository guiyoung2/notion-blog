import { describe, it, expect } from 'vitest';
import { formatDate } from '@/lib/date';

describe('formatDate', () => {
  it('undefined이면 빈 문자열 반환', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('빈 문자열이면 빈 문자열 반환', () => {
    expect(formatDate('')).toBe('');
  });

  it('유효한 날짜 문자열을 한국어 로케일 형식으로 변환', () => {
    const result = formatDate('2024-01-15');
    expect(result).toMatch(/2024년/);
    expect(result).toMatch(/1월/);
  });

  it('Date 객체를 한국어 로케일 형식으로 변환', () => {
    const date = new Date('2024-03-20T12:00:00Z');
    const result = formatDate(date);
    expect(result).toMatch(/2024년/);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
