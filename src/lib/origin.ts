import { File, Paths } from 'expo-file-system';
import {
  Asset,
  getPermissionsAsync,
  presentPermissionsPicker,
  requestPermissionsAsync,
} from 'expo-media-library';
import * as MediaLegacy from 'expo-media-library/legacy';

import { suppressAutoLock } from './lockGate';
import { vaultRoot } from './vault';

export type OriginRef = {
  uri: string;
  assetId?: string | null;
  kind?: 'photo' | 'video' | 'document';
};

export type OriginCleanup = {
  galleryRemoved: number;
  galleryFailed: number;
  filesRemoved: number;
};

function isInsideVault(uri: string): boolean {
  return uri.startsWith(vaultRoot().uri);
}

export async function requestMovePermissions(): Promise<boolean> {
  const current = await getPermissionsAsync(false, ['photo', 'video']);
  let granted = current.granted;
  if (!granted) {
    const next = await requestPermissionsAsync(false, ['photo', 'video']);
    granted = next.granted;
  }
  if (granted && current.accessPrivileges === 'limited') {
    try {
      await presentPermissionsPicker(['photo', 'video']);
    } catch {
      // picker not available
    }
  }
  return granted;
}

function deleteLocalFile(uri: string): boolean {
  if (!uri || isInsideVault(uri)) return false;
  try {
    const file = new File(uri);
    if (!file.exists) return false;
    file.delete();
    return true;
  } catch {
    return false;
  }
}

async function deleteGalleryId(assetId: string): Promise<boolean> {
  try {
    await suppressAutoLock(() => new Asset(assetId).delete());
    return true;
  } catch {
    try {
      const ok = await suppressAutoLock(() => MediaLegacy.deleteAssetsAsync([assetId]));
      return Boolean(ok);
    } catch {
      return false;
    }
  }
}

/** After files are inside Sigillum, remove them from the gallery and original paths. */
export async function removeOriginsAfterMove(origins: OriginRef[]): Promise<OriginCleanup> {
  const result: OriginCleanup = { galleryRemoved: 0, galleryFailed: 0, filesRemoved: 0 };
  const assetIds = [
    ...new Set(
      origins
        .filter((item) => item.assetId && (item.kind === 'photo' || item.kind === 'video'))
        .map((item) => String(item.assetId)),
    ),
  ];

  if (assetIds.length > 0) {
    const allowed = await requestMovePermissions();
    if (!allowed) {
      result.galleryFailed = assetIds.length;
    } else {
      for (const id of assetIds) {
        const ok = await deleteGalleryId(id);
        if (ok) result.galleryRemoved += 1;
        else result.galleryFailed += 1;
      }
    }
  }

  for (const origin of origins) {
    if (!origin.uri || isInsideVault(origin.uri)) continue;
    if (deleteLocalFile(origin.uri)) result.filesRemoved += 1;
  }

  return result;
}

export async function saveMediaToLibrary(fileUri: string): Promise<void> {
  const write = await requestPermissionsAsync(true, ['photo', 'video']);
  if (!write.granted) {
    const full = await requestPermissionsAsync(false, ['photo', 'video']);
    if (!full.granted) {
      throw new Error('Sin permiso para guardar en la galería.');
    }
  }
  try {
    await suppressAutoLock(() => Asset.create(fileUri));
  } catch {
    await suppressAutoLock(() => MediaLegacy.saveToLibraryAsync(fileUri));
  }
}
