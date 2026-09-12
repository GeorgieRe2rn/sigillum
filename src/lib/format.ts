import type { AutoLock, VaultKind } from '../types';

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatCountdown(until: number, now = Date.now()): string {
  const diff = Math.max(0, until - now);
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  const seconds = Math.floor((diff % (60 * 1000)) / 1000);
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function kindLabel(kind: VaultKind, plural = false): string {
  if (kind === 'photo') return plural ? 'fotos' : 'foto';
  if (kind === 'video') return plural ? 'vídeos' : 'vídeo';
  return plural ? 'documentos' : 'documento';
}

export function autoLockLabel(value: AutoLock): string {
  switch (value) {
    case 'immediate':
      return 'Al salir';
    case '15s':
      return '15 s';
    case '1m':
      return '1 min';
    case '5m':
      return '5 min';
  }
}

export function autoLockMs(value: AutoLock): number {
  switch (value) {
    case 'immediate':
      return 0;
    case '15s':
      return 15_000;
    case '1m':
      return 60_000;
    case '5m':
      return 5 * 60_000;
  }
}

export function shortenFingerprint(fp: string): string {
  if (fp.length <= 16) return fp;
  return `${fp.slice(0, 8)} · ${fp.slice(-8)}`;
}

export function fileExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  if (idx <= 0) return '';
  return name.slice(idx + 1).toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function nameFromUri(uri: string, fallback: string): string {
  const cleaned = uri.split('?')[0] ?? uri;
  const last = cleaned.split('/').pop();
  if (!last) return fallback;
  try {
    const decoded = decodeURIComponent(last);
    if (decoded.includes('.')) return decoded;
  } catch {
    if (last.includes('.')) return last;
  }
  return fallback;
}

export function storageExtension(fileName: string, mimeType: string, kind: VaultKind): string {
  const fromName = fileExtension(fileName);
  if (fromName && fromName.length <= 5) return fromName;
  const mime = mimeType.toLowerCase();
  if (mime.includes('jpeg') || mime.includes('jpg')) return 'jpg';
  if (mime.includes('png')) return 'png';
  if (mime.includes('heic') || mime.includes('heif')) return 'heic';
  if (mime.includes('webp')) return 'webp';
  if (mime.includes('gif')) return 'gif';
  if (mime.includes('mp4')) return 'mp4';
  if (mime.includes('quicktime') || mime.includes('mov')) return 'mov';
  if (mime.includes('pdf')) return 'pdf';
  if (kind === 'photo') return 'jpg';
  if (kind === 'video') return 'mp4';
  return 'bin';
}

export function titleFromFileName(name: string): string {
  const base = name.replace(/\.[^/.]+$/, '');
  return base.replace(/[_-]+/g, ' ').trim() || 'Sin título';
}
