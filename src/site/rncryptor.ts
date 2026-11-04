/* Decrypts the blog CMS's public API responses (RNCryptor v3, password-based). Same algorithm as the
   admin panel's src/lib/laravel-cms/rncryptor.ts. Web Crypto only, so it runs in Node and on Vercel.
   Layout: version(3) | options(1) | encSalt(8) | hmacSalt(8) | IV(16) | AES-256-CBC ciphertext | HMAC-SHA256(32).
   Keys: PBKDF2-SHA1(password, salt, 10 000 rounds, 32 bytes). The HMAC is checked before decrypting. */

const SALT = 8, IV = 16, HEADER = 2 + SALT * 2 + IV, HMAC = 32, BLOCK = 16, ROUNDS = 10_000;

export async function decryptRncryptor(base64: string, password: string): Promise<string> {
  const bin = atob(base64.replace(/\s+/g, ''));
  const msg = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) msg[i] = bin.charCodeAt(i);

  const cipherLen = msg.length - HEADER - HMAC;
  if (cipherLen < BLOCK || cipherLen % BLOCK !== 0) throw new Error('encrypted response has the wrong length');
  if (msg[0] !== 3 || msg[1] !== 1) throw new Error('encrypted response is not RNCryptor v3 with a password');

  const encSalt = msg.subarray(2, 2 + SALT);
  const hmacSalt = msg.subarray(2 + SALT, 2 + SALT * 2);
  const iv = msg.subarray(2 + SALT * 2, HEADER);
  const signed = msg.subarray(0, msg.length - HMAC);
  const cipher = msg.subarray(HEADER, msg.length - HMAC);
  const mac = msg.subarray(msg.length - HMAC);

  const { subtle } = globalThis.crypto;
  const pw = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  const kdf = (salt: Uint8Array<ArrayBuffer>) => ({ name: 'PBKDF2', hash: 'SHA-1', salt, iterations: ROUNDS });

  const hmacKey = await subtle.deriveKey(kdf(hmacSalt), pw, { name: 'HMAC', hash: 'SHA-256', length: 256 }, false, ['verify']);
  if (!(await subtle.verify('HMAC', hmacKey, mac, signed))) throw new Error('integrity check failed (wrong CMS_ENCRYPTION_KEY?)');

  const aesKey = await subtle.deriveKey(kdf(encSalt), pw, { name: 'AES-CBC', length: 256 }, false, ['decrypt']);
  const plain = await subtle.decrypt({ name: 'AES-CBC', iv }, aesKey, cipher);
  return new TextDecoder('utf-8', { fatal: true }).decode(plain);
}
