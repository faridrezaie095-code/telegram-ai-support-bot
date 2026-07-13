/**
 * رمزنگاری/رمزگشایی توکن بات و کلید API با AES-GCM.
 * کلید master (ENCRYPTION_KEY) هرگز در کد یا wrangler.toml قرار نمی‌گیرد؛
 * فقط با `wrangler secret put ENCRYPTION_KEY` تنظیم می‌شود.
 *
 * فرمت خروجی: base64(iv) + ":" + base64(ciphertext)
 */

/**
 * کلید AES-256 را از هر رشته دلخواهی که کاربر برای ENCRYPTION_KEY وارد کرده
 * می‌سازد (با هش SHA-256 آن). به این ترتیب کاربر لازم نیست کلید را با فرمت
 * خاصی (مثل base64 دقیقاً ۳۲ بایتی) تولید کند؛ هر متن دلخواه و طولانی کافی است.
 */
async function importKey(rawSecretText: string): Promise<CryptoKey> {
  const material = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawSecretText));
  return crypto.subtle.importKey('raw', material, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
}

export async function encrypt(plainText: string, encryptionSecretText: string): Promise<string> {
  const key = await importKey(encryptionSecretText);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);

  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

  return `${bytesToBase64(iv)}:${bytesToBase64(new Uint8Array(cipherBuf))}`;
}

export async function decrypt(payload: string, encryptionSecretText: string): Promise<string> {
  const [ivB64, cipherB64] = payload.split(':');
  if (!ivB64 || !cipherB64) throw new Error('فرمت داده رمزنگاری‌شده نامعتبر است');

  const key = await importKey(encryptionSecretText);
  const iv = base64ToBytes(ivB64);
  const cipherBytes = base64ToBytes(cipherB64);

  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
  return new TextDecoder().decode(plainBuf);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const hashBuf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(hashBuf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
