import { nowIso, uuid } from '@/utils/id';

describe('uuid', () => {
  it('генерирует v4-формат', () => {
    const id = uuid();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it('уникален на практике (1000 вызовов)', () => {
    const ids = new Set(Array.from({ length: 1000 }, () => uuid()));
    expect(ids.size).toBe(1000);
  });
});

describe('nowIso', () => {
  it('возвращает валидный ISO-8601 с суффиксом Z', () => {
    const value = nowIso();
    expect(value).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(value).toISOString()).toBe(value);
  });

  it('близок к текущему моменту', () => {
    const before = Date.now();
    const value = new Date(nowIso()).getTime();
    expect(Math.abs(value - before)).toBeLessThan(5000);
  });
});
