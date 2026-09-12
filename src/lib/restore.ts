import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { suppressAutoLock } from './lockGate';
import { saveMediaToLibrary } from './origin';
import { itemFile } from './vault';
import type { VaultItem } from '../types';

function utiFor(item: VaultItem): string | undefined {
  const mime = item.mimeType.toLowerCase();
  const name = item.fileName.toLowerCase();
  if (mime.includes('jpeg') || name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'public.jpeg';
  if (mime.includes('png') || name.endsWith('.png')) return 'public.png';
  if (mime.includes('heic') || name.endsWith('.heic')) return 'public.heic';
  if (mime.includes('mp4') || name.endsWith('.mp4')) return 'public.mpeg-4';
  if (mime.includes('quicktime') || name.endsWith('.mov')) return 'com.apple.quicktime-movie';
  if (mime.includes('pdf') || name.endsWith('.pdf')) return 'com.adobe.pdf';
  return undefined;
}

function safeFileName(name: string, fallback: string): string {
  const cleaned = name.replace(/[/\\?%*:|"<>]/g, '_').trim();
  return cleaned || fallback;
}

async function stageCopy(item: VaultItem): Promise<string> {
  const src = itemFile(item);
  if (!src.exists) {
    throw new Error('El archivo ya no está en Sigillum.');
  }
  const dir = new Directory(Paths.cache, 'sigillum-export');
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  const dest = new File(dir, safeFileName(item.fileName, src.name));
  if (dest.exists) dest.delete();
  await src.copy(dest, { overwrite: true });
  if (!dest.exists) throw new Error('No se pudo preparar el archivo para exportar.');
  return dest.uri;
}

export async function restoreItem(item: VaultItem): Promise<{ destination: 'gallery' | 'share' }> {
  const staged = await stageCopy(item);

  if (item.kind === 'photo' || item.kind === 'video' || item.origin?.channel === 'gallery' || item.origin?.channel === 'camera') {
    try {
      await saveMediaToLibrary(staged);
      return { destination: 'gallery' };
    } catch {
      // fall through to share sheet
    }
  }

  const available = await Sharing.isAvailableAsync();
  if (!available) {
    throw new Error('Este dispositivo no puede exportar archivos.');
  }
  await suppressAutoLock(() =>
    Sharing.shareAsync(staged, {
      mimeType: item.mimeType || 'application/octet-stream',
      dialogTitle: item.title,
      UTI: utiFor(item),
    }),
  );
  return { destination: 'share' };
}
