// Base64 без нативных зависимостей — нужен для записи в SAF (content:// URI).
// btoa/atob в Hermes/RN нет гарантированно, поэтому реализуем вручную.

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

const LOOKUP: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) {
  LOOKUP[ALPHABET[i]] = i;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += ALPHABET[b0 >> 2];
    out += ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)];
    out += i + 1 < bytes.length ? ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)] : '=';
    out += i + 2 < bytes.length ? ALPHABET[b2 & 0x3f] : '=';
  }
  return out;
}

export function base64ToBytes(value: string): Uint8Array {
  const clean = value.replace(/[^A-Za-z0-9+/=]/g, '');
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const out = new Uint8Array((clean.length / 4) * 3 - padding);
  let outIndex = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const c0 = LOOKUP[clean[i]] ?? 0;
    const c1 = LOOKUP[clean[i + 1]] ?? 0;
    const c2 = LOOKUP[clean[i + 2]] ?? 0;
    const c3 = LOOKUP[clean[i + 3]] ?? 0;
    out[outIndex++] = (c0 << 2) | (c1 >> 4);
    if (outIndex < out.length) out[outIndex++] = ((c1 & 0x0f) << 4) | (c2 >> 2);
    if (outIndex < out.length) out[outIndex++] = ((c2 & 0x03) << 6) | c3;
  }
  return out;
}
