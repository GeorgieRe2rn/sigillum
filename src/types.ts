export type VaultKind = 'photo' | 'video' | 'document';

export type OriginChannel = 'gallery' | 'camera' | 'files';

export type ItemOrigin = {
  channel: OriginChannel;
  assetId?: string | null;
  originalUri?: string | null;
};

export type FingerprintAlg = 'sha256' | 'md5';

export type VaultItem = {
  id: string;
  kind: VaultKind;
  title: string;
  note: string;
  fileName: string;
  storageName: string;
  mimeType: string;
  size: number;
  fingerprint: string;
  fingerprintAlg: FingerprintAlg;
  createdAt: number;
  updatedAt: number;
  sealedUntil: number | null;
  origin?: ItemOrigin;
};

export type Catalog = {
  version: 1;
  items: VaultItem[];
};

export type AutoLock = 'immediate' | '15s' | '1m' | '5m';

export type Settings = {
  biometricsEnabled: boolean;
  autoLock: AutoLock;
  privacyVeil: boolean;
  displayName: string;
};

export type BiometricKind = 'face' | 'fingerprint' | 'none';

export type BiometricProfile = {
  hasHardware: boolean;
  enrolled: boolean;
  kind: BiometricKind;
  canAuth: boolean;
  biometricsUsable: boolean;
  hasDeviceSecret: boolean;
  label: string;
  unlockLabel: string;
  blockedReason: 'ios-expo-go' | null;
};

export const defaultSettings = (): Settings => ({
  biometricsEnabled: true,
  autoLock: 'immediate',
  privacyVeil: true,
  displayName: 'Archivo',
});

export const emptyCatalog = (): Catalog => ({
  version: 1,
  items: [],
});
