import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatUtcCompact, formatLocalCompact, formatLocalReadable, formatDateOnly } from '../../src/utils/times';

describe('utils/times 时间格式化函数', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('formatUtcCompact', () => {
    it('UTC 时间格式化为 YYYYMMDDTHHmmss', () => {
      vi.setSystemTime(new Date('2026-09-09T10:30:45Z'));
      expect(formatUtcCompact()).toBe('20260909T103045');
    });

    it('使用 UTC 时区而非本地时区', () => {
      vi.setSystemTime(new Date('2026-01-15T08:05:03Z'));
      expect(formatUtcCompact()).toBe('20260115T080503');
    });
  });

  describe('formatLocalCompact', () => {
    it('本地时间格式化为 YYYYMMDD-HHmmss', () => {
      const localDate = new Date(2026, 8, 9, 10, 30, 45);
      vi.setSystemTime(localDate);
      expect(formatLocalCompact()).toBe('20260909-103045');
    });

    it('个位数月份和日期补零', () => {
      const localDate = new Date(2026, 0, 5, 3, 5, 7);
      vi.setSystemTime(localDate);
      expect(formatLocalCompact()).toBe('20260105-030507');
    });
  });

  describe('formatLocalReadable', () => {
    it('本地时间格式化为 YYYY-MM-DD HH:mm:ss', () => {
      const localDate = new Date(2026, 8, 9, 10, 30, 45);
      vi.setSystemTime(localDate);
      expect(formatLocalReadable()).toBe('2026-09-09 10:30:45');
    });

    it('个位数时间单位补零', () => {
      const localDate = new Date(2026, 0, 5, 3, 5, 7);
      vi.setSystemTime(localDate);
      expect(formatLocalReadable()).toBe('2026-01-05 03:05:07');
    });
  });

  describe('formatDateOnly', () => {
    it('本地日期格式化为 YYYY-MM-DD', () => {
      const localDate = new Date(2026, 8, 9);
      vi.setSystemTime(localDate);
      expect(formatDateOnly()).toBe('2026-09-09');
    });

    it('个位数月份和日期补零', () => {
      const localDate = new Date(2026, 0, 5);
      vi.setSystemTime(localDate);
      expect(formatDateOnly()).toBe('2026-01-05');
    });
  });
});
