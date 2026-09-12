import {
  AESEncryptionKey,
  AESSealedData,
  CryptoDigestAlgorithm,
  aesDecryptAsync,
  aesEncryptAsync,
  digest,
  digestStringAsync,
  getRandomBytes,
  randomUUID,
} from 'expo-crypto';

export function newId(): string {
  return randomUUID();
}

export function randomSaltHex(): string {
  return bytesToHex(getRandomBytes(16));
}

export function bytesToHex(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, '0');
  }
  return out;
}

/** iOS Expo modules only accept a real TypedArray, never ArrayBuffer. */
function asTypedArray(data: Uint8Array): Uint8Array {
  const typed = new Uint8Array(data.byteLength);
  typed.set(data);
  return typed;
}

export async function sha256Hex(data: Uint8Array): Promise<string> {
  const typed = asTypedArray(data);
  const buf = await digest(CryptoDigestAlgorithm.SHA256, typed as unknown as Uint8Array<ArrayBuffer>);
  return bytesToHex(new Uint8Array(buf));
}

export async function sha256String(value: string): Promise<string> {
  return digestStringAsync(CryptoDigestAlgorithm.SHA256, value);
}

export async function hashPin(pin: string, saltHex: string): Promise<string> {
  let value = `${saltHex}:${pin}`;
  for (let i = 0; i < 12; i += 1) {
    value = await digestStringAsync(CryptoDigestAlgorithm.SHA256, value);
  }
  return value;
}

export async function generateVaultKeyHex(): Promise<string> {
  const key = await AESEncryptionKey.generate();
  return key.encoded('hex');
}

export async function encryptBytes(bytes: Uint8Array, keyHex: string): Promise<Uint8Array> {
  const key = await AESEncryptionKey.import(keyHex, 'hex');
  const sealed = await aesEncryptAsync(asTypedArray(bytes), key);
  const combined = await sealed.combined();
  return combined instanceof Uint8Array ? combined : new Uint8Array(combined as ArrayBuffer);
}

export async function decryptBytes(combined: Uint8Array, keyHex: string): Promise<Uint8Array> {
  const key = await AESEncryptionKey.import(keyHex, 'hex');
  const sealed = AESSealedData.fromCombined(asTypedArray(combined));
  const plain = await aesDecryptAsync(sealed, key, { output: 'bytes' });
  return plain instanceof Uint8Array ? plain : new Uint8Array(plain);
}

export async function encryptText(text: string, keyHex: string): Promise<Uint8Array> {
  return encryptBytes(new TextEncoder().encode(text), keyHex);
}

export async function decryptText(combined: Uint8Array, keyHex: string): Promise<string> {
  const plain = await decryptBytes(combined, keyHex);
  return new TextDecoder().decode(plain);
}
