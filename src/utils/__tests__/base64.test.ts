import { base64ToBytes, bytesToBase64 } from '@/utils/base64';

describe('bytesToBase64', () => {
  it('известные векторы (RFC 4648)', () => {
    expect(bytesToBase64(new Uint8Array(0))).toBe('');
    expect(bytesToBase64(new TextEncoder().encode('f'))).toBe('Zg==');
    expect(bytesToBase64(new TextEncoder().encode('fo'))).toBe('Zm8=');
    expect(bytesToBase64(new TextEncoder().encode('foo'))).toBe('Zm9v');
    expect(bytesToBase64(new TextEncoder().encode('foob'))).toBe('Zm9vYg==');
    expect(bytesToBase64(new TextEncoder().encode('fooba'))).toBe('Zm9vYmE=');
    expect(bytesToBase64(new TextEncoder().encode('foobar'))).toBe('Zm9vYmFy');
  });

  it('бинарные данные со всеми значениями байтов', () => {
    const bytes = new Uint8Array(256);
    for (let i = 0; i < bytes.length; i++) bytes[i] = i;
    expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
  });

  it('roundtrip на случайной длине (включая остатки 1 и 2 байта)', () => {
    for (const length of [1, 2, 3, 4, 5, 63, 64, 65]) {
      const bytes = new Uint8Array(length).map((_, i) => (i * 7 + length) % 256);
      expect(base64ToBytes(bytesToBase64(bytes))).toEqual(bytes);
    }
  });
});

describe('base64ToBytes', () => {
  it('игнорирует пробелы и переносы строк', () => {
    expect(base64ToBytes('Zm9v YmFy')).toEqual(new TextEncoder().encode('foobar'));
    expect(base64ToBytes('Zm9v\nYmFy')).toEqual(new TextEncoder().encode('foobar'));
  });
});
