import { Directory, File, Paths } from 'expo-file-system';
import * as LegacyFileSystem from 'expo-file-system/legacy';

import { decryptText, encryptText, newId, sha256Hex, sha256String } from './crypto';
import { storageExtension, titleFromFileName } from './format';
import { emptyCatalog, type Catalog, type ItemOrigin, type VaultItem, type VaultKind } from '../types';

const SHA_LIMIT = 8 * 1024 * 1024;

export function vaultRoot(): Directory {
  return new Directory(Paths.document, 'sigillum');
}

export function filesDir(): Directory {
  return new Directory(Paths.document, 'sigillum', 'files');
}

export function catalogFile(): File {
  return new File(Paths.document, 'sigillum', 'catalog.enc');
}

export function openCacheDir(): Directory {
  return new Directory(Paths.cache, 'sigillum-open');
}

export function ensureVaultLayout(): void {
  const root = vaultRoot();
  if (!root.exists) root.create({ intermediates: true, idempotent: true });
  const files = filesDir();
  if (!files.exists) files.create({ intermediates: true, idempotent: true });
}

export function itemFile(item: VaultItem | string): File {
  if (typeof item === 'string') return new File(filesDir(), item);
  return new File(filesDir(), item.storageName || item.id);
}

export function isSealed(item: VaultItem, now = Date.now()): boolean {
  return item.sealedUntil !== null && item.sealedUntil > now;
}

function looksLikeJson(bytes: Uint8Array): boolean {
  for (let i = 0; i < bytes.length; i += 1) {
    const c = bytes[i];
    if (c === 32 || c === 10 || c === 13 || c === 9) continue;
    return c === 123;
  }
  return false;
}

function parseCatalog(json: string): Catalog {
  const parsed = JSON.parse(json) as Catalog;
  if (!parsed?.items || !Array.isArray(parsed.items)) return emptyCatalog();
  return {
    version: 1,
    items: parsed.items.map((item) => ({
      ...item,
      storageName: item.storageName || item.id,
      note: item.note ?? '',
      origin: item.origin,
    })),
  };
}

export async function loadCatalog(keyHex: string): Promise<Catalog> {
  ensureVaultLayout();
  const file = catalogFile();
  if (!file.exists) {
    const fresh = emptyCatalog();
    await saveCatalog(fresh, keyHex);
    return fresh;
  }
  const bytes = await file.bytes();
  if (!bytes.byteLength) return emptyCatalog();
  if (looksLikeJson(bytes)) {
    try {
      return parseCatalog(new TextDecoder().decode(bytes));
    } catch {
      return emptyCatalog();
    }
  }
  try {
    const json = await decryptText(bytes, keyHex);
    return parseCatalog(json);
  } catch {
    try {
      return parseCatalog(new TextDecoder().decode(bytes));
    } catch {
      return emptyCatalog();
    }
  }
}

export async function saveCatalog(catalog: Catalog, keyHex: string): Promise<void> {
  ensureVaultLayout();
  const file = catalogFile();
  const json = JSON.stringify(catalog);
  try {
    const sealed = await encryptText(json, keyHex);
    file.create({ overwrite: true });
    file.write(sealed);
  } catch {
    file.create({ overwrite: true });
    file.write(json);
  }
}

export function guessKind(mimeType: string, fileName: string): VaultKind {
  const mime = mimeType.toLowerCase();
  const name = fileName.toLowerCase();
  if (mime.startsWith('image/') || /\.(heic|heif|jpg|jpeg|png|gif|webp|dng)$/.test(name)) {
    return 'photo';
  }
  if (mime.startsWith('video/') || /\.(mov|mp4|m4v|avi)$/.test(name)) {
    return 'video';
  }
  return 'document';
}

async function copySourceToVault(sourceUri: string, dest: File): Promise<void> {
  const src = new File(sourceUri);

  try {
    await src.copy(dest, { overwrite: true });
    if (dest.exists && (dest.size ?? 0) > 0) return;
  } catch {
    // ph://, content:// or picker temp files sometimes fail copy()
  }

  try {
    const bytes = await src.bytes();
    if (bytes.byteLength > 0) {
      dest.create({ overwrite: true, intermediates: true });
      dest.write(bytes);
      if (dest.exists && (dest.size ?? 0) > 0) return;
    }
  } catch {
    // last resort: legacy copy
  }

  await LegacyFileSystem.copyAsync({ from: sourceUri, to: dest.uri });
  if (!dest.exists || (dest.size ?? 0) === 0) {
    throw new Error('El archivo de origen ya no está disponible.');
  }
}

async function fingerprintFile(file: File): Promise<{ fingerprint: string; fingerprintAlg: VaultItem['fingerprintAlg'] }> {
  const size = file.size ?? 0;

  if (size > 0 && size <= SHA_LIMIT) {
    try {
      const bytes = await file.bytes();
      const fingerprint = await sha256Hex(bytes);
      if (fingerprint) return { fingerprint, fingerprintAlg: 'sha256' };
    } catch {
      try {
        const b64 = await file.base64();
        const fingerprint = await sha256String(b64);
        if (fingerprint) return { fingerprint, fingerprintAlg: 'sha256' };
      } catch {
        // native md5 below
      }
    }
  }

  try {
    const info = file.info({ md5: true });
    if (info.md5) return { fingerprint: info.md5, fingerprintAlg: 'md5' };
  } catch {
    // size fallback
  }

  return {
    fingerprint: `size:${size}:mtime:${file.lastModified ?? 0}`,
    fingerprintAlg: 'md5',
  };
}

export async function ingestSource(params: {
  sourceUri: string;
  fileName: string;
  mimeType: string;
  kind?: VaultKind;
  title?: string;
  note?: string;
  sealedUntil?: number | null;
  origin?: ItemOrigin;
  keyHex: string;
  catalog: Catalog;
}): Promise<{ catalog: Catalog; item: VaultItem }> {
  ensureVaultLayout();

  const kind = params.kind ?? guessKind(params.mimeType, params.fileName);
  const id = newId();
  const ext = storageExtension(params.fileName, params.mimeType, kind);
  const storageName = `${id}.${ext}`;
  const dest = itemFile(storageName);

  try {
    await copySourceToVault(params.sourceUri, dest);
    const { fingerprint, fingerprintAlg } = await fingerprintFile(dest);

    const item: VaultItem = {
      id,
      kind,
      title: params.title?.trim() || titleFromFileName(params.fileName),
      note: params.note ?? '',
      fileName: params.fileName,
      storageName,
      mimeType: params.mimeType || 'application/octet-stream',
      size: dest.size ?? 0,
      fingerprint,
      fingerprintAlg,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      sealedUntil: params.sealedUntil ?? null,
      origin: params.origin,
    };

    const catalog: Catalog = { version: 1, items: [item, ...params.catalog.items] };
    await saveCatalog(catalog, params.keyHex);
    return { catalog, item };
  } catch (error) {
    try {
      if (dest.exists) dest.delete();
    } catch {
      // ignore cleanup
    }
    throw error;
  }
}

export async function verifyItemFingerprint(item: VaultItem): Promise<boolean> {
  const file = itemFile(item);
  if (!file.exists) return false;

  if (item.fingerprintAlg === 'sha256') {
    try {
      const bytes = await file.bytes();
      if ((await sha256Hex(bytes)) === item.fingerprint) return true;
    } catch {
      try {
        const b64 = await file.base64();
        if ((await sha256String(b64)) === item.fingerprint) return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  try {
    const info = file.info({ md5: true });
    if (info.md5 && info.md5 === item.fingerprint) return true;
  } catch {
    // size token
  }
  return `size:${file.size ?? 0}:mtime:${file.lastModified ?? 0}` === item.fingerprint;
}

export function deleteItemFiles(item: VaultItem): void {
  const file = itemFile(item);
  if (file.exists) file.delete();
}

export function destroyVaultFiles(): void {
  const root = vaultRoot();
  if (root.exists) root.delete();
  const cache = openCacheDir();
  if (cache.exists) cache.delete();
}

export function itemUri(item: VaultItem): string {
  return itemFile(item).uri;
}

export function vaultStats(items: VaultItem[]) {
  const photos = items.filter((i) => i.kind === 'photo');
  const videos = items.filter((i) => i.kind === 'video');
  const documents = items.filter((i) => i.kind === 'document');
  const bytes = items.reduce((sum, i) => sum + (i.size || 0), 0);
  const capsules = items.filter((i) => isSealed(i));
  return {
    photos: photos.length,
    videos: videos.length,
    documents: documents.length,
    total: items.length,
    bytes,
    capsules: capsules.length,
  };
}
